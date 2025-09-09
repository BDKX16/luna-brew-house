"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getMyOrders } from "@/services/private";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Truck,
  Clock,
  Eye,
  Calendar,
  MapPin,
  CreditCard,
  X,
} from "lucide-react";
import Link from "next/link";

export default function UserOrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { loading: ordersLoading, callEndpoint } = useFetchAndLoad();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/perfil/pedidos");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Load user orders when authenticated
    const loadOrders = async () => {
      if (user && isAuthenticated) {
        try {
          const response = await callEndpoint(getMyOrders());
          if (response && response.data && response.data.data) {
            setOrders(response.data.data.data);
            setFilteredOrders(response.data.data.data);
          }
        } catch (error) {
          if (error.name !== "CanceledError" && error.name !== "AbortError") {
            console.error("Error loading orders:", error);
          }
        }
      }
    };

    loadOrders();
  }, [user, isAuthenticated, callEndpoint]);

  useEffect(() => {
    // Filter orders based on status
    const ordersArray = orders ?? [];
    if (statusFilter === "all") {
      setFilteredOrders(ordersArray);
    } else if (statusFilter === "shipping") {
      // Filtro especial para "En camino" que incluye múltiples estados
      setFilteredOrders(
        ordersArray.filter(
          (order) =>
            order.status?.toLowerCase() === "shipped" ||
            order.status?.toLowerCase() === "shipping" ||
            order.status?.toLowerCase() === "en camino" ||
            order.status?.toLowerCase() === "enviado"
        )
      );
    } else {
      setFilteredOrders(
        ordersArray.filter(
          (order) => order.status?.toLowerCase() === statusFilter.toLowerCase()
        )
      );
    }
  }, [orders, statusFilter]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Avoid flash of unauthorized page before redirect
  if (!isAuthenticated || !user) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "entregado":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "shipped":
      case "shipping":
      case "en camino":
      case "enviado":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "processing":
      case "procesando":
        return <Package className="h-5 w-5 text-yellow-600" />;
      case "pending":
      case "pendiente":
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "entregado":
        return "bg-green-50 border-green-200 text-green-800";
      case "shipped":
      case "shipping":
      case "en camino":
      case "enviado":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "processing":
      case "procesando":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "pending":
      case "pendiente":
        return "bg-gray-50 border-gray-200 text-gray-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "entregado":
        return "Entregado";
      case "shipped":
      case "shipping":
      case "en camino":
      case "enviado":
        return "En Camino";
      case "processing":
      case "procesando":
        return "Procesando";
      case "pending":
      case "pendiente":
        return "Pendiente";
      default:
        return status || "Sin estado";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "entregado":
        return "bg-green-600";
      case "shipped":
      case "shipping":
      case "en camino":
      case "enviado":
        return "bg-blue-600";
      case "processing":
      case "procesando":
        return "bg-yellow-600";
      case "pending":
      case "pendiente":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatOrderId = (id) => {
    return `#${id.slice(-6).toUpperCase()}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  // Función para obtener el pedido más reciente en camino
  const getActiveShippingOrder = () => {
    return (orders ?? []).find(
      (order) =>
        order.status?.toLowerCase() === "shipped" ||
        order.status?.toLowerCase() === "shipping" ||
        order.status?.toLowerCase() === "en camino" ||
        order.status?.toLowerCase() === "enviado"
    );
  };

  const statusOptions = [
    { value: "all", label: "Todos los pedidos", count: (orders ?? []).length },
    {
      value: "pending",
      label: "Pendientes",
      count: (orders ?? []).filter(
        (o) =>
          o.status?.toLowerCase() === "pending" ||
          o.status?.toLowerCase() === "pendiente"
      ).length,
    },
    {
      value: "processing",
      label: "Procesando",
      count: (orders ?? []).filter(
        (o) =>
          o.status?.toLowerCase() === "processing" ||
          o.status?.toLowerCase() === "procesando"
      ).length,
    },
    {
      value: "shipping",
      label: "En camino",
      count: (orders ?? []).filter(
        (o) =>
          o.status?.toLowerCase() === "shipped" ||
          o.status?.toLowerCase() === "shipping" ||
          o.status?.toLowerCase() === "en camino" ||
          o.status?.toLowerCase() === "enviado"
      ).length,
    },
    {
      value: "delivered",
      label: "Entregados",
      count: (orders ?? []).filter(
        (o) =>
          o.status?.toLowerCase() === "delivered" ||
          o.status?.toLowerCase() === "entregado"
      ).length,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/perfil">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 hover:bg-amber-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Perfil
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
              <p className="text-gray-600">
                Gestiona y revisa el historial de todos tus pedidos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Filters */}
        <Card className="mb-6 bg-white/70 backdrop-blur-sm border-amber-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filtrar pedidos</CardTitle>
            <CardDescription>
              Filtra tus pedidos por estado para encontrar lo que buscas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    statusFilter === option.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter(option.value)}
                  className={
                    statusFilter === option.value
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-amber-300 hover:bg-amber-50"
                  }
                >
                  {option.label}
                  {option.count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white/20 text-current"
                    >
                      {option.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card de Progreso del Pedido en Camino */}
        {getActiveShippingOrder() && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-600 p-3 rounded-full">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900">
                    ¡Tu pedido está en camino! 🚚
                  </h3>
                  <p className="text-blue-700">
                    Pedido {formatOrderId(getActiveShippingOrder()._id)} -
                    Total: {formatPrice(getActiveShippingOrder().total || 0)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 hover:bg-blue-50 text-blue-700"
                  onClick={() => openOrderDetails(getActiveShippingOrder())}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>

              {/* Barra de Progreso */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium text-blue-800">
                  <span>Progreso del envío</span>
                  <span>En tránsito</span>
                </div>

                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full relative overflow-hidden"
                    style={{ width: "75%" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>

                {/* Estados del Progreso */}
                <div className="flex justify-between text-xs text-blue-700 mt-2">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mb-1"></div>
                    <span>Confirmado</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mb-1"></div>
                    <span>Preparando</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mb-1 animate-pulse"></div>
                    <span>En camino</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-300 rounded-full mb-1"></div>
                    <span>Entregado</span>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      Tiempo estimado de entrega:
                    </span>
                    <span>24-48 horas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>Tu pedido llegará pronto a tu dirección</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : (filteredOrders ?? []).length > 0 ? (
          <div className="space-y-4">
            {(filteredOrders ?? []).map((order) => (
              <Card
                key={order._id}
                className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            Pedido {formatOrderId(order._id)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Realizado el{" "}
                            {formatDate(order.createdAt || new Date())}
                          </p>
                        </div>
                        <Badge
                          className={`${getStatusBadgeColor(
                            order.status
                          )} text-white`}
                        >
                          {getStatusText(order.status)}
                        </Badge>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">
                            {order.items?.length || 0} artículo(s)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {formatPrice(order.total || 0)}
                          </span>
                        </div>
                        {order.shippingAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600 truncate">
                              {order.shippingAddress}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Items Preview */}
                      {order.items && order.items.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Artículos del pedido:
                          </p>
                          <div className="space-y-1">
                            {order.items.slice(0, 3).map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{order.items.length - 3} artículo(s) más
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-300 hover:bg-amber-50"
                        onClick={() => openOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                      {(order.status?.toLowerCase() === "delivered" ||
                        order.status?.toLowerCase() === "entregado") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-300 hover:bg-green-50 text-green-700"
                        >
                          Volver a Pedir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {statusFilter === "all"
                  ? "No tienes pedidos aún"
                  : `No tienes pedidos ${statusOptions
                      .find((o) => o.value === statusFilter)
                      ?.label.toLowerCase()}`}
              </h3>
              <p className="text-gray-600 mb-6">
                {statusFilter === "all"
                  ? "¡Explora nuestros productos y haz tu primer pedido!"
                  : "Prueba con un filtro diferente o explora nuestros productos."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {statusFilter !== "all" && (
                  <Button
                    variant="outline"
                    onClick={() => setStatusFilter("all")}
                    className="border-amber-300 hover:bg-amber-50"
                  >
                    Ver todos los pedidos
                  </Button>
                )}
                <Link href="/productos">
                  <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                    Explorar Productos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Detalles del Pedido */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Detalles del Pedido #{selectedOrder?.id}
            </DialogTitle>
            <DialogDescription>
              Información completa de tu pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Estado y Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Estado del Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedOrder.status)}
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha del Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {formatDate(selectedOrder.date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedOrder.date).toLocaleTimeString("es-ES")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Información de Entrega */}
              {selectedOrder.shippingInfo && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Información de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">
                          {selectedOrder.shippingInfo.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shippingInfo.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shippingInfo.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          {selectedOrder.shippingInfo.address},{" "}
                          {selectedOrder.shippingInfo.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedOrder.shippingInfo.province} -{" "}
                          {selectedOrder.shippingInfo.postalCode}
                        </p>
                        {selectedOrder.shippingInfo.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Notas:</span>{" "}
                            {selectedOrder.shippingInfo.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Productos del Pedido */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Productos ({selectedOrder.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {item.name || item.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.type === "beer" ? "Cerveza" : "Suscripción"}{" "}
                              - Cantidad: {item.quantity || 1}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.price * (item.quantity || 1))}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.price)} c/u
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen de Pago */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Resumen de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento:</span>
                        <span>-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>
                        {selectedOrder.shippingCost > 0
                          ? formatPrice(selectedOrder.shippingCost)
                          : "Gratis"}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-amber-600">
                        {formatPrice(selectedOrder.total)}
                      </span>
                    </div>
                  </div>

                  {/* Estado de Pago */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Estado de Pago:
                      </span>
                      <Badge
                        className={
                          selectedOrder.paymentStatus === "completed"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : selectedOrder.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {selectedOrder.paymentStatus === "completed" &&
                          "Pagado"}
                        {selectedOrder.paymentStatus === "pending" &&
                          "Pendiente"}
                        {selectedOrder.paymentStatus === "failed" && "Falló"}
                        {!selectedOrder.paymentStatus && "No especificado"}
                      </Badge>
                    </div>
                    {selectedOrder.paymentMethod && (
                      <p className="text-sm text-gray-600 mt-1">
                        Método: {selectedOrder.paymentMethod}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Acciones del Modal */}
              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={closeOrderDetails}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                {(selectedOrder.status?.toLowerCase() === "delivered" ||
                  selectedOrder.status?.toLowerCase() === "entregado") && (
                  <Button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                    Volver a Pedir
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
