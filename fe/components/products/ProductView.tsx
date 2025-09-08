"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Truck,
  Shield,
  Star,
} from "lucide-react";

interface ProductViewProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    type?: string;
    alcoholContent?: number;
    volume?: number;
    ingredients?: string[];
    stock?: number;
    category?: string;
  };
}

export default function ProductView({ product }: ProductViewProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "/placeholder.jpg",
      type: "beer",
      quantity,
    };

    // Obtener carrito actual del localStorage
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    
    // Buscar si el producto ya existe en el carrito
    const existingProductIndex = currentCart.findIndex(
      (item: any) => item.id === product.id && item.type === "beer"
    );

    if (existingProductIndex !== -1) {
      // Si existe, actualizar cantidad
      currentCart[existingProductIndex].quantity += quantity;
    } else {
      // Si no existe, agregar nuevo producto
      currentCart.push(productData);
    }

    // Guardar en localStorage
    localStorage.setItem("cart", JSON.stringify(currentCart));

    // Redirigir al checkout
    router.push(`/checkout?product=${product.id}&type=beer`);
  };

  const incrementQuantity = () => {
    if (product.stock && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else if (!product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container py-6">
        {/* Botón de regreso */}
        <Button
          variant="ghost"
          className="mb-6 text-amber-800 hover:bg-amber-100"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagen del producto */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-amber-200">
              <CardContent className="p-0">
                <div className="aspect-square relative bg-white">
                  <Image
                    src={product.image || "/placeholder.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.category && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {product.category}
                  </Badge>
                )}
                {product.stock !== undefined && product.stock > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    En stock
                  </Badge>
                )}
                {product.stock !== undefined && product.stock === 0 && (
                  <Badge variant="destructive">
                    Sin stock
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {product.type && (
                <p className="text-lg text-gray-600 capitalize">{product.type}</p>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Especificaciones */}
            {(product.alcoholContent || product.volume) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Especificaciones</h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.alcoholContent && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">
                        <strong>Alcohol:</strong> {product.alcoholContent}%
                      </span>
                    </div>
                  )}
                  {product.volume && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">
                        <strong>Volumen:</strong> {product.volume}ml
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ingredientes */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Ingredientes</h3>
                <p className="text-gray-600">{product.ingredients.join(", ")}</p>
              </div>
            )}

            <Separator />

            {/* Precio y compra */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-amber-800">
                  {formatPrice(product.price)}
                </span>
                {product.stock !== undefined && (
                  <span className="text-sm text-gray-500">
                    {product.stock} disponibles
                  </span>
                )}
              </div>

              {/* Selector de cantidad */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Cantidad:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-1 text-center min-w-[3rem]">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    disabled={product.stock ? quantity >= product.stock : false}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-amber-800">
                  {formatPrice(product.price * quantity)}
                </span>
              </div>

              {/* Botón de compra */}
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock === 0 ? "Sin stock" : "Agregar al carrito"}
              </Button>
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="text-sm">Envío gratis en pedidos superiores a $15.000</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Garantía de calidad Luna Brew House</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Producto artesanal premium</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
