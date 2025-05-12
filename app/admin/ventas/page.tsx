"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
import {
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
  Mail,
  Calendar,
  Clock12,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

// Tipos
interface Order {
  id: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  date: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  items: OrderItem[]
  paymentMethod: string
  deliveryTime?: {
    date: string
    timeRange: string
  }
  customerSelectedTime?: boolean
}

interface OrderItem {
  id: string
  name: string
  type: string
  price: number
  quantity: number
}

// Datos simulados
const orders: Order[] = [
  {
    id: "ORD-5523",
    customer: {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      phone: "+54 223 555-1234",
      address: "Av. Colón 1234, Mar del Plata, Argentina",
    },
    date: "12 May, 2025",
    status: "delivered",
    total: 12500,
    items: [
      { id: "beer-golden", name: "Luna Dorada", type: "Golden Ale", price: 3500, quantity: 2 },
      { id: "beer-red", name: "Luna Roja", type: "Irish Red Ale", price: 4500, quantity: 1 },
    ],
    paymentMethod: "Mercado Pago",
    deliveryTime: {
      date: "13 May, 2025",
      timeRange: "16:00 - 18:00",
    },
    customerSelectedTime: true,
  },
  {
    id: "ORD-5522",
    customer: {
      name: "María García",
      email: "maria.garcia@example.com",
      phone: "+54 223 555-5678",
      address: "Av. Independencia 567, Mar del Plata, Argentina",
    },
    date: "11 May, 2025",
    status: "processing",
    total: 8200,
    items: [{ id: "sub-standard", name: "Plan Estándar", type: "Suscripción", price: 22400, quantity: 1 }],
    paymentMethod: "Mercado Pago",
    deliveryTime: {
      date: "12 May, 2025",
      timeRange: "14:00 - 16:00",
    },
    customerSelectedTime: false,
  },
  {
    id: "ORD-5521",
    customer: {
      name: "Carlos López",
      email: "carlos.lopez@example.com",
      phone: "+54 223 555-9012",
      address: "Av. Constitución 890, Mar del Plata, Argentina",
    },
    date: "10 May, 2025",
    status: "shipped",
    total: 5400,
    items: [{ id: "beer-ipa", name: "Luna Brillante", type: "IPA", price: 5000, quantity: 1 }],
    paymentMethod: "Transferencia Bancaria",
    deliveryTime: {
      date: "11 May, 2025",
      timeRange: "18:00 - 20:00",
    },
    customerSelectedTime: true,
  },
  {
    id: "ORD-5520",
    customer: {
      name: "Ana Martínez",
      email: "ana.martinez@example.com",
      phone: "+54 223 555-3456",
      address: "Av. Luro 456, Mar del Plata, Argentina",
    },
    date: "10 May, 2025",
    status: "pending",
    total: 9800,
    items: [
      { id: "beer-golden", name: "Luna Dorada", type: "Golden Ale", price: 3500, quantity: 1 },
      { id: "beer-red", name: "Luna Roja", type: "Irish Red Ale", price: 4500, quantity: 1 },
      { id: "beer-special", name: "Luna Especial", type: "Edición Limitada", price: 6500, quantity: 1 },
    ],
    paymentMethod: "Mercado Pago",
  },
  {
    id: "ORD-5519",
    customer: {
      name: "Roberto Sánchez",
      email: "roberto.sanchez@example.com",
      phone: "+54 223 555-7890",
      address: "Av. Juan B. Justo 789, Mar del Plata, Argentina",
    },
    date: "09 May, 2025",
    status: "cancelled",
    total: 4500,
    items: [{ id: "beer-red", name: "Luna Roja", type: "Irish Red Ale", price: 4500, quantity: 1 }],
    paymentMethod: "Mercado Pago",
  },
  {
    id: "ORD-5518",
    customer: {
      name: "Laura Gómez",
      email: "laura.gomez@example.com",
      phone: "+54 223 555-2345",
      address: "Av. Libertad 234, Mar del Plata, Argentina",
    },
    date: "08 May, 2025",
    status: "delivered",
    total: 44800,
    items: [{ id: "sub-premium", name: "Plan Premium", type: "Suscripción", price: 44800, quantity: 1 }],
    paymentMethod: "Transferencia Bancaria",
    deliveryTime: {
      date: "09 May, 2025",
      timeRange: "14:00 - 16:00",
    },
    customerSelectedTime: false,
  },
  {
    id: "ORD-5517",
    customer: {
      name: "Diego Fernández",
      email: "diego.fernandez@example.com",
      phone: "+54 223 555-6789",
      address: "Av. Champagnat 678, Mar del Plata, Argentina",
    },
    date: "07 May, 2025",
    status: "delivered",
    total: 11200,
    items: [{ id: "sub-basic", name: "Plan Básico", type: "Suscripción", price: 11200, quantity: 1 }],
    paymentMethod: "Mercado Pago",
    deliveryTime: {
      date: "08 May, 2025",
      timeRange: "16:00 - 18:00",
    },
    customerSelectedTime: true,
  },
]

export default function VentasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [ordersList, setOrdersList] = useState<Order[]>(orders)
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliveryTimeRange, setDeliveryTimeRange] = useState("")

  // Filtrar y ordenar pedidos
  const filteredOrders = ordersList
    .filter(
      (order) =>
        (statusFilter === "all" || order.status === statusFilter) &&
        (order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      // Convertir fechas a objetos Date para comparación
      const dateA = new Date(a.date.split(", ")[0] + ", " + a.date.split(", ")[1])
      const dateB = new Date(b.date.split(", ")[0] + ", " + b.date.split(", ")[1])

      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    })

  // Estadísticas de pedidos
  const totalSales = ordersList.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = ordersList.filter((order) => order.status === "pending").length
  const processingOrders = ordersList.filter((order) => order.status === "processing").length
  const shippedOrders = ordersList.filter((order) => order.status === "shipped").length
  const deliveredOrders = ordersList.filter((order) => order.status === "delivered").length
  const cancelledOrders = ordersList.filter((order) => order.status === "cancelled").length

  // Función para renderizar el badge de estado
  const renderStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
            Pendiente
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            Procesando
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">
            Enviado
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            Entregado
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  // Función para establecer el horario de entrega
  const handleSetDeliveryTime = () => {
    if (!selectedOrder || !deliveryDate || !deliveryTimeRange) return

    const updatedOrders = ordersList.map((order) => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          deliveryTime: {
            date: deliveryDate,
            timeRange: deliveryTimeRange,
          },
          customerSelectedTime: false,
        }
      }
      return order
    })

    setOrdersList(updatedOrders)
    setIsDeliveryDialogOpen(false)
    toast({
      title: "Horario de entrega establecido",
      description: `Se ha programado la entrega para el ${deliveryDate} entre ${deliveryTimeRange}`,
    })
  }

  // Función para enviar email al cliente
  const handleSendEmail = () => {
    if (!selectedOrder) return

    // En una implementación real, aquí se enviaría el email
    // Para esta simulación, solo mostraremos un mensaje de éxito
    toast({
      title: "Email enviado",
      description: `Se ha enviado un email a ${selectedOrder.customer.email} para que seleccione su horario de entrega preferido`,
    })
    setIsEmailDialogOpen(false)
  }

  // Función para cambiar el estado del pedido
  const handleChangeStatus = (orderId: string, newStatus: Order["status"]) => {
    const updatedOrders = ordersList.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
        }
      }
      return order
    })

    setOrdersList(updatedOrders)
    toast({
      title: "Estado actualizado",
      description: `El pedido ${orderId} ha sido actualizado a "${
        newStatus === "pending"
          ? "Pendiente"
          : newStatus === "processing"
            ? "Procesando"
            : newStatus === "shipped"
              ? "Enviado"
              : newStatus === "delivered"
                ? "Entregado"
                : "Cancelado"
      }"`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas y Pedidos</h1>
          <p className="text-muted-foreground">Gestiona y visualiza todos los pedidos de Luna Brew House.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="text-2xl font-bold">{processingOrders + shippedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div className="text-2xl font-bold">{deliveredOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div className="text-2xl font-bold">{cancelledOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ID, cliente o email..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Estado</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="processing">Procesando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No se encontraron pedidos
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{order.customer.name}</span>
                      <span className="text-sm text-muted-foreground">{order.customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{renderStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.deliveryTime ? (
                      <div className="flex flex-col">
                        <span className="text-sm">{order.deliveryTime.date}</span>
                        <span className="text-xs text-muted-foreground">{order.deliveryTime.timeRange}</span>
                        {order.customerSelectedTime && (
                          <Badge className="mt-1 bg-amber-100 text-amber-800 hover:bg-amber-100 w-fit">
                            Elegido por cliente
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No programada</span>
                    )}
                  </TableCell>
                  <TableCell>${order.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="whitespace-nowrap"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Detalles del Pedido {selectedOrder?.id}</DialogTitle>
                            <DialogDescription>Información completa del pedido y su estado actual.</DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-6 py-4">
                              <Tabs defaultValue="details">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="details">Detalles</TabsTrigger>
                                  <TabsTrigger value="customer">Cliente</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="space-y-4 pt-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h3 className="font-medium">Estado del pedido</h3>
                                      <div className="mt-1">{renderStatusBadge(selectedOrder.status)}</div>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Fecha</h3>
                                      <p className="text-muted-foreground">{selectedOrder.date}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Método de pago</h3>
                                      <p className="text-muted-foreground">{selectedOrder.paymentMethod}</p>
                                    </div>
                                  </div>

                                  {/* Información de entrega */}
                                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-medium flex items-center gap-2">
                                          <Clock12 className="h-4 w-4 text-amber-600" />
                                          Horario de entrega
                                        </h3>
                                        {selectedOrder.deliveryTime ? (
                                          <div className="mt-1">
                                            <p className="text-sm">
                                              <span className="font-medium">Fecha:</span>{" "}
                                              {selectedOrder.deliveryTime.date}
                                            </p>
                                            <p className="text-sm">
                                              <span className="font-medium">Horario:</span>{" "}
                                              {selectedOrder.deliveryTime.timeRange}
                                            </p>
                                            {selectedOrder.customerSelectedTime && (
                                              <Badge className="mt-1 bg-amber-200 text-amber-800 hover:bg-amber-200">
                                                Horario elegido por el cliente
                                              </Badge>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-amber-700 mt-1">
                                            No se ha programado un horario de entrega
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                          onClick={() => {
                                            setIsDeliveryDialogOpen(true)
                                          }}
                                        >
                                          <Calendar className="h-4 w-4 mr-2" />
                                          Programar entrega
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                          onClick={() => {
                                            setIsEmailDialogOpen(true)
                                          }}
                                        >
                                          <Mail className="h-4 w-4 mr-2" />
                                          Enviar email
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border rounded-md">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Producto</TableHead>
                                          <TableHead>Tipo</TableHead>
                                          <TableHead>Precio</TableHead>
                                          <TableHead>Cantidad</TableHead>
                                          <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {selectedOrder.items.map((item) => (
                                          <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.type}</TableCell>
                                            <TableCell>${item.price.toLocaleString()}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                              ${(item.price * item.quantity).toLocaleString()}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-right font-bold">
                                            Total
                                          </TableCell>
                                          <TableCell className="text-right font-bold">
                                            ${selectedOrder.total.toLocaleString()}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TabsContent>
                                <TabsContent value="customer" className="space-y-4 pt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-medium">Nombre</h3>
                                      <p className="text-muted-foreground">{selectedOrder.customer.name}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Email</h3>
                                      <p className="text-muted-foreground">{selectedOrder.customer.email}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Teléfono</h3>
                                      <p className="text-muted-foreground">{selectedOrder.customer.phone}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">Dirección</h3>
                                      <p className="text-muted-foreground">{selectedOrder.customer.address}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          )}
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline">Cambiar estado</Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Estado del pedido</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Selecciona el nuevo estado para este pedido
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    <div className="grid grid-cols-2 items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="justify-start"
                                        onClick={() => handleChangeStatus(selectedOrder?.id || "", "pending")}
                                      >
                                        Pendiente
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="justify-start"
                                        onClick={() => handleChangeStatus(selectedOrder?.id || "", "processing")}
                                      >
                                        Procesando
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="justify-start"
                                        onClick={() => handleChangeStatus(selectedOrder?.id || "", "shipped")}
                                      >
                                        Enviado
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="justify-start"
                                        onClick={() => handleChangeStatus(selectedOrder?.id || "", "delivered")}
                                      >
                                        Entregado
                                      </Button>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleChangeStatus(selectedOrder?.id || "", "cancelled")}
                                    >
                                      Cancelado
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para programar horario de entrega */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Programar horario de entrega</DialogTitle>
            <DialogDescription>
              Establece la fecha y el rango horario para la entrega del pedido {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery-date" className="text-right">
                Fecha
              </Label>
              <Input
                id="delivery-date"
                type="text"
                placeholder="Ej: 15 May, 2025"
                className="col-span-3"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery-time" className="text-right">
                Rango horario
              </Label>
              <Select value={deliveryTimeRange} onValueChange={setDeliveryTimeRange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rango horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10:00 - 12:00">10:00 - 12:00</SelectItem>
                  <SelectItem value="12:00 - 14:00">12:00 - 14:00</SelectItem>
                  <SelectItem value="14:00 - 16:00">14:00 - 16:00</SelectItem>
                  <SelectItem value="16:00 - 18:00">16:00 - 18:00</SelectItem>
                  <SelectItem value="18:00 - 20:00">18:00 - 20:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSetDeliveryTime}>
              Programar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para enviar email al cliente */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar email al cliente</DialogTitle>
            <DialogDescription>
              Envía un email al cliente para que seleccione su horario de entrega preferido
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
              <h4 className="font-medium text-amber-800">Información del cliente</h4>
              <p className="text-sm mt-2">
                <span className="font-medium">Nombre:</span> {selectedOrder?.customer.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span> {selectedOrder?.customer.email}
              </p>
              <p className="text-sm">
                <span className="font-medium">Teléfono:</span> {selectedOrder?.customer.phone}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Vista previa del email</h4>
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-sm">
                  <span className="font-medium">Asunto:</span> Selecciona tu horario de entrega preferido - Luna Brew
                  House
                </p>
                <div className="mt-3 text-sm border-t pt-3">
                  <p>Hola {selectedOrder?.customer.name},</p>
                  <p className="mt-2">
                    Gracias por tu compra en Luna Brew House. Queremos asegurarnos de entregarte tu pedido en el momento
                    que mejor te convenga.
                  </p>
                  <p className="mt-2">
                    Por favor, haz clic en el siguiente enlace para seleccionar tu horario de entrega preferido:
                  </p>
                  <div className="mt-2 bg-amber-50 p-2 rounded border border-amber-200 text-center">
                    <a
                      href={`https://lunabrewhouse.com/pedidos/horario/${selectedOrder?.id}`}
                      className="text-amber-600 font-medium"
                    >
                      Seleccionar horario de entrega
                    </a>
                  </div>
                  <p className="mt-2">
                    Si tienes alguna pregunta, no dudes en responder a este correo o llamarnos al +54 223 555-1234.
                  </p>
                  <p className="mt-2">¡Salud!</p>
                  <p>El equipo de Luna Brew House</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSendEmail}>
              Enviar email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
