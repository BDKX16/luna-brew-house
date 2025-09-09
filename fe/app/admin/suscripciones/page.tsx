"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  getAdminSubscriptions,
  updateSubscriptionStatus,
  deleteSubscription,
} from "@/services/private";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Tipos
interface Subscription {
  _id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  planId: string;
  planName: string;
  planType: string;
  startDate: string;
  endDate: string;
  status: "active" | "paused" | "cancelled" | "expired";
  price: number;
  deliveryFrequency: number; // días
  nextDelivery: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<
    Subscription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<
    string | null
  >(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { toast } = useToast();
  const { callEndpoint } = useFetchAndLoad();

  // Cargar suscripciones
  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Filtrar suscripciones
  useEffect(() => {
    let filtered = subscriptions;

    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.planName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, statusFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const result = await callEndpoint(getAdminSubscriptions());
      console.log(result);
      if (result.status === 200 && result.data) {
        const subscriptionsData = result.data.subscriptions || [];
        console.log(subscriptionsData);
        setSubscriptions(subscriptionsData);
        setLastUpdated(new Date());

        if (subscriptionsData.length === 0) {
          toast({
            title: "Sin suscripciones",
            description: "No hay suscripciones registradas en el sistema",
            variant: "default",
          });
        }
      } else {
        setSubscriptions([]);
        setLastUpdated(new Date());
        toast({
          title: "Sin datos",
          description: "No se encontraron suscripciones",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      setSubscriptions([]);

      // Mostrar error específico
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 401) {
          toast({
            title: "Sin autorización",
            description: "No tienes permisos para ver las suscripciones",
            variant: "destructive",
          });
        } else if (statusCode === 404) {
          toast({
            title: "Endpoint no encontrado",
            description: "El servicio de suscripciones no está disponible",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error del servidor",
            description: `Error ${statusCode}: ${
              error.response.data?.message || "Error desconocido"
            }`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (
    subscriptionId: string,
    newStatus: string
  ) => {
    try {
      setUpdatingStatus(true);
      const result = await callEndpoint(
        updateSubscriptionStatus(subscriptionId, { status: newStatus })
      );

      if (result.status === 200) {
        setSubscriptions((prev) =>
          prev.map((sub) =>
            sub._id === subscriptionId
              ? { ...sub, status: newStatus as any }
              : sub
          )
        );

        toast({
          title: "Estado actualizado",
          description:
            "El estado de la suscripción ha sido actualizado correctamente",
        });
      } else {
        throw new Error("Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error updating subscription status:", error);

      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 404) {
          toast({
            title: "Suscripción no encontrada",
            description: "La suscripción que intentas actualizar no existe",
            variant: "destructive",
          });
        } else if (statusCode === 400) {
          toast({
            title: "Estado inválido",
            description: "El estado seleccionado no es válido",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error al actualizar",
            description:
              error.response.data?.message || "No se pudo actualizar el estado",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive",
        });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!subscriptionToDelete) return;

    try {
      const result = await callEndpoint(
        deleteSubscription(subscriptionToDelete)
      );

      if (result.status === 200) {
        setSubscriptions((prev) =>
          prev.filter((sub) => sub._id !== subscriptionToDelete)
        );
        setShowDeleteModal(false);
        setSubscriptionToDelete(null);

        toast({
          title: "Suscripción eliminada",
          description: "La suscripción ha sido eliminada correctamente",
        });
      } else {
        throw new Error("Error al eliminar la suscripción");
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);

      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 404) {
          toast({
            title: "Suscripción no encontrada",
            description: "La suscripción que intentas eliminar no existe",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error al eliminar",
            description:
              error.response.data?.message ||
              "No se pudo eliminar la suscripción",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive",
        });
      }

      setShowDeleteModal(false);
      setSubscriptionToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Activa", variant: "default", icon: CheckCircle },
      paused: { label: "Pausada", variant: "secondary", icon: Clock },
      cancelled: { label: "Cancelada", variant: "destructive", icon: XCircle },
      expired: { label: "Expirada", variant: "outline", icon: AlertCircle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant as any}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Suscripciones</h1>
          <p className="text-muted-foreground">
            Administra las suscripciones de cerveza de los clientes
          </p>
        </div>
        <Button
          onClick={loadSubscriptions}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Suscripciones
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter((sub) => sub.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Mensuales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                subscriptions
                  .filter((sub) => sub.status === "active")
                  .reduce((sum, sub) => sum + sub.price, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximas Entregas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                subscriptions.filter(
                  (sub) =>
                    sub.status === "active" &&
                    new Date(sub.nextDelivery) <=
                      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, email o plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Suscripciones ({filteredSubscriptions.length})
              {loading && (
                <span className="ml-2 text-sm text-muted-foreground">
                  Cargando...
                </span>
              )}
            </CardTitle>
            {subscriptions.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Total en sistema: {subscriptions.length}
                {lastUpdated && (
                  <span className="ml-2">
                    • Actualizado: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Próxima Entrega</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {subscription.user?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.planName}</div>
                      <div className="text-sm text-muted-foreground">
                        {subscription.planType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>{formatPrice(subscription.price)}</TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>
                    {subscription.status === "active" ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(subscription.nextDelivery)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(subscription)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Select
                        value={subscription.status}
                        onValueChange={(value) =>
                          handleUpdateStatus(subscription._id, value)
                        }
                        disabled={updatingStatus}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activa</SelectItem>
                          <SelectItem value="paused">Pausada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="expired">Expirada</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSubscriptionToDelete(subscription._id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSubscriptions.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {subscriptions.length === 0
                  ? "No hay suscripciones registradas"
                  : "No se encontraron suscripciones"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {subscriptions.length === 0
                  ? "Cuando los usuarios compren suscripciones, aparecerán aquí para su gestión."
                  : searchTerm || statusFilter !== "all"
                  ? "Intenta cambiar los filtros de búsqueda para ver más resultados."
                  : "Todas las suscripciones están ocultas por los filtros actuales."}
              </p>
              {subscriptions.length === 0 && (
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={loadSubscriptions}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Recargar datos
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Suscripción</DialogTitle>
            <DialogDescription>
              Información completa de la suscripción seleccionada
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Cliente
                  </h4>
                  <p className="font-medium">
                    {selectedSubscription.user.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubscription.user.email}
                  </p>
                  {selectedSubscription.user.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSubscription.user.phone}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Plan
                  </h4>
                  <p className="font-medium">{selectedSubscription.planName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubscription.planType}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Estado
                  </h4>
                  {getStatusBadge(selectedSubscription.status)}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Precio
                  </h4>
                  <p className="font-medium text-lg">
                    {formatPrice(selectedSubscription.price)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Fecha de Inicio
                  </h4>
                  <p>{formatDate(selectedSubscription.startDate)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Fecha de Fin
                  </h4>
                  <p>{formatDate(selectedSubscription.endDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Frecuencia de Entrega
                  </h4>
                  <p>Cada {selectedSubscription.deliveryFrequency} días</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Próxima Entrega
                  </h4>
                  <p>
                    {selectedSubscription.status === "active"
                      ? formatDate(selectedSubscription.nextDelivery)
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground">
                  Dirección de Entrega
                </h4>
                <p>{selectedSubscription.deliveryAddress}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Creada
                  </h4>
                  <p>{formatDate(selectedSubscription.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Última Actualización
                  </h4>
                  <p>{formatDate(selectedSubscription.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta suscripción? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSubscriptionToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubscription}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
