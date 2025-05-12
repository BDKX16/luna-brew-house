"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Package, Truck, Home, CheckCircle, Clock, Calendar, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Tipos
type OrderStatus = "procesando" | "preparando" | "en_camino" | "entregado" | "cancelado"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  type: "beer" | "subscription"
  image: string
}

interface Order {
  id: string
  date: string
  status: OrderStatus
  total: number
  items: OrderItem[]
  estimatedDelivery?: string
  address: string
  trackingSteps: {
    status: string
    date: string
    completed: boolean
    current: boolean
  }[]
}

// Datos de ejemplo
const mockOrders: Order[] = [
  {
    id: "ORD-2023-001",
    date: "2023-05-10T14:30:00",
    status: "entregado",
    total: 15000,
    items: [
      {
        id: "beer-1",
        name: "Luna Dorada",
        quantity: 2,
        price: 3500,
        type: "beer",
        image: "/images/golden-ale.png",
      },
      {
        id: "beer-2",
        name: "Luna Roja",
        quantity: 1,
        price: 4500,
        type: "beer",
        image: "/images/red-ale.png",
      },
      {
        id: "beer-3",
        name: "Luna Brillante",
        quantity: 1,
        price: 5000,
        type: "beer",
        image: "/images/ipa.png",
      },
    ],
    address: "Av. Constitución 1234, Mar del Plata",
    trackingSteps: [
      {
        status: "Pedido recibido",
        date: "10 May, 14:30",
        completed: true,
        current: false,
      },
      {
        status: "Preparando pedido",
        date: "10 May, 15:45",
        completed: true,
        current: false,
      },
      {
        status: "En camino",
        date: "10 May, 17:20",
        completed: true,
        current: false,
      },
      {
        status: "Entregado",
        date: "10 May, 18:45",
        completed: true,
        current: false,
      },
    ],
  },
  {
    id: "ORD-2023-002",
    date: "2023-05-15T10:15:00",
    status: "en_camino",
    total: 28000,
    estimatedDelivery: "Hoy, entre 17:00 y 19:00",
    items: [
      {
        id: "sub-1",
        name: "Plan Estándar - Luna Dorada",
        quantity: 1,
        price: 28000,
        type: "subscription",
        image: "/images/golden-ale.png",
      },
    ],
    address: "Av. Colón 5678, Mar del Plata",
    trackingSteps: [
      {
        status: "Pedido recibido",
        date: "15 May, 10:15",
        completed: true,
        current: false,
      },
      {
        status: "Preparando pedido",
        date: "15 May, 11:30",
        completed: true,
        current: false,
      },
      {
        status: "En camino",
        date: "15 May, 14:45",
        completed: true,
        current: true,
      },
      {
        status: "Entregado",
        date: "Pendiente",
        completed: false,
        current: false,
      },
    ],
  },
  {
    id: "ORD-2023-003",
    date: "2023-05-18T16:20:00",
    status: "preparando",
    total: 12500,
    estimatedDelivery: "Mañana, entre 14:00 y 16:00",
    items: [
      {
        id: "beer-1",
        name: "Luna Dorada",
        quantity: 1,
        price: 3500,
        type: "beer",
        image: "/images/golden-ale.png",
      },
      {
        id: "beer-3",
        name: "Luna Brillante",
        quantity: 1,
        price: 5000,
        type: "beer",
        image: "/images/ipa.png",
      },
      {
        id: "beer-4",
        name: "Luna Especial",
        quantity: 1,
        price: 4000,
        type: "beer",
        image: "/images/special-edition.png",
      },
    ],
    address: "Av. Independencia 789, Mar del Plata",
    trackingSteps: [
      {
        status: "Pedido recibido",
        date: "18 May, 16:20",
        completed: true,
        current: false,
      },
      {
        status: "Preparando pedido",
        date: "18 May, 17:45",
        completed: true,
        current: true,
      },
      {
        status: "En camino",
        date: "Pendiente",
        completed: false,
        current: false,
      },
      {
        status: "Entregado",
        date: "Pendiente",
        completed: false,
        current: false,
      },
    ],
  },
]

