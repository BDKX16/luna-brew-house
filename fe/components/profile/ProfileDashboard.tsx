import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  Package,
  CalendarDays,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";

interface ProfileDashboardProps {
  user: any;
}

export default function ProfileDashboard({ user }: ProfileDashboardProps) {
  const isAdmin = user?.role === "admin";

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{user.name || "No disponible"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="pt-4">
              <Link href="/perfil/editar">
                <Button variant="outline" className="w-full">
                  Editar Perfil
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Mis Suscripciones
          </CardTitle>
          <CardDescription>
            Gestiona tus planes de cerveza mensuales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              Revisa y gestiona tus suscripciones activas e históricas.
            </p>
            <Link href="/perfil/suscripciones">
              <Button className="w-full">Ver suscripciones</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Orders Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mis Pedidos
          </CardTitle>
          <CardDescription>Historial de tus compras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              Consulta el estado e historial de todos tus pedidos.
            </p>
            <Link href="/perfil/pedidos">
              <Button variant="outline" className="w-full">
                Ver pedidos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Admin Panel Card - Only shown for admin users */}
      {isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <LayoutDashboard className="h-5 w-5" />
              Panel de Administración
            </CardTitle>
            <CardDescription className="text-amber-700">
              Acceso al área administrativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-amber-700">
                Gestionar productos, pedidos y configuraciones del sistema.
              </p>
              <Link href="/admin">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  Acceder al Panel Admin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explore Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Explorar Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              Descubre nuestra selección de cervezas artesanales y planes de
              suscripción.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Cervezas
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Suscripciones
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
