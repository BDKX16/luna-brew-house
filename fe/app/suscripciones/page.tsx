"use client";

import { useEffect, useState } from "react";
import { getSubscriptionPlans } from "@/services/public";
import SubscriptionGrid from "@/components/subscriptions/SubscriptionGrid";
import LoadingSpinner from "@/components/ui/loading-spinner";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { loading, callEndpoint } = useFetchAndLoad();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await callEndpoint(getSubscriptionPlans());
        if (response && response.data) {
          setSubscriptions(response.data);
        } else {
          setError("No se pudieron cargar los planes de suscripción");
        }
      } catch (err: any) {
        console.error("Error al cargar suscripciones:", err);
        setError(err.message || "Error al cargar las suscripciones");
      }
    };

    fetchSubscriptions();
  }, []);

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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Planes de Suscripción</h1>
      <p className="text-lg mb-8">
        Recibe cervezas artesanales seleccionadas directamente en tu puerta cada
        mes
      </p>
      <SubscriptionGrid subscriptions={subscriptions} />
    </div>
  );
}
