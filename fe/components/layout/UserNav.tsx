"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingCart, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function UserNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();

    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Link href="/checkout" className="text-sm font-medium hover:text-primary">
        <ShoppingCart className="h-5 w-5" />
        <span className="sr-only">Carrito</span>
      </Link>

      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <User className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "Usuario"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil">Mi perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/perfil/pedidos">Mis pedidos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/perfil/suscripciones">Mis suscripciones</Link>
            </DropdownMenuItem>

            {/* Admin panel link - only for admin users */}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="text-amber-700 font-medium"
                >
                  <Link href="/admin" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel de Administración
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href="/auth/login">Iniciar sesión</Link>
        </Button>
      )}
    </div>
  );
}
