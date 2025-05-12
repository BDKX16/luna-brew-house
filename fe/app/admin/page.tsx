import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Beer,
  ShoppingCart,
} from "lucide-react"

export default function AdminDashboard() {
  // Datos simulados para el dashboard
  const stats = [
    {
      title: "Ventas Totales",
      value: "$125,430",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Pedidos",
      value: "432",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingBag,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Clientes",
      value: "1,205",
      change: "+18.3%",
      trend: "up",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      title: "Tasa de Conversión",
      value: "3.2%",
      change: "-0.4%",
      trend: "down",
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
    },
  ]

  // Datos simulados para productos más vendidos
  const topProducts = [
    { name: "Luna Dorada", sales: 156, revenue: "$54,600" },
    { name: "Luna Roja", sales: 132, revenue: "$59,400" },
    { name: "Luna Brillante", sales: 98, revenue: "$49,000" },
    { name: "Plan Estándar", sales: 87, revenue: "$31,320" },
    { name: "Plan Premium", sales: 64, revenue: "$51,200" },
  ]

  // Datos simulados para pedidos recientes
  const recentOrders = [
    { id: "#ORD-5523", customer: "Juan Pérez", date: "12 May, 2025", status: "Completado", total: "$12,500" },
    { id: "#ORD-5522", customer: "María García", date: "11 May, 2025", status: "Procesando", total: "$8,200" },
    { id: "#ORD-5521", customer: "Carlos López", date: "10 May, 2025", status: "Completado", total: "$5,400" },
    { id: "#ORD-5520", customer: "Ana Martínez", date: "10 May, 2025", status: "Enviado", total: "$9,800" },
    { id: "#ORD-5519", customer: "Roberto Sánchez", date: "09 May, 2025", status: "Completado", total: "$4,500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de ventas y actividad de Luna Brew House.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/productos">
            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              <Beer className="mr-2 h-4 w-4" />
              Gestionar Productos
            </div>
          </Link>
          <Link href="/admin/ventas">
            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-amber-600 text-white hover:bg-amber-700 h-10 px-4 py-2">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Ventas
            </div>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`${stat.bgColor} p-2 rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1">
                  <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>{stat.change}</span>
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>Los productos con mayor volumen de ventas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{product.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">{product.sales} ventas</div>
                    <div className="font-medium">{product.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pedidos recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos recientes</CardTitle>
            <CardDescription>Los últimos pedidos realizados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="font-medium">{order.id}</div>
                    <div className="text-sm text-muted-foreground">{order.customer}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">{order.date}</div>
                    <div className="font-medium">{order.total}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
