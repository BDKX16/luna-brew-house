"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Beer,
  ShoppingCart,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getDashboardStats,
  getTopProducts,
  getRecentOrders,
} from "@/services/private";

export default function AdminDashboard() {
  const { loading: loadingStats, callEndpoint } = useFetchAndLoad();
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    topProducts: [],
    recentOrders: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener todas las estadísticas del dashboard
        const result = await callEndpoint(getDashboardStats());
        if (result && result.data) {
          setDashboardData(result.data);
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // Componente de carga para estadísticas
  const StatSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  // Componente de carga para listas
  const ListItemSkeleton = () => (
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de ventas y actividad de Luna Brew House.
          </p>
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
        {loadingStats
          ? // Mostrar esqueletos de carga mientras se cargan los datos
            [...Array(4)].map((_, index) => <StatSkeleton key={index} />)
          : dashboardData.stats.map((stat, index) => {
              // Mapeo de iconos según el título
              const iconMap = {
                "Ventas Totales": DollarSign,
                Pedidos: ShoppingBag,
                Clientes: Users,
                "Tasa de Conversión": TrendingUp,
              };

              // Mapeo de colores según el título
              const colorMap = {
                "Ventas Totales": "text-green-500",
                Pedidos: "text-blue-500",
                Clientes: "text-purple-500",
                "Tasa de Conversión": "text-amber-500",
              };

              // Mapeo de colores de fondo según el título
              const bgColorMap = {
                "Ventas Totales": "bg-green-100",
                Pedidos: "bg-blue-100",
                Clientes: "bg-purple-100",
                "Tasa de Conversión": "bg-amber-100",
              };

              const Icon = iconMap[stat.title] || DollarSign;
              const color = colorMap[stat.title] || "text-gray-500";
              const bgColor = bgColorMap[stat.title] || "bg-gray-100";

              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`${bgColor} p-2 rounded-full`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            stat.trend === "up"
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {stat.change}
                        </span>
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>
              Los productos con mayor volumen de ventas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingStats
                ? // Mostrar esqueletos de carga para productos
                  [...Array(5)].map((_, index) => (
                    <ListItemSkeleton key={index} />
                  ))
                : dashboardData.topProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{product.name}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {product.sales} ventas
                        </div>
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
              {loadingStats
                ? // Mostrar esqueletos de carga para pedidos
                  [...Array(5)].map((_, index) => (
                    <ListItemSkeleton key={index} />
                  ))
                : dashboardData.recentOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {order.date}
                        </div>
                        <div className="font-medium">{order.total}</div>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
