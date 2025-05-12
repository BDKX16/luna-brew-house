"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface UserAuthFormProps {
  onComplete: () => void
  onCreateAccount: () => void
}

export default function UserAuthForm({ onComplete, onCreateAccount }: UserAuthFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulación de procesamiento exitoso
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Guardar datos en localStorage (en una implementación real, esto se manejaría en el servidor)
      localStorage.setItem("guestCheckout", JSON.stringify(formData))

      toast({
        title: "Información guardada",
        description: "Puedes continuar con tu compra",
      })

      onComplete()
    } catch (error) {
      toast({
        title: "Error al guardar la información",
        description: "Por favor intenta nuevamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Información de contacto</h3>
        <p className="text-sm text-muted-foreground">
          Completa tus datos para continuar con la compra o{" "}
          <button type="button" className="font-medium text-amber-600 hover:text-amber-700" onClick={onCreateAccount}>
            crea una cuenta
          </button>{" "}
          para guardar tus datos y acceder a beneficios exclusivos.
        </p>
      </div>

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
          <Label htmlFor="address">Dirección de entrega</Label>
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
          {isLoading ? "Guardando información..." : "Continuar como invitado"}
        </Button>
      </form>
    </div>
  )
}
