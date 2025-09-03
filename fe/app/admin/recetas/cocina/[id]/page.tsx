"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getRecipeById,
  startBrewing,
  pauseBrewing,
  resumeBrewing,
  completeBrewing,
  completeStep,
  uncompleteStep,
  updateBrewingTime,
  updateGravityMeasurements,
  addRecipeStep,
  updateRecipeStep,
  deleteRecipeStep,
  getBrewingStatus,
} from "@/services/private";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Plus,
  Trash2,
  Calendar,
  FlaskConical,
  Beaker,
  Wheat,
  Droplets,
  Timer,
} from "lucide-react";
import Link from "next/link";

interface RecipeStep {
  id: string;
  time: number; // en minutos
  type:
    | "hop-addition"
    | "dry-hop"
    | "caramel-addition"
    | "yeast-addition"
    | "temperature-change"
    | "stirring"
    | "other";
  description: string;
  amount?: string;
  temperature?: number;
}

interface BrewingSession {
  sessionId: string;
  startDate: string;
  currentTime?: number;
  isRunning: boolean;
  isPaused: boolean;
  pausedAt?: string;
  resumedAt?: string;
  completedSteps: { stepId: string; completedAt: string }[];
  status: "not-started" | "brewing" | "fermenting" | "completed";
  fermentationStartDate?: string;
  notes?: string;
  originalGravity?: number;
  finalGravity?: number;
  calculatedABV?: number;
  batchLiters?: number;
  packagingDate?: string;
}

interface Recipe {
  id: string;
  name: string;
  style: string;
  description: string;
  abv: number;
  ibu: number;
  srm: number;
  difficulty: "Fácil" | "Intermedio" | "Avanzado";
  batchSize: number;
  boilTime: number;
  steps: RecipeStep[];
  createdAt: string;
  status: "Borrador" | "Activa" | "Archivada";
  brewingStatus?:
    | "not-started"
    | "brewing"
    | "paused"
    | "fermenting"
    | "completed";
  brewingStartDate?: string;
  pausedAt?: string;
  accumulatedTime?: number; // tiempo acumulado en segundos antes de pausas
  currentTime?: number; // tiempo actual guardado en la BD
  currentSession?: string; // ID de la sesión actual
  brewingSessions?: BrewingSession[]; // Array de todas las sesiones
  fermentationDays?: number;
  // Datos técnicos adicionales
  mashTemp?: number;
  mashTime?: number;
  spargeTemp?: number;
  targetOriginalGravity?: number;
  targetFinalGravity?: number;
  efficiency?: number;
  waterProfile?: string;
  yeastStrain?: string;
  fermentationTemp?: number;
  notes?: string;
}

interface GroupedStep {
  time: number;
  steps: RecipeStep[];
  position: number;
}

const stepTypes = [
  {
    value: "hop-addition",
    label: "Adición de Lúpulo",
    icon: "🌿",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "dry-hop",
    label: "Dry Hop",
    icon: "🌱",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "caramel-addition",
    label: "Adición de Caramelo",
    icon: "🍯",
    color: "bg-amber-100 text-amber-800",
  },
  {
    value: "yeast-addition",
    label: "Adición de Levadura",
    icon: "🦠",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "temperature-change",
    label: "Cambio de Temperatura",
    icon: "🌡️",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "stirring",
    label: "Agitado",
    icon: "🥄",
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "other",
    label: "Otro",
    icon: "⚙️",
    color: "bg-gray-100 text-gray-800",
  },
];

// Tipos de proceso para facilitar la adición de pasos
const processTypes = [
  {
    value: "mashing",
    label: "Maceración",
    icon: "🌾",
    description: "Pasos durante el macerado (0-90 min)",
  },
  {
    value: "boiling",
    label: "Cocción/Hervido",
    icon: "🔥",
    description: "Pasos durante el hervido",
  },
  {
    value: "fermentation",
    label: "Fermentación",
    icon: "🧪",
    description: "Pasos durante la fermentación (días)",
  },
];

