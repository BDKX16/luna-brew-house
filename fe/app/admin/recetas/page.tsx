"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Search,
  Clock,
  Thermometer,
  Droplets,
  Loader2,
  Info,
  Beaker,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  startBrewing,
  getBrewingSessions,
  deleteBrewingSession,
  updateBrewingSessionPackaging,
} from "@/services/private";
import LoadingSpinner from "@/components/ui/loading-spinner";
import BatchDetailsModal from "@/components/admin/BatchDetailsModal";

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
  _id?: string;
  id?: string;
  name: string;
  style: string;
  description: string;
  abv: number;
  ibu: number;
  srm: number;
  difficulty: "Fácil" | "Intermedio" | "Avanzado";
  batchSize: number; // en litros
  boilTime: number; // en minutos
  steps: RecipeStep[];
  createdAt: string;
  status: "Borrador" | "Activa" | "Archivada";
  // Campos adicionales del modelo API
  brewingStatus?:
    | "not-started"
    | "brewing"
    | "paused"
    | "fermenting"
    | "completed";
  brewingStartDate?: string;
  brewingPausedAt?: string;
  brewingCurrentTime?: number;
  completedSteps?: string[];
  fermentationDays?: number;
  mashTemp?: number;
  mashTime?: number;
  spargeTemp?: number;
  targetOriginalGravity?: number;
  targetFinalGravity?: number;
  efficiency?: number;
  yeastStrain?: string;
  fermentationTemp?: number;
  notes?: string;
  grainBill?: string; // Nuevo campo para cantidad de granos
  // Perfil del agua
  waterVolume?: number;
  saltAdditions?: {
    gypsum?: number;
    calciumChloride?: number;
    epsom?: number;
    table?: number;
    bakingSoda?: number;
    chalk?: number;
  };
  waterProfile?: {
    calcium?: number;
    magnesium?: number;
    sodium?: number;
    sulfate?: number;
    chloride?: number;
    bicarbonate?: number;
  };
}

interface BrewingSession {
  sessionId: string;
  recipeId: string;
  recipeName: string;
  recipeStyle: string;
  startDate: string;
  endDate?: string;
  currentTime: number;
  isRunning: boolean;
  isPaused: boolean;
  status: "not-started" | "brewing" | "fermenting" | "completed";
  batchNumber?: string;
  originalGravity?: number;
  finalGravity?: number;
  calculatedABV?: number;
  notes?: string;
  batchNotes?: string;
  packagingDate?: string;
  batchLiters?: number;
  completedSteps?: Array<{
    stepId: string;
    completedAt: string;
    stepDescription?: string;
    stepTime?: number;
    stepType?: string;
  }>;
  recipe?: {
    steps: Array<{
      id: string;
      time: number;
      type: string;
      description: string;
      amount?: string;
      temperature?: number;
    }>;
    fermentationDays?: number;
  };
}

