"use client";

import { useEffect, useState } from "react";
import { getBeers } from "@/services/public";
import LoadingSpinner from "@/components/ui/loading-spinner";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { loading, callEndpoint } = useFetchAndLoad();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await callEndpoint(getBeers());
        if (response && response.data) {
          setProducts(response.data);
        } else {
          setError("No se pudieron cargar los productos");
        }
      } catch (err: any) {
        console.error("Error al cargar productos:", err);
        setError(err.message || "Error al cargar los productos");
      }
    };

    fetchProducts();
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
      <h1 className="text-3xl font-bold mb-6">Nuestras Cervezas</h1>
    </div>
  );
}
