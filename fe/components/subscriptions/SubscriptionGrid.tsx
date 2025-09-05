"use client";

import { useState } from "react";
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
  CheckCircle,
  Star,
  Package,
  Clock,
  Gift,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  isPopular?: boolean;
  discount?: number;
}

interface SubscriptionGridProps {
  plans?: SubscriptionPlan[];
  loading?: boolean;
}

export default function SubscriptionGrid({
  plans = [],
  loading = false,
}: SubscriptionGridProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes("envío")) {
      return <Package className="h-4 w-4 text-green-600" />;
    }
    if (feature.toLowerCase().includes("descuento")) {
      return <Gift className="h-4 w-4 text-blue-600" />;
    }
    if (
      feature.toLowerCase().includes("prioritario") ||
      feature.toLowerCase().includes("premium")
    ) {
      return <Star className="h-4 w-4 text-yellow-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay planes disponibles
          </h3>
          <p className="text-gray-600 mb-6">
            Estamos trabajando en nuevos planes de suscripción. ¡Vuelve pronto!
          </p>
          <Link href="/productos">
            <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
              Ver Productos Individuales
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card
          key={plan._id}
          className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
            plan.isPopular
              ? "ring-2 ring-amber-500 shadow-lg"
              : "border-gray-200 hover:border-amber-300"
          } ${
            selectedPlan === plan._id ? "ring-2 ring-blue-500 shadow-lg" : ""
          }`}
        >
          {plan.isPopular && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
              <Star className="h-3 w-3 inline mr-1" />
              Más Popular
            </div>
          )}

          {plan.discount && (
            <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded-br-lg">
              -{plan.discount}% OFF
            </div>
          )}

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-gray-500 ml-2">
                  /{plan.duration || "mes"}
                </span>
              </div>

              {plan.discount && (
                <div className="text-sm text-gray-500 line-through">
                  {formatPrice(
                    Math.round(plan.price / (1 - plan.discount / 100))
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Incluye:</h4>
              <ul className="space-y-2">
                {plan.features?.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {getFeatureIcon(feature)}
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-4 space-y-2">
              <Button
                className={`w-full ${
                  plan.isPopular
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                    : selectedPlan === plan._id
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-amber-300 hover:bg-amber-50 text-amber-700"
                } transition-all duration-200`}
                variant={
                  plan.isPopular || selectedPlan === plan._id
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedPlan(plan._id)}
              >
                {selectedPlan === plan._id ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Seleccionado
                  </>
                ) : (
                  <>
                    Seleccionar Plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              {selectedPlan === plan._id && (
                <Link href={`/checkout?plan=${plan._id}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Continuar al Checkout
                  </Button>
                </Link>
              )}
            </div>

            {/* Additional Info */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Renovación automática</span>
                </div>
                <div>
                  <span>Cancela cuando quieras</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
