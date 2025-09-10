"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface SubscriptionDetailPanelProps {
  subscription: {
    _id: string;
    id: string;
    userId: string;
    subscriptionId: string;
    name: string;
    beerType: string;
    beerName: string;
    liters: number;
    price: number;
    status: string;
    startDate: string;
    nextDelivery: string;
    deliveries: any[];
    billingInfo: {
      orderId: string;
      paymentId: number;
      paymentDate: string;
    };
    __v?: number;
    nullDate?: null;
    deliveryFrequency: string;
    deliveriesLeft?: number;
    totalDeliveries?: number;
    paymentMethod?: string;
    address?: string;
  };
  onBeerTypeUpdate: (newBeerType: string) => Promise<void>;
  onCancelSubscription: () => Promise<void>;
}

const beerTypes = [
  { value: "golden", label: "Golden Ale" },
  { value: "ipa", label: "IPA" },
  { value: "lager", label: "Lager" },
  { value: "stout", label: "Stout" },
  { value: "wheat", label: "Wheat" },
  { value: "porter", label: "Porter" },
  { value: "pilsner", label: "Pilsner" },
  { value: "mixed", label: "Mixto" },
];

export default function SubscriptionDetailPanel({
  subscription,
  onCancelSubscription,
}: SubscriptionDetailPanelProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusBadge = (status: string | undefined | null) => {
    if (!status) {
      return <Badge variant="secondary">Sin estado</Badge>;
    }

    switch (status.toLowerCase()) {
      case "active":
      case "activa":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Activa
          </Badge>
        );
      case "paused":
      case "pausada":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pausada
          </Badge>
        );
      case "cancelled":
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isActiveSubscription = (status: string | undefined | null) => {
    return status && status.toLowerCase() === "active";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await onCancelSubscription();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/perfil/suscripciones")}
            className="text-amber-800 hover:bg-amber-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Mis Suscripciones
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {subscription.name}
                  </CardTitle>
                  {getStatusBadge(subscription.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  ID: {subscription.subscriptionId}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Volumen</p>
                      <p className="text-sm text-gray-600">
                        {subscription.liters}L por entrega
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Tipo de cerveza</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {subscription.beerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Precio</p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(subscription.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Fechas importantes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Inicio:</span>{" "}
                      {formatDate(subscription.startDate)}
                    </div>
                    <div>
                      <span className="font-medium">Próxima entrega:</span>{" "}
                      {formatDate(subscription.nextDelivery)}
                    </div>
                  </div>
                </div>

                {/* Información de facturación */}
                {subscription.billingInfo && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium">Información de pago</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">ID de pago:</span>{" "}
                          {subscription.billingInfo.paymentId}
                        </div>
                        <div>
                          <span className="font-medium">Fecha de pago:</span>{" "}
                          {formatDate(subscription.billingInfo.paymentDate)}
                        </div>
                        <div>
                          <span className="font-medium">ID de pedido:</span>{" "}
                          {subscription.billingInfo.orderId}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Información de entregas */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium">Entregas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Entregas realizadas:</span>{" "}
                      {subscription.deliveries.length}
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span>{" "}
                      <span className="capitalize">{subscription.status}</span>
                    </div>
                  </div>
                </div>

                {subscription.address && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Dirección de entrega</h4>
                      <p className="text-sm text-gray-600">
                        {subscription.address}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Resumen */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Plan:</span>
                  <span className="font-medium">{subscription.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estado:</span>
                  <span className="capitalize">{subscription.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precio:</span>
                  <span className="font-medium">
                    {formatPrice(subscription.price)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Volumen:</span>
                  <span className="font-medium">{subscription.liters}L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cerveza:</span>
                  <span className="capitalize">{subscription.beerName}</span>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            {isActiveSubscription(subscription.status) && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Zona de peligro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Cancelar tu suscripción detendrá todas las entregas futuras.
                    Esta acción no se puede deshacer.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={isCancelling}
                      >
                        {isCancelling
                          ? "Cancelando..."
                          : "Cancelar suscripción"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción cancelará permanentemente tu suscripción
                          al "{subscription.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          No, mantener suscripción
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Sí, cancelar suscripción
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
