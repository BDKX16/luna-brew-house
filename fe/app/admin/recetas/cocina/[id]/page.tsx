"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  brewingStatus?: "not-started" | "brewing" | "fermenting" | "completed";
  brewingStartDate?: string;
  fermentationDays?: number;
  // Datos técnicos adicionales
  mashTemp?: number;
  mashTime?: number;
  spargeTemp?: number;
  originalGravity?: number;
  finalGravity?: number;
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
    color: "bg-red-100 text-red-800",
  },
  {
    value: "stirring",
    label: "Agitado",
    icon: "🥄",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "other",
    label: "Otro",
    icon: "⚙️",
    color: "bg-gray-100 text-gray-800",
  },
];

// Mock data - en una app real vendría de una API
const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Luna Golden Ale",
    style: "Golden Ale",
    description: "Una cerveza dorada refrescante con notas cítricas",
    abv: 5.2,
    ibu: 25,
    srm: 4,
    difficulty: "Fácil",
    batchSize: 20,
    boilTime: 60,
    steps: [
      {
        id: "1",
        time: 0,
        type: "temperature-change",
        description: "Calentar agua a temperatura de macerado",
        temperature: 65,
      },
      {
        id: "2",
        time: 5,
        type: "other",
        description: "Agregar malta base",
        amount: "4 kg Pilsner",
      },
      {
        id: "3",
        time: 65,
        type: "temperature-change",
        description: "Elevar temperatura para mash out",
        temperature: 78,
      },
      { id: "4", time: 75, type: "other", description: "Iniciar hervido" },
      {
        id: "5",
        time: 90,
        type: "hop-addition",
        description: "Primera adición de lúpulo",
        amount: "25g Cascade (60min)",
      },
      {
        id: "6",
        time: 135,
        type: "hop-addition",
        description: "Segunda adición de lúpulo",
        amount: "15g Centennial (15min)",
      },
      {
        id: "7",
        time: 150,
        type: "hop-addition",
        description: "Adición aromática",
        amount: "10g Cascade (0min)",
      },
      {
        id: "8",
        time: 150,
        type: "other",
        description: "Finalizar hervido y enfriar",
      },
      {
        id: "9",
        time: 180,
        type: "yeast-addition",
        description: "Agregar levadura",
        amount: "1 sobre US-05",
      },
      {
        id: "10",
        time: 10080,
        type: "dry-hop",
        description: "Dry hop (día 7)",
        amount: "30g Citra",
      },
    ],
    createdAt: "2024-01-15",
    status: "Activa",
    brewingStatus: "not-started",
    fermentationDays: 14,
    // Datos técnicos
    mashTemp: 65,
    mashTime: 60,
    spargeTemp: 78,
    originalGravity: 1.05,
    finalGravity: 1.01,
    efficiency: 75,
    waterProfile: "Balanceada",
    yeastStrain: "Safale US-05",
    fermentationTemp: 18,
    notes:
      "Cerveza refrescante ideal para el verano. Mantener temperatura de fermentación constante.",
  },
  {
    id: "2",
    name: "Luna IPA Imperial",
    style: "Imperial IPA",
    description:
      "IPA intensa con alto contenido alcohólico y amargor pronunciado",
    abv: 8.5,
    ibu: 75,
    srm: 8,
    difficulty: "Avanzado",
    batchSize: 20,
    boilTime: 90,
    steps: [
      {
        id: "1",
        time: 0,
        type: "temperature-change",
        description: "Calentar agua a temperatura de macerado",
        temperature: 64,
      },
      {
        id: "2",
        time: 5,
        type: "other",
        description: "Agregar maltas",
        amount: "6 kg Malta Pale + 0.5 kg Crystal 60L",
      },
      {
        id: "3",
        time: 75,
        type: "temperature-change",
        description: "Mash out",
        temperature: 78,
      },
      {
        id: "4",
        time: 90,
        type: "other",
        description: "Iniciar hervido de 90 minutos",
      },
      {
        id: "5",
        time: 120,
        type: "hop-addition",
        description: "Primera adición de lúpulo",
        amount: "40g Columbus (90min)",
      },
      {
        id: "6",
        time: 165,
        type: "hop-addition",
        description: "Segunda adición",
        amount: "30g Simcoe (30min)",
      },
      {
        id: "7",
        time: 175,
        type: "hop-addition",
        description: "Tercera adición",
        amount: "25g Citra (15min)",
      },
      {
        id: "8",
        time: 180,
        type: "hop-addition",
        description: "Adición final",
        amount: "20g Mosaic (0min)",
      },
      {
        id: "9",
        time: 180,
        type: "other",
        description: "Whirlpool 20 minutos",
      },
      {
        id: "10",
        time: 200,
        type: "yeast-addition",
        description: "Agregar levadura",
        amount: "2 sobres US-05",
      },
      {
        id: "11",
        time: 10080,
        type: "dry-hop",
        description: "Primer dry hop (día 7)",
        amount: "50g Citra + 30g Mosaic",
      },
      {
        id: "12",
        time: 17280,
        type: "dry-hop",
        description: "Segundo dry hop (día 12)",
        amount: "40g Centennial",
      },
    ],
    createdAt: "2024-01-10",
    status: "Activa",
    brewingStatus: "not-started",
    fermentationDays: 21,
    // Datos técnicos
    mashTemp: 64,
    mashTime: 75,
    spargeTemp: 78,
    originalGravity: 1.08,
    finalGravity: 1.012,
    efficiency: 78,
    waterProfile: "Alta en sulfatos",
    yeastStrain: "Safale US-05 (doble dosis)",
    fermentationTemp: 19,
    notes:
      "IPA de alta graduación. Controlar temperatura de fermentación. Dry hop en dos etapas para máximo aroma.",
  },
];

