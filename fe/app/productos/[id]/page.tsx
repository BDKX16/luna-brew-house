"use client";

import { useEffect, useState } from "react";
import { getBeerById } from "@/services/public";
import ProductView from "@/components/products/ProductView";
import LoadingSpinner from "@/components/ui/loading-spinner";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { loading, callEndpoint } = useFetchAndLoad();

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await callEndpoint(getBeerById(params.id));
        if (response && response.data) {
          setProduct(response.data);
        } else {
          setError("No se pudo cargar la información del producto");
        }
      } catch (err: any) {
        console.error("Error al cargar producto:", err);
        setError(err.message || "Error al cargar el producto");
      }
    };

    fetchProductData();
  }, [params.id, callEndpoint]);

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

  if (!product) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl">Producto no encontrado</h2>
      </div>
    );
  }

  return <ProductView product={product} />;
}
