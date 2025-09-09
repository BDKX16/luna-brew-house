"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, getMyOrders } from "@/services/private";
import {
  getSubscriptionPlans,
  getBeers,
  getUserSubscriptions,
} from "@/services/public";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  CheckCircle,
  Truck,
  Edit,
  Save,
  X,
  Settings,
  ShoppingBag,
  CreditCard,
  Beer,
  Crown,
  ArrowRight,
  Shield,
  Star,
  TrendingUp,
  LayoutDashboard,
  CalendarDays,
  UserCircle,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { loading: isUpdating, callEndpoint } = useFetchAndLoad();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [userSubscriptionsLoading, setUserSubscriptionsLoading] =
    useState(false);
  const [userSubscriptionsLoaded, setUserSubscriptionsLoaded] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [beers, setBeers] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  // Estados para acordeones en mobile
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  // Función para toggle de acordeón en mobile
  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  useEffect(() => {
    // Redirect to login if not authenticated and not currently loading
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/perfil");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Populate user info when user data is available
    if (user) {
      setUserInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        birthDate: user.birthDate || "",
      });
    }
  }, [user]);

  useEffect(() => {
    // Load user orders when user is authenticated
    const loadOrders = async () => {
      if (user && isAuthenticated && !ordersLoaded && !ordersLoading) {
        try {
          setOrdersLoading(true);
          const response = await callEndpoint(getMyOrders());
          if (response && response.data && response.data.data) {
            // Filtrar pedidos de cerveza (excluir suscripciones) y ordenar por fecha
            const allOrders =
              response.data.data.data || response.data.data || [];
            const beerOrders = allOrders.filter((order) => {
              const isSubscription =
                order.orderType?.toLowerCase().includes("suscripción") ||
                order.orderType?.toLowerCase().includes("subscription") ||
                (order.items &&
                  order.items.some(
                    (item) =>
                      item.type?.toLowerCase().includes("suscripción") ||
                      item.type?.toLowerCase().includes("subscription")
                  ));
              return !isSubscription;
            });

            // Ordenar por fecha (más reciente primero)
            const sortedOrders = beerOrders.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setOrders(sortedOrders);
          }
          setOrdersLoaded(true);
        } catch (error) {
          // Solo loggear errores que no sean de cancelación
          if (error.name !== "CanceledError" && error.name !== "AbortError") {
            console.error("Error loading orders:", error);
          }
        } finally {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();
  }, [user, isAuthenticated, ordersLoaded, ordersLoading]); // Removido callEndpoint de las dependencias

  useEffect(() => {
    // Load user subscriptions when user is authenticated
    const loadUserSubscriptions = async () => {
      if (
        user &&
        isAuthenticated &&
        !userSubscriptionsLoaded &&
        !userSubscriptionsLoading
      ) {
        try {
          setUserSubscriptionsLoading(true);
          const response = await callEndpoint(getUserSubscriptions());
          console.log(response);
          if (response && response.data && response.data.subscriptions) {
            setUserSubscriptions(response.data.subscriptions);
            console.log(
              "Suscripciones del usuario cargadas:",
              response.data.subscriptions
            );
          }
          setUserSubscriptionsLoaded(true);
        } catch (error) {
          // Solo loggear errores que no sean de cancelación
          if (error.name !== "CanceledError" && error.name !== "AbortError") {
            console.error("Error loading user subscriptions:", error);
          }
        } finally {
          setUserSubscriptionsLoading(false);
        }
      }
    };

    loadUserSubscriptions();
  }, [
    user,
    isAuthenticated,
    userSubscriptionsLoaded,
    userSubscriptionsLoading,
  ]);

  useEffect(() => {
    // Load promotional content for non-admin users
    if (user && isAuthenticated && user.role !== "admin" && !contentLoaded) {
      loadPromotionalContent();
    }
  }, [user, isAuthenticated, contentLoaded]);

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

  const isAdmin = user?.role === "admin";

  const handleSave = async () => {
    try {
      const response = await callEndpoint(updateUserProfile(userInfo));
      if (response && response.data) {
        setIsEditing(false);
        setUpdateSuccess(true);
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => setUpdateSuccess(false), 3000);
        console.log("Perfil actualizado exitosamente:", response.data);
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar valores originales del usuario
    if (user) {
      setUserInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        birthDate: user.birthDate || "",
      });
    }
  };

  const refreshOrders = async () => {
    if (user && isAuthenticated) {
      try {
        setOrdersLoading(true);
        setOrdersLoaded(false); // Resetear la bandera para permitir recarga
        const response = await callEndpoint(getMyOrders());
        if (response && response.data) {
          setOrders(response.data);
        }
        setOrdersLoaded(true);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error("Error refreshing orders:", error);
        }
      } finally {
        setOrdersLoading(false);
      }
    }
  };

  const loadPromotionalContent = async () => {
    if (contentLoaded || contentLoading) return;

    setContentLoading(true);
    try {
      // Cargar suscripciones y cervezas en paralelo
      const [subscriptionsResponse, beersResponse] = await Promise.all([
        callEndpoint(getSubscriptionPlans()),
        callEndpoint(getBeers()),
      ]);

      // Guardar suscripciones si están disponibles
      if (
        subscriptionsResponse?.data &&
        subscriptionsResponse.data.length > 0
      ) {
        setSubscriptions(subscriptionsResponse.data);
        console.log("Suscripciones cargadas:", subscriptionsResponse.data);
      }

      // Guardar cervezas si están disponibles
      console.log(beersResponse);
      if (
        beersResponse?.data &&
        beersResponse?.data?.beers &&
        beersResponse.data.beers.length > 0
      ) {
        setBeers(beersResponse.data.beers);
        console.log("Cervezas cargadas:", beersResponse.data);
      }

      setContentLoaded(true);
    } catch (error) {
      if (error.name !== "CanceledError" && error.name !== "AbortError") {
        console.error("Error loading promotional content:", error);
      }
    } finally {
      setContentLoading(false);
    }
  };

  // useEffect para cargar contenido promocional
  useEffect(() => {
    if (user && isAuthenticated && user.role !== "admin" && !contentLoaded) {
      loadPromotionalContent();
    }
  }, [user, isAuthenticated, contentLoaded]);

  const stats = [
    {
      label: "Pedidos Totales",
      value: ordersLoading ? "..." : orders?.length?.toString(),
      icon: ShoppingBag,
      color: "text-blue-600",
    },
    {
      label: "Suscripciones Activas",
      value: userSubscriptionsLoading
        ? "..."
        : userSubscriptions.length.toString(),
      icon: CreditCard,
      color: "text-green-600",
    },
    {
      label: "Puntos Acumulados",
      value: user.loyaltyPoints || "0",
      icon: Star,
      color: "text-yellow-600",
    },
    {
      label: "Miembro Desde",
      value: user.createdAt
        ? new Date(user.createdAt).getFullYear().toString()
        : "2024",
      icon: Calendar,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header con información del usuario */}
      <ProfileHeader
        backUrl="/"
        backLabel="Volver al Home"
        showUserInfo={true}
        stats={stats}
      />

      {/* Contenido principal */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Personal */}
          <Card className="bg-white/70 backdrop-blur-sm border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader
              className="pb-4 cursor-pointer md:cursor-default"
              onClick={() => window.innerWidth < 768 && toggleCard("personal")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Información Personal
                    </CardTitle>
                    <CardDescription className="md:block hidden">
                      Gestiona tus datos de perfil
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 hover:bg-amber-50"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave();
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {isUpdating ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel();
                        }}
                        variant="outline"
                        size="sm"
                        disabled={isUpdating}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  )}

                  {/* Icono de acordeón solo en mobile */}
                  <div className="md:hidden">
                    {expandedCards.includes("personal") ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Contenido colapsable en mobile, siempre visible en desktop */}
            <div
              className={`md:block transition-all duration-300 ${
                expandedCards.includes("personal") ? "block" : "hidden"
              }`}
            >
              <CardContent className="space-y-4">
                {updateSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Perfil actualizado exitosamente
                      </span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nombre Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        value={userInfo.name}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, name: e.target.value })
                        }
                        className="pl-10 border-gray-200 focus:border-amber-400 focus:ring-amber-400"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Correo Electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={userInfo.email}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, email: e.target.value })
                        }
                        className="pl-10 border-gray-200 focus:border-amber-400 focus:ring-amber-400"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Teléfono
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={userInfo.phone}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, phone: e.target.value })
                        }
                        className="pl-10 border-gray-200 focus:border-amber-400 focus:ring-amber-400"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Mis Suscripciones */}
          <Card className="bg-white/70 backdrop-blur-sm border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
            <CardHeader
              className="pb-4 cursor-pointer md:cursor-default"
              onClick={() =>
                window.innerWidth < 768 && toggleCard("subscriptions")
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Mis Suscripciones</CardTitle>
                    <CardDescription className="md:block hidden">
                      Gestiona tus planes de cerveza mensuales
                    </CardDescription>
                  </div>
                </div>

                {/* Icono de acordeón solo en mobile */}
                <div className="md:hidden">
                  {expandedCards.includes("subscriptions") ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Contenido colapsable en mobile, siempre visible en desktop */}
            <div
              className={`md:block transition-all duration-300 flex-1 flex flex-col ${
                expandedCards.includes("subscriptions") ? "block" : "hidden"
              }`}
            >
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4">
                  <p className="text-gray-600">
                    Revisa y gestiona tus suscripciones activas e históricas.
                  </p>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        {userSubscriptionsLoading
                          ? "Cargando..."
                          : `${userSubscriptions.length} Suscripciones Activas`}
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      {userSubscriptions.length > 0
                        ? "Revisa tus planes activos y próximos envíos"
                        : "No tienes suscripciones activas"}
                    </p>
                    {userSubscriptions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {userSubscriptions.slice(0, 2).map((subscription) => (
                          <div
                            key={subscription._id}
                            className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded"
                          >
                            {subscription.name} - {subscription.beerName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <Link href="/perfil/suscripciones">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                      Ver Suscripciones
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Mis Pedidos */}
          <Card className="bg-white/70 backdrop-blur-sm border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
            <CardHeader
              className="pb-4 cursor-pointer md:cursor-default"
              onClick={() => window.innerWidth < 768 && toggleCard("orders")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Mis Pedidos</CardTitle>
                    <CardDescription className="md:block hidden">
                      Historial de tus pedidos de cerveza
                    </CardDescription>
                  </div>
                </div>

                {/* Icono de acordeón solo en mobile */}
                <div className="md:hidden">
                  {expandedCards.includes("orders") ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Contenido colapsable en mobile, siempre visible en desktop */}
            <div
              className={`md:block transition-all duration-300 flex-1 flex flex-col ${
                expandedCards.includes("orders") ? "block" : "hidden"
              }`}
            >
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4">
                  <p className="text-gray-600">
                    Consulta el estado e historial de todos tus pedidos de
                    cerveza.
                  </p>

                  {ordersLoading ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner className="h-6 w-6" />
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        // Separar pedidos por prioridad
                        // 1. Pedidos en curso (alta prioridad): preparación, en camino, listo para recoger, esperando horario
                        const inProgressOrders = orders.filter((order) => {
                          const status = order.status?.toLowerCase();
                          return (
                            status === "processing" ||
                            status === "procesando" ||
                            status === "en preparación" ||
                            status === "shipped" ||
                            status === "shipping" ||
                            status === "en camino" ||
                            status === "enviado" ||
                            status === "ready_pickup" ||
                            status === "listo para recoger" ||
                            status === "waiting_schedule" ||
                            status === "esperando horario"
                          );
                        });

                        // 2. Pedidos pendientes/confirmados (media prioridad)
                        const pendingOrders = orders.filter((order) => {
                          const status = order.status?.toLowerCase();
                          return (
                            status === "pending" ||
                            status === "pendiente" ||
                            status === "confirmed" ||
                            status === "confirmado"
                          );
                        });

                        // 3. Pedidos completados (baja prioridad) - NO incluir cancelados
                        const completedOrders = orders.filter((order) => {
                          const status = order.status?.toLowerCase();
                          return (
                            status === "delivered" || status === "entregado"
                          );
                        });

                        // Lógica de mostrado:
                        // Si hay pedidos en curso, mostrar solo esos (máximo 3)
                        // Si no hay en curso, mostrar pendientes + completados (máximo 3)
                        let ordersToShow;
                        if (inProgressOrders.length > 0) {
                          ordersToShow = [
                            ...inProgressOrders,
                            ...pendingOrders,
                          ].slice(0, 3);
                        } else {
                          ordersToShow = [
                            ...pendingOrders,
                            ...completedOrders,
                          ].slice(0, 3);
                        }

                        return ordersToShow.map((order) => {
                          const getStatusIcon = (status) => {
                            switch (status?.toLowerCase()) {
                              case "delivered":
                              case "entregado":
                                return (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                );
                              case "shipped":
                              case "shipping":
                              case "en camino":
                              case "enviado":
                                return (
                                  <Truck className="h-4 w-4 text-blue-600" />
                                );
                              case "processing":
                              case "procesando":
                              case "en preparación":
                                return (
                                  <Package className="h-4 w-4 text-yellow-600" />
                                );
                              case "confirmed":
                              case "confirmado":
                                return (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                );
                              case "ready_pickup":
                              case "listo para recoger":
                                return (
                                  <Package className="h-4 w-4 text-orange-600" />
                                );
                              case "waiting_schedule":
                              case "esperando horario":
                                return (
                                  <CalendarDays className="h-4 w-4 text-cyan-600" />
                                );
                              case "pending":
                              case "pendiente":
                                return (
                                  <Package className="h-4 w-4 text-gray-600" />
                                );
                              default:
                                return (
                                  <Package className="h-4 w-4 text-gray-600" />
                                );
                            }
                          };

                          const getStatusColor = (status) => {
                            switch (status?.toLowerCase()) {
                              case "delivered":
                              case "entregado":
                                return "bg-green-50 border-green-200";
                              case "shipped":
                              case "shipping":
                              case "en camino":
                              case "enviado":
                                return "bg-blue-50 border-blue-200";
                              case "processing":
                              case "procesando":
                              case "en preparación":
                                return "bg-yellow-50 border-yellow-200";
                              case "confirmed":
                              case "confirmado":
                                return "bg-green-50 border-green-200";
                              case "ready_pickup":
                              case "listo para recoger":
                                return "bg-orange-50 border-orange-200";
                              case "waiting_schedule":
                              case "esperando horario":
                                return "bg-cyan-50 border-cyan-200";
                              case "pending":
                              case "pendiente":
                                return "bg-gray-50 border-gray-200";
                              default:
                                return "bg-gray-50 border-gray-200";
                            }
                          };

                          const getStatusTextColor = (status) => {
                            switch (status?.toLowerCase()) {
                              case "delivered":
                              case "entregado":
                                return "text-green-800";
                              case "shipped":
                              case "shipping":
                              case "en camino":
                              case "enviado":
                                return "text-blue-800";
                              case "processing":
                              case "procesando":
                              case "en preparación":
                                return "text-yellow-800";
                              case "confirmed":
                              case "confirmado":
                                return "text-green-800";
                              case "ready_pickup":
                              case "listo para recoger":
                                return "text-orange-800";
                              case "waiting_schedule":
                              case "esperando horario":
                                return "text-cyan-800";
                              case "pending":
                              case "pendiente":
                                return "text-gray-800";
                              default:
                                return "text-gray-800";
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
                                return "En camino";
                              case "processing":
                              case "procesando":
                              case "en preparación":
                                return "En preparación";
                              case "confirmed":
                              case "confirmado":
                                return "Confirmado";
                              case "ready_pickup":
                              case "listo para recoger":
                                return "Listo para recoger";
                              case "waiting_schedule":
                              case "esperando horario":
                                return "Esperando horario";
                              case "pending":
                              case "pendiente":
                                return "Pendiente";
                              default:
                                return status || "Sin estado";
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

                          const isDeliveryToday = (order) => {
                            if (!order.deliveryTime?.date) return false;

                            const today = new Date();
                            const todayDay = today.getDate();
                            const todayMonth = today.toLocaleDateString(
                              "es-ES",
                              {
                                month: "long",
                              }
                            );

                            // Convertir el deliveryTime.date a formato comparable
                            const deliveryDate =
                              order.deliveryTime.date.toLowerCase();

                            // Crear string de hoy en formato similar: "10 septiembre"
                            const todayString =
                              `${todayDay} ${todayMonth}`.toLowerCase();

                            return deliveryDate === todayString;
                          };

                          return (
                            <div
                              key={order._id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isDeliveryToday(order)
                                  ? "bg-blue-50 border-blue-200"
                                  : getStatusColor(order.status)
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isDeliveryToday(order) ? (
                                  <div className="p-1 bg-blue-100 rounded-full">
                                    <Truck className="h-4 w-4 text-blue-600" />
                                  </div>
                                ) : (
                                  getStatusIcon(order.status)
                                )}
                                <div>
                                  <p
                                    className={`font-medium ${
                                      isDeliveryToday(order)
                                        ? "text-blue-800"
                                        : getStatusTextColor(order.status)
                                    }`}
                                  >
                                    Pedido {formatOrderId(order._id)}
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      isDeliveryToday(order)
                                        ? "text-blue-600"
                                        : getStatusTextColor(
                                            order.status
                                          ).replace("800", "600")
                                    }`}
                                  >
                                    {isDeliveryToday(order)
                                      ? "¡Llega hoy!"
                                      : getStatusText(order.status)}
                                    {isDeliveryToday(order) &&
                                      order.deliveryTime?.timeRange && (
                                        <span className="block text-xs text-blue-500">
                                          {order.deliveryTime.timeRange}
                                        </span>
                                      )}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={`${
                                  isDeliveryToday(order)
                                    ? "border-blue-300 text-blue-700 bg-blue-50"
                                    : `border-${
                                        getStatusColor(order.status).includes(
                                          "green"
                                        )
                                          ? "green"
                                          : getStatusColor(
                                              order.status
                                            ).includes("blue")
                                          ? "blue"
                                          : getStatusColor(
                                              order.status
                                            ).includes("yellow")
                                          ? "yellow"
                                          : "gray"
                                      }-300 ${getStatusTextColor(
                                        order.status
                                      ).replace("800", "700")}`
                                }`}
                              >
                                {formatPrice(order.total || 0)}
                              </Badge>
                            </div>
                          );
                        }); // Cierre del map
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No tienes pedidos de cerveza aún
                      </p>
                      <p className="text-sm text-gray-400">
                        ¡Explora nuestras cervezas y haz tu primer pedido!
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón pegado al fondo del card */}
                <div className="mt-4">
                  <Link href="/perfil/pedidos">
                    <Button
                      variant="outline"
                      className="w-full border-purple-300 hover:bg-purple-50 bg-transparent"
                    >
                      Ver Todos los Pedidos de Cerveza
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Contenido Condicional - Panel Admin o Promocional */}
          {isAdmin ? (
            <Card className="bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
              <CardHeader
                className="pb-4 cursor-pointer md:cursor-default"
                onClick={() => window.innerWidth < 768 && toggleCard("admin")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-200 rounded-lg">
                      <LayoutDashboard className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-amber-900">
                        Panel de Administración
                      </CardTitle>
                      <CardDescription className="text-amber-700 md:block hidden">
                        Acceso al área administrativa
                      </CardDescription>
                    </div>
                  </div>

                  {/* Icono de acordeón solo en mobile */}
                  <div className="md:hidden">
                    {expandedCards.includes("admin") ? (
                      <ChevronUp className="h-4 w-4 text-amber-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Contenido colapsable en mobile, siempre visible en desktop */}
              <div
                className={`md:block transition-all duration-300 flex-1 flex flex-col ${
                  expandedCards.includes("admin") ? "block" : "hidden"
                }`}
              >
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    <p className="text-amber-800">
                      Gestionar productos, pedidos y configuraciones del
                      sistema.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-amber-800">
                          Ventas
                        </p>
                        <p className="text-xs text-amber-600">Dashboard</p>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <Package className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-amber-800">
                          Productos
                        </p>
                        <p className="text-xs text-amber-600">Gestión</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link href="/admin">
                      <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-md">
                        <Settings className="mr-2 h-4 w-4" />
                        Acceder al Panel Admin
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          ) : (
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
              <CardHeader
                className="pb-4 cursor-pointer md:cursor-default"
                onClick={() => window.innerWidth < 768 && toggleCard("promo")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Beer className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {userSubscriptions.length > 0
                          ? "Mis Suscripciones"
                          : subscriptions.length > 0
                          ? "Planes de Suscripción"
                          : "Cervezas Artesanales"}
                      </CardTitle>
                      <CardDescription className="md:block hidden">
                        {userSubscriptions.length > 0
                          ? "Gestiona tus suscripciones activas"
                          : subscriptions.length > 0
                          ? "Descubre nuestros planes con descuentos exclusivos"
                          : "Explora nuestra selección de cervezas premium"}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Icono de acordeón solo en mobile */}
                  <div className="md:hidden">
                    {expandedCards.includes("promo") ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Contenido colapsable en mobile, siempre visible en desktop */}
              <div
                className={`md:block transition-all duration-300 flex-1 flex flex-col ${
                  expandedCards.includes("promo") ? "block" : "hidden"
                }`}
              >
                <CardContent className="flex-1 flex flex-col">
                  {contentLoading || userSubscriptionsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : userSubscriptions.length > 0 ? (
                    // Mostrar suscripciones activas del usuario
                    <>
                      <div className="flex-1 space-y-3">
                        {userSubscriptions.slice(0, 2).map((subscription) => (
                          <div
                            key={subscription._id}
                            className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-green-800 text-sm">
                                {subscription.name}
                              </h3>
                              <Badge className="bg-green-600 text-white text-xs">
                                Activa
                              </Badge>
                            </div>
                            <p className="text-xs text-green-600 mb-1">
                              {subscription.beerName} - {subscription.liters}L
                            </p>
                            <div className="text-xs text-gray-500">
                              Próxima entrega:{" "}
                              {subscription.nextDelivery
                                ? new Date(
                                    subscription.nextDelivery
                                  ).toLocaleDateString()
                                : "Por programar"}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Link href="/perfil/suscripciones">
                          <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0">
                            <Crown className="h-4 w-4 mr-2" />
                            Gestionar Suscripciones
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : subscriptions.length > 0 ? (
                    // Mostrar planes de suscripción disponibles
                    <>
                      <div className="flex-1 space-y-3">
                        {subscriptions.slice(0, 2).map((subscription) => (
                          <div
                            key={subscription._id}
                            className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-green-800 text-sm">
                                {subscription.name}
                              </h3>
                              <Badge className="bg-green-600 text-white text-xs">
                                ${subscription.price?.toLocaleString()}
                              </Badge>
                            </div>
                            <p className="text-xs text-green-600 mb-1">
                              {subscription.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              {subscription.features?.slice(0, 1).join(" • ")}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Link href="/suscripciones">
                          <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                            <Crown className="h-4 w-4 mr-2" />
                            Ver Planes de Suscripción
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : beers.length > 0 ? (
                    // Mostrar cervezas como fallback
                    <>
                      <div className="flex-1 space-y-3">
                        {beers.slice(0, 2).map((beer) => (
                          <div
                            key={beer._id}
                            className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">🍺</div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-amber-800 text-sm">
                                    {beer.name}
                                  </h3>
                                  <Badge className="bg-amber-600 text-white text-xs">
                                    ${beer.price?.toLocaleString()}
                                  </Badge>
                                </div>
                                <p className="text-xs text-amber-600 mb-2">
                                  {beer.type}
                                </p>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {beer.description}
                                </p>
                                {beer.stock !== undefined && (
                                  <div className="mt-2">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        beer.stock > 0
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {beer.stock > 0
                                        ? `${beer.stock} disponibles`
                                        : "Agotado"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Link href="/productos?category=beer">
                          <Button
                            variant="outline"
                            className="w-full border-amber-300 hover:bg-amber-50 bg-transparent"
                          >
                            Ver Todas las Cervezas
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    // Estado sin contenido
                    <div className="flex-1 flex flex-col justify-center items-center text-center py-6">
                      <div className="text-3xl mb-3">🍺</div>
                      <p className="text-gray-500 text-sm mb-3">
                        Estamos preparando contenido especial para ti
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => loadPromotionalContent()}
                        disabled={contentLoading}
                        className="border-amber-300 hover:bg-amber-50 text-sm"
                      >
                        {contentLoading ? "Cargando..." : "Actualizar"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
