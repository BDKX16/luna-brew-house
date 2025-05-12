"use client"

import { useState } from "react"
import { Calendar, Copy, Edit, Plus, Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

// Tipos
interface Discount {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  minPurchase?: number
  validFrom: string
  validUntil: string
  description: string
  appliesTo: "all" | "beer" | "subscription"
  active: boolean
  usageCount: number
  usageLimit?: number
}

// Datos iniciales
const initialDiscounts: Discount[] = [
  {
    id: "disc-001",
    code: "BIENVENIDO10",
    type: "percentage",
    value: 10,
    validFrom: "01 Jan, 2025",
    validUntil: "31 Dec, 2025",
    description: "10% de descuento en tu primera compra",
    appliesTo: "all",
    active: true,
    usageCount: 45,
  },
  {
    id: "disc-002",
    code: "VERANO25",
    type: "percentage",
    value: 25,
    minPurchase: 10000,
    validFrom: "01 Dec, 2024",
    validUntil: "28 Feb, 2025",
    description: "25% de descuento en compras superiores a $10,000",
    appliesTo: "all",
    active: true,
    usageCount: 23,
  },
  {
    id: "disc-003",
    code: "CERVEZA500",
    type: "fixed",
    value: 500,
    validFrom: "01 Jan, 2025",
    validUntil: "31 Dec, 2025",
    description: "$500 de descuento en cervezas individuales",
    appliesTo: "beer",
    active: true,
    usageCount: 67,
  },
  {
    id: "disc-004",
    code: "CLUB20",
    type: "percentage",
    value: 20,
    validFrom: "01 Jan, 2025",
    validUntil: "31 Dec, 2025",
    description: "20% adicional en suscripciones",
    appliesTo: "subscription",
    active: true,
    usageCount: 18,
  },
  {
    id: "disc-005",
    code: "PRIMAVERA15",
    type: "percentage",
    value: 15,
    validFrom: "01 Sep, 2024",
    validUntil: "30 Nov, 2024",
    description: "15% de descuento en toda la tienda",
    appliesTo: "all",
    active: false,
    usageCount: 89,
  },
  {
    id: "disc-006",
    code: "AMIGOS2X1",
    type: "percentage",
    value: 50,
    minPurchase: 7000,
    validFrom: "01 Jun, 2025",
    validUntil: "31 Jul, 2025",
    description: "2x1 en cervezas (50% de descuento)",
    appliesTo: "beer",
    active: false,
    usageCount: 0,
    usageLimit: 100,
  },
]

export default function PromocionesPage() {
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts)
  const [activeTab, setActiveTab] = useState("active")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({
    code: "",
    type: "percentage",
    value: 10,
    appliesTo: "all",
    description: "",
    validFrom: new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    active: true,
  })
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  // Filtrar descuentos
  const filteredDiscounts = discounts.filter(
    (discount) =>
      (activeTab === "active" ? discount.active : !discount.active) &&
      (discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        discount.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Funciones para gestionar descuentos
  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount({ ...discount })
  }

  const handleSaveDiscount = () => {
    if (editingDiscount) {
      setDiscounts(discounts.map((disc) => (disc.id === editingDiscount.id ? editingDiscount : disc)))
      setEditingDiscount(null)
      toast({
        title: "Promoción actualizada",
        description: `El código ${editingDiscount.code} ha sido actualizado correctamente.`,
      })
    }
  }

  const handleDeleteDiscount = (id: string) => {
    setDiscounts(discounts.filter((disc) => disc.id !== id))
    toast({
      title: "Promoción eliminada",
      description: "La promoción ha sido eliminada correctamente.",
    })
  }

  const handleToggleActive = (id: string, active: boolean) => {
    setDiscounts(
      discounts.map((disc) =>
        disc.id === id
          ? {
              ...disc,
              active,
            }
          : disc,
      ),
    )
    const discount = discounts.find((d) => d.id === id)
    toast({
      title: active ? "Promoción activada" : "Promoción desactivada",
      description: `El código ${discount?.code} ha sido ${active ? "activado" : "desactivado"} correctamente.`,
    })
  }

  const handleAddDiscount = () => {
    if (!newDiscount.code || !newDiscount.description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      })
      return
    }

    const newId = `disc-${Date.now()}`
    const discountToAdd: Discount = {
      id: newId,
      code: newDiscount.code || "",
      type: newDiscount.type as "percentage" | "fixed",
      value: newDiscount.value || 0,
      minPurchase: newDiscount.minPurchase,
      validFrom: newDiscount.validFrom || "",
      validUntil: newDiscount.validUntil || "",
      description: newDiscount.description || "",
      appliesTo: newDiscount.appliesTo as "all" | "beer" | "subscription",
      active: newDiscount.active || false,
      usageCount: 0,
      usageLimit: newDiscount.usageLimit,
    }

    setDiscounts([...discounts, discountToAdd])
    setIsCreating(false)
    setNewDiscount({
      code: "",
      type: "percentage",
      value: 10,
      appliesTo: "all",
      description: "",
      validFrom: new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      active: true,
    })
    toast({
      title: "Promoción creada",
      description: `El código ${discountToAdd.code} ha sido creado correctamente.`,
    })
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Código copiado",
      description: `El código ${code} ha sido copiado al portapapeles.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Promociones</h1>
          <p className="text-muted-foreground">Administra los códigos de descuento para tu tienda.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="mr-2 h-4 w-4" />
                Crear Promoción
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Promoción</DialogTitle>
                <DialogDescription>Completa los detalles para crear un nuevo código de descuento.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-code">Código</Label>
                    <Input
                      id="new-code"
                      value={newDiscount.code}
                      onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                      placeholder="Ej: VERANO25"
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-type">Tipo de descuento</Label>
                    <Select
                      value={newDiscount.type}
                      onValueChange={(value) =>
                        setNewDiscount({ ...newDiscount, type: value as "percentage" | "fixed" })
                      }
                    >
                      <SelectTrigger id="new-type">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-value">
                      {newDiscount.type === "percentage" ? "Porcentaje de descuento" : "Monto de descuento"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-value"
                        type="number"
                        value={newDiscount.value || ""}
                        onChange={(e) => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })}
                        className="pl-8"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        {newDiscount.type === "percentage" ? "%" : "$"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-purchase">Compra mínima (opcional)</Label>
                    <div className="relative">
                      <Input
                        id="new-min-purchase"
                        type="number"
                        value={newDiscount.minPurchase || ""}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            minPurchase: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="Sin mínimo"
                        className="pl-8"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        $
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-description">Descripción</Label>
                  <Input
                    id="new-description"
                    value={newDiscount.description}
                    onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                    placeholder="Ej: 25% de descuento en toda la tienda"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-valid-from">Válido desde</Label>
                    <Input
                      id="new-valid-from"
                      value={newDiscount.validFrom}
                      onChange={(e) => setNewDiscount({ ...newDiscount, validFrom: e.target.value })}
                      placeholder="Ej: 01 Jan, 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-valid-until">Válido hasta</Label>
                    <Input
                      id="new-valid-until"
                      value={newDiscount.validUntil}
                      onChange={(e) => setNewDiscount({ ...newDiscount, validUntil: e.target.value })}
                      placeholder="Ej: 31 Dec, 2025"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-applies-to">Aplica a</Label>
                    <Select
                      value={newDiscount.appliesTo}
                      onValueChange={(value) =>
                        setNewDiscount({ ...newDiscount, appliesTo: value as "all" | "beer" | "subscription" })
                      }
                    >
                      <SelectTrigger id="new-applies-to">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los productos</SelectItem>
                        <SelectItem value="beer">Solo cervezas</SelectItem>
                        <SelectItem value="subscription">Solo suscripciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-usage-limit">Límite de usos (opcional)</Label>
                    <Input
                      id="new-usage-limit"
                      type="number"
                      value={newDiscount.usageLimit || ""}
                      onChange={(e) =>
                        setNewDiscount({
                          ...newDiscount,
                          usageLimit: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="Sin límite"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="new-active"
                    checked={newDiscount.active}
                    onCheckedChange={(checked) => setNewDiscount({ ...newDiscount, active: checked })}
                  />
                  <Label htmlFor="new-active">Activar promoción inmediatamente</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddDiscount}>
                  Crear Promoción
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center">
        <Input
          placeholder="Buscar promociones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Validez</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No se encontraron promociones activas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDiscounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{discount.code}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-amber-50"
                              onClick={() => copyToClipboard(discount.code)}
                            >
                              <Copy className="h-3 w-3 text-amber-600" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {discount.type === "percentage" ? (
                            <span>{discount.value}% de descuento</span>
                          ) : (
                            <span>${discount.value} de descuento</span>
                          )}
                          {discount.minPurchase && (
                            <div className="text-xs text-muted-foreground">Mínimo: ${discount.minPurchase}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px]">
                            <span>{discount.description}</span>
                            <div className="text-xs text-muted-foreground mt-1">
                              Aplica a:{" "}
                              {discount.appliesTo === "all"
                                ? "Todos los productos"
                                : discount.appliesTo === "beer"
                                  ? "Solo cervezas"
                                  : "Solo suscripciones"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {discount.validFrom} - {discount.validUntil}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {discount.usageCount} usos
                            {discount.usageLimit && (
                              <span className="text-xs text-muted-foreground ml-1">/ {discount.usageLimit} máx.</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleEditDiscount(discount)}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Editar Promoción</DialogTitle>
                                  <DialogDescription>Modifica los detalles del código de descuento.</DialogDescription>
                                </DialogHeader>
                                {editingDiscount && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-code">Código</Label>
                                        <Input
                                          id="edit-code"
                                          value={editingDiscount.code}
                                          onChange={(e) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              code: e.target.value.toUpperCase(),
                                            })
                                          }
                                          className="uppercase"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-type">Tipo de descuento</Label>
                                        <Select
                                          value={editingDiscount.type}
                                          onValueChange={(value) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              type: value as "percentage" | "fixed",
                                            })
                                          }
                                        >
                                          <SelectTrigger id="edit-type">
                                            <SelectValue placeholder="Selecciona un tipo" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                            <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-value">
                                          {editingDiscount.type === "percentage"
                                            ? "Porcentaje de descuento"
                                            : "Monto de descuento"}
                                        </Label>
                                        <div className="relative">
                                          <Input
                                            id="edit-value"
                                            type="number"
                                            value={editingDiscount.value}
                                            onChange={(e) =>
                                              setEditingDiscount({
                                                ...editingDiscount,
                                                value: Number(e.target.value),
                                              })
                                            }
                                            className="pl-8"
                                          />
                                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                            {editingDiscount.type === "percentage" ? "%" : "$"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-min-purchase">Compra mínima (opcional)</Label>
                                        <div className="relative">
                                          <Input
                                            id="edit-min-purchase"
                                            type="number"
                                            value={editingDiscount.minPurchase || ""}
                                            onChange={(e) =>
                                              setEditingDiscount({
                                                ...editingDiscount,
                                                minPurchase: e.target.value ? Number(e.target.value) : undefined,
                                              })
                                            }
                                            placeholder="Sin mínimo"
                                            className="pl-8"
                                          />
                                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                            $
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-description">Descripción</Label>
                                      <Input
                                        id="edit-description"
                                        value={editingDiscount.description}
                                        onChange={(e) =>
                                          setEditingDiscount({
                                            ...editingDiscount,
                                            description: e.target.value,
                                          })
                                        }
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-valid-from">Válido desde</Label>
                                        <Input
                                          id="edit-valid-from"
                                          value={editingDiscount.validFrom}
                                          onChange={(e) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              validFrom: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-valid-until">Válido hasta</Label>
                                        <Input
                                          id="edit-valid-until"
                                          value={editingDiscount.validUntil}
                                          onChange={(e) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              validUntil: e.target.value,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-applies-to">Aplica a</Label>
                                        <Select
                                          value={editingDiscount.appliesTo}
                                          onValueChange={(value) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              appliesTo: value as "all" | "beer" | "subscription",
                                            })
                                          }
                                        >
                                          <SelectTrigger id="edit-applies-to">
                                            <SelectValue placeholder="Selecciona una opción" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="all">Todos los productos</SelectItem>
                                            <SelectItem value="beer">Solo cervezas</SelectItem>
                                            <SelectItem value="subscription">Solo suscripciones</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-usage-limit">Límite de usos (opcional)</Label>
                                        <Input
                                          id="edit-usage-limit"
                                          type="number"
                                          value={editingDiscount.usageLimit || ""}
                                          onChange={(e) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              usageLimit: e.target.value ? Number(e.target.value) : undefined,
                                            })
                                          }
                                          placeholder="Sin límite"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2">
                                      <Switch
                                        id="edit-active"
                                        checked={editingDiscount.active}
                                        onCheckedChange={(checked) =>
                                          setEditingDiscount({ ...editingDiscount, active: checked })
                                        }
                                      />
                                      <Label htmlFor="edit-active">Promoción activa</Label>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingDiscount(null)}>
                                    Cancelar
                                  </Button>
                                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSaveDiscount}>
                                    Guardar Cambios
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleToggleActive(discount.id, false)}
                            >
                              Desactivar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Validez</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No se encontraron promociones inactivas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDiscounts.map((discount) => (
                      <TableRow key={discount.id} className="opacity-70">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{discount.code}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-amber-50"
                              onClick={() => copyToClipboard(discount.code)}
                            >
                              <Copy className="h-3 w-3 text-amber-600" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {discount.type === "percentage" ? (
                            <span>{discount.value}% de descuento</span>
                          ) : (
                            <span>${discount.value} de descuento</span>
                          )}
                          {discount.minPurchase && (
                            <div className="text-xs text-muted-foreground">Mínimo: ${discount.minPurchase}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px]">
                            <span>{discount.description}</span>
                            <div className="text-xs text-muted-foreground mt-1">
                              Aplica a:{" "}
                              {discount.appliesTo === "all"
                                ? "Todos los productos"
                                : discount.appliesTo === "beer"
                                  ? "Solo cervezas"
                                  : "Solo suscripciones"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {discount.validFrom} - {discount.validUntil}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {discount.usageCount} usos
                            {discount.usageLimit && (
                              <span className="text-xs text-muted-foreground ml-1">/ {discount.usageLimit} máx.</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleToggleActive(discount.id, true)}
                            >
                              Activar
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirmar eliminación</DialogTitle>
                                  <DialogDescription>
                                    ¿Estás seguro de que deseas eliminar el código de descuento "{discount.code}"? Esta
                                    acción no se puede deshacer.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="mt-4">
                                  <Button variant="outline">Cancelar</Button>
                                  <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleDeleteDiscount(discount.id)}>
                                      Eliminar
                                    </Button>
                                  </DialogClose>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-600" />
            Consejos para códigos de descuento efectivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium">Nombres memorables</h3>
              <p className="text-sm text-muted-foreground">
                Usa códigos cortos y fáciles de recordar. Relaciona el código con la promoción (ej: VERANO25 para 25% en
                verano).
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Limitaciones estratégicas</h3>
              <p className="text-sm text-muted-foreground">
                Establece límites de uso o fechas de caducidad para crear sensación de urgencia y exclusividad.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Seguimiento y análisis</h3>
              <p className="text-sm text-muted-foreground">
                Monitorea qué códigos generan más ventas para optimizar tus estrategias de marketing futuras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
