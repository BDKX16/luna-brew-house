"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SubscribeForm from "@/components/subscriptions/SubscribeForm";
import {
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  Truck,
  Shield,
  Star,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";

interface SubscriptionDetailViewProps {
  subscription: {
    id: string;
    name: string;
    description?: string;
    price: number;
    liters: number;
    deliveryFrequency: string;
    features?: string[];
    planType?: string;
    duration?: number;
    discount?: number;
    popular?: boolean;
    image?: string;
    benefits?: string[];
  };
}

export default function SubscriptionDetailView({
  subscription,
}: SubscriptionDetailViewProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFrequencyIcon = (frequency: string | undefined | null) => {
    if (!frequency) {
      return <Calendar className="h-4 w-4" />;
    }

    switch (frequency.toLowerCase()) {
      case "semanal":
      case "weekly":
        return <Calendar className="h-4 w-4" />;
      case "quincenal":
      case "biweekly":
        return <Calendar className="h-4 w-4" />;
      case "mensual":
      case "monthly":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/suscripciones/${subscription.id}`);
      return;
    }
    setShowSubscribeForm(true);
  };

  if (showSubscribeForm) {
    return (
      <SubscribeForm
        subscription={subscription}
        onBack={() => setShowSubscribeForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/suscripciones")}
            className="text-amber-800 hover:bg-amber-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver todos los planes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      {subscription.name}
                    </CardTitle>
                    {subscription.planType && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 capitalize"
                      >
                        Plan {subscription.planType}
                      </Badge>
                    )}
                    {subscription.popular && (
                      <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                        <Star className="h-3 w-3 mr-1" />
                        Más popular
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-amber-800">
                      {formatPrice(subscription.price)}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      por {subscription.deliveryFrequency}
                    </div>
                    {subscription.discount && (
                      <div className="text-sm text-green-600 font-medium">
                        {subscription.discount}% descuento
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscription.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                    <p className="text-gray-600">{subscription.description}</p>
                  </div>
                )}

                {/* Especificaciones principales */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">¿Qué incluye?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                      <Package className="h-6 w-6 text-amber-600" />
                      <div>
                        <p className="font-medium">
                          {subscription.liters}L de cerveza
                        </p>
                        <p className="text-sm text-gray-600">Por entrega</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      {getFrequencyIcon(subscription.deliveryFrequency)}
                      <div>
                        <p className="font-medium capitalize">
                          Entrega {subscription.deliveryFrequency}
                        </p>
                        <p className="text-sm text-gray-600">Programada</p>
                      </div>
                    </div>
                    {subscription.duration && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium">
                            {subscription.duration} meses
                          </p>
                          <p className="text-sm text-gray-600">
                            Duración mínima
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="font-medium">Variedades premium</p>
                        <p className="text-sm text-gray-600">
                          Selección artesanal
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Características */}
                {subscription.features && subscription.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Características
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {subscription.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beneficios */}
                {subscription.benefits && subscription.benefits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Beneficios adicionales
                    </h3>
                    <div className="space-y-2">
                      {subscription.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Star className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Botón de suscripción */}
                <div className="text-center">
                  <Button
                    onClick={handleSubscribe}
                    size="lg"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg"
                  >
                    {isAuthenticated
                      ? "Suscribirme ahora"
                      : "Iniciar sesión para suscribirme"}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Puedes cancelar en cualquier momento
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Resumen de precio */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg">Resumen de costos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Plan base:</span>
                  <span>{formatPrice(subscription.price)}</span>
                </div>
                {subscription.discount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento ({subscription.discount}%):</span>
                    <span>
                      -
                      {formatPrice(
                        (subscription.price * subscription.discount) / 100
                      )}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total por {subscription.deliveryFrequency}:</span>
                  <span className="text-amber-800">
                    {subscription.discount
                      ? formatPrice(
                          subscription.price * (1 - subscription.discount / 100)
                        )
                      : formatPrice(subscription.price)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Precio por litro:{" "}
                  {formatPrice(subscription.price / subscription.liters)}/L
                </div>
              </CardContent>
            </Card>

            {/* Información de entrega */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>Frecuencia: {subscription.deliveryFrequency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span>Volumen: {subscription.liters}L por entrega</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Envío gratuito incluido</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Garantías */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Garantías
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Calidad garantizada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Cancela cuando quieras</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Pausa tu suscripción</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Soporte 24/7</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
