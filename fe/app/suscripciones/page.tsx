"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Check, Truck, Calendar, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

// Tipos
interface Subscription {
  id: string
  name: string
  beerType: string
  beerName: string
  image: string
  liters: number
  price: number
  nextDelivery: string
  status: "active" | "paused" | "cancelled"
  deliveries: {
    date: string
    status: "delivered" | "pending" | "processing"
  }[]
}

// Datos de ejemplo
const mockSubscriptions: Subscription[] = [
  {
    id: "SUB-2023-001",
    name: "Plan Estándar",
    beerType: "Golden Ale",
    beerName: "Luna Dorada",
    image: "/images/golden-ale.png",
    liters: 8,
    price: 22400,
    nextDelivery: "15 de junio, 2023",
    status: "active",
    deliveries: [
      {
        date: "15 de mayo, 2023",
        status: "delivered",
      },
      {
        date: "15 de abril, 2023",
        status: "delivered",
      },
      {
        date: "15 de marzo, 2023",
        status: "delivered",
      },
    ],
  },
  {
    id: "SUB-2023-002",
    name: "Plan Premium",
    beerType: "IPA",
    beerName: "Luna Brillante",
    image: "/images/ipa.png",
    liters: 16,
    price: 64000,
    nextDelivery: "20 de junio, 2023",
    status: "paused",
    deliveries: [
      {
        date: "20 de mayo, 2023",
        status: "delivered",
      },
      {
        date: "20 de abril, 2023",
        status: "delivered",
      },
    ],
  },
]

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image src="/images/luna-logo.png" alt="Luna logo" width={40} height={40} className="object-cover" />
              </div>
              <span className="text-xl font-bold">Luna Brew House</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/perfil" className="text-sm font-medium flex items-center gap-1 hover:text-amber-600">
              <ChevronLeft className="h-4 w-4" />
              Volver a mi perfil
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Mis Suscripciones</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus suscripciones mensuales</p>
          </div>

          <div className="mb-6">
            <Alert className="bg-amber-50 border-amber-200">
              <Truck className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <span className="font-bold">¡Envío GRATIS!</span> Todas tus suscripciones incluyen entrega a domicilio
                sin cargo adicional en Mar del Plata.
              </AlertDescription>
            </Alert>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="active">Activas</TabsTrigger>
              <TabsTrigger value="paused">Pausadas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-8">
              {mockSubscriptions.filter((sub) => sub.status === "active").length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No tienes suscripciones activas</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Suscríbete a nuestro Club Luna y recibe tu cerveza favorita cada mes con un 20% de descuento.
                  </p>
                  <Button asChild className="mt-6 rounded-full bg-amber-600 hover:bg-amber-700">
                    <Link href="/#suscripciones">Ver planes</Link>
                  </Button>
                </div>
              ) : (
                mockSubscriptions
                  .filter((sub) => sub.status === "active")
                  .map((subscription) => <SubscriptionCard key={subscription.id} subscription={subscription} />)
              )}
            </TabsContent>

            <TabsContent value="paused" className="space-y-8">
              {mockSubscriptions.filter((sub) => sub.status === "paused").length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No tienes suscripciones pausadas</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Todas tus suscripciones están activas o no tienes ninguna suscripción.
                  </p>
                  <Button asChild className="mt-6 rounded-full bg-amber-600 hover:bg-amber-700">
                    <Link href="/#suscripciones">Ver planes</Link>
                  </Button>
                </div>
              ) : (
                mockSubscriptions
                  .filter((sub) => sub.status === "paused")
                  .map((subscription) => <SubscriptionCard key={subscription.id} subscription={subscription} />)
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-8">
              {mockSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No tienes suscripciones</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Suscríbete a nuestro Club Luna y recibe tu cerveza favorita cada mes con un 20% de descuento.
                  </p>
                  <Button asChild className="mt-6 rounded-full bg-amber-600 hover:bg-amber-700">
                    <Link href="/#suscripciones">Ver planes</Link>
                  </Button>
                </div>
              ) : (
                mockSubscriptions.map((subscription) => (
                  <SubscriptionCard key={subscription.id} subscription={subscription} />
                ))
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>¿Por qué suscribirte a Club Luna?</CardTitle>
                <CardDescription>Beneficios exclusivos para miembros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-bold">Ahorro garantizado</h3>
                    <p className="text-sm text-muted-foreground">
                      Obtén un 20% de descuento en todas tus cervezas favoritas con tu suscripción mensual.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-bold">Envío gratuito</h3>
                    <p className="text-sm text-muted-foreground">
                      Todas las suscripciones incluyen entrega a domicilio sin cargo adicional en Mar del Plata.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-bold">Botella especial gratis</h3>
                    <p className="text-sm text-muted-foreground">
                      Recibe una botella de nuestra edición especial de temporada completamente gratis cada mes.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="rounded-full bg-amber-600 hover:bg-amber-700">
                  <Link href="/#suscripciones">Ver planes disponibles</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t bg-amber-900/5 mt-16">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image src="/images/luna-logo.png" alt="Luna logo" width={32} height={32} className="object-cover" />
              </div>
              <span className="text-lg font-bold">Luna Brew House</span>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Luna Brew House. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Componente para mostrar una suscripción
function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const [expanded, setExpanded] = useState(false)

  // Obtener el color del badge según el estado
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "paused":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pending":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "processing":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activa"
      case "paused":
        return "Pausada"
      case "cancelled":
        return "Cancelada"
      case "delivered":
        return "Entregado"
      case "pending":
        return "Pendiente"
      case "processing":
        return "En proceso"
      default:
        return "Desconocido"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {subscription.name} - {subscription.beerName}
              <Badge className={`ml-2 ${getStatusBadgeColor(subscription.status)}`}>
                {getStatusText(subscription.status)}
              </Badge>
            </CardTitle>
            <CardDescription>Suscripción #{subscription.id}</CardDescription>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">${subscription.price}/mes</p>
            <p className="text-xs text-amber-700 font-medium">{subscription.liters} litros por mes</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="sm:w-1/3">
            <div className="relative h-40 rounded-lg overflow-hidden">
              <Image
                src={subscription.image || "/placeholder.svg"}
                alt={subscription.beerName}
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="sm:w-2/3 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Próxima entrega</p>
                <p className="text-sm text-muted-foreground">{subscription.nextDelivery}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Detalles</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.liters} litros de {subscription.beerName} ({subscription.beerType})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Truck className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Envío</p>
                <p className="text-sm text-muted-foreground">
                  <span className="text-green-600 font-medium">GRATIS</span> - Entrega a domicilio en Mar del Plata
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de entregas */}
        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 -ml-2 mb-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ocultar historial" : "Ver historial de entregas"}
          </Button>

          {expanded && (
            <div className="mt-2 space-y-3">
              <Separator />
              <h4 className="text-sm font-medium mt-4">Historial de entregas</h4>
              <div className="space-y-3">
                {subscription.deliveries.map((delivery, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <p className="text-sm">{delivery.date}</p>
                    <Badge className={getStatusBadgeColor(delivery.status)}>{getStatusText(delivery.status)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-3">
        {subscription.status === "active" ? (
          <>
            <Button variant="outline" size="sm" className="rounded-full">
              Pausar suscripción
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
            >
              Cambiar variedad
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="rounded-full">
              Cancelar suscripción
            </Button>
            <Button size="sm" className="rounded-full bg-amber-600 hover:bg-amber-700">
              Reactivar suscripción
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