export default function CookingPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const { loading, callEndpoint } = useFetchAndLoad();
  const { callEndpoint: callEndpointSilent } = useFetchAndLoad(); // Para operaciones que no deben mostrar loading

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // tiempo actual en segundos
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentAlert, setCurrentAlert] = useState<RecipeStep | null>(null);

  // Estados para medición de gravedad y ABV
  const [originalGravity, setOriginalGravity] = useState<number | null>(null);
  const [finalGravity, setFinalGravity] = useState<number | null>(null);
  const [calculatedABV, setCalculatedABV] = useState<number | null>(null);
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [batchLiters, setBatchLiters] = useState<number | null>(null);
  const [batchNotes, setBatchNotes] = useState<string>("");
  const [notesLastChanged, setNotesLastChanged] = useState<number>(0);
  const [isUpdatingFromBackend, setIsUpdatingFromBackend] =
    useState<boolean>(false);

  // Ref para mantener el valor actual de notas para el debounce
  const currentNotesRef = useRef<string>("");

  // Sincronizar el ref cuando cambie batchNotes
  useEffect(() => {
    currentNotesRef.current = batchNotes;
  }, [batchNotes]);

  const [sessionState, setSessionState] = useState<{
    hasActiveSession: boolean;
    isRunning: boolean;
    isPaused: boolean;
    status: string;
    session?: any;
  }>({
    hasActiveSession: false,
    isRunning: false,
    isPaused: false,
    status: "not-started",
  });

  // Función para calcular el tiempo transcurrido basado en fechas de la BD (solo para carga inicial)
  const calculateElapsedTime = useCallback(
    async (recipe: Recipe) => {
      try {
        // Consultar el estado actual de la sesión en el backend
        const result = await callEndpointSilent(getBrewingStatus(recipe.id));
        const data = result?.data;

        if (data?.hasActiveSession && data.activeSession) {
          const session = data.activeSession;

          if (session.status === "brewing" && session.isRunning) {
            // Calcular tiempo desde inicio considerando pausas
            const startTime = new Date(session.startDate).getTime();
            const currentTime = Date.now();
            let totalElapsed = Math.floor((currentTime - startTime) / 1000);

            // Si hay tiempo guardado en currentTime, usarlo como base
            if (session.currentTime) {
              totalElapsed = Math.max(totalElapsed, session.currentTime);
            }

            return totalElapsed;
          } else if (session.currentTime) {
            // Si está pausada, usar el tiempo guardado
            return session.currentTime;
          }
        }

        return 0;
      } catch (error) {
        console.error("Error calculando tiempo transcurrido:", error);
        return 0;
      }
    },
    [callEndpointSilent]
  );

  // Función para obtener el estado de la sesión activa
  const getActiveSessionState = useCallback(
    async (recipe: Recipe) => {
      try {
        const result = await callEndpointSilent(getBrewingStatus(recipe.id));
        const data = result?.data;

        console.log("getActiveSessionState - data completa:", data);

        if (data?.hasActiveSession) {
          // Usar currentSession que tiene los datos completos, o activeSession como fallback
          const session = data.currentSession || data.activeSession;
          console.log("getActiveSessionState - session encontrada:", session);

          if (session) {
            return {
              hasActiveSession: true,
              isRunning: session.isRunning,
              isPaused: session.isPaused,
              status: session.status,
              session: session,
            };
          }
        }

        console.log("getActiveSessionState - no hay sesión activa");
        return {
          hasActiveSession: false,
          isRunning: false,
          isPaused: false,
          status: "not-started",
        };
      } catch (error) {
        console.error("Error getting session state:", error);
        return {
          hasActiveSession: false,
          isRunning: false,
          isPaused: false,
          status: "not-started",
        };
      }
    },
    [callEndpointSilent]
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);
  const [newStep, setNewStep] = useState<Partial<RecipeStep>>({
    time: 0,
    type: "other",
    description: "",
    amount: "",
    temperature: undefined,
  });
  const [selectedProcessType, setSelectedProcessType] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs para debounce de actualizaciones
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<{
    originalGravity?: number;
    finalGravity?: number;
    batchLiters?: number;
  } | null>(null);

  // Refs para valores que necesita el interval sin causar re-renders
  const currentTimeRef = useRef(0);
  const sessionStateRef = useRef(sessionState);
  const recipeRef = useRef<Recipe | null>(null);
  const completedStepsRef = useRef<Set<string>>(new Set());
  const pauseTimerRef = useRef<(() => void) | null>(null);

  // Actualizar refs cuando cambien los valores
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  useEffect(() => {
    recipeRef.current = recipe;
  }, [recipe]);

  useEffect(() => {
    completedStepsRef.current = completedSteps;
  }, [completedSteps]);

  // Función para calcular el tiempo automáticamente según el proceso
  const calculateTimeByProcess = (
    processType: string,
    stepTime: number
  ): number => {
    if (!recipe) return stepTime;

    switch (processType) {
      case "mashing":
        // Durante maceración: tiempo directo (0-90 min típicamente)
        return stepTime;
      case "boiling":
        // Durante hervido: tiempo base del macerado + tiempo del hervido
        const mashTime = recipe.mashTime || 60;
        return mashTime + stepTime;
      case "fermentation":
        // Durante fermentación: convertir días a minutos (1440 min = 1 día)
        return stepTime * 1440;
      default:
        return stepTime;
    }
  };

  // Función para actualizar el tiempo cuando cambia el proceso
  const handleProcessTypeChange = (processType: string) => {
    setSelectedProcessType(processType);
    setValidationError(""); // Limpiar error al cambiar tipo de proceso

    // Calcular tiempo automáticamente si ya hay un tiempo base
    if (newStep.time !== undefined && newStep.time > 0) {
      const calculatedTime = calculateTimeByProcess(processType, newStep.time);
      setNewStep((prev) => ({
        ...prev,
        time: calculatedTime,
      }));
    }
  };

  // Función para validar el tiempo del paso según el tipo de proceso
  const validateStepTime = (
    processType: string,
    stepTime: number
  ): { isValid: boolean; message?: string } => {
    if (!recipe) return { isValid: true };

    switch (processType) {
      case "mashing":
        const mashTime = recipe.mashTime || 60;
        if (stepTime > mashTime) {
          return {
            isValid: false,
            message: `El tiempo de maceración no puede ser mayor a ${mashTime} minutos (tiempo configurado de macerado)`,
          };
        }
        break;

      case "boiling":
        const boilTime = recipe.boilTime || 60;
        const totalMashTime = recipe.mashTime || 60;
        const maxBoilTime = totalMashTime + boilTime;
        if (stepTime > maxBoilTime) {
          return {
            isValid: false,
            message: `El tiempo de hervido no puede ser mayor a ${maxBoilTime} minutos (${totalMashTime} min macerado + ${boilTime} min hervido)`,
          };
        }
        if (stepTime < totalMashTime) {
          return {
            isValid: false,
            message: `El tiempo de hervido debe ser mayor a ${totalMashTime} minutos (tiempo de macerado)`,
          };
        }
        break;

      case "fermentation":
        const fermentationDays = recipe.fermentationDays || 14;
        const maxFermentationMinutes = fermentationDays * 1440; // días a minutos
        if (stepTime > maxFermentationMinutes) {
          return {
            isValid: false,
            message: `El tiempo de fermentación no puede ser mayor a ${fermentationDays} días (tiempo configurado de fermentación)`,
          };
        }
        break;
    }

    return { isValid: true };
  };

  // Función para generar marcadores automáticos del proceso
  const generateAutoMarkers = useCallback((): RecipeStep[] => {
    if (!recipe) return [];

    const autoMarkers: RecipeStep[] = [];

    // Marcador de inicio de cocción (al finalizar maceración)
    if (recipe.mashTime && recipe.mashTime > 0) {
      autoMarkers.push({
        id: `auto-boil-start-${recipe.mashTime}`,
        time: recipe.mashTime,
        type: "temperature-change",
        description: "🔥 Inicio de cocción",
        amount: "Subir temperatura a hervido",
        temperature: 100,
      });
    }

    return autoMarkers;
  }, [recipe]);

  // Función para toggle del paso (completar/descompletar)
  const toggleStep = async (stepId: string) => {
    if (!recipe) return;

    try {
      const isCompleted = completedSteps.has(stepId);

      if (isCompleted) {
        // Descompletar paso
        await callEndpoint(uncompleteStep(recipe.id, stepId));
        setCompletedSteps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(stepId);
          return newSet;
        });
      } else {
        // Completar paso
        await callEndpoint(completeStep(recipe.id, stepId));
        setCompletedSteps((prev) => new Set(prev).add(stepId));
      }
    } catch (error) {
      console.error("Error toggling step:", error);
    }
  };

  // Función para resetear el timer
  const resetTimer = async () => {
    if (!recipe) return;

    try {
      // Completar la sesión actual
      await callEndpoint(completeBrewing(recipe.id));

      // Actualizar estado local inmediatamente
      setCurrentTime(0);
      setIsRunning(false);
      setCompletedSteps(new Set());

      // Actualizar estado de sesión
      const newSessionState = await getActiveSessionState(recipe);
      setSessionState(newSessionState);
    } catch (error) {
      console.error("Error resetting timer:", error);
    }
  };

  // Función para eliminar alerta actual
  const dismissAlert = () => {
    setCurrentAlert(null);
  };

  // Función para calcular ABV basado en las gravedades
  const calculateABV = useCallback((og: number, fg: number): number => {
    // Fórmula estándar: ABV = (OG - FG) * 131.25
    return (og - fg) * 131.25;
  }, []);

  // Función debounced para actualizar mediciones en el backend
  const debouncedUpdateMeasurements = useCallback(async () => {
    if (!recipe || !pendingUpdateRef.current) return;

    try {
      const updateData: any = {};
      const pending = pendingUpdateRef.current;

      // Solo incluir campos que están pendientes de actualización
      if (pending.originalGravity !== undefined) {
        updateData.originalGravity = pending.originalGravity;
      }
      if (pending.finalGravity !== undefined) {
        updateData.finalGravity = pending.finalGravity;
      }
      if (pending.batchLiters !== undefined) {
        updateData.batchLiters = pending.batchLiters;
      }

      // Calcular ABV si tenemos ambas gravedades
      const og = pending.originalGravity ?? originalGravity;
      const fg = pending.finalGravity ?? finalGravity;
      if (og && fg) {
        updateData.calculatedABV = calculateABV(og, fg);
      }

      console.log("Enviando update debounced:", updateData);

      // Persistir en el backend solo si hay datos válidos
      if (Object.keys(updateData).length > 0) {
        await callEndpointSilent(
          updateGravityMeasurements(recipe.id, updateData)
        );
        console.log("Update completado exitosamente");
      }

      // Limpiar pending updates DESPUÉS de la actualización exitosa
      pendingUpdateRef.current = null;
    } catch (error) {
      console.error("Error updating measurements:", error);
      // En caso de error, mantener los pending updates para reintento
    }
  }, [recipe, originalGravity, finalGravity, calculateABV, callEndpointSilent]);

  // Función para programar una actualización con debounce
  const scheduleUpdate = useCallback(
    (updates: {
      originalGravity?: number;
      finalGravity?: number;
      batchLiters?: number;
    }) => {
      // Limpiar timeout anterior si existe
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Combinar con updates pendientes
      pendingUpdateRef.current = {
        ...pendingUpdateRef.current,
        ...updates,
      };

      // Programar nueva actualización después de 500ms
      debounceTimeoutRef.current = setTimeout(() => {
        debouncedUpdateMeasurements();
      }, 500);
    },
    [debouncedUpdateMeasurements]
  );

  // Función para actualizar gravedad original
  const updateOriginalGravity = useCallback(
    (og: number) => {
      if (!recipe) return;

      // Actualizar estado local inmediatamente
      setOriginalGravity(og);

      // Si ya tenemos FG, recalcular ABV
      if (finalGravity) {
        const abv = calculateABV(og, finalGravity);
        setCalculatedABV(abv);
      }

      // Programar actualización en backend con debounce
      scheduleUpdate({ originalGravity: og });
    },
    [recipe, finalGravity, calculateABV, scheduleUpdate]
  );

  // Función para actualizar gravedad final
  const updateFinalGravity = useCallback(
    (fg: number) => {
      if (!recipe) return;

      // Actualizar estado local inmediatamente
      setFinalGravity(fg);

      // Si ya tenemos OG, recalcular ABV
      if (originalGravity) {
        const abv = calculateABV(originalGravity, fg);
        setCalculatedABV(abv);
      }

      // Programar actualización en backend con debounce
      scheduleUpdate({ finalGravity: fg });
    },
    [recipe, originalGravity, calculateABV, scheduleUpdate]
  );

  // Función para actualizar litros del batch
  const updateBatchLiters = useCallback(
    (liters: number) => {
      if (!recipe) return;

      // Actualizar estado local inmediatamente
      setBatchLiters(liters);

      // Programar actualización en backend con debounce
      scheduleUpdate({ batchLiters: liters });
    },
    [recipe, scheduleUpdate]
  );

  // Función simple para actualizar notas (solo actualiza el estado)
  const updateBatchNotes = useCallback(
    (notes: string) => {
      setBatchNotes(notes);
      currentNotesRef.current = notes;
      // Solo activar debounce si no es una actualización desde el backend
      if (!isUpdatingFromBackend) {
        setNotesLastChanged(Date.now());
      }
    },
    [isUpdatingFromBackend]
  );

  // Sincronizar el tiempo con la API cada 30 segundos cuando está corriendo
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;

    if (isRunning && recipe?.id) {
      syncInterval = setInterval(async () => {
        try {
          // Actualizar tiempo en el backend
          await callEndpointSilent(updateBrewingTime(recipe.id, currentTime));

          // Sincronizar estado de sesión ocasionalmente (solo para verificar consistencia)
          const newSessionState = await getActiveSessionState(recipe);

          // Solo actualizar si hay cambios significativos en el estado
          if (
            sessionState.isRunning !== newSessionState.isRunning ||
            sessionState.isPaused !== newSessionState.isPaused ||
            sessionState.hasActiveSession !== newSessionState.hasActiveSession
          ) {
            console.log(
              "Detectado cambio de estado de sesión, actualizando..."
            );
            setSessionState(newSessionState);
          }

          // Si hay desincronización de tiempo, corregir
          if (
            newSessionState.hasActiveSession &&
            newSessionState.session?.currentTime !== undefined
          ) {
            const backendTime = newSessionState.session.currentTime;
            const timeDiff = Math.abs(currentTime - backendTime);

            // Si la diferencia es mayor a 10 segundos, sincronizar
            if (timeDiff > 10) {
              console.log(
                `Sincronizando tiempo: local=${currentTime}s, backend=${backendTime}s`
              );
              setCurrentTime(backendTime);
            }
          }
        } catch (error) {
          console.error("Error syncing time:", error);
        }
      }, 30000); // Cada 30 segundos
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isRunning, recipe?.id, currentTime, sessionState]);

  useEffect(() => {
    // Crear elemento de audio para las alertas - sonido más notorio
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
    );
    // Configurar volumen y repetición para mejor notificación
    if (audioRef.current) {
      audioRef.current.volume = 0.8;
      audioRef.current.loop = false;
    }
  }, []);

  useEffect(() => {
    // Solicitar permisos de notificación
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Función para verificar si el timer debería estar pausado por cambio de temperatura
  const checkForAutoPause = useCallback(
    (
      recipe: Recipe,
      currentTimeInSeconds: number,
      completedStepsSet: Set<string>
    ) => {
      const currentMinutes = Math.floor(currentTimeInSeconds / 60);

      // Combinar pasos de la receta con marcadores automáticos
      const autoMarkers = generateAutoMarkers();
      const allSteps = [...recipe.steps, ...autoMarkers];

      // Buscar el último paso que requiere pausa automática que ya debería haber ocurrido
      const temperatureChangeSteps = allSteps
        .filter(
          (step) =>
            (step.type === "temperature-change" ||
              step.id?.startsWith("auto-boil-start") ||
              step.temperature !== undefined) &&
            step.time <= currentMinutes &&
            step.time < 1440 && // Solo pasos del día de cocción
            !completedStepsSet.has(step.id) // NO pausar si el paso ya fue completado
        )
        .sort((a, b) => b.time - a.time); // Ordenar de mayor a menor para obtener el más reciente

      if (temperatureChangeSteps.length > 0) {
        const lastTemperatureStep = temperatureChangeSteps[0];

        // Si hay un paso de cambio de temperatura que ya debería haber ocurrido,
        // el timer debería estar pausado en ese momento
        const pauseTimeInSeconds = lastTemperatureStep.time * 60;

        console.log(
          "Detectado paso de temperatura que requiere pausa automática:",
          {
            step: lastTemperatureStep,
            currentTime: currentTimeInSeconds,
            shouldPauseAt: pauseTimeInSeconds,
          }
        );

        return {
          shouldBePaused: true,
          pauseTime: pauseTimeInSeconds,
          triggerStep: lastTemperatureStep,
        };
      }

      return { shouldBePaused: false };
    },
    [generateAutoMarkers]
  );

  // Función para pausar el timer (declarada temprano para el useEffect)
  const pauseTimer = useCallback(async () => {
    if (!recipe) return;

    try {
      // Llamar a la API para pausar el brewing
      const sessionResponse = await callEndpointSilent(pauseBrewing(recipe.id));

      // Actualizar estado local inmediatamente
      setIsRunning(false);

      // Usar la respuesta del endpoint directamente
      if (sessionResponse?.data?.session) {
        const session = sessionResponse.data.session;
        setSessionState({
          hasActiveSession: true,
          isRunning: session.isRunning,
          isPaused: session.isPaused,
          status: session.status,
          session: session,
        });

        if (session.currentTime !== undefined) {
          setCurrentTime(session.currentTime);
        }
      }
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  }, [recipe, callEndpointSilent, pauseBrewing]);

  // Actualizar ref de pauseTimer
  useEffect(() => {
    pauseTimerRef.current = pauseTimer;
  }, [pauseTimer]);

  // useEffect para cargar la receta inicial
  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipeId) return;

      try {
        setIsInitialLoading(true);
        const result = await callEndpoint(getRecipeById(recipeId));

        if (result?.data) {
          setRecipe(result.data);

          // Cargar datos de gravedad si existen en la receta
          if (result.data.originalGravity) {
            setOriginalGravity(result.data.originalGravity);
          }
          if (result.data.finalGravity) {
            setFinalGravity(result.data.finalGravity);
          }

          // Calcular ABV si tenemos ambas gravedades
          if (result.data.originalGravity && result.data.finalGravity) {
            const abv = calculateABV(
              result.data.originalGravity,
              result.data.finalGravity
            );
            setCalculatedABV(abv);
          }

          // Cargar estado de sesión si existe
          const sessionState = await getActiveSessionState(result.data);
          setSessionState(sessionState);

          // Cargar datos de gravedad desde la sesión activa si existe
          if (sessionState.hasActiveSession && sessionState.session) {
            const session = sessionState.session;

            console.log("Cargando datos de sesión:", session);
            console.log("Session originalGravity:", session.originalGravity);
            console.log("Session finalGravity:", session.finalGravity);
            console.log("Session batchLiters:", session.batchLiters);

            if (
              session.originalGravity !== undefined &&
              session.originalGravity !== null
            ) {
              console.log(
                "Aplicando originalGravity:",
                session.originalGravity
              );
              setOriginalGravity(session.originalGravity);
            }
            if (
              session.finalGravity !== undefined &&
              session.finalGravity !== null
            ) {
              console.log("Aplicando finalGravity:", session.finalGravity);
              setFinalGravity(session.finalGravity);
            }
            if (
              session.calculatedABV !== undefined &&
              session.calculatedABV !== null
            ) {
              setCalculatedABV(session.calculatedABV);
            } else if (session.originalGravity && session.finalGravity) {
              // Calcular ABV si tenemos ambas gravedades pero no el ABV calculado
              const abv = calculateABV(
                session.originalGravity,
                session.finalGravity
              );
              setCalculatedABV(abv);
            }
            if (
              session.batchNumber !== undefined &&
              session.batchNumber !== null
            ) {
              setBatchNumber(session.batchNumber);
            }
            if (
              session.batchLiters !== undefined &&
              session.batchLiters !== null
            ) {
              console.log("Aplicando batchLiters:", session.batchLiters);
              setBatchLiters(session.batchLiters);
            }
            if (
              session.batchNotes !== undefined &&
              session.batchNotes !== null
            ) {
              console.log("Aplicando batchNotes:", session.batchNotes);
              setIsUpdatingFromBackend(true);
              setBatchNotes(session.batchNotes);
              currentNotesRef.current = session.batchNotes;
              setTimeout(() => setIsUpdatingFromBackend(false), 100);
            }
          }

          // Si hay una sesión activa, cargar el tiempo actual
          if (sessionState.hasActiveSession && sessionState.session) {
            let elapsedTime = await calculateElapsedTime(result.data);

            // Cargar pasos completados ANTES de verificar auto-pausa
            let completedStepsSet = new Set<string>();
            if (sessionState.session.completedSteps) {
              const completedIds = sessionState.session.completedSteps.map(
                (cs) => cs.stepId
              );
              completedStepsSet = new Set(completedIds);
              setCompletedSteps(completedStepsSet);
            }

            // Verificar si debería haber habido una pausa automática
            if (sessionState.isRunning) {
              const pauseCheck = checkForAutoPause(
                result.data,
                elapsedTime,
                completedStepsSet
              );

              if (
                pauseCheck.shouldBePaused &&
                pauseCheck.pauseTime !== undefined
              ) {
                // El timer debería estar pausado, ajustar el tiempo y pausar
                console.log(
                  "Timer debería estar pausado por cambio de temperatura, ajustando..."
                );

                // Ajustar el tiempo al momento donde debería haberse pausado
                elapsedTime = pauseCheck.pauseTime;
                setCurrentTime(elapsedTime);
                setIsRunning(false);

                // Mostrar la alerta del paso que causó la pausa
                if (pauseCheck.triggerStep) {
                  setCurrentAlert(pauseCheck.triggerStep);
                }

                // Pausar en el backend también
                try {
                  await callEndpointSilent(pauseBrewing(result.data.id));
                } catch (error) {
                  console.error("Error pausando brewing en el backend:", error);
                }
              } else {
                setCurrentTime(elapsedTime);
                setIsRunning(sessionState.isRunning);
              }
            } else {
              setCurrentTime(elapsedTime);
              setIsRunning(sessionState.isRunning);
            }
          }
        }
      } catch (error) {
        console.error("Error loading recipe:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId]); // Solo depender de recipeId

  // useEffect para manejar el timer principal
  useEffect(() => {
    // Limpiar cualquier interval previo antes de crear uno nuevo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && recipe?.id) {
      intervalRef.current = setInterval(() => {
        // Incrementar tiempo local cada segundo sin llamar al backend
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1;

          // Verificar si hay algún paso que deba alertar
          const currentMinutes = Math.floor(newTime / 60);

          // Usar valores de refs para evitar dependencias
          const currentRecipe = recipeRef.current;
          const currentCompletedSteps = completedStepsRef.current;

          if (!currentRecipe) return newTime;

          // Combinar pasos de la receta con marcadores automáticos
          const autoMarkers = generateAutoMarkers();
          const allSteps = [...currentRecipe.steps, ...autoMarkers];

          const stepToAlert = allSteps.find(
            (step) =>
              step.time === currentMinutes &&
              !currentCompletedSteps.has(step.id) &&
              Math.floor(prevTime / 60) < currentMinutes &&
              step.time < 1440 // Solo alertar pasos del día de cocción (menos de 24 horas)
          );

          if (stepToAlert) {
            setCurrentAlert(stepToAlert);

            // Pausar automáticamente si el paso requiere cambio de temperatura
            // o si es el marcador de inicio de cocción
            if (
              stepToAlert.type === "temperature-change" ||
              stepToAlert.id.startsWith("auto-boil-start") ||
              stepToAlert.temperature !== undefined
            ) {
              pauseTimerRef.current?.();
              console.log(
                "Timer pausado automáticamente para cambio de temperatura:",
                stepToAlert.description
              );
            }

            // Reproducir sonido de alerta (múltiples veces para cambios críticos)
            if (audioRef.current) {
              const isTemperatureChange =
                stepToAlert.type === "temperature-change" ||
                stepToAlert.id.startsWith("auto-boil-start") ||
                stepToAlert.temperature !== undefined;

              // Para cambios de temperatura, reproducir el sonido 3 veces
              if (isTemperatureChange) {
                audioRef.current.play().catch(console.error);
                setTimeout(
                  () => audioRef.current?.play().catch(console.error),
                  500
                );
                setTimeout(
                  () => audioRef.current?.play().catch(console.error),
                  1000
                );
              } else {
                audioRef.current.play().catch(console.error);
              }
            }

            // Mostrar notificación del navegador si está disponible
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(`Luna Brew House - ${currentRecipe.name}`, {
                body: `Es hora de: ${stepToAlert.description}`,
                icon: "/images/luna-logo.png",
              });
            }
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, recipe?.id]); // Solo dependencias esenciales

  // useEffect para configurar el audio de alertas
  useEffect(() => {
    // Crear elemento de audio para las alertas - sonido más notorio
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
    );
    // Configurar volumen y repetición para mejor notificación
    if (audioRef.current) {
      audioRef.current.volume = 0.8;
      audioRef.current.loop = false;
    }
  }, []);

  // useEffect para sincronización periódica con el backend
  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null;

    // Solo sincronizar cuando hay una sesión activa
    if (isRunning && recipe?.id) {
      syncInterval = setInterval(async () => {
        try {
          // Usar valores de los refs para evitar dependencias innecesarias
          const currentRecipe = recipeRef.current;
          const currentTimeValue = currentTimeRef.current;
          const currentSessionState = sessionStateRef.current;

          if (!currentRecipe) return;

          // Actualizar tiempo en el backend
          await callEndpointSilent(
            updateBrewingTime(currentRecipe.id, currentTimeValue)
          );

          // Sincronizar estado de sesión ocasionalmente (solo para verificar consistencia)
          const newSessionState = await getActiveSessionState(currentRecipe);

          // Solo actualizar si hay cambios significativos en el estado
          if (
            currentSessionState.isRunning !== newSessionState.isRunning ||
            currentSessionState.isPaused !== newSessionState.isPaused ||
            currentSessionState.hasActiveSession !==
              newSessionState.hasActiveSession
          ) {
            console.log(
              "Detectado cambio de estado de sesión, actualizando..."
            );
            setSessionState(newSessionState);
          }

          // NOTA: No sincronizar tiempo automáticamente para evitar interferir con el timer local
          // Solo sincronizar si hay una diferencia MUY grande (más de 30 segundos)
          if (
            newSessionState.hasActiveSession &&
            newSessionState.session?.currentTime !== undefined
          ) {
            const backendTime = newSessionState.session.currentTime;
            const timeDiff = Math.abs(currentTimeValue - backendTime);

            // Solo sincronizar si hay una diferencia muy grande (posible desconexión)
            if (timeDiff > 30) {
              console.log(
                `Sincronizando tiempo por gran diferencia: local=${currentTimeValue}s, backend=${backendTime}s`
              );
              setCurrentTime(backendTime);
            }
          }
        } catch (error) {
          console.error("Error syncing time:", error);
        }
      }, 30000); // Cada 30 segundos
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isRunning, recipe?.id]); // Solo dependencias esenciales

  // useEffect para sincronizar datos de gravedad cuando cambie sessionState
  useEffect(() => {
    if (sessionState.hasActiveSession && sessionState.session) {
      const session = sessionState.session;

      console.log("Sincronizando datos de sessionState:", session);

      // Solo actualizar si los valores han cambiado para evitar loops
      // Y solo si no hay actualizaciones pendientes (usuario no está editando)
      if (!pendingUpdateRef.current) {
        if (
          session.originalGravity !== undefined &&
          session.originalGravity !== null &&
          session.originalGravity !== originalGravity
        ) {
          console.log(
            "Actualizando originalGravity desde sessionState:",
            session.originalGravity
          );
          setOriginalGravity(session.originalGravity);
        }

        if (
          session.finalGravity !== undefined &&
          session.finalGravity !== null &&
          session.finalGravity !== finalGravity
        ) {
          console.log(
            "Actualizando finalGravity desde sessionState:",
            session.finalGravity
          );
          setFinalGravity(session.finalGravity);
        }

        if (
          session.batchLiters !== undefined &&
          session.batchLiters !== null &&
          session.batchLiters !== batchLiters
        ) {
          console.log(
            "Actualizando batchLiters desde sessionState:",
            session.batchLiters
          );
          setBatchLiters(session.batchLiters);
        }

        if (
          session.batchNotes !== undefined &&
          session.batchNotes !== null &&
          session.batchNotes !== batchNotes
        ) {
          console.log(
            "Actualizando batchNotes desde sessionState:",
            session.batchNotes
          );
          setIsUpdatingFromBackend(true);
          setBatchNotes(session.batchNotes);
          currentNotesRef.current = session.batchNotes;
          // Resetear la bandera después de un breve delay
          setTimeout(() => setIsUpdatingFromBackend(false), 100);
        }
      }

      if (
        session.calculatedABV !== undefined &&
        session.calculatedABV !== null
      ) {
        setCalculatedABV(session.calculatedABV);
      } else if (session.originalGravity && session.finalGravity) {
        const abv = calculateABV(session.originalGravity, session.finalGravity);
        setCalculatedABV(abv);
      }

      if (session.batchNumber !== undefined && session.batchNumber !== null) {
        setBatchNumber(session.batchNumber);
      }
    }
  }, [sessionState, calculateABV]); // Removidas las dependencias conflictivas

  // useEffect para manejar debounce de notas
  useEffect(() => {
    if (notesLastChanged === 0 || !recipe) return;

    const timeoutId = setTimeout(async () => {
      try {
        const updateData = {
          batchNotes: currentNotesRef.current,
        };

        await callEndpointSilent(
          updateGravityMeasurements(recipe.id, updateData)
        );
      } catch (error) {
        console.error("Error updating batch notes:", error);
      }
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [notesLastChanged, recipe?.id]); // Removida callEndpointSilent para evitar loops

  // useEffect para solicitar permisos de notificación
  useEffect(() => {
    // Solicitar permisos de notificación
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // useEffect para limpiar timeouts del debounce al desmontar
  useEffect(() => {
    return () => {
      // Limpiar timeout de debounce si existe
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Si hay actualizaciones pendientes, ejecutarlas inmediatamente antes de desmontar
      if (pendingUpdateRef.current && recipe) {
        debouncedUpdateMeasurements();
      }
    };
  }, [debouncedUpdateMeasurements, recipe]);
  if (isInitialLoading || !recipe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {isInitialLoading ? "Cargando receta..." : "Receta no encontrada"}
          </h2>
          <p className="text-muted-foreground">
            {isInitialLoading
              ? "Por favor espera un momento"
              : "La receta solicitada no existe"}
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getCurrentMinutes = () => Math.floor(currentTime / 60);

  const getStepStatus = (step: RecipeStep) => {
    const currentMinutes = getCurrentMinutes();

    // Los marcadores automáticos se marcan como completados automáticamente cuando se alcanza su tiempo
    if (step.id.startsWith("auto-") && step.time <= currentMinutes) {
      return "completed";
    }

    if (completedSteps.has(step.id)) return "completed";
    if (step.time <= currentMinutes && step.time < 1440) return "current"; // Solo pasos del día de cocción
    return "pending";
  };

  const getStepTypeInfo = (type: string) => {
    return (
      stepTypes.find((st) => st.value === type) ||
      stepTypes[stepTypes.length - 1]
    );
  };

  const startTimer = async () => {
    if (!recipe) return;

    try {
      // Solo llamar a startBrewing si no hay una sesión activa
      const currentSessionState = await getActiveSessionState(recipe);

      let sessionResponse;
      if (!currentSessionState.hasActiveSession) {
        sessionResponse = await callEndpointSilent(startBrewing(recipe.id));
      }

      // Actualizar estado local inmediatamente
      setIsRunning(true);

      // Usar la respuesta del endpoint directamente si está disponible
      if (sessionResponse?.data?.session) {
        const session = sessionResponse.data.session;
        setSessionState({
          hasActiveSession: true,
          isRunning: session.isRunning,
          isPaused: session.isPaused,
          status: session.status,
          session: session,
        });

        if (session.currentTime !== undefined) {
          setCurrentTime(session.currentTime);
        }
      } else {
        // Solo si no tenemos respuesta directa, consultar estado
        const newSessionState = await getActiveSessionState(recipe);
        setSessionState(newSessionState);

        if (newSessionState.session?.currentTime !== undefined) {
          setCurrentTime(newSessionState.session.currentTime);
        }
      }
    } catch (error: any) {
      console.error("Error starting timer:", error);

      // Si ya hay una sesión activa, solo reanudar el timer local
      if (
        error?.response?.data?.error?.includes("sesión de elaboración activa")
      ) {
        console.log("Sesión ya activa, continuando con el timer local...");
        setIsRunning(true);

        // En caso de error, obtener estado actual
        const newSessionState = await getActiveSessionState(recipe);
        setSessionState(newSessionState);

        if (newSessionState.session?.currentTime !== undefined) {
          setCurrentTime(newSessionState.session.currentTime);
        }
      }
    }
  };

  const resumeTimer = async () => {
    if (!recipe) return;

    try {
      // Llamar a la API para reanudar el brewing
      const sessionResponse = await callEndpointSilent(
        resumeBrewing(recipe.id)
      );

      // Actualizar estado local inmediatamente
      setIsRunning(true);

      // Usar la respuesta del endpoint directamente
      if (sessionResponse?.data?.session) {
        const session = sessionResponse.data.session;
        setSessionState({
          hasActiveSession: true,
          isRunning: session.isRunning,
          isPaused: session.isPaused,
          status: session.status,
          session: session,
        });

        if (session.currentTime !== undefined) {
          setCurrentTime(session.currentTime);
        }
      }
    } catch (error) {
      console.error("Error resuming timer:", error);
    }
  };

  const toggleTimer = async () => {
    if (isRunning) {
      pauseTimer();
    } else {
      // Verificar el estado actual para decidir entre iniciar o reanudar
      if (sessionState.hasActiveSession && sessionState.isPaused) {
        // Si hay una sesión pausada, reanudar
        resumeTimer();
      } else if (sessionState.hasActiveSession && sessionState.isRunning) {
        // Si ya está corriendo (sincronización), solo actualizar el estado local
        setIsRunning(true);
      } else {
        // Si no hay sesión activa, iniciar una nueva
        startTimer();
      }
    }
  };

  const completeBrewingDay = () => {
    setIsRunning(false);
    if (recipe) {
      setRecipe({
        ...recipe,
        brewingStatus: "fermenting",
      });
    }
  };

  const addStep = async () => {
    if (newStep.description && newStep.time !== undefined && recipe) {
      // Validar tiempo según el tipo de proceso
      if (selectedProcessType) {
        const validation = validateStepTime(
          selectedProcessType,
          newStep.time || 0
        );
        if (!validation.isValid) {
          setValidationError(validation.message || "Error de validación");
          return;
        }
      }

      try {
        const stepData = {
          time: newStep.time || 0,
          type: newStep.type || "other",
          description: newStep.description,
          amount: newStep.amount,
          temperature: newStep.temperature,
        };

        await callEndpointSilent(addRecipeStep(recipe.id, stepData));

        // Recargar receta para obtener el paso actualizado
        const result = await callEndpointSilent(getRecipeById(recipe.id));
        if (result?.data) {
          setRecipe(result.data);
        }

        setNewStep({
          time: 0,
          type: "other",
          description: "",
          amount: "",
          temperature: undefined,
        });
        setSelectedProcessType("");
        setValidationError("");
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("Error adding step:", error);
      }
    }
  };

  const updateStep = async () => {
    if (editingStep && recipe) {
      try {
        const stepData = {
          time: editingStep.time,
          type: editingStep.type,
          description: editingStep.description,
          amount: editingStep.amount,
          temperature: editingStep.temperature,
        };

        await callEndpointSilent(
          updateRecipeStep(recipe.id, editingStep.id, stepData)
        );

        // Recargar receta para obtener el paso actualizado
        const result = await callEndpointSilent(getRecipeById(recipe.id));
        if (result?.data) {
          setRecipe(result.data);
        }

        setEditingStep(null);
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("Error updating step:", error);
      }
    }
  };

  const removeStep = async (stepId: string) => {
    if (recipe) {
      try {
        await callEndpointSilent(deleteRecipeStep(recipe.id, stepId));

        // Recargar receta para obtener los cambios
        const result = await callEndpointSilent(getRecipeById(recipe.id));
        if (result?.data) {
          setRecipe(result.data);
        }
      } catch (error) {
        console.error("Error removing step:", error);
      }
    }
  };

  // Separar pasos de cocción y fermentación
  const brewingSteps = recipe.steps.filter((step) => step.time < 1440); // Menos de 24 horas
  const fermentationSteps = recipe.steps.filter((step) => step.time >= 1440); // 24 horas o más

  const sortedBrewingSteps = [...brewingSteps].sort((a, b) => a.time - b.time);
  const sortedFermentationSteps = [...fermentationSteps].sort(
    (a, b) => a.time - b.time
  );

  const totalBrewingSteps = sortedBrewingSteps.length;
  const completedBrewingCount = sortedBrewingSteps.filter((step) =>
    completedSteps.has(step.id)
  ).length;
  const brewingProgress =
    totalBrewingSteps > 0
      ? (completedBrewingCount / totalBrewingSteps) * 100
      : 0;

  const currentStep = sortedBrewingSteps.find(
    (step) => getStepStatus(step) === "current"
  );
  const nextStep = sortedBrewingSteps.find(
    (step) => step.time > getCurrentMinutes()
  );

  // Timeline horizontal para pasos de cocción

  // Calcular el tiempo máximo de los pasos (manejar array vacío)
  const maxStepTime =
    sortedBrewingSteps.length > 0
      ? Math.max(...sortedBrewingSteps.map((step) => step.time))
      : 0;

  const calculatedTime = (recipe.mashTime || 60) + (recipe.boilTime || 60);

  const maxBrewingTime = Math.max(maxStepTime, calculatedTime);

  const currentTimeProgress = (getCurrentMinutes() / maxBrewingTime) * 100;

  // Función para agrupar pasos que están muy cerca (menos de 10 minutos)
  const groupSteps = (
    steps: RecipeStep[],
    maxTime: number,
    isBrewingSteps = true
  ): GroupedStep[] => {
    const groups: GroupedStep[] = [];
    const sortedSteps = [...steps].sort((a, b) => a.time - b.time);

    for (const step of sortedSteps) {
      const timeToCheck = isBrewingSteps
        ? step.time
        : Math.floor(step.time / 1440); // Para fermentación usar días
      const threshold = isBrewingSteps ? 15 : 1; // 10 minutos para cocción, 1 día para fermentación

      // Buscar si hay un grupo existente dentro del threshold
      const existingGroup = groups.find(
        (group) => Math.abs(group.time - timeToCheck) < threshold
      );

      if (existingGroup) {
        existingGroup.steps.push(step);
      } else {
        const position = isBrewingSteps
          ? (step.time / maxTime) * 100
          : (Math.floor(step.time / 1440) / (recipe.fermentationDays || 14)) *
            100;

        groups.push({
          time: timeToCheck,
          steps: [step],
          position: Math.min(position, 95),
        });
      }
    }

    return groups;
  };

  // Timeline de fermentación
  const getFermentationProgress = () => {
    if (!recipe.brewingStartDate || recipe.brewingStatus !== "fermenting")
      return 0;
    const startDate = new Date(recipe.brewingStartDate);
    const currentDate = new Date();
    const daysPassed = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.min((daysPassed / (recipe.fermentationDays || 14)) * 100, 100);
  };

  const getFermentationDaysPassed = () => {
    if (!recipe.brewingStartDate) return 0;
    const startDate = new Date(recipe.brewingStartDate);
    const currentDate = new Date();
    return Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Agrupar pasos para el timeline
  const autoMarkers = generateAutoMarkers();
  const allBrewingSteps = [...sortedBrewingSteps, ...autoMarkers];
  const groupedBrewingSteps = groupSteps(allBrewingSteps, maxBrewingTime, true);
  const groupedFermentationSteps = groupSteps(
    sortedFermentationSteps,
    recipe.fermentationDays || 14,
    false
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b rounded-t-lg">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/recetas">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Recetas
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{recipe.name}</h1>
                <p className="text-muted-foreground">
                  {recipe.style} • {recipe.batchSize}L
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                className={
                  recipe.difficulty === "Fácil"
                    ? "bg-green-100 text-green-800"
                    : recipe.difficulty === "Intermedio"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {recipe.difficulty}
              </Badge>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingStep(null);
                  setNewStep({
                    time: 0,
                    type: "other",
                    description: "",
                    amount: "",
                    temperature: undefined,
                  });
                  setSelectedProcessType("");
                  setValidationError("");
                  setIsEditDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Paso
              </Button>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {recipe.brewingStatus === "fermenting"
                      ? "Fermentando"
                      : "Tiempo transcurrido"}
                  </div>
                </div>

                {/* Controles del Timer */}
                {recipe.brewingStatus !== "fermenting" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={toggleTimer}
                      className={
                        isRunning
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }
                    >
                      {isRunning ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          {sessionState.hasActiveSession &&
                          sessionState.isPaused
                            ? "Continuar"
                            : "Iniciar"}
                        </>
                      )}
                    </Button>
                    {recipe.currentSession && (
                      <Button size="sm" variant="outline" onClick={resetTimer}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reiniciar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Horizontal */}
      <div className="bg-white border-b rounded-b-lg">
        <div className="container py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {recipe.brewingStatus === "fermenting"
                  ? "Timeline de Fermentación"
                  : "Timeline de Cocción"}
              </h3>
              <div className="text-sm text-muted-foreground">
                {recipe.brewingStatus === "fermenting"
                  ? `Día ${getFermentationDaysPassed()} de ${
                      recipe.fermentationDays
                    }`
                  : `${getCurrentMinutes()} / ${maxBrewingTime} minutos`}
              </div>
            </div>

            {recipe.brewingStatus !== "fermenting" ? (
              // Timeline de cocción
              <div className="relative px-8 pb-16">
                {/* Barra de progreso principal */}
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-3 bg-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(currentTimeProgress, 100)}%` }}
                  />
                </div>

                {/* Marcadores de pasos agrupados */}
                <div className="relative mt-6">
                  {groupedBrewingSteps.map((group, groupIndex) => {
                    const hasMultipleSteps = group.steps.length > 1;
                    const primaryStep = group.steps[0];
                    const status = getStepStatus(primaryStep);
                    const typeInfo = getStepTypeInfo(primaryStep.type);

                    // Determinar el estado del grupo
                    const groupStatus = group.steps.every(
                      (step) => getStepStatus(step) === "completed"
                    )
                      ? "completed"
                      : group.steps.some(
                          (step) => getStepStatus(step) === "current"
                        )
                      ? "current"
                      : "pending";

                    return (
                      <Popover key={groupIndex}>
                        <PopoverTrigger asChild>
                          <div
                            className="absolute transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform"
                            style={{ left: `${group.position}%` }}
                          >
                            <div className="flex flex-col items-center">
                              <div className="relative">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-3 shadow-lg ${
                                    groupStatus === "completed"
                                      ? "bg-green-500 border-green-600 text-white"
                                      : groupStatus === "current"
                                      ? "bg-amber-500 border-amber-600 text-white animate-pulse"
                                      : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                                  }`}
                                >
                                  {groupStatus === "completed" ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : hasMultipleSteps ? (
                                    <span className="text-sm font-bold">
                                      {group.steps.length}
                                    </span>
                                  ) : (
                                    <span className="text-sm">
                                      {typeInfo.icon}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-center max-w-20">
                                <div className="font-medium">{group.time}m</div>
                                <div className="text-muted-foreground truncate text-xs">
                                  {hasMultipleSteps
                                    ? `${group.steps.length} pasos`
                                    : primaryStep.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-96">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">
                                {hasMultipleSteps ? "📋" : typeInfo.icon}
                              </span>
                              <h4 className="font-medium">
                                {hasMultipleSteps
                                  ? `${group.steps.length} pasos en ${group.time} minutos`
                                  : primaryStep.description}
                              </h4>
                            </div>

                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              {group.steps.map((step) => {
                                const stepStatus = getStepStatus(step);
                                const stepTypeInfo = getStepTypeInfo(step.type);

                                return (
                                  <div
                                    key={step.id}
                                    className="border rounded-lg p-3 space-y-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">
                                        {stepTypeInfo.icon}
                                      </span>
                                      <Badge className={stepTypeInfo.color}>
                                        {stepTypeInfo.label}
                                      </Badge>
                                      {stepStatus === "current" && (
                                        <Badge
                                          variant="outline"
                                          className="animate-pulse"
                                        >
                                          En curso
                                        </Badge>
                                      )}
                                      {stepStatus === "completed" && (
                                        <Badge
                                          variant="outline"
                                          className="text-green-600"
                                        >
                                          Completado
                                        </Badge>
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-sm">
                                        {step.description}
                                      </h5>
                                      <p className="text-xs text-muted-foreground">
                                        Tiempo: {step.time} minutos
                                      </p>
                                      {step.amount && (
                                        <p className="text-xs text-muted-foreground">
                                          Cantidad: {step.amount}
                                        </p>
                                      )}
                                      {step.temperature && (
                                        <p className="text-xs text-muted-foreground">
                                          Temperatura: {step.temperature}°C
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      {stepStatus !== "pending" &&
                                        !step.id.startsWith("auto-") && (
                                          <Button
                                            size="sm"
                                            variant={
                                              stepStatus === "completed"
                                                ? "default"
                                                : "outline"
                                            }
                                            onClick={() => toggleStep(step.id)}
                                            className="flex-1"
                                          >
                                            {stepStatus === "completed" ? (
                                              <>
                                                <CheckCircle className="mr-2 h-3 w-3" />
                                                Completado
                                              </>
                                            ) : (
                                              "Marcar completado"
                                            )}
                                          </Button>
                                        )}
                                      {step.id.startsWith("auto-") ? (
                                        <div className="flex-1 text-center text-xs text-muted-foreground py-2">
                                          Marcador automático
                                        </div>
                                      ) : (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setEditingStep(step);
                                              setIsEditDialogOpen(true);
                                            }}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeStep(step.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Timeline de fermentación
              <div className="relative px-8 pb-16">
                {/* Barra de progreso de fermentación */}
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-3 bg-green-600 rounded-full transition-all duration-1000"
                    style={{ width: `${getFermentationProgress()}%` }}
                  />
                </div>

                {/* Marcadores de fermentación */}
                <div className="relative mt-6">
                  {/* Inicio de fermentación */}
                  <div
                    className="absolute transform -translate-x-1/2"
                    style={{ left: "0%" }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 text-white shadow-lg">
                        <FlaskConical className="h-5 w-5" />
                      </div>
                      <div className="mt-2 text-xs text-center">
                        <div className="font-medium">Inicio</div>
                        <div className="text-muted-foreground text-xs">
                          Fermentación
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pasos de fermentación agrupados */}
                  {groupedFermentationSteps.map((group, groupIndex) => {
                    const hasMultipleSteps = group.steps.length > 1;
                    const primaryStep = group.steps[0];
                    const typeInfo = getStepTypeInfo(primaryStep.type);
                    const dayOfStep = group.time;
                    const isPassed = getFermentationDaysPassed() >= dayOfStep;

                    return (
                      <Popover key={groupIndex}>
                        <PopoverTrigger asChild>
                          <div
                            className="absolute transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform"
                            style={{ left: `${group.position}%` }}
                          >
                            <div className="flex flex-col items-center">
                              <div className="relative">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-3 shadow-lg ${
                                    isPassed
                                      ? "bg-green-500 border-green-600 text-white"
                                      : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                                  }`}
                                >
                                  {isPassed ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : hasMultipleSteps ? (
                                    <span className="text-sm font-bold">
                                      {group.steps.length}
                                    </span>
                                  ) : (
                                    <span className="text-sm">
                                      {typeInfo.icon}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-center max-w-24">
                                <div className="font-medium">
                                  Día {dayOfStep}
                                </div>
                                <div className="text-muted-foreground truncate text-xs">
                                  {hasMultipleSteps
                                    ? `${group.steps.length} pasos`
                                    : primaryStep.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-96">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">
                                {hasMultipleSteps ? "📋" : typeInfo.icon}
                              </span>
                              <h4 className="font-medium">
                                {hasMultipleSteps
                                  ? `${group.steps.length} pasos en día ${dayOfStep}`
                                  : primaryStep.description}
                              </h4>
                            </div>

                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              {group.steps.map((step) => {
                                const stepTypeInfo = getStepTypeInfo(step.type);
                                const stepDayOfStep = Math.floor(
                                  step.time / 1440
                                );
                                const stepIsPassed =
                                  getFermentationDaysPassed() >= stepDayOfStep;

                                return (
                                  <div
                                    key={step.id}
                                    className="border rounded-lg p-3 space-y-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">
                                        {stepTypeInfo.icon}
                                      </span>
                                      <Badge className={stepTypeInfo.color}>
                                        {stepTypeInfo.label}
                                      </Badge>
                                      {stepIsPassed && (
                                        <Badge
                                          variant="outline"
                                          className="text-green-600"
                                        >
                                          Completado
                                        </Badge>
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-sm">
                                        {step.description}
                                      </h5>
                                      <p className="text-xs text-muted-foreground">
                                        Día: {stepDayOfStep}
                                      </p>
                                      {step.amount && (
                                        <p className="text-xs text-muted-foreground">
                                          Cantidad: {step.amount}
                                        </p>
                                      )}
                                      {step.temperature && (
                                        <p className="text-xs text-muted-foreground">
                                          Temperatura: {step.temperature}°C
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingStep(step);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeStep(step.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}

                  {/* Final de fermentación */}
                  <div
                    className="absolute transform -translate-x-1/2"
                    style={{ left: "100%" }}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                          getFermentationProgress() >= 100
                            ? "bg-green-500 text-white"
                            : "bg-white border-3 border-gray-300 text-gray-600"
                        }`}
                      >
                        {getFermentationProgress() >= 100 ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Calendar className="h-5 w-5" />
                        )}
                      </div>
                      <div className="mt-2 text-xs text-center">
                        <div className="font-medium">
                          Día {recipe.fermentationDays}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Completado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Control y Datos Técnicos */}
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel de control */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Control de Tiempo
                </CardTitle>
                <CardDescription>
                  {recipe.brewingStatus === "fermenting"
                    ? "Proceso de fermentación en curso"
                    : "Controla el proceso de elaboración"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipe.brewingStatus !== "fermenting" ? (
                  <>
                    <div className="flex gap-2">
                      <Button
                        onClick={toggleTimer}
                        className={
                          isRunning
                            ? "flex-1 bg-red-500 hover:bg-red-600"
                            : "flex-1 bg-green-500 hover:bg-green-600"
                        }
                      >
                        {isRunning ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            {sessionState.hasActiveSession &&
                            sessionState.isPaused
                              ? "Continuar"
                              : "Empezar"}
                          </>
                        )}
                      </Button>
                      <Button onClick={resetTimer} variant="outline">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso de Cocción</span>
                        <span>
                          {completedBrewingCount}/{totalBrewingSteps} pasos
                        </span>
                      </div>
                      <Progress value={brewingProgress} className="h-2" />
                    </div>

                    {brewingProgress >= 100 && (
                      <Button
                        onClick={completeBrewingDay}
                        className="w-full"
                        variant="default"
                      >
                        <FlaskConical className="mr-2 h-4 w-4" />
                        Completar Día de Cocción
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso de Fermentación</span>
                        <span>
                          {getFermentationDaysPassed()}/
                          {recipe.fermentationDays} días
                        </span>
                      </div>
                      <Progress
                        value={getFermentationProgress()}
                        className="h-2"
                      />
                    </div>

                    <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <FlaskConical className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-sm text-purple-800 font-medium">
                        Fermentación en Progreso
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        La cerveza está fermentando. Revisa los pasos de dry hop
                        según el cronograma.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep && recipe.brewingStatus !== "fermenting" && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-800">
                        Paso Actual
                      </span>
                    </div>
                    <p className="text-sm text-amber-700">
                      {currentStep.description}
                    </p>
                    {currentStep.amount && (
                      <p className="text-xs text-amber-600 mt-1">
                        Cantidad: {currentStep.amount}
                      </p>
                    )}
                    {currentStep.temperature && (
                      <p className="text-xs text-amber-600 mt-1">
                        Temperatura: {currentStep.temperature}°C
                      </p>
                    )}
                  </div>
                )}

                {nextStep && recipe.brewingStatus !== "fermenting" && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Próximo Paso
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {nextStep.description}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      En {nextStep.time - getCurrentMinutes()} minutos
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {calculatedABV !== null
                        ? calculatedABV.toFixed(2)
                        : recipe.abv}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ABV {calculatedABV !== null ? "(Medido)" : "(Teórico)"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {recipe.ibu}
                    </div>
                    <div className="text-xs text-muted-foreground">IBU</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {recipe.srm}
                    </div>
                    <div className="text-xs text-muted-foreground">SRM</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel de Medición de Gravedad */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Medición de Gravedad
                </CardTitle>
                <CardDescription>
                  Registra las mediciones y calcula el ABV automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gravedad Original */}
                <div className="space-y-2">
                  <Label htmlFor="original-gravity">
                    Gravedad Original (OG)
                  </Label>
                  <Input
                    id="original-gravity"
                    type="number"
                    step="0.001"
                    min="1.000"
                    max="1.200"
                    placeholder="ej. 1.050"
                    value={originalGravity || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 1.0 && value <= 1.2) {
                        updateOriginalGravity(value);
                      } else if (e.target.value === "") {
                        setOriginalGravity(null);
                        setCalculatedABV(null);
                      }
                    }}
                  />
                </div>

                {/* Gravedad Final */}
                <div className="space-y-2">
                  <Label htmlFor="final-gravity">Gravedad Final (FG)</Label>
                  <Input
                    id="final-gravity"
                    type="number"
                    step="0.001"
                    min="0.990"
                    max="1.100"
                    placeholder="ej. 1.012"
                    value={finalGravity || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0.99 && value <= 1.1) {
                        updateFinalGravity(value);
                      } else if (e.target.value === "") {
                        setFinalGravity(null);
                        setCalculatedABV(null);
                      }
                    }}
                  />
                </div>

                {/* ABV Calculado */}
                {calculatedABV !== null && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          ABV Calculado
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {calculatedABV.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Basado en OG: {originalGravity?.toFixed(3)} y FG:{" "}
                      {finalGravity?.toFixed(3)}
                    </p>
                  </div>
                )}

                {/* Litros del Batch */}
                <div className="space-y-2">
                  <Label htmlFor="batch-liters">Litros del Batch</Label>
                  <Input
                    id="batch-liters"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1000"
                    placeholder="ej. 20.5"
                    value={batchLiters || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        updateBatchLiters(value);
                      } else if (e.target.value === "") {
                        setBatchLiters(null);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Volumen final del batch después del proceso de elaboración
                  </p>
                </div>

                {/* Información de ayuda */}
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <p>
                    <strong>OG:</strong> Medir antes de añadir levadura
                  </p>
                  <p>
                    <strong>FG:</strong> Medir al final de la fermentación
                  </p>
                  <p>
                    <strong>Fórmula:</strong> ABV = (OG - FG) × 131.25
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Datos Técnicos de la Receta */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="h-5 w-5" />
                  Datos Técnicos de la Receta
                </CardTitle>
                <CardDescription>
                  Información detallada del proceso de elaboración
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Datos del Macerado */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wheat className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-amber-800">Macerado</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Temperatura:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.mashTemp}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Tiempo:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.mashTime} min
                        </span>
                      </div>
                      {(recipe as any).grainBill && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Granos:
                          </span>
                          <span className="text-sm font-medium">
                            {(recipe as any).grainBill}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Datos de Fermentación */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FlaskConical className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-800">
                        Fermentación
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Levadura:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.yeastStrain}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Temperatura:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.fermentationTemp}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Duración:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.fermentationDays} días
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Perfil de agua:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.waterProfile &&
                          typeof recipe.waterProfile === "object"
                            ? `Ca: ${
                                (recipe.waterProfile as any).calcium
                              }ppm, Mg: ${
                                (recipe.waterProfile as any).magnesium
                              }ppm`
                            : recipe.waterProfile || "No definido"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gravedad y Alcohol */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">
                        Gravedad Objetivo
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          OG Objetivo:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.targetOriginalGravity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          FG Objetivo:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.targetFinalGravity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          ABV:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.abv}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Atenuación:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.targetOriginalGravity &&
                          recipe.targetFinalGravity
                            ? Math.round(
                                ((recipe.targetOriginalGravity -
                                  recipe.targetFinalGravity) /
                                  (recipe.targetOriginalGravity - 1)) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lúpulos */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🌿</span>
                      <h3 className="font-semibold text-green-800">Lúpulos</h3>
                    </div>
                    <div className="space-y-2">
                      {recipe.steps
                        .filter(
                          (step) =>
                            step.type === "hop-addition" ||
                            step.type === "dry-hop"
                        )
                        .map((step, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {step.time < 1440
                                ? `${step.time}min`
                                : `Día ${Math.floor(step.time / 1440)}`}
                              :
                            </span>
                            <span className="text-sm font-medium">
                              {step.amount}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Tiempos */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-800">Tiempos</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Hervido:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.boilTime} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Lote:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.batchSize}L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          IBU:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.ibu}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          SRM:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.srm}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📝</span>
                      <h3 className="font-semibold text-gray-800">
                        Observaciones
                      </h3>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{recipe.notes}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notas del Batch */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Notas del Batch
                </CardTitle>
                <CardDescription>
                  Registra observaciones específicas de este batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="batch-notes">Notas y Observaciones</Label>
                  <Textarea
                    id="batch-notes"
                    placeholder="Añade notas específicas sobre este batch: observaciones, cambios realizados, problemas encontrados, etc."
                    value={batchNotes}
                    onChange={(e) => updateBatchNotes(e.target.value)}
                    rows={6}
                    className="resize-vertical"
                  />
                  <p className="text-xs text-muted-foreground">
                    Estas notas se guardan automáticamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog para editar pasos */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStep ? "Editar Paso" : "Agregar Nuevo Paso"}
            </DialogTitle>
            <DialogDescription>
              {editingStep
                ? "Modifica los detalles del paso"
                : "Agrega un nuevo paso a la receta"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Selector de tipo de proceso - solo para nuevos pasos */}
            {!editingStep && (
              <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label htmlFor="processType">Tipo de Proceso</Label>
                <Select
                  value={selectedProcessType}
                  onValueChange={handleProcessTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de proceso" />
                  </SelectTrigger>
                  <SelectContent>
                    {processTypes.map((process) => (
                      <SelectItem key={process.value} value={process.value}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{process.icon}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{process.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {process.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProcessType && (
                  <div className="text-xs text-blue-600 mt-2">
                    {selectedProcessType === "mashing" &&
                      "💡 El tiempo se cuenta desde el inicio del macerado (0-90 min típicamente)"}
                    {selectedProcessType === "boiling" &&
                      `💡 El tiempo se cuenta desde el inicio del hervor`}
                    {selectedProcessType === "fermentation" &&
                      "💡 Ingresa el número de días y se convertirá automáticamente"}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stepTime">
                  {selectedProcessType === "fermentation"
                    ? "Tiempo (días)"
                    : selectedProcessType === "boiling"
                    ? "Tiempo desde hervor (min)"
                    : "Tiempo (min)"}
                </Label>
                <Input
                  id="stepTime"
                  type="number"
                  value={
                    selectedProcessType === "fermentation" && newStep.time
                      ? Math.floor(newStep.time / 1440) || ""
                      : selectedProcessType === "boiling" &&
                        newStep.time &&
                        recipe?.mashTime
                      ? newStep.time - (recipe.mashTime || 60) || ""
                      : editingStep?.time || newStep.time
                  }
                  onChange={(e) => {
                    let value = Number.parseInt(e.target.value) || 0;

                    // Limpiar error de validación al cambiar el valor
                    setValidationError("");

                    // Calcular el tiempo real según el tipo de proceso
                    if (selectedProcessType) {
                      value = calculateTimeByProcess(
                        selectedProcessType,
                        value
                      );
                    }

                    if (editingStep) {
                      setEditingStep({ ...editingStep, time: value });
                    } else {
                      setNewStep({ ...newStep, time: value });
                    }
                  }}
                  placeholder={
                    selectedProcessType === "fermentation"
                      ? "Ej: 7 (días)"
                      : selectedProcessType === "boiling"
                      ? "Ej: 60 (min desde hervor)"
                      : "Ej: 15 (minutos)"
                  }
                />
                {selectedProcessType === "boiling" &&
                  newStep.time != 0 &&
                  newStep.time &&
                  recipe?.mashTime && (
                    <div className="text-xs text-muted-foreground">
                      Tiempo desde inicio de hervor
                    </div>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stepType">Tipo</Label>
                <Select
                  value={editingStep?.type || newStep.type}
                  onValueChange={(value) => {
                    if (editingStep) {
                      setEditingStep({
                        ...editingStep,
                        type: value as RecipeStep["type"],
                      });
                    } else {
                      setNewStep({
                        ...newStep,
                        type: value as RecipeStep["type"],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stepTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepDescription">Descripción</Label>
              <Input
                id="stepDescription"
                value={editingStep?.description || newStep.description}
                onChange={(e) => {
                  if (editingStep) {
                    setEditingStep({
                      ...editingStep,
                      description: e.target.value,
                    });
                  } else {
                    setNewStep({ ...newStep, description: e.target.value });
                  }
                }}
                placeholder="Describe qué hacer en este paso..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stepAmount">Cantidad</Label>
                <Input
                  id="stepAmount"
                  value={editingStep?.amount || newStep.amount}
                  onChange={(e) => {
                    if (editingStep) {
                      setEditingStep({
                        ...editingStep,
                        amount: e.target.value,
                      });
                    } else {
                      setNewStep({ ...newStep, amount: e.target.value });
                    }
                  }}
                  placeholder="Ej: 25g, 2 kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stepTemp">Temperatura °C</Label>
                <Input
                  id="stepTemp"
                  type="number"
                  value={editingStep?.temperature || newStep.temperature || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? Number.parseInt(e.target.value)
                      : undefined;
                    if (editingStep) {
                      setEditingStep({ ...editingStep, temperature: value });
                    } else {
                      setNewStep({ ...newStep, temperature: value });
                    }
                  }}
                />
              </div>
            </div>

            {/* Mensaje de error de validación */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Error de validación
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">{validationError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingStep(null);
                setNewStep({
                  time: 0,
                  type: "other",
                  description: "",
                  amount: "",
                  temperature: undefined,
                });
                setSelectedProcessType("");
                setValidationError("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={editingStep ? updateStep : addStep}>
              {editingStep ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta modal */}
      {currentAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-6 w-6" />
                ¡Es hora del siguiente paso!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {getStepTypeInfo(currentAlert.type).icon}
                  </span>
                  <div>
                    <p className="font-medium">{currentAlert.description}</p>
                    {currentAlert.amount && (
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {currentAlert.amount}
                      </p>
                    )}
                    {currentAlert.temperature && (
                      <p className="text-sm text-muted-foreground">
                        Temperatura: {currentAlert.temperature}°C
                      </p>
                    )}
                  </div>
                </div>

                {/* Mensaje de pausa automática */}
                {(currentAlert.type === "temperature-change" ||
                  currentAlert.id?.startsWith("auto-boil-start") ||
                  currentAlert.temperature !== undefined) && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <Pause className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Timer pausado automáticamente
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      Este paso requiere cambio de temperatura. Presiona
                      "Entendido" y luego "Reanudar" cuando estés listo.
                    </p>
                  </div>
                )}

                <Button onClick={dismissAlert} className="w-full">
                  Entendido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
