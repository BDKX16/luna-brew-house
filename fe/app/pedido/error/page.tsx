"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { XCircle, RotateCcw, Home, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
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
          <Card className="bg-white/70 backdrop-blur-sm border-red-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                Error en el pago
              </CardTitle>
              <p className="text-red-600">No se pudo procesar tu pago</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Hubo un problema al procesar tu pago. Esto puede deberse a:
                </p>
                <ul className="text-sm text-gray-500 space-y-1 text-left max-w-md mx-auto">
                  <li>• Fondos insuficientes</li>
                  <li>• Datos de tarjeta incorrectos</li>
                  <li>• Problemas temporales del proveedor de pagos</li>
                  <li>• Cancelación del pago</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  <Link href="/checkout">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Intentar nuevamente
                  </Link>
                </Button>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/productos">
                    <CreditCard className="h-4 w-4 mr-2" />
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
