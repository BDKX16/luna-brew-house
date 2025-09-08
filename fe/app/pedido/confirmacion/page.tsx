"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Package, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src="/placeholder-logo.png"
                alt="Luna logo"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold">Luna Brew House</span>
          </Link>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/70 backdrop-blur-sm border-green-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                ¡Pago confirmado!
              </CardTitle>
              <p className="text-green-600">
                Tu pedido ha sido procesado exitosamente
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Recibirás un correo electrónico con los detalles de tu pedido
                  y el número de seguimiento en breve.
                </p>
                <p className="text-sm text-gray-500">
                  Tiempo estimado de entrega: 24-48 horas
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  <Link href="/perfil/pedidos">
                    <Package className="h-4 w-4 mr-2" />
                    Ver mis pedidos
                  </Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/productos">
                    <Package className="h-4 w-4 mr-2" />
                    Continuar comprando
                  </Link>
                </Button>

                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Volver al inicio
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
