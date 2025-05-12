"use client";

import { useEffect, useState } from "react";
import { getUserSubscriptions } from "@/services/public";
import UserSubscriptionsTable from "@/components/profile/UserSubscriptionsTable";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { loading, callEndpoint } = useFetchAndLoad();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/perfil/suscripciones");
      return;
    }

    const fetchUserSubscriptions = async () => {
      try {
        const response = await callEndpoint(getUserSubscriptions());
        if (response && response.data) {
          // Ensure we're handling the response structure correctly
          const subscriptionsData = Array.isArray(response.data)
            ? response.data
            : response.data.subscriptions
            ? response.data.subscriptions
            : [];
          setSubscriptions(subscriptionsData);
        } else {
          setError("No se pudieron cargar tus suscripciones");
        }
      } catch (err: any) {
        console.error("Error al cargar suscripciones del usuario:", err);
        setError(err.message || "Error al cargar las suscripciones");
      }
    };

    fetchUserSubscriptions();
  }, [isAuthenticated, router, callEndpoint]);

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
        <Button onClick={() => window.location.reload()} variant="outline">
          Intentar nuevamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Mis Suscripciones</h1>

      {subscriptions.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl mb-2">No tienes suscripciones activas</h2>
          <p className="mb-6">
            Explora nuestros planes de suscripción y disfruta de cervezas
            artesanales cada mes
          </p>
          <Link href="/suscripciones">
            <Button>Ver planes de suscripción</Button>
          </Link>
        </div>
      ) : (
        <UserSubscriptionsTable subscriptions={subscriptions} />
      )}
    </div>
  );
}
