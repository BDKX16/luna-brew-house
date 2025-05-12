"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUserSubscriptionById,
  updateSubscriptionBeerType,
  cancelUserSubscription,
} from "@/services/public";
import SubscriptionDetailPanel from "@/components/profile/SubscriptionDetailPanel";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import { Button } from "@/components/ui/button";

export default function SubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { loading, callEndpoint } = useFetchAndLoad();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/perfil/suscripciones/${params.id}`);
      return;
    }

    const fetchSubscriptionData = async () => {
      try {
        const response = await callEndpoint(getUserSubscriptionById(params.id));
        if (response && response.data) {
          setSubscription(response.data);
        } else {
          setError("No se pudo cargar la información de la suscripción");
        }
      } catch (err: any) {
        console.error("Error al cargar suscripción:", err);
        if (err.response?.status === 404) {
          setError("La suscripción no existe o no tienes acceso a ella");
        } else {
          setError(err.message || "Error al cargar la suscripción");
        }
      }
    };

    fetchSubscriptionData();
  }, [params.id, isAuthenticated, router, callEndpoint]);

  const handleBeerTypeUpdate = async (beerType: string, beerName: string) => {
    try {
      const response = await callEndpoint(
        updateSubscriptionBeerType(params.id, beerType, beerName)
      );

      if (response && response.data) {
        setSubscription({
          ...subscription,
          beerType,
          beerName,
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al actualizar preferencia de cerveza:", error);
      return false;
    }
  };

  const handleCancelSubscription = async (reason: string) => {
    try {
      const response = await callEndpoint(
        cancelUserSubscription(params.id, reason)
      );

      if (response && response.data) {
        setSubscription({
          ...subscription,
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al cancelar suscripción:", error);
      return false;
    }
  };

  if (!isAuthenticated) {
    return null; // Redirecting in useEffect
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-xl font-medium text-red-600">Error</h2>
        <p className="mt-2 mb-4">{error}</p>
        <Button onClick={() => router.back()} variant="outline">
          Volver
        </Button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl">Suscripción no encontrada</h2>
        <Button
          onClick={() => router.push("/perfil/suscripciones")}
          className="mt-4"
        >
          Ver todas mis suscripciones
        </Button>
      </div>
    );
  }

  return (
    <SubscriptionDetailPanel
      subscription={subscription}
      onBeerTypeUpdate={handleBeerTypeUpdate}
      onCancelSubscription={handleCancelSubscription}
    />
  );
}
