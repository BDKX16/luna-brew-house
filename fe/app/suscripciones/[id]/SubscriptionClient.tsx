"use client";

import { useEffect, useState } from "react";
import { getSubscriptionPlanById } from "@/services/public";
import SubscriptionDetailView from "@/components/subscriptions/SubscriptionDetailView";
import LoadingSpinner from "@/components/ui/loading-spinner";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

interface SubscriptionClientProps {
  subscriptionId: string;
}

export default function SubscriptionClient({
  subscriptionId,
}: SubscriptionClientProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { loading, callEndpoint } = useFetchAndLoad();

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const response = await callEndpoint(
          getSubscriptionPlanById(subscriptionId)
        );
        if (response && response.data) {
          setSubscription(response.data);
        } else {
          setError("No se pudo cargar la información de la suscripción");
        }
      } catch (err: any) {
        console.error("Error al cargar suscripción:", err);
        setError(err.message || "Error al cargar la suscripción");
      }
    };

    fetchSubscriptionData();
  }, [subscriptionId, callEndpoint]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl">Plan de suscripción no encontrado</h2>
      </div>
    );
  }

  return <SubscriptionDetailView subscription={subscription} />;
}