export default function CookingPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentTime, setCurrentTime] = useState(0); // tiempo actual en segundos
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentAlert, setCurrentAlert] = useState<RecipeStep | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);
  const [newStep, setNewStep] = useState<Partial<RecipeStep>>({
    time: 0,
    type: "other",
    description: "",
    amount: "",
    temperature: undefined,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Buscar la receta por ID
    const foundRecipe = mockRecipes.find((r) => r.id === recipeId);
    if (foundRecipe) {
      setRecipe(foundRecipe);
    } else {
      router.push("/admin/recetas");
    }
  }, [recipeId, router]);

  useEffect(() => {
    // Crear elemento de audio para las alertas
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
    );
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1;

          // Verificar si hay algún paso que deba alertar
          if (recipe) {
            const currentMinutes = Math.floor(newTime / 60);
            const stepToAlert = recipe.steps.find(
              (step) =>
                step.time === currentMinutes &&
                !completedSteps.has(step.id) &&
                Math.floor(prev / 60) < currentMinutes &&
                step.time < 1440 // Solo alertar pasos del día de cocción (menos de 24 horas)
            );

            if (stepToAlert) {
              setCurrentAlert(stepToAlert);
              // Reproducir sonido de alerta
              if (audioRef.current) {
                audioRef.current.play().catch(console.error);
              }
              // Mostrar notificación del navegador si está disponible
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(`Luna Brew House - ${recipe.name}`, {
                  body: `Es hora de: ${stepToAlert.description}`,
                  icon: "/images/luna-logo.png",
                });
              }
            }
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, recipe, completedSteps]);

  useEffect(() => {
    // Solicitar permisos de notificación
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cargando receta...</h2>
          <p className="text-muted-foreground">Por favor espera un momento</p>
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

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const startTimer = () => {
    setIsRunning(true);
    if (recipe && !recipe.brewingStartDate) {
      setRecipe({
        ...recipe,
        brewingStatus: "brewing",
        brewingStartDate: new Date().toISOString(),
      });
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setCompletedSteps(new Set());
    setCurrentAlert(null);
    if (recipe) {
      setRecipe({
        ...recipe,
        brewingStatus: "not-started",
        brewingStartDate: undefined,
      });
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

  const dismissAlert = () => {
    setCurrentAlert(null);
  };

  const addStep = () => {
    if (newStep.description && newStep.time !== undefined && recipe) {
      const step: RecipeStep = {
        id: Date.now().toString(),
        time: newStep.time || 0,
        type: newStep.type || "other",
        description: newStep.description,
        amount: newStep.amount,
        temperature: newStep.temperature,
      };

      setRecipe({
        ...recipe,
        steps: [...recipe.steps, step].sort((a, b) => a.time - b.time),
      });

      setNewStep({
        time: 0,
        type: "other",
        description: "",
        amount: "",
        temperature: undefined,
      });
      setIsEditDialogOpen(false);
    }
  };

  const updateStep = () => {
    if (editingStep && recipe) {
      setRecipe({
        ...recipe,
        steps: recipe.steps.map((step) =>
          step.id === editingStep.id ? editingStep : step
        ),
      });
      setEditingStep(null);
      setIsEditDialogOpen(false);
    }
  };

  const removeStep = (stepId: string) => {
    if (recipe) {
      setRecipe({
        ...recipe,
        steps: recipe.steps.filter((step) => step.id !== stepId),
      });
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
  const maxBrewingTime = Math.max(
    ...sortedBrewingSteps.map((step) => step.time),
    180
  ); // Mínimo 3 horas
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
      const threshold = isBrewingSteps ? 10 : 1; // 10 minutos para cocción, 1 día para fermentación

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
  const groupedBrewingSteps = groupSteps(
    sortedBrewingSteps,
    maxBrewingTime,
    true
  );
  const groupedFermentationSteps = groupSteps(
    sortedFermentationSteps,
    recipe.fermentationDays || 14,
    false
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
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
                  setIsEditDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Paso
              </Button>
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
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Horizontal */}
      <div className="bg-white border-b">
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
                    const groupStatus = group.steps.every((step) =>
                      completedSteps.has(step.id)
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
                                      {stepStatus !== "pending" && (
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
                </div>
              </div>
            ) : (
              // Timeline de fermentación
              <div className="relative px-8">
                {/* Barra de progreso de fermentación */}
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-3 bg-purple-500 rounded-full transition-all duration-1000"
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
                      {!isRunning ? (
                        <Button onClick={startTimer} className="flex-1">
                          <Play className="mr-2 h-4 w-4" />
                          {currentTime === 0 ? "Empezar" : "Continuar"}
                        </Button>
                      ) : (
                        <Button
                          onClick={pauseTimer}
                          variant="outline"
                          className="flex-1 bg-transparent"
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </Button>
                      )}
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
                      {recipe.abv}%
                    </div>
                    <div className="text-xs text-muted-foreground">ABV</div>
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
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Sparge:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.spargeTemp}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Eficiencia:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.efficiency}%
                        </span>
                      </div>
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
                          {recipe.waterProfile}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gravedad y Alcohol */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">Gravedad</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          OG:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.originalGravity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          FG:
                        </span>
                        <span className="text-sm font-medium">
                          {recipe.finalGravity}
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
                          {recipe.originalGravity && recipe.finalGravity
                            ? Math.round(
                                ((recipe.originalGravity -
                                  recipe.finalGravity) /
                                  (recipe.originalGravity - 1)) *
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stepTime">Tiempo (min)</Label>
                <Input
                  id="stepTime"
                  type="number"
                  value={editingStep?.time || newStep.time}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value);
                    if (editingStep) {
                      setEditingStep({ ...editingStep, time: value });
                    } else {
                      setNewStep({ ...newStep, time: value });
                    }
                  }}
                />
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
