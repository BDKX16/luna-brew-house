"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, LogOut, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export default function UserNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Simular verificación de autenticación
  useEffect(() => {
    // En una implementación real, esto verificaría el estado de autenticación desde una API o contexto
    const checkAuth = () => {
      const fakeAuth = localStorage.getItem("isLoggedIn") === "true"
      setIsLoggedIn(fakeAuth)
      setUserName(fakeAuth ? "Usuario Luna" : "")
    }

    checkAuth()
    window.addEventListener("storage", checkAuth)

    return () => {
      window.removeEventListener("storage", checkAuth)
    }
  }, [])

  const handleLogout = () => {
    // En una implementación real, esto llamaría a una API de logout
    localStorage.removeItem("isLoggedIn")
    setIsLoggedIn(false)

    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    })

    router.push("/")
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/checkout" className="text-sm font-medium hover:text-primary">
        <ShoppingCart className="h-5 w-5" />
        <span className="sr-only">Carrito</span>
      </Link>

      {isLoggedIn ? (
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
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">usuario@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil">Mi perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pedidos">Mis pedidos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/suscripciones">Mis suscripciones</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login">Iniciar sesión</Link>
        </Button>
      )}
    </div>
  )
}
