"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Calendar,
  Droplets,
  FlaskConical,
  CheckCircle,
  Circle,
  Trash2,
  AlertTriangle,
  Beaker,
  Timer,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  updateBrewingSessionPackaging,
  completeBatch,
} from "@/services/private";

interface BatchDetailsModalProps {
  session: BrewingSession | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (sessionId: string) => Promise<void>;
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

interface GroupedStep {
  time: number;
  steps: Array<{
    id: string;
    time: number;
    type: string;
    description: string;
    amount?: string;
    temperature?: number;
  }>;
  position: number;
}

export default function BatchDetailsModal({
  session,
  isOpen,
  onClose,
  onDelete,
}: BatchDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [packagingDate, setPackagingDate] = useState("");
  const [isUpdatingPackaging, setIsUpdatingPackaging] = useState(false);
  const [isCompletingBatch, setIsCompletingBatch] = useState(false);
  const [finalGravity, setFinalGravity] = useState("");
  const [batchLiters, setBatchLiters] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const { toast } = useToast();
  const { callEndpoint } = useFetchAndLoad();

  // Inicializar fecha de envasado cuando cambie la sesión
  useEffect(() => {
    if (session?.packagingDate) {
      setPackagingDate(session.packagingDate.split("T")[0]); // Convertir a formato date input
    } else {
      setPackagingDate("");
    }
  }, [session]);

  if (!session) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
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

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case "hop-addition":
        return "🌿";
      case "dry-hop":
        return "🌱";
      case "caramel-addition":
        return "🍯";
      case "yeast-addition":
        return "🦠";
      case "temperature-change":
        return "🌡️";
      case "stirring":
        return "🥄";
      default:
        return "⚙️";
    }
  };

  const isStepCompleted = (stepId: string) => {
    return session.completedSteps?.some((cs) => cs.stepId === stepId);
  };

  const getCompletedStepInfo = (stepId: string) => {
    return session.completedSteps?.find((cs) => cs.stepId === stepId);
  };

  // Obtener pasos personalizados de completedSteps
  const customSteps =
    session.completedSteps
      ?.filter((cs) => cs.customStep)
      .map((cs) => ({ ...cs.customStep, isCustomStep: true })) || [];

  // Separar pasos de cocción y fermentación (incluyendo personalizados)
  const recipeBrewingSteps =
    session.recipe?.steps.filter((step) => step.time < 1440) || [];
  const recipeFermentationSteps =
    session.recipe?.steps.filter((step) => step.time >= 1440) || [];

  const customBrewingSteps = customSteps.filter((step) => step.time < 1440);
  const customFermentationSteps = customSteps.filter(
    (step) => step.time >= 1440
  );

  const brewingSteps = [...recipeBrewingSteps, ...customBrewingSteps];
  const fermentationSteps = [
    ...recipeFermentationSteps,
    ...customFermentationSteps,
  ];

  // Separar pasos por fase de proceso
  const mashingSteps = brewingSteps.filter(
    (step) => step.time <= (session.recipe?.mashTime || 60)
  );
  const boilingSteps = brewingSteps.filter(
    (step) => step.time > (session.recipe?.mashTime || 60)
  );

  // Función para agrupar pasos que están muy cerca
  const groupSteps = (
    steps: Array<{
      id: string;
      time: number;
      type: string;
      description: string;
      amount?: string;
      temperature?: number;
    }>,
    maxTime: number,
    isBrewingSteps = true,
    isMashing = false
  ): GroupedStep[] => {
    const groups: GroupedStep[] = [];
    const sortedSteps = [...steps].sort((a, b) => a.time - b.time);

    for (const step of sortedSteps) {
      const timeToCheck = isBrewingSteps
        ? step.time
        : Math.floor(step.time / 1440); // Para fermentación usar días
      const threshold = isBrewingSteps ? 11 : 1; // 11 minutos para cocción, 1 día para fermentación

      // Buscar si hay un grupo existente dentro del threshold
      const existingGroup = groups.find(
        (group) => Math.abs(group.time - timeToCheck) < threshold
      );

      if (existingGroup) {
        existingGroup.steps.push(step);
      } else {
        let position: number;
        if (isBrewingSteps) {
          if (isMashing) {
            // Para maceración, usar el mashTime como base
            position = (step.time / (session.recipe?.mashTime || 60)) * 100;
          } else {
            // Para cocción, ajustar el tiempo base al inicio de la cocción
            const mashTime = session.recipe?.mashTime || 60;
            const adjustedTime = step.time - mashTime;
            const boilTime = session.recipe?.boilTime || 60;
            position = (adjustedTime / boilTime) * 100;
          }
        } else {
          position =
            (Math.floor(step.time / 1440) /
              (session.recipe?.fermentationDays || 14)) *
            100;
        }

        groups.push({
          time: timeToCheck,
          steps: [step],
          position: Math.min(position, 95),
        });
      }
    }

    return groups;
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(session.sessionId);
      setShowDeleteConfirm(false);
      onClose();
      toast({
        title: "Sesión eliminada",
        description: "La sesión de brewing ha sido eliminada exitosamente.",
      });
    } catch (error) {
      console.error("Error al eliminar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión de brewing.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const updatePackagingDate = async () => {
    try {
      setIsUpdatingPackaging(true);
      const packagingData = {
        packagingDate: packagingDate
          ? new Date(packagingDate).toISOString()
          : null,
      };

      const response = await callEndpoint(
        updateBrewingSessionPackaging(session.sessionId, packagingData)
      );

      if (response && response.data) {
        toast({
          title: "Fecha actualizada",
          description: "La fecha de envasado ha sido actualizada exitosamente.",
        });
      }
    } catch (error) {
      console.error("Error al actualizar fecha de envasado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de envasado.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPackaging(false);
    }
  };

  const handleCompleteBatch = async () => {
    setIsCompletingBatch(true);

    try {
      const requestBody: any = {};

      if (finalGravity) {
        requestBody.finalGravity = parseFloat(finalGravity);
      }

      if (batchLiters) {
        requestBody.batchLiters = parseFloat(batchLiters);
      }

      if (completionNotes) {
        requestBody.batchNotes = completionNotes;
      }

      const response = await callEndpoint(
        completeBatch(session.recipeId, session.sessionId, requestBody)
      );
      console.log(response);
      if (response && response.data) {
        toast({
          title: "Éxito",
          description: "Batch completado exitosamente",
        });
        onClose(); // Cerrar modal para refrescar datos
      } else {
        throw new Error(response?.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Error completing batch:", error);
      toast({
        title: "Error",
        description: "No se pudo completar el batch",
        variant: "destructive",
      });
    } finally {
      setIsCompletingBatch(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FlaskConical className="h-6 w-6 text-blue-600" />
              Detalles del Batch - {session.recipeName}
            </DialogTitle>
            <DialogDescription>
              Información completa de la sesión de brewing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información General */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Receta</p>
                    <p className="font-medium">{session.recipeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.recipeStyle}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Batch</p>
                    <Badge variant="outline">
                      {session.batchNumber || "Sin asignar"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusText(session.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tiempos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Inicio</p>
                    <p className="text-sm font-medium">
                      {formatDate(session.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duración</p>
                    <p className="text-sm font-medium">
                      {formatDuration(session.currentTime)}
                    </p>
                  </div>
                  {session.endDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Finalización
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(session.endDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Mediciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Gravedad Original
                    </p>
                    <p className="text-sm font-medium">
                      {session.originalGravity
                        ? session.originalGravity.toFixed(3)
                        : "No medida"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Gravedad Final
                    </p>
                    <p className="text-sm font-medium">
                      {session.finalGravity
                        ? session.finalGravity.toFixed(3)
                        : "No medida"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ABV Calculado
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {session.calculatedABV
                        ? `${session.calculatedABV.toFixed(1)}%`
                        : "No calculado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Litros del Batch
                    </p>
                    <p className="text-sm font-medium">
                      {session.batchLiters
                        ? `${session.batchLiters} L`
                        : "No especificado"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sección para completar batch cuando está fermentando */}
            {session.status === "fermenting" && (
              <>
                <Separator />
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Completar Batch
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Marca este batch como completado cuando la fermentación
                        haya terminado
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Gravedad Final
                          </label>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="1.010"
                            value={finalGravity}
                            onChange={(e) => setFinalGravity(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Litros Finales
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="20"
                            value={batchLiters}
                            onChange={(e) => setBatchLiters(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Notas Finales del Batch
                        </label>
                        <textarea
                          className="w-full mt-1 p-2 border rounded-md"
                          rows={3}
                          placeholder="Observaciones finales, sabor, aroma, etc..."
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleCompleteBatch}
                        disabled={isCompletingBatch}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isCompletingBatch ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Completando Batch...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como Completado
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Sección de envasado para sesiones completadas */}
            {session.status === "completed" && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Información de Envasado
                  </h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="packaging-date"
                            className="text-sm font-medium"
                          >
                            Fecha de Envasado
                          </Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="packaging-date"
                              type="date"
                              value={packagingDate}
                              onChange={(e) => setPackagingDate(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              onClick={updatePackagingDate}
                              disabled={isUpdatingPackaging}
                              size="sm"
                            >
                              {isUpdatingPackaging ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                "Guardar"
                              )}
                            </Button>
                          </div>
                          {session.packagingDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Última actualización:{" "}
                              {formatDate(session.packagingDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <Separator />

            {/* Timeline de Maceración */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Beaker className="h-5 w-5 text-amber-600" />
                Timeline de Maceración
              </h3>

              {mashingSteps.length > 0 ? (
                <div className="relative px-8 pb-16">
                  {/* Barra de progreso principal */}
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-3 bg-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: "100%" }} // Mostrar completo en el histórico
                    />
                  </div>

                  {/* Marcadores de pasos agrupados */}
                  <div className="relative mt-6">
                    {(() => {
                      const mashTime = session.recipe?.mashTime || 60;
                      const groupedSteps = groupSteps(
                        mashingSteps,
                        mashTime,
                        true,
                        true
                      );

                      return groupedSteps.map((group, groupIndex) => {
                        const hasMultipleSteps = group.steps.length > 1;
                        const primaryStep = group.steps[0];

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
                                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                        group.steps.every((step) =>
                                          isStepCompleted(step.id)
                                        )
                                          ? "bg-green-500 text-white"
                                          : "bg-gray-300 text-gray-600"
                                      }`}
                                    >
                                      <span className="text-lg">
                                        {hasMultipleSteps
                                          ? "📋"
                                          : getStepTypeIcon(primaryStep.type)}
                                      </span>
                                    </div>
                                    {/* Marca distintiva para pasos personalizados */}
                                    {group.steps.some(
                                      (step: any) => step.isCustomStep
                                    ) && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                          +
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 text-xs text-center max-w-20">
                                    <div className="font-medium text-gray-700">
                                      {group.time}m
                                    </div>
                                    <div className="text-gray-600 text-xs truncate">
                                      {hasMultipleSteps
                                        ? `${group.steps.length} pasos`
                                        : primaryStep.description.length > 15
                                        ? primaryStep.description.substring(
                                            0,
                                            15
                                          ) + "..."
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
                                    {hasMultipleSteps
                                      ? "📋"
                                      : getStepTypeIcon(primaryStep.type)}
                                  </span>
                                  <h4 className="font-medium">
                                    {hasMultipleSteps
                                      ? `${group.steps.length} pasos en ${group.time} minutos`
                                      : primaryStep.description}
                                  </h4>
                                </div>

                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                  {group.steps.map((step) => {
                                    const isCompleted = isStepCompleted(
                                      step.id
                                    );
                                    const completedInfo = getCompletedStepInfo(
                                      step.id
                                    );

                                    return (
                                      <div
                                        key={step.id}
                                        className={`p-3 rounded-lg border ${
                                          isCompleted
                                            ? "bg-amber-50 border-amber-200"
                                            : "bg-gray-50 border-gray-200"
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="mt-1">
                                            {isCompleted ? (
                                              <CheckCircle className="h-4 w-4 text-amber-600" />
                                            ) : (
                                              <Circle className="h-4 w-4 text-gray-400" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              <span className="text-sm">
                                                {getStepTypeIcon(step.type)}
                                              </span>
                                              <span className="font-medium text-sm">
                                                {step.description}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {step.time} min
                                              </Badge>
                                              {(step as any).isCustomStep && (
                                                <Badge
                                                  variant="outline"
                                                  className="bg-blue-50 border-blue-200 text-blue-700 text-xs"
                                                >
                                                  + Personalizado
                                                </Badge>
                                              )}
                                            </div>
                                            {step.amount && (
                                              <p className="text-xs text-muted-foreground">
                                                Cantidad: {step.amount}
                                              </p>
                                            )}
                                            {step.temperature && (
                                              <p className="text-xs text-muted-foreground">
                                                Temperatura: {step.temperature}
                                                °C
                                              </p>
                                            )}
                                            {isCompleted && completedInfo && (
                                              <p className="text-xs text-amber-600 mt-1">
                                                ✓{" "}
                                                {formatDate(
                                                  completedInfo.completedAt
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay pasos de maceración definidos
                </p>
              )}
            </div>

            <Separator />

            {/* Timeline de Cocción */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-orange-600" />
                Timeline de Cocción
              </h3>

              {boilingSteps.length > 0 ? (
                <div className="relative px-8 pb-16">
                  {/* Barra de progreso principal */}
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-3 bg-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: "100%" }} // Mostrar completo en el histórico
                    />
                  </div>

                  {/* Marcadores de pasos agrupados */}
                  <div className="relative mt-6">
                    {(() => {
                      const boilTime = session.recipe?.boilTime || 60;
                      const groupedSteps = groupSteps(
                        boilingSteps,
                        boilTime,
                        true,
                        false
                      );

                      return groupedSteps.map((group, groupIndex) => {
                        const hasMultipleSteps = group.steps.length > 1;
                        const primaryStep = group.steps[0];
                        const mashTime = session.recipe?.mashTime || 60;
                        const adjustedTime = group.time - mashTime;

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
                                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                        group.steps.every((step) =>
                                          isStepCompleted(step.id)
                                        )
                                          ? "bg-green-500 text-white"
                                          : "bg-gray-300 text-gray-600"
                                      }`}
                                    >
                                      <span className="text-lg">
                                        {hasMultipleSteps
                                          ? "📋"
                                          : getStepTypeIcon(primaryStep.type)}
                                      </span>
                                    </div>
                                    {/* Marca distintiva para pasos personalizados */}
                                    {group.steps.some(
                                      (step: any) => step.isCustomStep
                                    ) && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                          +
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 text-xs text-center max-w-20">
                                    <div className="font-medium text-gray-700">
                                      {adjustedTime}m
                                    </div>
                                    <div className="text-gray-600 text-xs truncate">
                                      {hasMultipleSteps
                                        ? `${group.steps.length} pasos`
                                        : primaryStep.description.length > 15
                                        ? primaryStep.description.substring(
                                            0,
                                            15
                                          ) + "..."
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
                                    {hasMultipleSteps
                                      ? "📋"
                                      : getStepTypeIcon(primaryStep.type)}
                                  </span>
                                  <h4 className="font-medium">
                                    {hasMultipleSteps
                                      ? `${group.steps.length} pasos en minuto ${adjustedTime} de cocción`
                                      : primaryStep.description}
                                  </h4>
                                </div>

                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                  {group.steps.map((step) => {
                                    const isCompleted = isStepCompleted(
                                      step.id
                                    );
                                    const completedInfo = getCompletedStepInfo(
                                      step.id
                                    );
                                    const stepAdjustedTime =
                                      step.time - mashTime;

                                    return (
                                      <div
                                        key={step.id}
                                        className={`p-3 rounded-lg border ${
                                          isCompleted
                                            ? "bg-orange-50 border-orange-200"
                                            : "bg-gray-50 border-gray-200"
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="mt-1">
                                            {isCompleted ? (
                                              <CheckCircle className="h-4 w-4 text-orange-600" />
                                            ) : (
                                              <Circle className="h-4 w-4 text-gray-400" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              <span className="text-sm">
                                                {getStepTypeIcon(step.type)}
                                              </span>
                                              <span className="font-medium text-sm">
                                                {step.description}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {stepAdjustedTime}m cocción
                                              </Badge>
                                              {(step as any).isCustomStep && (
                                                <Badge
                                                  variant="outline"
                                                  className="bg-blue-50 border-blue-200 text-blue-700 text-xs"
                                                >
                                                  + Personalizado
                                                </Badge>
                                              )}
                                            </div>
                                            {step.amount && (
                                              <p className="text-xs text-muted-foreground">
                                                Cantidad: {step.amount}
                                              </p>
                                            )}
                                            {step.temperature && (
                                              <p className="text-xs text-muted-foreground">
                                                Temperatura: {step.temperature}
                                                °C
                                              </p>
                                            )}
                                            {isCompleted && completedInfo && (
                                              <p className="text-xs text-orange-600 mt-1">
                                                ✓{" "}
                                                {formatDate(
                                                  completedInfo.completedAt
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay pasos de cocción definidos
                </p>
              )}
            </div>

            <Separator />

            {/* Timeline de Fermentación */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Timer className="h-5 w-5 text-purple-600" />
                Timeline de Fermentación
              </h3>

              {fermentationSteps.length > 0 ? (
                <div className="relative px-8 pb-16">
                  {/* Barra de progreso de fermentación */}
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-3 bg-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: "100%" }} // Mostrar completo en el histórico
                    />
                  </div>

                  {/* Marcadores de fermentación agrupados */}
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
                          <div className="font-medium text-gray-700">Día 0</div>
                          <div className="text-gray-600">
                            Inicio fermentación
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pasos de fermentación agrupados */}
                    {(() => {
                      const maxFermentationDays =
                        session.recipe?.fermentationDays || 14;
                      const groupedSteps = groupSteps(
                        fermentationSteps,
                        maxFermentationDays,
                        false,
                        false
                      );

                      return groupedSteps.map((group, groupIndex) => {
                        const hasMultipleSteps = group.steps.length > 1;
                        const primaryStep = group.steps[0];

                        return (
                          <Popover key={groupIndex}>
                            <PopoverTrigger asChild>
                              <div
                                className="absolute transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform"
                                style={{
                                  left: `${Math.min(group.position, 90)}%`,
                                }}
                              >
                                <div className="flex flex-col items-center">
                                  <div className="relative">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                        group.steps.every((step) =>
                                          isStepCompleted(step.id)
                                        )
                                          ? "bg-purple-500 text-white"
                                          : "bg-gray-300 text-gray-600"
                                      }`}
                                    >
                                      <span className="text-lg">
                                        {hasMultipleSteps
                                          ? "📋"
                                          : getStepTypeIcon(primaryStep.type)}
                                      </span>
                                    </div>
                                    {/* Marca distintiva para pasos personalizados */}
                                    {group.steps.some(
                                      (step: any) => step.isCustomStep
                                    ) && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                          +
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 text-xs text-center max-w-20">
                                    <div className="font-medium text-gray-700">
                                      Día {group.time}
                                    </div>
                                    <div className="text-gray-600 text-xs truncate">
                                      {hasMultipleSteps
                                        ? `${group.steps.length} pasos`
                                        : primaryStep.description.length > 15
                                        ? primaryStep.description.substring(
                                            0,
                                            15
                                          ) + "..."
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
                                    {hasMultipleSteps
                                      ? "📋"
                                      : getStepTypeIcon(primaryStep.type)}
                                  </span>
                                  <h4 className="font-medium">
                                    {hasMultipleSteps
                                      ? `${group.steps.length} pasos en día ${group.time}`
                                      : primaryStep.description}
                                  </h4>
                                </div>

                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                  {group.steps.map((step) => {
                                    const isCompleted = isStepCompleted(
                                      step.id
                                    );
                                    const completedInfo = getCompletedStepInfo(
                                      step.id
                                    );
                                    const fermentationDay = Math.floor(
                                      step.time / 1440
                                    );

                                    return (
                                      <div
                                        key={step.id}
                                        className={`p-3 rounded-lg border ${
                                          isCompleted
                                            ? "bg-purple-50 border-purple-200"
                                            : "bg-gray-50 border-gray-200"
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="mt-1">
                                            {isCompleted ? (
                                              <CheckCircle className="h-4 w-4 text-purple-600" />
                                            ) : (
                                              <Circle className="h-4 w-4 text-gray-400" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              <span className="text-sm">
                                                {getStepTypeIcon(step.type)}
                                              </span>
                                              <span className="font-medium text-sm">
                                                {step.description}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                Día {fermentationDay}
                                              </Badge>
                                              {(step as any).isCustomStep && (
                                                <Badge
                                                  variant="outline"
                                                  className="bg-blue-50 border-blue-200 text-blue-700 text-xs"
                                                >
                                                  + Personalizado
                                                </Badge>
                                              )}
                                            </div>
                                            {step.amount && (
                                              <p className="text-xs text-muted-foreground">
                                                Cantidad: {step.amount}
                                              </p>
                                            )}
                                            {step.temperature && (
                                              <p className="text-xs text-muted-foreground">
                                                Temperatura: {step.temperature}
                                                °C
                                              </p>
                                            )}
                                            {isCompleted && completedInfo && (
                                              <p className="text-xs text-purple-600 mt-1">
                                                ✓{" "}
                                                {formatDate(
                                                  completedInfo.completedAt
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      });
                    })()}

                    {/* Final de fermentación */}
                    <div
                      className="absolute transform -translate-x-1/2"
                      style={{ left: "100%" }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white shadow-lg">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="mt-2 text-xs text-center">
                          <div className="font-medium text-gray-700">
                            Día {session.recipe?.fermentationDays || 14}
                          </div>
                          <div className="text-gray-600">
                            Fermentación completa
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay pasos de fermentación definidos
                </p>
              )}
            </div>

            {/* Notas del Batch */}
            {(session.batchNotes || session.notes) && (
              <>
                <Separator />
                {session.batchNotes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Beaker className="h-5 w-5 text-green-600" />
                      Notas del Batch
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                        {session.batchNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notas de la Receta */}
                {session.notes && (
                  <div className={session.batchNotes ? "mt-4" : ""}>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-blue-600" />
                      Notas de la Receta
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {session.notes}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Sesión
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta sesión de brewing?
              <br />
              <strong>Esta acción no se puede deshacer.</strong>
              <br />
              <br />
              Se eliminará:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Batch: {session.batchNumber || "Sin número"}</li>
                <li>Receta: {session.recipeName}</li>
                <li>Fecha: {formatDate(session.startDate)}</li>
                <li>Todas las mediciones y progreso registrado</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Definitivamente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
