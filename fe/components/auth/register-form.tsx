"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica que ambas contraseñas sean iguales",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulación de registro exitoso
      // En una implementación real, aquí iría la llamada a la API de registro
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Registro exitoso",
        description: "Te hemos enviado un correo para verificar tu cuenta",
      })

      // Redirigir al usuario a la página principal
      router.push("/")
    } catch (error) {
      toast({
        title: "Error al registrarse",
        description: "Ha ocurrido un error. Por favor intenta nuevamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Únete a Luna Brew House y disfruta de beneficios exclusivos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Número de teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+54 223 555-1234"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección de entrega y facturación</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Av. Constitución 5500, Mar del Plata, Argentina"
              value={formData.address}
              onChange={handleChange}
              required
              className="min-h-[80px]"
            />
          </div>
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creando cuenta...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Crear cuenta
              </span>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O</span>
          </div>
        </div>
        <div className="text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/auth/login" className="font-medium text-amber-600 hover:text-amber-700">
            Inicia sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
