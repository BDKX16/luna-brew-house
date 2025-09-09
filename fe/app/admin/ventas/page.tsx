"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowUpDown,
  Mail,
  CreditCard,
  Banknote,
  Package,
  ShoppingBag,
} from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updateOrderDelivery,
  cancelOrder,
  getAdminOrderStats,
} from "@/services/private";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Tipos
interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    userId?: string;
  };
  date: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "ready_pickup"
    | "waiting_schedule";
  total: number;
  items: OrderItem[];
  paymentMethod: string;
  deliveryTime?: {
    date: string;
    timeRange: string;
  };
  customerSelectedTime?: boolean;
  trackingSteps?: TrackingStep[];
  cancellationReason?: string;
  // Nuevas propiedades para información de pago y tipo
  orderType: string;
  hasPayment: boolean;
  paymentStatus: string;
  payment?: {
    id: string;
    status: string;
    paymentMethod: string;
    amount: number;
    paymentId?: string;
    preferenceId?: string;
    date: string;
  };
}

interface TrackingStep {
  status: string;
  date: string;
  completed: boolean;
  current: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
}

export default function VentasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTimeRange, setDeliveryTimeRange] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });

  const { loading, callEndpoint } = useFetchAndLoad();
  const { toast } = useToast();

  // Cargar los pedidos al iniciar
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  // Obtener pedidos desde la API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await callEndpoint(getAdminOrders());
      if (response && response.data && response.data.orders) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener estadísticas de pedidos
  const fetchStats = async () => {
    try {
      const response = await callEndpoint(getAdminOrderStats("month"));
      if (response && response.data && response.data.stats) {
        const { stats } = response.data;

        // Obtener datos de estado
        const pendingOrders = stats.salesByStatus.pending?.count || 0;
        const processingOrders = stats.salesByStatus.processing?.count || 0;
        const shippedOrders = stats.salesByStatus.shipped?.count || 0;
        const deliveredOrders = stats.salesByStatus.delivered?.count || 0;
        const cancelledOrders = stats.salesByStatus.cancelled?.count || 0;

        setStats({
          totalSales: stats.totalSales || 0,
          pendingOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
        });
      }
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    }
  };

  // Filtrar y ordenar pedidos
  const filteredOrders = orders
    .filter(
      (order) =>
        (statusFilter === "all" || order.status === statusFilter) &&
        (order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customer?.name &&
            order.customer.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (order.customer?.email &&
            order.customer.email
              .toLowerCase()
              .includes(searchTerm.toLowerCase())))
    )
    .sort((a, b) => {
      // Convertir fechas a objetos Date para comparación
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      return sortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

  // Función para ver detalle del pedido
  const handleViewOrderDetail = async (orderId: string) => {
    try {
      const response = await callEndpoint(getAdminOrderById(orderId));
      if (response && response.data && response.data.order) {
        setSelectedOrder(response.data.order);
      }
    } catch (error) {
      console.error("Error al obtener detalle del pedido:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener el detalle del pedido",
        variant: "destructive",
      });
    }
  };

  // Función para establecer el horario de entrega
  const handleSetDeliveryTime = async () => {
    if (!selectedOrder || !deliveryDate || !deliveryTimeRange) return;

    try {
      const response = await callEndpoint(
        updateOrderDelivery(selectedOrder.id, {
          date: deliveryDate,
          timeRange: deliveryTimeRange,
        })
      );

      if (response && response.data) {
        await fetchOrders(); // Recargar pedidos
        setIsDeliveryDialogOpen(false);
        toast({
          title: "Horario de entrega establecido",
          description: `Se ha programado la entrega para el ${deliveryDate} entre ${deliveryTimeRange}`,
        });
      }
    } catch (error) {
      console.error("Error al establecer horario de entrega:", error);
      toast({
        title: "Error",
        description: "No se pudo establecer el horario de entrega",
        variant: "destructive",
      });
    }
  };

  // Función para enviar email al cliente
  const handleSendEmail = () => {
    if (!selectedOrder) return;

    // En una implementación real, aquí se enviaría el email
    // Para esta simulación, solo mostraremos un mensaje de éxito
    toast({
      title: "Email enviado",
      description: `Se ha enviado un email a ${selectedOrder.customer.email} para que seleccione su horario de entrega preferido`,
    });
    setIsEmailDialogOpen(false);
  };

  // Función para cambiar el estado del pedido
  const handleChangeStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const response = await callEndpoint(
        updateOrderStatus(orderId, newStatus)
      );

      if (response && response.data) {
        await fetchOrders(); // Recargar pedidos
        await fetchStats(); // Actualizar estadísticas

        toast({
          title: "Estado actualizado",
          description: `El pedido ${orderId} ha sido actualizado a "${
            newStatus === "pending"
              ? "Pendiente"
              : newStatus === "confirmed"
              ? "Confirmado"
              : newStatus === "processing"
              ? "En preparación"
              : newStatus === "shipped"
              ? "En camino"
              : newStatus === "delivered"
              ? "Entregado"
              : newStatus === "ready_pickup"
              ? "Listo para recoger"
              : newStatus === "waiting_schedule"
              ? "Esperando horario"
              : "Cancelado"
          }"`,
        });
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      });
    }
  };

  // Función para cancelar un pedido
  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await callEndpoint(
        cancelOrder(orderId, "Cancelado por administrador")
      );

      if (response && response.data) {
        await fetchOrders(); // Recargar pedidos
        await fetchStats(); // Actualizar estadísticas

        toast({
          title: "Pedido cancelado",
          description: `El pedido ${orderId} ha sido cancelado correctamente`,
        });
      }
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar el pedido",
        variant: "destructive",
      });
    }
  };

  // Función para renderizar el badge de estado
  const renderStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50"
          >
            Pendiente
          </Badge>
        );
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-50"
          >
            Confirmado
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-50"
          >
            En preparación
          </Badge>
        );
      case "shipped":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 hover:bg-purple-50"
          >
            En camino
          </Badge>
        );
      case "delivered":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-50"
          >
            Entregado
          </Badge>
        );
      case "ready_pickup":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 hover:bg-orange-50"
          >
            Listo para recoger
          </Badge>
        );
      case "waiting_schedule":
        return (
          <Badge
            variant="outline"
            className="bg-cyan-50 text-cyan-700 hover:bg-cyan-50"
          >
            Esperando horario
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 hover:bg-red-50"
          >
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const renderOrderTypeBadge = (orderType: string) => {
    switch (orderType) {
      case "suscripción":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 hover:bg-purple-50"
          >
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" /> Suscripción
            </span>
          </Badge>
        );
      case "cervezas":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 hover:bg-amber-50"
          >
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Cervezas
            </span>
          </Badge>
        );
      case "mixto":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50"
          >
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" /> Mixto
            </span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" /> Desconocido
            </span>
          </Badge>
        );
    }
  };

  const renderPaymentStatusBadge = (paymentStatus: string, payment: any) => {
    const getPaymentMethodIcon = (method: string) => {
      switch (method) {
        case "mercadopago":
          return <CreditCard className="w-3 h-3" />;
        case "cash":
          return <Banknote className="w-3 h-3" />;
        case "transfer":
          return <CreditCard className="w-3 h-3" />;
        default:
          return <CreditCard className="w-3 h-3" />;
      }
    };

    const paymentIcon = payment ? (
      getPaymentMethodIcon(payment.paymentMethod)
    ) : (
      <XCircle className="w-3 h-3" />
    );

    switch (paymentStatus) {
      case "completed":
      case "approved":
      case "accredited":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-50"
          >
            <span className="flex items-center gap-1">
              {paymentIcon} Pagado
            </span>
          </Badge>
        );
      case "pending":
      case "in_process":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50"
          >
            <span className="flex items-center gap-1">
              {paymentIcon} Pendiente
            </span>
          </Badge>
        );
      case "failed":
      case "cancelled":
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 hover:bg-red-50"
          >
            <span className="flex items-center gap-1">
              {paymentIcon} Fallido
            </span>
          </Badge>
        );
      case "sin_pago":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Sin Pago
            </span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-1">
              {paymentIcon} {paymentStatus}
            </span>
          </Badge>
        );
    }
  };

  // Formatear la fecha para mostrar
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ventas y Pedidos
          </h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todos los pedidos de Luna Brew House.
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Proceso
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="text-2xl font-bold">
              {stats.processingOrders + stats.shippedOrders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregados
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelados
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div className="text-2xl font-bold">{stats.cancelledOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ID, cliente o email..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Estado</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="processing">En preparación</SelectItem>
              <SelectItem value="shipped">En camino</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="ready_pickup">Listo para recoger</SelectItem>
              <SelectItem value="waiting_schedule">
                Esperando horario
              </SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado Pedido</TableHead>
              <TableHead>Estado Pago</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6">
                  <div className="flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-6 text-muted-foreground"
                >
                  No se encontraron pedidos
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customer.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {order.customer.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>{renderOrderTypeBadge(order.orderType)}</TableCell>
                  <TableCell>{renderStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {renderPaymentStatusBadge(
                      order.paymentStatus,
                      order.payment
                    )}
                  </TableCell>
                  <TableCell>
                    {order.deliveryTime ? (
                      <div className="flex flex-col text-sm">
                        <span>{order.deliveryTime.date}</span>
                        <span className="text-muted-foreground">
                          {order.deliveryTime.timeRange}
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          handleViewOrderDetail(order.id);
                          setIsDeliveryDialogOpen(true);
                        }}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Programar
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>${order.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {order.status !== "delivered" &&
                        order.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              handleViewOrderDetail(order.id);
                              setIsEmailDialogOpen(true);
                            }}
                          >
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Email
                          </Button>
                        )}

                      <Select
                        disabled={
                          order.status === "cancelled" ||
                          order.status === "delivered"
                        }
                        onValueChange={(value) =>
                          handleChangeStatus(order.id, value as Order["status"])
                        }
                        value={order.status}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <span>Cambiar estado</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="processing">
                            En preparación
                          </SelectItem>
                          <SelectItem value="shipped">En camino</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="ready_pickup">
                            Listo para recoger
                          </SelectItem>
                          <SelectItem value="waiting_schedule">
                            Esperando horario
                          </SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para programar horario de entrega */}
      <Dialog
        open={isDeliveryDialogOpen}
        onOpenChange={setIsDeliveryDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Programar horario de entrega</DialogTitle>
            <DialogDescription>
              Establece la fecha y el rango horario para la entrega del pedido{" "}
              {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery-date" className="text-right">
                Fecha
              </Label>
              <Input
                id="delivery-date"
                type="text"
                placeholder="Ej: 15 May, 2025"
                className="col-span-3"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery-time" className="text-right">
                Rango horario
              </Label>
              <Select
                value={deliveryTimeRange}
                onValueChange={setDeliveryTimeRange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rango horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10:00 - 12:00">10:00 - 12:00</SelectItem>
                  <SelectItem value="12:00 - 14:00">12:00 - 14:00</SelectItem>
                  <SelectItem value="14:00 - 16:00">14:00 - 16:00</SelectItem>
                  <SelectItem value="16:00 - 18:00">16:00 - 18:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeliveryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleSetDeliveryTime}
            >
              Programar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para enviar email al cliente */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar email al cliente</DialogTitle>
            <DialogDescription>
              Envía un email al cliente para que seleccione su horario de
              entrega preferido
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
              <h4 className="font-medium text-amber-800">
                Información del cliente
              </h4>
              <p className="text-sm mt-2">
                <span className="font-medium">Nombre:</span>{" "}
                {selectedOrder?.customer.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span>{" "}
                {selectedOrder?.customer.email}
              </p>
              <p className="text-sm">
                <span className="font-medium">Teléfono:</span>{" "}
                {selectedOrder?.customer.phone}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Vista previa del email</h4>
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-sm">
                  <span className="font-medium">Asunto:</span> Selecciona tu
                  horario de entrega preferido - Luna Brew House
                </p>
                <div className="mt-3 text-sm border-t pt-3">
                  <p>Hola {selectedOrder?.customer.name},</p>
                  <p className="mt-2">
                    Gracias por tu pedido en Luna Brew House. Estamos listos
                    para enviarte tu pedido y nos gustaría que puedas elegir el
                    horario que más te convenga.
                  </p>
                  <p className="mt-2">
                    Por favor, haz clic en el siguiente enlace para seleccionar
                    tu horario de entrega preferido:
                  </p>
                  <div className="mt-2 mb-2 bg-amber-50 border border-amber-200 p-2 rounded">
                    [Enlace para seleccionar horario de entrega]
                  </div>
                  <p>¡Saludos cordiales!</p>
                  <p>El equipo de Luna Brew House</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleSendEmail}
            >
              Enviar email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
