"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Calendar, Clock, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

// Tipos
interface Order {
  id: string
  customer: {
    name: string
    email: string
  }
  items: {
    name: string
    quantity: number
  }[]
  total: number
}

// Datos simulados
const mockOrders: Record<string, Order> = {
  "ORD-5523": {
    id: "ORD-5523",
    customer: {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
    },
    items: [
      { name: "Luna Dorada", quantity: 2 },
      { name: "Luna Roja", quantity: 1 },
    ],
    total: 12500,
  },
  "ORD-5522": {
    id: "ORD-5522",
    customer: {
      name: "María García",
      email: "maria.garcia@example.com",
    },
    items: [{ name: "Plan Estándar", quantity: 1 }],
    total: 8200,
  },
  "ORD-5521": {
    id: "ORD-5521",
    customer: {
      name: "Carlos López",
      email: "carlos.lopez@example.com",
    },
    items: [{ name: "Luna Brillante", quantity: 1 }],
    total: 5400,
  },
  "ORD-5520": {
    id: "ORD-5520",
    customer: {
      name: "Ana Martínez",
      email: "ana.martinez@example.com",
    },
    items: [
      { name: "Luna Dorada", quantity: 1 },
      { name: "Luna Roja", quantity: 1 },
      { name: "Luna Especial", quantity: 1 },
    ],
    total: 9800,
  },
}

// Rangos horarios disponibles
const timeRanges = [
  { id: "10-12", label: "10:00 - 12:00", available: true },
  { id: "12-14", label: "12:00 - 14:00", available: true },
  { id: "14-16", label: "14:00 - 16:00", available: true },
  { id: "16-18", label: "16:00 - 18:00", available: true },
  { id: "18-20", label: "18:00 - 20:00", available: true },
]

// Días disponibles
const availableDays = [
  { id: "today", label: "Hoy", date: "15 May, 2025", default: true },
  { id: "tomorrow", label: "Mañana", date: "16 May, 2025", default: false },
  { id: "day-after", label: "Pasado mañana", date: "17 May, 2025", default: false },
  { id: "monday", label: "Lunes", date: "19 May, 2025", default: false },
  { id: "tuesday", label: "Martes", date: "20 May, 2025", default: false },
]

export default function DeliveryTimePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [selectedDay, setSelectedDay] = useState(availableDays.find((day) => day.default)?.id || "today")
  const [selectedTimeRange, setSelectedTimeRange] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // En una implementación real, aquí se cargarían los datos del pedido desde una API
    const orderId = params.id as string
    const orderData = mockOrders[orderId]

    if (orderData) {
      setOrder(orderData)
    }
  }, [params.id])

  const handleSubmit = () => {
    if (!selectedTimeRange || !selectedDay) {
      toast({
        title: "Error",
        description: "Por favor selecciona un día y un rango horario",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulamos una llamada a la API
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)

      toast({
        title: "¡Horario confirmado!",
        description: "Hemos registrado tu preferencia de horario de entrega",
      })
    }, 1500)
  }

  if (isSuccess) {
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
          </div>
        </header>

        <main className="flex-1 py-10">
          <div className="container max-w-md mx-auto">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">¡Horario confirmado!</h1>
              <p className="text-muted-foreground">
                Hemos registrado tu preferencia de horario de entrega para tu pedido #{order?.id}.
              </p>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mt-6 text-left">
                <h3 className="font-medium text-amber-800">Detalles de la entrega</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-amber-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Fecha de entrega</p>
                      <p className="text-sm text-muted-foreground">
                        {availableDays.find((day) => day.id === selectedDay)?.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Horario</p>
                      <p className="text-sm text-muted-foreground">
                        {timeRanges.find((time) => time.id === selectedTimeRange)?.label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                Te enviaremos un email de confirmación con estos detalles. Si necesitas hacer algún cambio, por favor
                contáctanos al +54 223 555-1234.
              </p>

              <Button asChild className="mt-4 rounded-full bg-amber-600 hover:bg-amber-700">
                <Link href="/">Volver al inicio</Link>
              </Button>
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
            <Link href="/" className="text-sm font-medium flex items-center gap-1 hover:text-amber-600">
              <ChevronLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="container max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Selecciona tu horario de entrega</h1>
            <p className="text-muted-foreground mt-1">
              Elige el día y horario que mejor te convenga para recibir tu pedido
            </p>
          </div>

          {!order ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">Cargando información del pedido...</h3>
              <p className="mt-2 text-sm text-muted-foreground">Por favor espera un momento.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del pedido #{order.id}</CardTitle>
                  <CardDescription>Pedido realizado por {order.customer.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Productos</h3>
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="text-sm flex justify-between">
                            <span>
                              {item.name} x{item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">${order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertTitle className="text-amber-800">Envío gratuito</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Recuerda que todos nuestros envíos son GRATIS en Mar del Plata. Acercamos la cerveza a tu casa sin
                  cargo adicional.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Elige tu horario preferido</CardTitle>
                  <CardDescription>
                    Selecciona el día y rango horario que mejor te convenga para recibir tu pedido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Día de entrega</h3>
                    <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
                      <TabsList className="grid grid-cols-3 md:grid-cols-5 h-auto">
                        {availableDays.map((day) => (
                          <TabsTrigger key={day.id} value={day.id} className="text-xs md:text-sm py-2">
                            {day.label}
                            <span className="hidden md:inline ml-1">({day.date.split(",")[0]})</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {availableDays.map((day) => (
                        <TabsContent key={day.id} value={day.id} className="pt-4">
                          <div className="text-sm text-muted-foreground mb-4">
                            Horarios disponibles para el {day.date}:
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Rango horario</h3>
                    <RadioGroup value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {timeRanges.map((time) => (
                          <div key={time.id}>
                            <RadioGroupItem
                              value={time.id}
                              id={time.id}
                              className="peer sr-only"
                              disabled={!time.available}
                            />
                            <Label
                              htmlFor={time.id}
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-600 peer-data-[state=checked]:bg-amber-50 [&:has([data-state=checked])]:border-amber-600 [&:has([data-state=checked])]:bg-amber-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span>{time.label}</span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/">Cancelar</Link>
                  </Button>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={handleSubmit}
                    disabled={!selectedTimeRange || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Confirmando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Confirmar horario
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
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