const stepTypes = [
  { value: "hop-addition", label: "Adición de Lúpulo", icon: "🌿" },
  { value: "dry-hop", label: "Dry Hop", icon: "🌱" },
  { value: "caramel-addition", label: "Adición de Caramelo", icon: "🍯" },
  { value: "yeast-addition", label: "Adición de Levadura", icon: "🦠" },
  { value: "temperature-change", label: "Cambio de Temperatura", icon: "🌡️" },
  { value: "stirring", label: "Agitado", icon: "🥄" },
  { value: "other", label: "Otro", icon: "⚙️" },
];

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
        amount: "4 kg",
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
        amount: "25g Cascade",
      },
      {
        id: "6",
        time: 135,
        type: "hop-addition",
        description: "Segunda adición de lúpulo",
        amount: "15g Centennial",
      },
      {
        id: "7",
        time: 135,
        type: "other",
        description: "Finalizar hervido y enfriar",
      },
      {
        id: "8",
        time: 150,
        type: "yeast-addition",
        description: "Agregar levadura",
        amount: "1 sobre US-05",
      },
    ],
    createdAt: "2024-01-15",
    status: "Activa",
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
        amount: "6 kg Malta Pale + 0.5 kg Crystal",
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
        amount: "40g Columbus",
      },
      {
        id: "6",
        time: 165,
        type: "hop-addition",
        description: "Segunda adición",
        amount: "30g Simcoe",
      },
      {
        id: "7",
        time: 175,
        type: "hop-addition",
        description: "Adición final",
        amount: "25g Citra",
      },
      { id: "8", time: 180, type: "other", description: "Whirlpool" },
      {
        id: "9",
        time: 195,
        type: "yeast-addition",
        description: "Agregar levadura",
        amount: "2 sobres US-05",
      },
      {
        id: "10",
        time: 10080,
        type: "dry-hop",
        description: "Dry hop (día 7)",
        amount: "50g Citra + 30g Mosaic",
      },
    ],
    createdAt: "2024-01-10",
    status: "Activa",
  },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sessions, setSessions] = useState<BrewingSession[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mainTab, setMainTab] = useState("recipes"); // "recipes" o "sessions"
  const [selectedTab, setSelectedTab] = useState("all"); // para filtros dentro de recetas
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<BrewingSession | null>(
    null
  );
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const { loading, callEndpoint } = useFetchAndLoad();
  const { toast } = useToast();

  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    name: "",
    style: "",
    description: "",
    abv: 0,
    ibu: 0,
    srm: 0,
    difficulty: "Fácil",
    batchSize: 20,
    boilTime: 60,
    steps: [],
    status: "Borrador",
    // Campos de fermentación
    fermentationDays: 14,
    yeastStrain: "",
    fermentationTemp: 18,
    // Campos de macerado
    mashTemp: 65,
    mashTime: 60,
    grainBill: "", // Nuevo campo para cantidad de granos
    // Perfil del agua
    waterVolume: 30, // Volumen de agua por defecto
    saltAdditions: {
      gypsum: 0,
      calciumChloride: 0,
      epsom: 0,
      table: 0,
      bakingSoda: 0,
      chalk: 0,
    },
    waterProfile: {
      calcium: 0,
      magnesium: 0,
      sodium: 0,
      sulfate: 0,
      chloride: 0,
      bicarbonate: 0,
    },
    // Campos de gravedad objetivo
    targetOriginalGravity: 1.05,
    targetFinalGravity: 1.01,
  });
  const [newStep, setNewStep] = useState<Partial<RecipeStep>>({
    time: 0,
    type: "other",
    description: "",
    amount: "",
    temperature: undefined,
  });

  // Estado para el selector de tipo de proceso
  const [selectedProcessType, setSelectedProcessType] = useState<string>("");

  // Estado para error de validación de tiempo
  const [timeValidationError, setTimeValidationError] = useState<string>("");

  // Tipos de proceso para el cálculo automático de tiempo
  const processTypes = [
    {
      value: "mashing",
      label: "Maceración",
      icon: "🌾",
      description: "Proceso de extracción de azúcares del grano",
    },
    {
      value: "boiling",
      label: "Cocción",
      icon: "🔥",
      description: "Proceso de cocción y adición de lúpulos",
    },
    {
      value: "fermentation",
      label: "Fermentación",
      icon: "🍺",
      description: "Proceso de fermentación con levadura",
    },
  ];

  // Función para calcular tiempo según tipo de proceso
  const calculateTimeByProcess = (processType: string, inputValue: number) => {
    switch (processType) {
      case "mashing":
        // Maceración: tiempo directo en minutos
        return inputValue;
      case "boiling":
        // Cocción: tiempo de macerado + tiempo de hervido
        const mashTime = newRecipe.mashTime || 60;
        return mashTime + inputValue;
      case "fermentation":
        // Fermentación: convertir días a minutos
        return inputValue * 1440; // 1440 minutos = 24 horas
      default:
        return inputValue;
    }
  };

  // Función para manejar cambio de tipo de proceso
  const handleProcessTypeChange = (value: string) => {
    setSelectedProcessType(value);
    setTimeValidationError(""); // Limpiar error al cambiar tipo

    // Si cambia el tipo de proceso, recalcular el tiempo actual
    if (newStep.time) {
      let currentDisplayValue = newStep.time;

      // Si había un tipo anterior, "deshacer" el cálculo
      if (selectedProcessType === "boiling" && newRecipe.mashTime) {
        currentDisplayValue = newStep.time - (newRecipe.mashTime || 60);
      } else if (selectedProcessType === "fermentation") {
        currentDisplayValue = Math.floor(newStep.time / 1440);
      }

      // Aplicar el nuevo cálculo
      const newTime = calculateTimeByProcess(
        value,
        Math.max(currentDisplayValue, 0)
      );
      setNewStep({ ...newStep, time: newTime });
    }
  };

  // Función para validar tiempo según el tipo de proceso
  const validateStepTime = (time: number, processType: string): string => {
    if (!processType || !time) return "";

    const currentRecipe = editingRecipe || newRecipe;

    switch (processType) {
      case "mashing":
        const mashTime = currentRecipe.mashTime || 60;
        if (time > mashTime) {
          return `El tiempo de maceración no puede ser mayor a ${mashTime} minutos`;
        }
        break;
      case "boiling":
        const boilTime = currentRecipe.boilTime || 60;
        const totalMashTime = currentRecipe.mashTime || 60;
        const boilOnlyTime = time - totalMashTime;
        if (boilOnlyTime > boilTime) {
          return `El tiempo desde hervor no puede ser mayor a ${boilTime} minutos`;
        }
        break;
      case "fermentation":
        const fermentationDays = currentRecipe.fermentationDays || 14;
        const inputDays = Math.floor(time / 1440);
        if (inputDays > fermentationDays) {
          return `El tiempo de fermentación no puede ser mayor a ${fermentationDays} días`;
        }
        break;
    }
    return "";
  };

  // Cargar recetas al montar el componente
  useEffect(() => {
    loadRecipes();
    loadSessions(); // Cargar sesiones también para verificar estados activos
  }, []);

  // Cargar sesiones cuando se seleccione el tab de sesiones
  useEffect(() => {
    if (mainTab === "sessions") {
      loadSessions();
    }
  }, [mainTab]);

  const loadRecipes = async () => {
    try {
      setIsLoadingRecipes(true);
      const response = await callEndpoint(getRecipes());
      if (response && response.data && response.data.recipes) {
        setRecipes(response.data.recipes);
      }
    } catch (error) {
      console.error("Error al cargar recetas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las recetas",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await callEndpoint(getBrewingSessions());
      if (response && response.data && response.data.sessions) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error("Error al cargar sesiones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones de brewing",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await callEndpoint(deleteBrewingSession(sessionId));
      if (response && response.data) {
        // Recargar las sesiones después de eliminar
        await loadSessions();
        toast({
          title: "Sesión eliminada",
          description: "La sesión de brewing se ha eliminado correctamente",
        });
      }
    } catch (error) {
      console.error("Error al eliminar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión de brewing",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleViewSession = (session: BrewingSession) => {
    setSelectedSession(session);
    setIsBatchModalOpen(true);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.style.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      selectedTab === "all" || recipe.status.toLowerCase() === selectedTab;
    return matchesSearch && matchesTab;
  });

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.recipeStyle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.batchNumber &&
        session.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-100 text-green-800";
      case "Intermedio":
        return "bg-yellow-100 text-yellow-800";
      case "Avanzado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para calcular el perfil del agua basado en las sales añadidas
  const calculateWaterProfile = (saltAdditions: any, waterVolume: number) => {
    // Constantes de contribución de minerales por gramo de sal en PPM por litro
    const contributions = {
      gypsum: { calcium: 23.3, sulfate: 55.9 }, // CaSO4·2H2O
      calciumChloride: { calcium: 36.1, chloride: 63.9 }, // CaCl2·2H2O
      epsom: { magnesium: 9.9, sulfate: 39.0 }, // MgSO4·7H2O
      table: { sodium: 39.3, chloride: 60.7 }, // NaCl
      bakingSoda: { sodium: 27.4, bicarbonate: 72.6 }, // NaHCO3
      chalk: { calcium: 40.0, bicarbonate: 60.0 }, // CaCO3
    };

    let profile = {
      calcium: 0,
      magnesium: 0,
      sodium: 0,
      sulfate: 0,
      chloride: 0,
      bicarbonate: 0,
    };

    // Calcular contribución de cada sal
    Object.entries(saltAdditions).forEach(([salt, grams]: [string, any]) => {
      const contrib = contributions[salt as keyof typeof contributions];
      if (contrib && grams > 0) {
        Object.entries(contrib).forEach(([mineral, ppmPerGram]) => {
          profile[mineral as keyof typeof profile] +=
            (grams * ppmPerGram) / waterVolume;
        });
      }
    });

    // Redondear a 1 decimal
    Object.keys(profile).forEach((key) => {
      profile[key as keyof typeof profile] =
        Math.round(profile[key as keyof typeof profile] * 10) / 10;
    });

    return profile;
  };

  // Función para actualizar las sales y recalcular el perfil del agua
  const updateSaltAddition = (saltType: string, value: number) => {
    const updatedSaltAdditions = {
      ...newRecipe.saltAdditions,
      [saltType]: value,
    };

    const updatedWaterProfile = calculateWaterProfile(
      updatedSaltAdditions,
      newRecipe.waterVolume || 30
    );

    setNewRecipe((prev) => ({
      ...prev,
      saltAdditions: updatedSaltAdditions,
      waterProfile: updatedWaterProfile,
    }));
  };

  // Funciones auxiliares para las sesiones
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case "brewing":
        return "bg-blue-100 text-blue-800";
      case "fermenting":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionStatusText = (status: string) => {
    switch (status) {
      case "brewing":
        return "Elaborando";
      case "fermenting":
        return "Fermentando";
      case "completed":
        return "Completado";
      default:
        return "No iniciado";
    }
  };

  // Función para verificar si hay una sesión activa para una receta
  const hasActiveSession = (recipeId: string) => {
    return sessions.some((session) => {
      return (
        session.recipeId === recipeId &&
        (session.status === "brewing" || session.status === "fermenting")
      );
    });
  };

  // Función para obtener la sesión activa de una receta
  const getActiveSession = (recipeId: string) => {
    return sessions.find(
      (session) =>
        session.recipeId === recipeId &&
        (session.status === "brewing" || session.status === "fermenting")
    );
  };

  // Función para actualizar el volumen de agua y recalcular el perfil
  const updateWaterVolume = (volume: number) => {
    const updatedWaterProfile = calculateWaterProfile(
      newRecipe.saltAdditions || {},
      volume
    );

    setNewRecipe((prev) => ({
      ...prev,
      waterVolume: volume,
      waterProfile: updatedWaterProfile,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activa":
        return "bg-green-100 text-green-800";
      case "Borrador":
        return "bg-yellow-100 text-yellow-800";
      case "Archivada":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const addStep = () => {
    if (newStep.description && newStep.time !== undefined) {
      // Validar tiempo según el tipo de proceso
      const validationError = validateStepTime(
        newStep.time,
        selectedProcessType
      );
      if (validationError) {
        setTimeValidationError(validationError);
        return;
      }

      // Limpiar error si la validación es exitosa
      setTimeValidationError("");

      const step: RecipeStep = {
        id: Date.now().toString(),
        time: newStep.time || 0,
        type: newStep.type || "other",
        description: newStep.description,
        amount: newStep.amount,
        temperature: newStep.temperature,
      };

      if (editingRecipe) {
        setEditingRecipe({
          ...editingRecipe,
          steps: [...editingRecipe.steps, step].sort((a, b) => a.time - b.time),
        });
      } else {
        setNewRecipe({
          ...newRecipe,
          steps: [...(newRecipe.steps || []), step].sort(
            (a, b) => a.time - b.time
          ),
        });
      }

      setNewStep({
        time: 0,
        type: "other",
        description: "",
        amount: "",
        temperature: undefined,
      });
      setSelectedProcessType("");
    }
  };

  const removeStep = (stepId: string) => {
    if (editingRecipe) {
      setEditingRecipe({
        ...editingRecipe,
        steps: editingRecipe.steps.filter((step) => step.id !== stepId),
      });
    } else {
      setNewRecipe({
        ...newRecipe,
        steps: (newRecipe.steps || []).filter((step) => step.id !== stepId),
      });
    }
  };

  const saveRecipe = async () => {
    const recipeToValidate = editingRecipe || newRecipe;

    console.log("Guardando receta:", {
      editingRecipe: !!editingRecipe,
      recipeToValidate,
      editingRecipeId: editingRecipe?._id || editingRecipe?.id,
    });

    if (
      !recipeToValidate.name ||
      !recipeToValidate.style ||
      !recipeToValidate.description
    ) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingRecipe) {
        // Actualizar receta existente
        const recipeId = editingRecipe._id?.toString();
        if (!recipeId) {
          throw new Error("ID de receta no encontrado");
        }

        console.log("Actualizando receta con ID:", recipeId);
        const response = await callEndpoint(
          updateRecipe(recipeId, editingRecipe)
        );
        console.log("Respuesta de actualización:", response);

        if (response && response.data && response.data.recipe) {
          setRecipes((prev) =>
            prev.map((r) =>
              (r._id || r.id) === recipeId ? response.data.recipe : r
            )
          );
          toast({
            title: "Éxito",
            description: "Receta actualizada correctamente",
          });
        }
        setEditingRecipe(null);
      } else {
        // Crear nueva receta
        const response = await callEndpoint(createRecipe(newRecipe));
        if (response && response.data && response.data.recipe) {
          setRecipes((prev) => [...prev, response.data.recipe]);
          toast({
            title: "Éxito",
            description: "Receta creada correctamente",
          });
        }

        setNewRecipe({
          name: "",
          style: "",
          description: "",
          abv: 0,
          ibu: 0,
          srm: 0,
          difficulty: "Fácil",
          batchSize: 20,
          boilTime: 60,
          steps: [],
          status: "Borrador",
          // Campos de fermentación
          fermentationDays: 14,
          yeastStrain: "",
          fermentationTemp: 18,
          // Campos de macerado
          mashTemp: 65,
          mashTime: 60,
          grainBill: "",
        });
        setSelectedProcessType("");
        setTimeValidationError("");
      }
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error al guardar receta:", error);
      toast({
        title: "Error",
        description: editingRecipe
          ? "No se pudo actualizar la receta"
          : "No se pudo crear la receta",
        variant: "destructive",
      });
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    if (minutes < 1440)
      return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor(
      (minutes % 1440) / 60
    )}h`;
  };

  const getStepTypeInfo = (type: string) => {
    return (
      stepTypes.find((st) => st.value === type) ||
      stepTypes[stepTypes.length - 1]
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Recetas de Cerveza
            </h1>
            <p className="text-muted-foreground">
              Gestiona las recetas y procesos de elaboración
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingRecipe(null);
                  setNewRecipe({
                    name: "",
                    style: "",
                    description: "",
                    abv: 0,
                    ibu: 0,
                    srm: 0,
                    difficulty: "Fácil",
                    batchSize: 20,
                    boilTime: 60,
                    steps: [],
                    status: "Borrador",
                    // Campos de fermentación
                    fermentationDays: 14,
                    yeastStrain: "",
                    fermentationTemp: 18,
                    // Campos de macerado
                    mashTemp: 65,
                    mashTime: 60,
                    grainBill: "",
                    // Campos de gravedad objetivo
                    targetOriginalGravity: 1.05,
                    targetFinalGravity: 1.01,
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Receta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[93vh] overflow-visible">
              <div className="overflow-y-auto max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRecipe ? "Editar Receta" : "Nueva Receta"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRecipe
                      ? "Modifica los detalles de la receta"
                      : "Crea una nueva receta de cerveza con sus pasos detallados"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6">
                  {/* Información básica */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre de la Receta</Label>
                      <Input
                        id="name"
                        value={editingRecipe?.name || newRecipe.name}
                        onChange={(e) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              name: e.target.value,
                            });
                          } else {
                            setNewRecipe({
                              ...newRecipe,
                              name: e.target.value,
                            });
                          }
                        }}
                        placeholder="Ej: Luna Golden Ale"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="style">Estilo</Label>
                      <Input
                        id="style"
                        value={editingRecipe?.style || newRecipe.style}
                        onChange={(e) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              style: e.target.value,
                            });
                          } else {
                            setNewRecipe({
                              ...newRecipe,
                              style: e.target.value,
                            });
                          }
                        }}
                        placeholder="Ej: Golden Ale, IPA, Stout"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={
                        editingRecipe?.description || newRecipe.description
                      }
                      onChange={(e) => {
                        if (editingRecipe) {
                          setEditingRecipe({
                            ...editingRecipe,
                            description: e.target.value,
                          });
                        } else {
                          setNewRecipe({
                            ...newRecipe,
                            description: e.target.value,
                          });
                        }
                      }}
                      placeholder="Describe las características de esta cerveza..."
                    />
                  </div>

                  {/* Especificaciones técnicas */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="abv">ABV (%)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>Alcohol By Volume</strong>
                            </p>
                            <p>
                              Porcentaje de alcohol en volumen. Típicamente
                              entre 3% y 12% para cervezas.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="abv"
                        type="number"
                        step="0.1"
                        value={editingRecipe?.abv || newRecipe.abv}
                        onChange={(e) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              abv: Number.parseFloat(e.target.value),
                            });
                          } else {
                            setNewRecipe({
                              ...newRecipe,
                              abv: Number.parseFloat(e.target.value),
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="ibu">IBU</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>International Bitterness Units</strong>
                            </p>
                            <p>
                              Medida de amargor de la cerveza. Rango típico:
                              10-100+. Más alto = más amargo.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="ibu"
                        type="number"
                        value={editingRecipe?.ibu || newRecipe.ibu}
                        onChange={(e) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              ibu: Number.parseInt(e.target.value),
                            });
                          } else {
                            setNewRecipe({
                              ...newRecipe,
                              ibu: Number.parseInt(e.target.value),
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="srm">SRM</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>Standard Reference Method</strong>
                            </p>
                            <p>
                              Medida del color de la cerveza. Rango: 1-40+.
                              Menor = más claro, mayor = más oscuro.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="srm"
                        type="number"
                        value={editingRecipe?.srm || newRecipe.srm}
                        onChange={(e) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              srm: Number.parseInt(e.target.value),
                            });
                          } else {
                            setNewRecipe({
                              ...newRecipe,
                              srm: Number.parseInt(e.target.value),
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Dificultad</Label>
                      <Select
                        value={
                          editingRecipe?.difficulty || newRecipe.difficulty
                        }
                        onValueChange={(
                          value: "Fácil" | "Intermedio" | "Avanzado"
                        ) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              difficulty: value,
                            });
                          } else {
                            setNewRecipe({ ...newRecipe, difficulty: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fácil">Fácil</SelectItem>
                          <SelectItem value="Intermedio">Intermedio</SelectItem>
                          <SelectItem value="Avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="batchSize">Tamaño del Lote (L)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>Volumen final de cerveza</strong>
                            </p>
                            <p>
                              Cantidad de cerveza que se obtendrá al final del
                              proceso en litros.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="batchSize"
                        type="number"
                        value={editingRecipe?.batchSize || newRecipe.batchSize}
                        onChange={(e) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              batchSize: Number.parseInt(e.target.value),
                            });
                          } else {
                            setNewRecipe({
                              ...newRecipe,
                              batchSize: Number.parseInt(e.target.value),
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="boilTime">
                          Tiempo de Hervido (min)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>Duración del hervido</strong>
                            </p>
                            <p>
                              Tiempo en minutos que se hervirá el mosto.
                              Típicamente 60-90 minutos.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="boilTime"
                        type="number"
                        value={editingRecipe?.boilTime || newRecipe.boilTime}
                        onChange={(e) => {
                          if (editingRecipe) {
                            setEditingRecipe({
                              ...editingRecipe,
                              boilTime: Number.parseInt(e.target.value),
                            });
                          } else {
                            setNewRecipe({
                              ...newRecipe,
                              boilTime: Number.parseInt(e.target.value),
                            });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Sección de Macerado */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-amber-600" />
                      Macerado
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="mashTemp">Temperatura (°C)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Temperatura de macerado</strong>
                              </p>
                              <p>
                                Temperatura del agua para el macerado.
                                Típicamente entre 62-70°C.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="mashTemp"
                          type="number"
                          value={editingRecipe?.mashTemp || newRecipe.mashTemp}
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                mashTemp: Number.parseInt(e.target.value),
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                mashTemp: Number.parseInt(e.target.value),
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="mashTime">Tiempo (min)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Duración del macerado</strong>
                              </p>
                              <p>
                                Tiempo en minutos para el macerado. Típicamente
                                60-90 minutos.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="mashTime"
                          type="number"
                          value={editingRecipe?.mashTime || newRecipe.mashTime}
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                mashTime: Number.parseInt(e.target.value),
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                mashTime: Number.parseInt(e.target.value),
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="grainBill">Granos</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Cantidad y tipo de granos</strong>
                              </p>
                              <p>Ej: "4kg Malta Pilsner + 0.5kg Crystal 60L"</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="grainBill"
                          value={
                            editingRecipe?.grainBill || newRecipe.grainBill
                          }
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                grainBill: e.target.value,
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                grainBill: e.target.value,
                              });
                            }
                          }}
                          placeholder="Ej: 4kg Malta Pilsner + 0.5kg Crystal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Gravedad Objetivo */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      Gravedad Objetivo
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="targetOriginalGravity">
                            Gravedad Original (OG)
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Densidad inicial objetivo</strong>
                              </p>
                              <p>
                                Medida antes de la fermentación. Típicamente
                                entre 1.030 y 1.100. Mayor valor = más azúcares
                                disponibles.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="targetOriginalGravity"
                          type="number"
                          step="0.001"
                          min="1.000"
                          max="1.200"
                          value={
                            editingRecipe?.targetOriginalGravity ||
                            newRecipe.targetOriginalGravity
                          }
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                targetOriginalGravity: Number.parseFloat(
                                  e.target.value
                                ),
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                targetOriginalGravity: Number.parseFloat(
                                  e.target.value
                                ),
                              });
                            }
                          }}
                          placeholder="1.050"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="targetFinalGravity">
                            Gravedad Final (FG)
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Densidad final objetivo</strong>
                              </p>
                              <p>
                                Medida después de la fermentación. Típicamente
                                entre 1.000 y 1.020. Indica azúcares residuales.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="targetFinalGravity"
                          type="number"
                          step="0.001"
                          min="0.990"
                          max="1.050"
                          value={
                            editingRecipe?.targetFinalGravity ||
                            newRecipe.targetFinalGravity
                          }
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                targetFinalGravity: Number.parseFloat(
                                  e.target.value
                                ),
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                targetFinalGravity: Number.parseFloat(
                                  e.target.value
                                ),
                              });
                            }
                          }}
                          placeholder="1.010"
                        />
                      </div>
                    </div>
                    {/* Mostrar ABV calculado basado en las gravedades objetivo */}
                    {(editingRecipe?.targetOriginalGravity ||
                      newRecipe.targetOriginalGravity) &&
                      (editingRecipe?.targetFinalGravity ||
                        newRecipe.targetFinalGravity) && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">
                            ABV Estimado:{" "}
                            {(
                              ((editingRecipe?.targetOriginalGravity ||
                                newRecipe.targetOriginalGravity ||
                                0) -
                                (editingRecipe?.targetFinalGravity ||
                                  newRecipe.targetFinalGravity ||
                                  0)) *
                              131.25
                            ).toFixed(2)}
                            %
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Basado en OG:{" "}
                            {(
                              editingRecipe?.targetOriginalGravity ||
                              newRecipe.targetOriginalGravity
                            )?.toFixed(3)}{" "}
                            y FG:{" "}
                            {(
                              editingRecipe?.targetFinalGravity ||
                              newRecipe.targetFinalGravity
                            )?.toFixed(3)}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Sección de Fermentación */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-purple-600" />
                      Fermentación
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="yeastStrain">Levadura</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Cepa de levadura</strong>
                              </p>
                              <p>
                                Tipo y marca de levadura. Ej: "Safale US-05",
                                "Lallemand Voss"
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="yeastStrain"
                          value={
                            editingRecipe?.yeastStrain || newRecipe.yeastStrain
                          }
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                yeastStrain: e.target.value,
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                yeastStrain: e.target.value,
                              });
                            }
                          }}
                          placeholder="Ej: Safale US-05"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="fermentationTemp">
                            Temperatura (°C)
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Temperatura de fermentación</strong>
                              </p>
                              <p>
                                Temperatura ideal para la fermentación.
                                Típicamente 16-22°C para ales.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="fermentationTemp"
                          type="number"
                          value={
                            editingRecipe?.fermentationTemp ||
                            newRecipe.fermentationTemp
                          }
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                fermentationTemp: Number.parseInt(
                                  e.target.value
                                ),
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                fermentationTemp: Number.parseInt(
                                  e.target.value
                                ),
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="fermentationDays">
                            Duración (días)
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                <strong>Días de fermentación</strong>
                              </p>
                              <p>
                                Tiempo total de fermentación primaria.
                                Típicamente 7-21 días.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="fermentationDays"
                          type="number"
                          value={
                            editingRecipe?.fermentationDays ||
                            newRecipe.fermentationDays
                          }
                          onChange={(e) => {
                            if (editingRecipe) {
                              setEditingRecipe({
                                ...editingRecipe,
                                fermentationDays: Number.parseInt(
                                  e.target.value
                                ),
                              });
                            } else {
                              setNewRecipe({
                                ...newRecipe,
                                fermentationDays: Number.parseInt(
                                  e.target.value
                                ),
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de Perfil del Agua */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Beaker className="h-5 w-5 text-blue-600" />
                      Perfil del Agua
                    </h3>

                    {/* Volumen de agua */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="waterVolume">Volumen de Agua (L)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              <strong>Volumen total de agua</strong>
                            </p>
                            <p>
                              Litros de agua para macerado y lavado. Afecta
                              concentración de sales.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="waterVolume"
                        type="number"
                        value={
                          editingRecipe?.waterVolume || newRecipe.waterVolume
                        }
                        onChange={(e) => {
                          const volume = Number.parseInt(e.target.value) || 30;
                          if (editingRecipe) {
                            const updatedProfile = calculateWaterProfile(
                              editingRecipe.saltAdditions || {},
                              volume
                            );
                            setEditingRecipe({
                              ...editingRecipe,
                              waterVolume: volume,
                              waterProfile: updatedProfile,
                            });
                          } else {
                            updateWaterVolume(volume);
                          }
                        }}
                        placeholder="30"
                      />
                    </div>

                    {/* Adición de sales */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Adición de Sales (gramos)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="gypsum">Yeso (CaSO₄)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  <strong>Sulfato de Calcio</strong>
                                </p>
                                <p>
                                  Aporta calcio y sulfatos. Mejora la claridad y
                                  realza el lúpulo.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="gypsum"
                            type="number"
                            step="0.1"
                            value={
                              editingRecipe?.saltAdditions?.gypsum ||
                              newRecipe.saltAdditions?.gypsum ||
                              0
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              if (editingRecipe) {
                                const updatedSalts = {
                                  ...editingRecipe.saltAdditions,
                                  gypsum: value,
                                };
                                const updatedProfile = calculateWaterProfile(
                                  updatedSalts,
                                  editingRecipe.waterVolume || 30
                                );
                                setEditingRecipe({
                                  ...editingRecipe,
                                  saltAdditions: updatedSalts,
                                  waterProfile: updatedProfile,
                                });
                              } else {
                                updateSaltAddition("gypsum", value);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="calciumChloride">
                              Cloruro de Calcio
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  <strong>CaCl₂</strong>
                                </p>
                                <p>
                                  Aporta calcio y cloruros. Mejora el cuerpo y
                                  suaviza la cerveza.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="calciumChloride"
                            type="number"
                            step="0.1"
                            value={
                              editingRecipe?.saltAdditions?.calciumChloride ||
                              newRecipe.saltAdditions?.calciumChloride ||
                              0
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              if (editingRecipe) {
                                const updatedSalts = {
                                  ...editingRecipe.saltAdditions,
                                  calciumChloride: value,
                                };
                                const updatedProfile = calculateWaterProfile(
                                  updatedSalts,
                                  editingRecipe.waterVolume || 30
                                );
                                setEditingRecipe({
                                  ...editingRecipe,
                                  saltAdditions: updatedSalts,
                                  waterProfile: updatedProfile,
                                });
                              } else {
                                updateSaltAddition("calciumChloride", value);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="epsom">Sal de Epsom</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  <strong>Sulfato de Magnesio (MgSO₄)</strong>
                                </p>
                                <p>
                                  Aporta magnesio y sulfatos. Importante para la
                                  función de enzimas.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="epsom"
                            type="number"
                            step="0.1"
                            value={
                              editingRecipe?.saltAdditions?.epsom ||
                              newRecipe.saltAdditions?.epsom ||
                              0
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              if (editingRecipe) {
                                const updatedSalts = {
                                  ...editingRecipe.saltAdditions,
                                  epsom: value,
                                };
                                const updatedProfile = calculateWaterProfile(
                                  updatedSalts,
                                  editingRecipe.waterVolume || 30
                                );
                                setEditingRecipe({
                                  ...editingRecipe,
                                  saltAdditions: updatedSalts,
                                  waterProfile: updatedProfile,
                                });
                              } else {
                                updateSaltAddition("epsom", value);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="table">Sal de Mesa</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  <strong>Cloruro de Sodio (NaCl)</strong>
                                </p>
                                <p>
                                  Aporta sodio y cloruros. Realza sabores en
                                  pequeñas cantidades.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="table"
                            type="number"
                            step="0.1"
                            value={
                              editingRecipe?.saltAdditions?.table ||
                              newRecipe.saltAdditions?.table ||
                              0
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              if (editingRecipe) {
                                const updatedSalts = {
                                  ...editingRecipe.saltAdditions,
                                  table: value,
                                };
                                const updatedProfile = calculateWaterProfile(
                                  updatedSalts,
                                  editingRecipe.waterVolume || 30
                                );
                                setEditingRecipe({
                                  ...editingRecipe,
                                  saltAdditions: updatedSalts,
                                  waterProfile: updatedProfile,
                                });
                              } else {
                                updateSaltAddition("table", value);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="bakingSoda">
                              Bicarbonato de Sodio
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  <strong>NaHCO₃</strong>
                                </p>
                                <p>
                                  Aporta sodio y bicarbonatos. Aumenta el pH del
                                  macerado.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="bakingSoda"
                            type="number"
                            step="0.1"
                            value={
                              editingRecipe?.saltAdditions?.bakingSoda ||
                              newRecipe.saltAdditions?.bakingSoda ||
                              0
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              if (editingRecipe) {
                                const updatedSalts = {
                                  ...editingRecipe.saltAdditions,
                                  bakingSoda: value,
                                };
                                const updatedProfile = calculateWaterProfile(
                                  updatedSalts,
                                  editingRecipe.waterVolume || 30
                                );
                                setEditingRecipe({
                                  ...editingRecipe,
                                  saltAdditions: updatedSalts,
                                  waterProfile: updatedProfile,
                                });
                              } else {
                                updateSaltAddition("bakingSoda", value);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="chalk">Tiza (CaCO₃)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  <strong>Carbonato de Calcio</strong>
                                </p>
                                <p>
                                  Aporta calcio y bicarbonatos. Poco soluble,
                                  mejor evitar.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="chalk"
                            type="number"
                            step="0.1"
                            value={
                              editingRecipe?.saltAdditions?.chalk ||
                              newRecipe.saltAdditions?.chalk ||
                              0
                            }
                            onChange={(e) => {
                              const value =
                                Number.parseFloat(e.target.value) || 0;
                              if (editingRecipe) {
                                const updatedSalts = {
                                  ...editingRecipe.saltAdditions,
                                  chalk: value,
                                };
                                const updatedProfile = calculateWaterProfile(
                                  updatedSalts,
                                  editingRecipe.waterVolume || 30
                                );
                                setEditingRecipe({
                                  ...editingRecipe,
                                  saltAdditions: updatedSalts,
                                  waterProfile: updatedProfile,
                                });
                              } else {
                                updateSaltAddition("chalk", value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Perfil calculado del agua */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Perfil Resultante (ppm)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">Calcio (Ca²⁺)</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {editingRecipe?.waterProfile?.calcium ||
                              newRecipe.waterProfile?.calcium ||
                              0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ppm
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">Magnesio (Mg²⁺)</div>
                          <div className="text-2xl font-bold text-green-600">
                            {editingRecipe?.waterProfile?.magnesium ||
                              newRecipe.waterProfile?.magnesium ||
                              0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ppm
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">Sodio (Na⁺)</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {editingRecipe?.waterProfile?.sodium ||
                              newRecipe.waterProfile?.sodium ||
                              0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ppm
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">Sulfatos (SO₄²⁻)</div>
                          <div className="text-2xl font-bold text-orange-600">
                            {editingRecipe?.waterProfile?.sulfate ||
                              newRecipe.waterProfile?.sulfate ||
                              0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ppm
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">Cloruros (Cl⁻)</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {editingRecipe?.waterProfile?.chloride ||
                              newRecipe.waterProfile?.chloride ||
                              0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ppm
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium">
                            Bicarbonatos (HCO₃⁻)
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {editingRecipe?.waterProfile?.bicarbonate ||
                              newRecipe.waterProfile?.bicarbonate ||
                              0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ppm
                          </div>
                        </div>
                      </div>

                      {/* Información adicional sobre ratios */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="font-medium text-blue-900">
                            Ratio SO₄:Cl
                          </div>
                          <div className="text-xl font-bold text-blue-700">
                            {(() => {
                              const profile =
                                editingRecipe?.waterProfile ||
                                newRecipe.waterProfile;
                              const sulfate = profile?.sulfate || 0;
                              const chloride = profile?.chloride || 0;
                              if (chloride === 0)
                                return sulfate > 0 ? "∞" : "0";
                              return (sulfate / chloride).toFixed(1);
                            })()}
                          </div>
                          <div className="text-sm text-blue-600">
                            {(() => {
                              const profile =
                                editingRecipe?.waterProfile ||
                                newRecipe.waterProfile;
                              const sulfate = profile?.sulfate || 0;
                              const chloride = profile?.chloride || 0;
                              const ratio =
                                chloride === 0
                                  ? sulfate > 0
                                    ? Infinity
                                    : 0
                                  : sulfate / chloride;
                              if (ratio > 2) return "Perfil lupulado";
                              if (ratio < 0.5) return "Perfil malteado";
                              return "Perfil balanceado";
                            })()}
                          </div>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="font-medium text-green-900">
                            Dureza Total
                          </div>
                          <div className="text-xl font-bold text-green-700">
                            {(() => {
                              const profile =
                                editingRecipe?.waterProfile ||
                                newRecipe.waterProfile;
                              const calcium = profile?.calcium || 0;
                              const magnesium = profile?.magnesium || 0;
                              // Dureza total = Ca + Mg (aproximado)
                              return Math.round(calcium + magnesium);
                            })()}
                          </div>
                          <div className="text-sm text-green-600">
                            ppm CaCO₃ equiv
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pasos de la receta */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Pasos de la Receta
                      </h3>
                    </div>

                    {/* Agregar nuevo paso */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Agregar Nuevo Paso
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Selector de tipo de proceso */}
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
                                <SelectItem
                                  key={process.value}
                                  value={process.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                      {process.icon}
                                    </span>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {process.label}
                                      </span>
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

                        <div className="grid grid-cols-4 gap-4">
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
                                selectedProcessType === "fermentation" &&
                                newStep.time
                                  ? Math.floor(newStep.time / 1440) || ""
                                  : selectedProcessType === "boiling" &&
                                    newStep.time &&
                                    newRecipe?.mashTime
                                  ? newStep.time - (newRecipe.mashTime || 60) ||
                                    ""
                                  : newStep.time
                              }
                              onChange={(e) => {
                                setTimeValidationError(""); // Limpiar error al cambiar tiempo
                                let value =
                                  Number.parseInt(e.target.value) || 0;

                                // Calcular el tiempo real según el tipo de proceso
                                if (selectedProcessType) {
                                  value = calculateTimeByProcess(
                                    selectedProcessType,
                                    value
                                  );
                                }

                                setNewStep({ ...newStep, time: value });
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
                              newStep.time &&
                              newRecipe?.mashTime && (
                                <div className="text-xs text-muted-foreground">
                                  Tiempo desde inicio de hervor
                                </div>
                              )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stepType">Tipo</Label>
                            <Select
                              value={newStep.type}
                              onValueChange={(value) =>
                                setNewStep({
                                  ...newStep,
                                  type: value as RecipeStep["type"],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stepTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.icon} {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stepAmount">
                              Cantidad (opcional)
                            </Label>
                            <Input
                              id="stepAmount"
                              value={newStep.amount}
                              onChange={(e) =>
                                setNewStep({
                                  ...newStep,
                                  amount: e.target.value,
                                })
                              }
                              placeholder="Ej: 25g, 2 kg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stepTemp">
                              Temperatura °C (opcional)
                            </Label>
                            <Input
                              id="stepTemp"
                              type="number"
                              value={newStep.temperature || ""}
                              onChange={(e) =>
                                setNewStep({
                                  ...newStep,
                                  temperature: e.target.value
                                    ? Number.parseInt(e.target.value)
                                    : undefined,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stepDescription">Descripción</Label>
                          <Input
                            id="stepDescription"
                            value={newStep.description}
                            onChange={(e) =>
                              setNewStep({
                                ...newStep,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe qué hacer en este paso..."
                          />
                        </div>

                        {/* Mensaje de error de validación */}
                        {timeValidationError && (
                          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                            {timeValidationError}
                          </div>
                        )}

                        <Button onClick={addStep} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Paso
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Lista de pasos */}
                    <div className="space-y-2">
                      {(editingRecipe?.steps || newRecipe.steps || [])
                        .sort((a, b) => a.time - b.time)
                        .map((step, index) => {
                          const typeInfo = getStepTypeInfo(step.type);
                          return (
                            <Card key={step.id}>
                              <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">
                                      {typeInfo.icon}
                                    </span>
                                    <div>
                                      <div className="font-medium">
                                        {step.description}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatTime(step.time)} •{" "}
                                        {typeInfo.label}
                                        {step.amount && ` • ${step.amount}`}
                                        {step.temperature &&
                                          ` • ${step.temperature}°C`}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStep(step.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setTimeValidationError("");
                    setSelectedProcessType("");
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={saveRecipe} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : editingRecipe ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Receta"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                mainTab === "recipes"
                  ? "Buscar recetas..."
                  : "Buscar sesiones..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Tabs principales */}
          <Tabs value={mainTab} onValueChange={setMainTab}>
            <TabsList>
              <TabsTrigger value="recipes">Recetas</TabsTrigger>
              <TabsTrigger value="sessions">Sesiones</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Contenido condicional según el tab seleccionado */}
        {mainTab === "recipes" ? (
          /* Tabla de recetas */
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receta</TableHead>
                  <TableHead>Estilo</TableHead>
                  <TableHead>Especificaciones</TableHead>
                  <TableHead>Dificultad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pasos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRecipes ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <div className="flex justify-center">
                        <LoadingSpinner size="md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRecipes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No se encontraron recetas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <TableRow key={recipe._id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{recipe.name}</span>
                            {hasActiveSession(recipe._id?.toString() || "") && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                En proceso
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {recipe.description.substring(0, 50)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{recipe.style}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-3 w-3" />
                            {recipe.abv}% ABV
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🌾</span>
                            {recipe.ibu} IBU
                          </div>
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-3 w-3" />
                            {recipe.batchSize}L
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getDifficultyColor(recipe.difficulty)}
                        >
                          {recipe.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(recipe.status)}>
                          {recipe.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {recipe.steps.length} pasos
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/recetas/cocina/${recipe._id}`}>
                            <Button
                              size="sm"
                              variant={
                                hasActiveSession(recipe._id?.toString() || "")
                                  ? "default"
                                  : "default"
                              }
                              className={
                                hasActiveSession(recipe._id?.toString() || "")
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : ""
                              }
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {hasActiveSession(recipe._id?.toString() || "")
                                ? "Continuar"
                                : "Cocinar"}
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRecipe({
                                ...recipe,
                                // Asegurar que existan los campos del perfil del agua
                                waterVolume: recipe.waterVolume || 30,
                                saltAdditions: recipe.saltAdditions || {
                                  gypsum: 0,
                                  calciumChloride: 0,
                                  epsom: 0,
                                  table: 0,
                                  bakingSoda: 0,
                                  chalk: 0,
                                },
                                waterProfile: recipe.waterProfile || {
                                  calcium: 0,
                                  magnesium: 0,
                                  sodium: 0,
                                  sulfate: 0,
                                  chloride: 0,
                                  bicarbonate: 0,
                                },
                              });
                              setNewRecipe({
                                name: "",
                                style: "",
                                description: "",
                                abv: 0,
                                ibu: 0,
                                srm: 0,
                                difficulty: "Fácil",
                                batchSize: 20,
                                boilTime: 60,
                                steps: [],
                                status: "Borrador",
                                // Campos de fermentación
                                fermentationDays: 14,
                                yeastStrain: "",
                                fermentationTemp: 18,
                                // Campos de macerado
                                mashTemp: 65,
                                mashTime: 60,
                                grainBill: "",
                              });
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const recipeId = recipe._id?.toString();
                                if (!recipeId) return;

                                const response = await callEndpoint(
                                  deleteRecipe(recipeId)
                                );
                                if (response && response.data) {
                                  setRecipes(
                                    recipes.filter(
                                      (r) => (r._id || r.id) !== recipeId
                                    )
                                  );
                                  toast({
                                    title: "Éxito",
                                    description:
                                      "Receta eliminada correctamente",
                                  });
                                }
                              } catch (error) {
                                console.error(
                                  "Error al eliminar receta:",
                                  error
                                );
                                toast({
                                  title: "Error",
                                  description: "No se pudo eliminar la receta",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        ) : (
          /* Tabla de sesiones */
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receta</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>ABV</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSessions ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No hay sesiones de brewing disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {session.recipeName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.recipeStyle}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {session.batchNumber || "Sin asignar"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(session.startDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDuration(session.currentTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getSessionStatusColor(session.status)}
                        >
                          {getSessionStatusText(session.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {session.originalGravity && session.finalGravity ? (
                            <div>
                              <div>
                                OG: {session.originalGravity.toFixed(3)}
                              </div>
                              <div>FG: {session.finalGravity.toFixed(3)}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {session.calculatedABV ? (
                            `${session.calculatedABV.toFixed(1)}%`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSession(session)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Modal de detalles del batch */}
      <BatchDetailsModal
        session={selectedSession}
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setSelectedSession(null);
        }}
        onDelete={deleteSession}
      />
    </TooltipProvider>
  );
}
