"use client";

import { useState } from "react";
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
  batchSize: number; // en litros
  boilTime: number; // en minutos
  steps: RecipeStep[];
  createdAt: string;
  status: "Borrador" | "Activa" | "Archivada";
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
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
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
  });
  const [newStep, setNewStep] = useState<Partial<RecipeStep>>({
    time: 0,
    type: "other",
    description: "",
    amount: "",
    temperature: undefined,
  });

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.style.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      selectedTab === "all" || recipe.status.toLowerCase() === selectedTab;
    return matchesSearch && matchesTab;
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

  const saveRecipe = () => {
    const recipeToSave =
      editingRecipe ||
      ({
        ...newRecipe,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split("T")[0],
      } as Recipe);

    if (editingRecipe) {
      setRecipes(
        recipes.map((r) => (r.id === editingRecipe.id ? recipeToSave : r))
      );
      setEditingRecipe(null);
    } else {
      setRecipes([...recipes, recipeToSave]);
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
      });
    }
    setIsCreateDialogOpen(false);
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Receta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        setNewRecipe({ ...newRecipe, name: e.target.value });
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
                        setNewRecipe({ ...newRecipe, style: e.target.value });
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
                  value={editingRecipe?.description || newRecipe.description}
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
                  <Label htmlFor="abv">ABV (%)</Label>
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
                  <Label htmlFor="ibu">IBU</Label>
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
                  <Label htmlFor="srm">SRM</Label>
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
                    value={editingRecipe?.difficulty || newRecipe.difficulty}
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
                  <Label htmlFor="batchSize">Tamaño del Lote (L)</Label>
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
                  <Label htmlFor="boilTime">Tiempo de Hervido (min)</Label>
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

              {/* Pasos de la receta */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pasos de la Receta</h3>
                </div>

                {/* Agregar nuevo paso */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Agregar Nuevo Paso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stepTime">Tiempo (min)</Label>
                        <Input
                          id="stepTime"
                          type="number"
                          value={newStep.time}
                          onChange={(e) =>
                            setNewStep({
                              ...newStep,
                              time: Number.parseInt(e.target.value),
                            })
                          }
                        />
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
                              <SelectItem key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stepAmount">Cantidad (opcional)</Label>
                        <Input
                          id="stepAmount"
                          value={newStep.amount}
                          onChange={(e) =>
                            setNewStep({ ...newStep, amount: e.target.value })
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
                                    {formatTime(step.time)} • {typeInfo.label}
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

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={saveRecipe}>
                {editingRecipe ? "Guardar Cambios" : "Crear Receta"}
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
            placeholder="Buscar recetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="activa">Activas</TabsTrigger>
            <TabsTrigger value="borrador">Borradores</TabsTrigger>
            <TabsTrigger value="archivada">Archivadas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tabla de recetas */}
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
            {filteredRecipes.map((recipe) => (
              <TableRow key={recipe.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{recipe.name}</div>
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
                  <Badge className={getDifficultyColor(recipe.difficulty)}>
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
                    <Link href={`/admin/recetas/cocina/${recipe.id}`}>
                      <Button size="sm" variant="default">
                        <Play className="mr-2 h-4 w-4" />
                        Cocinar
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRecipe(recipe);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRecipes(recipes.filter((r) => r.id !== recipe.id));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
