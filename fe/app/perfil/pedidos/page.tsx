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
  ArrowLeft,
  Package,
  CheckCircle,
  Truck,
  Clock,
  Eye,
  Calendar,
  MapPin,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export default function UserOrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { loading: ordersLoading, callEndpoint } = useFetchAndLoad();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

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
          if (response && response.data) {
            setOrders(response.data.data);
            setFilteredOrders(response.data.data);
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
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(
        orders.filter(
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

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "entregado":
        return "bg-green-600";
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

  const statusOptions = [
    { value: "all", label: "Todos los pedidos", count: orders.length },
    {
      value: "pending",
      label: "Pendientes",
      count: orders.filter(
        (o) =>
          o.status?.toLowerCase() === "pending" ||
          o.status?.toLowerCase() === "pendiente"
      ).length,
    },
    {
      value: "processing",
      label: "Procesando",
      count: orders.filter(
        (o) =>
          o.status?.toLowerCase() === "processing" ||
          o.status?.toLowerCase() === "procesando"
      ).length,
    },
    {
      value: "shipping",
      label: "En camino",
      count: orders.filter(
        (o) =>
          o.status?.toLowerCase() === "shipping" ||
          o.status?.toLowerCase() === "en camino" ||
          o.status?.toLowerCase() === "enviado"
      ).length,
    },
    {
      value: "delivered",
      label: "Entregados",
      count: orders.filter(
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

        {/* Orders List */}
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
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
                          {order.status || "Pendiente"}
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
    </div>
  );
}
