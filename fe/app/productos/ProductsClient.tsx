"use client";

import { useEffect, useState } from "react";
import { getBeers } from "@/services/public";
import LoadingSpinner from "@/components/ui/loading-spinner";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";

export default function ProductsClient() {
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
  }, [callEndpoint]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-3">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">
                  ${product.price}
                </span>
                <span className="text-sm text-gray-500">
                  {product.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && !loading && !error && (
        <div className="text-center text-gray-500 py-8">
          <p>No hay productos disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
}
