"use client"

import { useState } from "react"
import Image from "next/image"
import { Edit, Trash2, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Tipos
type BeerType = "golden" | "red" | "ipa"

interface Beer {
  id: string
  name: string
  type: string
  typeId: BeerType
  price: number
  image: string
  description: string
  stock: number
}

interface Subscription {
  id: string
  name: string
  liters: number
  price: number
  features: string[]
  popular?: boolean
}

// Datos iniciales
const initialBeers: Beer[] = [
  {
    id: "beer-golden",
    name: "Luna Dorada",
    type: "Golden Ale",
    typeId: "golden",
    price: 3500,
    image: "/images/golden-ale.png",
    description:
      "Suave y refrescante, con notas cítricas y un final limpio. Perfecta para días soleados y momentos de relax.",
    stock: 120,
  },
  {
    id: "beer-red",
    name: "Luna Roja",
    type: "Irish Red Ale",
    typeId: "red",
    price: 4500,
    image: "/images/red-ale.png",
    description:
      "Maltosa con carácter, notas de caramelo y un equilibrio perfecto. Ideal para acompañar comidas y conversaciones.",
    stock: 85,
  },
  {
    id: "beer-ipa",
    name: "Luna Brillante",
    type: "IPA",
    typeId: "ipa",
    price: 5000,
    image: "/images/ipa.png",
    description:
      "Intensa y aromática, con un perfil lupulado distintivo. Para los amantes de sabores audaces y experiencias intensas.",
    stock: 65,
  },
  {
    id: "beer-special",
    name: "Luna Especial",
    type: "Edición Limitada",
    typeId: "golden",
    price: 6500,
    image: "/images/special-edition.png",
    description: "Nuestra creación más exclusiva, elaborada con ingredientes premium cuidadosamente seleccionados.",
    stock: 20,
  },
]

const initialSubscriptions: Subscription[] = [
  {
    id: "sub-basic",
    name: "Plan Básico",
    liters: 4,
    price: 11200, // 3500 * 4 * 0.8
    features: ["Entrega mensual", "Botella de edición especial gratis", "Acceso a eventos exclusivos"],
  },
  {
    id: "sub-standard",
    name: "Plan Estándar",
    liters: 8,
    price: 22400, // 3500 * 8 * 0.8
    features: [
      "Entrega mensual",
      "Botella de edición especial gratis",
      "Acceso a eventos exclusivos",
      "Vaso personalizado",
    ],
    popular: true,
  },
  {
    id: "sub-premium",
    name: "Plan Premium",
    liters: 16,
    price: 44800, // 3500 * 16 * 0.8
    features: [
      "Entrega mensual",
      "Botella de edición especial gratis",
      "Acceso a eventos exclusivos",
      "Set de 2 vasos personalizados",
      "Visita guiada a la cervecería",
    ],
  },
]

export default function ProductosPage() {
  const [beers, setBeers] = useState<Beer[]>(initialBeers)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [newBeer, setNewBeer] = useState<Partial<Beer>>({
    name: "",
    type: "",
    typeId: "golden",
    price: 0,
    image: "/placeholder.svg?height=300&width=300",
    description: "",
    stock: 0,
  })
  const [newSubscription, setNewSubscription] = useState<Partial<Subscription>>({
    name: "",
    liters: 0,
    price: 0,
    features: [],
  })
  const [newFeature, setNewFeature] = useState("")

  // Filtrar productos por búsqueda
  const filteredBeers = beers.filter(
    (beer) =>
      beer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beer.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredSubscriptions = subscriptions.filter((sub) => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Funciones para gestionar cervezas
  const handleEditBeer = (beer: Beer) => {
    setEditingBeer({ ...beer })
  }

  const handleSaveBeer = () => {
    if (editingBeer) {
      setBeers(beers.map((beer) => (beer.id === editingBeer.id ? editingBeer : beer)))
      setEditingBeer(null)
    }
  }

  const handleDeleteBeer = (id: string) => {
    setBeers(beers.filter((beer) => beer.id !== id))
  }

  const handleAddBeer = () => {
    const newId = `beer-${Date.now()}`
    const beerToAdd: Beer = {
      id: newId,
      name: newBeer.name || "Nueva Cerveza",
      type: newBeer.type || "Ale",
      typeId: (newBeer.typeId as BeerType) || "golden",
      price: newBeer.price || 0,
      image: newBeer.image || "/placeholder.svg?height=300&width=300",
      description: newBeer.description || "",
      stock: newBeer.stock || 0,
    }

    setBeers([...beers, beerToAdd])
    setNewBeer({
      name: "",
      type: "",
      typeId: "golden",
      price: 0,
      image: "/placeholder.svg?height=300&width=300",
      description: "",
      stock: 0,
    })
  }

  // Funciones para gestionar suscripciones
  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription({ ...subscription })
  }

  const handleSaveSubscription = () => {
    if (editingSubscription) {
      setSubscriptions(subscriptions.map((sub) => (sub.id === editingSubscription.id ? editingSubscription : sub)))
      setEditingSubscription(null)
    }
  }

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(subscriptions.filter((sub) => sub.id !== id))
  }

  const handleAddSubscription = () => {
    const newId = `sub-${Date.now()}`
    const subToAdd: Subscription = {
      id: newId,
      name: newSubscription.name || "Nuevo Plan",
      liters: newSubscription.liters || 0,
      price: newSubscription.price || 0,
      features: newSubscription.features || [],
      popular: false,
    }

    setSubscriptions([...subscriptions, subToAdd])
    setNewSubscription({
      name: "",
      liters: 0,
      price: 0,
      features: [],
    })
  }

  const handleAddFeature = () => {
    if (newFeature && editingSubscription) {
      setEditingSubscription({
        ...editingSubscription,
        features: [...editingSubscription.features, newFeature],
      })
      setNewFeature("")
    }
  }

  const handleRemoveFeature = (index: number) => {
    if (editingSubscription) {
      const newFeatures = [...editingSubscription.features]
      newFeatures.splice(index, 1)
      setEditingSubscription({
        ...editingSubscription,
        features: newFeatures,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">Administra las cervezas y planes de suscripción.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="beers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="beers">Cervezas</TabsTrigger>
          <TabsTrigger value="subscriptions">Planes de Suscripción</TabsTrigger>
        </TabsList>

        {/* Pestaña de Cervezas */}
        <TabsContent value="beers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Cerveza
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Añadir Nueva Cerveza</DialogTitle>
                  <DialogDescription>
                    Completa los detalles para añadir una nueva cerveza al catálogo.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-name" className="text-right">
                      Nombre
                    </Label>
                    <Input
                      id="new-name"
                      value={newBeer.name}
                      onChange={(e) => setNewBeer({ ...newBeer, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-type" className="text-right">
                      Tipo
                    </Label>
                    <Input
                      id="new-type"
                      value={newBeer.type}
                      onChange={(e) => setNewBeer({ ...newBeer, type: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-typeId" className="text-right">
                      Categoría
                    </Label>
                    <Select
                      value={newBeer.typeId as string}
                      onValueChange={(value) => setNewBeer({ ...newBeer, typeId: value as BeerType })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="golden">Golden Ale</SelectItem>
                        <SelectItem value="red">Red Ale</SelectItem>
                        <SelectItem value="ipa">IPA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-price" className="text-right">
                      Precio
                    </Label>
                    <Input
                      id="new-price"
                      type="number"
                      value={newBeer.price || ""}
                      onChange={(e) => setNewBeer({ ...newBeer, price: Number(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-stock" className="text-right">
                      Stock
                    </Label>
                    <Input
                      id="new-stock"
                      type="number"
                      value={newBeer.stock || ""}
                      onChange={(e) => setNewBeer({ ...newBeer, stock: Number(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-image" className="text-right">
                      Imagen URL
                    </Label>
                    <Input
                      id="new-image"
                      value={newBeer.image}
                      onChange={(e) => setNewBeer({ ...newBeer, image: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="new-description" className="text-right pt-2">
                      Descripción
                    </Label>
                    <textarea
                      id="new-description"
                      value={newBeer.description}
                      onChange={(e) => setNewBeer({ ...newBeer, description: e.target.value })}
                      className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddBeer}>
                      Añadir Cerveza
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No se encontraron cervezas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBeers.map((beer) => (
                    <TableRow key={beer.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden">
                          <Image
                            src={beer.image || "/placeholder.svg?height=48&width=48"}
                            alt={beer.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{beer.name}</TableCell>
                      <TableCell>{beer.type}</TableCell>
                      <TableCell>${beer.price}</TableCell>
                      <TableCell>
                        {beer.stock <= 20 ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                            {beer.stock} unidades
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            {beer.stock} unidades
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => handleEditBeer(beer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Editar Cerveza</DialogTitle>
                                <DialogDescription>Modifica los detalles de la cerveza.</DialogDescription>
                              </DialogHeader>
                              {editingBeer && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">
                                      Nombre
                                    </Label>
                                    <Input
                                      id="edit-name"
                                      value={editingBeer.name}
                                      onChange={(e) => setEditingBeer({ ...editingBeer, name: e.target.value })}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-type" className="text-right">
                                      Tipo
                                    </Label>
                                    <Input
                                      id="edit-type"
                                      value={editingBeer.type}
                                      onChange={(e) => setEditingBeer({ ...editingBeer, type: e.target.value })}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-typeId" className="text-right">
                                      Categoría
                                    </Label>
                                    <Select
                                      value={editingBeer.typeId}
                                      onValueChange={(value) =>
                                        setEditingBeer({ ...editingBeer, typeId: value as BeerType })
                                      }
                                    >
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona una categoría" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="golden">Golden Ale</SelectItem>
                                        <SelectItem value="red">Red Ale</SelectItem>
                                        <SelectItem value="ipa">IPA</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-price" className="text-right">
                                      Precio
                                    </Label>
                                    <Input
                                      id="edit-price"
                                      type="number"
                                      value={editingBeer.price}
                                      onChange={(e) =>
                                        setEditingBeer({ ...editingBeer, price: Number(e.target.value) })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-stock" className="text-right">
                                      Stock
                                    </Label>
                                    <Input
                                      id="edit-stock"
                                      type="number"
                                      value={editingBeer.stock}
                                      onChange={(e) =>
                                        setEditingBeer({ ...editingBeer, stock: Number(e.target.value) })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-image" className="text-right">
                                      Imagen URL
                                    </Label>
                                    <Input
                                      id="edit-image"
                                      value={editingBeer.image}
                                      onChange={(e) => setEditingBeer({ ...editingBeer, image: e.target.value })}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="edit-description" className="text-right pt-2">
                                      Descripción
                                    </Label>
                                    <textarea
                                      id="edit-description"
                                      value={editingBeer.description}
                                      onChange={(e) => setEditingBeer({ ...editingBeer, description: e.target.value })}
                                      className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSaveBeer}>
                                    Guardar Cambios
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Confirmar eliminación</DialogTitle>
                                <DialogDescription>
                                  ¿Estás seguro de que deseas eliminar la cerveza "{beer.name}"? Esta acción no se puede
                                  deshacer.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="mt-4">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button variant="destructive" onClick={() => handleDeleteBeer(beer.id)}>
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
          </div>
        </TabsContent>

        {/* Pestaña de Suscripciones */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Añadir Nuevo Plan de Suscripción</DialogTitle>
                  <DialogDescription>Completa los detalles para añadir un nuevo plan de suscripción.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-sub-name" className="text-right">
                      Nombre
                    </Label>
                    <Input
                      id="new-sub-name"
                      value={newSubscription.name}
                      onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-sub-liters" className="text-right">
                      Litros
                    </Label>
                    <Input
                      id="new-sub-liters"
                      type="number"
                      value={newSubscription.liters || ""}
                      onChange={(e) => setNewSubscription({ ...newSubscription, liters: Number(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-sub-price" className="text-right">
                      Precio
                    </Label>
                    <Input
                      id="new-sub-price"
                      type="number"
                      value={newSubscription.price || ""}
                      onChange={(e) => setNewSubscription({ ...newSubscription, price: Number(e.target.value) })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddSubscription}>
                      Añadir Plan
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No se encontraron planes de suscripción
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">{subscription.name}</TableCell>
                      <TableCell>{subscription.liters} litros</TableCell>
                      <TableCell>${subscription.price}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">{subscription.features.length} características</div>
                      </TableCell>
                      <TableCell>
                        {subscription.popular ? (
                          <Badge className="bg-amber-500">Popular</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditSubscription(subscription)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Editar Plan de Suscripción</DialogTitle>
                                <DialogDescription>Modifica los detalles del plan de suscripción.</DialogDescription>
                              </DialogHeader>
                              {editingSubscription && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-sub-name" className="text-right">
                                      Nombre
                                    </Label>
                                    <Input
                                      id="edit-sub-name"
                                      value={editingSubscription.name}
                                      onChange={(e) =>
                                        setEditingSubscription({ ...editingSubscription, name: e.target.value })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-sub-liters" className="text-right">
                                      Litros
                                    </Label>
                                    <Input
                                      id="edit-sub-liters"
                                      type="number"
                                      value={editingSubscription.liters}
                                      onChange={(e) =>
                                        setEditingSubscription({
                                          ...editingSubscription,
                                          liters: Number(e.target.value),
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-sub-price" className="text-right">
                                      Precio
                                    </Label>
                                    <Input
                                      id="edit-sub-price"
                                      type="number"
                                      value={editingSubscription.price}
                                      onChange={(e) =>
                                        setEditingSubscription({
                                          ...editingSubscription,
                                          price: Number(e.target.value),
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Popular</Label>
                                    <div className="col-span-3 flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="edit-sub-popular"
                                        checked={editingSubscription.popular || false}
                                        onChange={(e) =>
                                          setEditingSubscription({ ...editingSubscription, popular: e.target.checked })
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600"
                                      />
                                      <Label htmlFor="edit-sub-popular" className="text-sm font-normal">
                                        Marcar como plan popular
                                      </Label>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">Características</Label>
                                    <div className="col-span-3 space-y-2">
                                      <div className="flex flex-col gap-2">
                                        {editingSubscription.features.map((feature, index) => (
                                          <div key={index} className="flex items-center gap-2">
                                            <Input value={feature} disabled />
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                              onClick={() => handleRemoveFeature(index)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Input
                                          placeholder="Nueva característica"
                                          value={newFeature}
                                          onChange={(e) => setNewFeature(e.target.value)}
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleAddFeature}
                                          disabled={!newFeature}
                                        >
                                          Añadir
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSaveSubscription}>
                                    Guardar Cambios
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Confirmar eliminación</DialogTitle>
                                <DialogDescription>
                                  ¿Estás seguro de que deseas eliminar el plan "{subscription.name}"? Esta acción no se
                                  puede deshacer.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="mt-4">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteSubscription(subscription.id)}
                                  >
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