// Función para obtener el color del badge según el estado
const getStatusBadgeColor = (status: OrderStatus) => {
  switch (status) {
    case "procesando":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "preparando":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "en_camino":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100"
    case "entregado":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "cancelado":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

// Función para obtener el texto del estado
const getStatusText = (status: OrderStatus) => {
  switch (status) {
    case "procesando":
      return "Procesando"
    case "preparando":
      return "Preparando"
    case "en_camino":
      return "En camino"
    case "entregado":
      return "Entregado"
    case "cancelado":
      return "Cancelado"
    default:
      return "Desconocido"
  }
}

// Función para obtener el icono del estado
const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case "procesando":
      return <Clock className="h-4 w-4" />
    case "preparando":
      return <Package className="h-4 w-4" />
    case "en_camino":
      return <Truck className="h-4 w-4" />
    case "entregado":
      return <CheckCircle className="h-4 w-4" />
    case "cancelado":
      return <Clock className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const router = useRouter()

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = () => {
      const fakeAuth = localStorage.getItem("isLoggedIn") === "true"
      setIsLoggedIn(fakeAuth)

      if (!fakeAuth) {
        router.push("/auth/login")
      } else {
        // Cargar pedidos de ejemplo
        setOrders(mockOrders)
        setFilteredOrders(mockOrders)
      }
    }

    checkAuth()
  }, [router])

  // Filtrar pedidos
  useEffect(() => {
    let result = [...orders]

    // Filtrar por estado
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredOrders(result)
  }, [orders, statusFilter, searchTerm])

  // Obtener pedidos pendientes
  const pendingOrders = filteredOrders.filter((order) => order.status !== "entregado" && order.status !== "cancelado")

  // Obtener pedidos completados
  const completedOrders = filteredOrders.filter((order) => order.status === "entregado" || order.status === "cancelado")

  if (!isLoggedIn) {
    return null // No renderizar nada si no está autenticado
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
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus pedidos y suscripciones</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Usuario Luna</CardTitle>
                    <CardDescription>usuario@example.com</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <Link
                      href="/perfil"
                      className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-900 transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      <span>Mis Pedidos</span>
                    </Link>
                    <Link
                      href="/suscripciones"
                      className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Mis Suscripciones</span>
                    </Link>
                    <Link
                      href="/perfil/datos"
                      className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      <span>Mis Datos</span>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Envíos a domicilio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <Alert className="bg-amber-50 border-amber-200">
                      <Truck className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-xs">
                        Todos nuestros envíos son <span className="font-bold">GRATIS</span> en Mar del Plata.
                      </AlertDescription>
                    </Alert>
                    <p className="text-muted-foreground text-xs">
                      Acercamos la cerveza a tu casa sin cargo adicional. Realizamos entregas de lunes a sábados de
                      14:00 a 20:00 hs.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Pedidos</CardTitle>
                  <CardDescription>Historial de tus compras y estado de tus pedidos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar pedidos..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los pedidos</SelectItem>
                        <SelectItem value="procesando">Procesando</SelectItem>
                        <SelectItem value="preparando">Preparando</SelectItem>
                        <SelectItem value="en_camino">En camino</SelectItem>
                        <SelectItem value="entregado">Entregados</SelectItem>
                        <SelectItem value="cancelado">Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="pending" className="relative">
                        Pendientes
                        {pendingOrders.length > 0 && (
                          <Badge className="ml-2 bg-amber-600 hover:bg-amber-700">{pendingOrders.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="completed">Completados</TabsTrigger>
                    </TabsList>

                    {/* Pedidos pendientes */}
                    <TabsContent value="pending" className="mt-6 space-y-6">
                      {pendingOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <h3 className="mt-4 text-lg font-medium">No tienes pedidos pendientes</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Todos tus pedidos han sido entregados o aún no has realizado ninguno.
                          </p>
                          <Button asChild className="mt-6 rounded-full bg-amber-600 hover:bg-amber-700">
                            <Link href="/#cervezas">Explorar cervezas</Link>
                          </Button>
                        </div>
                      ) : (
                        pendingOrders.map((order) => <OrderCard key={order.id} order={order} />)
                      )}
                    </TabsContent>

                    {/* Pedidos completados */}
                    <TabsContent value="completed" className="mt-6 space-y-6">
                      {completedOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <h3 className="mt-4 text-lg font-medium">No tienes pedidos completados</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Aún no has recibido ningún pedido o no has realizado ninguno.
                          </p>
                          <Button asChild className="mt-6 rounded-full bg-amber-600 hover:bg-amber-700">
                            <Link href="/#cervezas">Explorar cervezas</Link>
                          </Button>
                        </div>
                      ) : (
                        completedOrders.map((order) => <OrderCard key={order.id} order={order} />)
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
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

// Componente para mostrar un pedido
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const formattedDate = new Date(order.date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Pedido #{order.id}
              <Badge className={`ml-2 ${getStatusBadgeColor(order.status)}`}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </span>
              </Badge>
            </CardTitle>
            <CardDescription>Realizado el {formattedDate}</CardDescription>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">${order.total}</p>
            {order.estimatedDelivery && (
              <p className="text-xs text-amber-700 font-medium">Entrega estimada: {order.estimatedDelivery}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Timeline de seguimiento */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-4">Seguimiento del pedido</h4>
          <div className="relative flex">
            {order.trackingSteps.map((step, index) => (
              <div key={index} className="flex-1 relative">
                {/* Línea de conexión */}
                {index < order.trackingSteps.length - 1 && (
                  <div
                    className={`absolute top-3 left-3 right-0 h-0.5 ${step.completed ? "bg-amber-500" : "bg-gray-200"}`}
                  ></div>
                )}

                {/* Círculo de estado */}
                <div className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.current
                        ? "bg-amber-500 ring-4 ring-amber-100"
                        : step.completed
                          ? "bg-amber-500"
                          : "bg-gray-200"
                    }`}
                  >
                    {step.completed && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <p className="text-xs mt-2 text-center font-medium">{step.status}</p>
                  <p className="text-xs text-muted-foreground text-center">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dirección de entrega */}
        <div className="mb-4">
          <div className="flex items-start gap-2">
            <Home className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Dirección de entrega</p>
              <p className="text-sm text-muted-foreground">{order.address}</p>
            </div>
          </div>
        </div>

        {/* Resumen de productos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="relative w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-xs font-medium text-amber-800">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos" : "Ver detalles"}
          </Button>
        </div>

        {/* Detalles expandidos */}
        {expanded && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Productos</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x ${item.price} = ${item.quantity * item.price}
                    </p>
                  </div>
                  <Badge
                    className={
                      item.type === "subscription"
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }
                  >
                    {item.type === "subscription" ? "Suscripción" : "Cerveza"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-3">
        <Button variant="outline" size="sm" className="rounded-full">
          Contactar soporte
        </Button>
        {order.status !== "entregado" && order.status !== "cancelado" && (
          <Button size="sm" className="rounded-full bg-amber-600 hover:bg-amber-700">
            Seguir pedido
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
