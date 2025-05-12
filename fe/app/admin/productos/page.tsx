"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Edit, Trash2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getAdminBeers,
  getAdminBeerById,
  createBeer,
  updateBeer,
  deleteBeer,
  getAdminSubscriptionPlans,
  getAdminSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "@/services/private";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Tipos
type BeerType = "golden" | "red" | "ipa";

interface Beer {
  id: string;
  name: string;
  type: string;
  typeId: BeerType;
  price: number;
  image: string;
  description: string;
  stock: number;
}

interface Subscription {
  id: string;
  name: string;
  liters: number;
  price: number;
  features: string[];
  popular?: boolean;
}

export default function ProductosPage() {
  const [beers, setBeers] = useState<Beer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [isLoadingBeers, setIsLoadingBeers] = useState(true);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    type: "beer" | "subscription";
  } | null>(null);
  const [newBeer, setNewBeer] = useState<Partial<Beer>>({
    name: "",
    type: "",
    typeId: "golden",
    price: 0,
    image: "/images/placeholder-beer.png",
    description: "",
    stock: 0,
  });
  const [newSubscription, setNewSubscription] = useState<Partial<Subscription>>(
    {
      name: "",
      liters: 0,
      price: 0,
      features: [],
    }
  );
  const [newFeature, setNewFeature] = useState("");

  const { loading, callEndpoint } = useFetchAndLoad();
  const { toast } = useToast();

  // Cargar datos al iniciar
  useEffect(() => {
    fetchBeers();
    fetchSubscriptions();
  }, []);

  // Obtener todas las cervezas
  const fetchBeers = async () => {
    setIsLoadingBeers(true);
    try {
      const response = await callEndpoint(getAdminBeers());
      if (response && response.data && response.data.beers) {
        setBeers(response.data.beers);
      }
    } catch (error) {
      console.error("Error al obtener cervezas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cervezas",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBeers(false);
    }
  };

  // Obtener todos los planes de suscripción
  const fetchSubscriptions = async () => {
    setIsLoadingSubscriptions(true);
    try {
      const response = await callEndpoint(getAdminSubscriptionPlans());

      if (response && response.data && response.data.subscriptions) {
        setSubscriptions(response.data.subscriptions);
      } else {
        toast({
          title: "Error",
          description:
            "La respuesta no contiene datos de planes de suscripción",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al obtener planes de suscripción:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes de suscripción",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  // Filtrar productos por búsqueda
  const filteredBeers = beers.filter(
    (beer) =>
      beer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones para gestionar cervezas
  const handleEditBeer = async (beerId: string) => {
    try {
      const response = await callEndpoint(getAdminBeerById(beerId));
      if (response && response.data && response.data.beer) {
        setEditingBeer(response.data.beer);
      }
    } catch (error) {
      console.error("Error al obtener detalle de cerveza:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener la información de la cerveza",
        variant: "destructive",
      });
    }
  };

  const handleSaveBeer = async () => {
    if (!editingBeer) return;

    try {
      const response = await callEndpoint(
        updateBeer(editingBeer.id, editingBeer)
      );
      if (response && response.data) {
        await fetchBeers(); // Recargar la lista de cervezas
        setEditingBeer(null);
        toast({
          title: "Cerveza actualizada",
          description: `La cerveza ${editingBeer.name} ha sido actualizada correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al actualizar cerveza:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cerveza",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBeer = async (id: string) => {
    setProductToDelete({ id, type: "beer" });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      if (productToDelete.type === "beer") {
        const response = await callEndpoint(deleteBeer(productToDelete.id));
        if (response) {
          await fetchBeers(); // Recargar la lista de cervezas
          toast({
            title: "Cerveza eliminada",
            description: "La cerveza ha sido eliminada correctamente.",
          });
        }
      } else {
        const response = await callEndpoint(
          deleteSubscriptionPlan(productToDelete.id)
        );
        if (response) {
          await fetchSubscriptions(); // Recargar la lista de suscripciones
          toast({
            title: "Plan de suscripción eliminado",
            description:
              "El plan de suscripción ha sido eliminado correctamente.",
          });
        }
      }
    } catch (error) {
      console.error(
        `Error al eliminar ${
          productToDelete.type === "beer" ? "cerveza" : "plan"
        }:`,
        error
      );
      toast({
        title: "Error",
        description: `No se pudo eliminar el ${
          productToDelete.type === "beer" ? "producto" : "plan de suscripción"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleAddBeer = async () => {
    if (!newBeer.name || !newBeer.type) {
      toast({
        title: "Error",
        description:
          "Por favor completa al menos el nombre y el tipo de cerveza",
        variant: "destructive",
      });
      return;
    }

    const beerToAdd = {
      ...newBeer,
      id: `beer-${Date.now()}`,
      name: newBeer.name || "Nueva Cerveza",
      type: newBeer.type || "Ale",
      typeId: (newBeer.typeId as BeerType) || "golden",
      price: newBeer.price || 0,
      image: newBeer.image || "/images/placeholder-beer.png",
      description: newBeer.description || "",
      stock: newBeer.stock || 0,
    };

    try {
      const response = await callEndpoint(createBeer(beerToAdd));
      if (response && response.data) {
        await fetchBeers(); // Recargar la lista de cervezas
        setNewBeer({
          name: "",
          type: "",
          typeId: "golden",
          price: 0,
          image: "/images/placeholder-beer.png",
          description: "",
          stock: 0,
        });
        toast({
          title: "Cerveza añadida",
          description: `${beerToAdd.name} ha sido añadida al catálogo.`,
        });
      }
    } catch (error) {
      console.error("Error al crear cerveza:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir la cerveza",
        variant: "destructive",
      });
    }
  };

  // Funciones para gestionar suscripciones
  const handleEditSubscription = async (subscriptionId: string) => {
    try {
      const response = await callEndpoint(
        getAdminSubscriptionPlanById(subscriptionId)
      );
      if (response && response.data && response.data.subscription) {
        setEditingSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error("Error al obtener detalle de suscripción:", error);
      toast({
        title: "Error",
        description:
          "No se pudo obtener la información del plan de suscripción",
        variant: "destructive",
      });
    }
  };

  const handleSaveSubscription = async () => {
    if (!editingSubscription) return;

    try {
      const response = await callEndpoint(
        updateSubscriptionPlan(editingSubscription.id, editingSubscription)
      );
      if (response && response.data) {
        await fetchSubscriptions(); // Recargar la lista de suscripciones
        setEditingSubscription(null);
        toast({
          title: "Plan actualizado",
          description: `El plan ${editingSubscription.name} ha sido actualizado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al actualizar plan de suscripción:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan de suscripción",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubscription = (id: string) => {
    setProductToDelete({ id, type: "subscription" });
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubscription = async () => {
    if (
      !newSubscription.name ||
      !newSubscription.liters ||
      !newSubscription.price
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const subToAdd = {
      id: `sub-${Date.now()}`,
      name: newSubscription.name || "Nuevo Plan",
      liters: newSubscription.liters || 0,
      price: newSubscription.price || 0,
      features: newSubscription.features || [],
      popular: false,
    };

    try {
      const response = await callEndpoint(createSubscriptionPlan(subToAdd));
      if (response && response.data) {
        await fetchSubscriptions(); // Recargar la lista de suscripciones
        setNewSubscription({
          name: "",
          liters: 0,
          price: 0,
          features: [],
        });
        toast({
          title: "Plan de suscripción añadido",
          description: `${subToAdd.name} ha sido añadido correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al crear plan de suscripción:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir el plan de suscripción",
        variant: "destructive",
      });
    }
  };

  const handleAddFeature = () => {
    if (newFeature && editingSubscription) {
      setEditingSubscription({
        ...editingSubscription,
        features: [...editingSubscription.features, newFeature],
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (editingSubscription) {
      const newFeatures = [...editingSubscription.features];
      newFeatures.splice(index, 1);
      setEditingSubscription({
        ...editingSubscription,
        features: newFeatures,
      });
    }
  };

  const handleAddFeatureToNew = () => {
    if (newFeature) {
      setNewSubscription({
        ...newSubscription,
        features: [...(newSubscription.features || []), newFeature],
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeatureFromNew = (index: number) => {
    const newFeatures = [...(newSubscription.features || [])];
    newFeatures.splice(index, 1);
    setNewSubscription({
      ...newSubscription,
      features: newFeatures,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestión de Productos
          </h1>
          <p className="text-muted-foreground">
            Administra las cervezas y planes de suscripción.
          </p>
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
                    Completa los detalles para añadir una nueva cerveza al
                    catálogo.
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
                      onChange={(e) =>
                        setNewBeer({ ...newBeer, name: e.target.value })
                      }
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
                      onChange={(e) =>
                        setNewBeer({ ...newBeer, type: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-typeId" className="text-right">
                      Categoría
                    </Label>
                    <Select
                      value={newBeer.typeId as string}
                      onValueChange={(value) =>
                        setNewBeer({ ...newBeer, typeId: value as BeerType })
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
                    <Label htmlFor="new-price" className="text-right">
                      Precio
                    </Label>
                    <Input
                      id="new-price"
                      type="number"
                      value={newBeer.price || ""}
                      onChange={(e) =>
                        setNewBeer({
                          ...newBeer,
                          price: Number(e.target.value),
                        })
                      }
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
                      onChange={(e) =>
                        setNewBeer({
                          ...newBeer,
                          stock: Number(e.target.value),
                        })
                      }
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
                      onChange={(e) =>
                        setNewBeer({ ...newBeer, image: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label
                      htmlFor="new-description"
                      className="text-right pt-2"
                    >
                      Descripción
                    </Label>
                    <textarea
                      id="new-description"
                      value={newBeer.description}
                      onChange={(e) =>
                        setNewBeer({ ...newBeer, description: e.target.value })
                      }
                      className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={handleAddBeer}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Añadiendo...
                      </span>
                    ) : (
                      "Añadir Cerveza"
                    )}
                  </Button>
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
                {isLoadingBeers ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex justify-center">
                        <LoadingSpinner size="md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredBeers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No se encontraron cervezas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBeers.map((beer) => (
                    <TableRow key={beer.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden">
                          <Image
                            src={beer.image || "/images/placeholder-beer.png"}
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
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 hover:bg-red-50"
                          >
                            Bajo: {beer.stock} unidades
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 hover:bg-green-50"
                          >
                            {beer.stock} unidades
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBeer(beer.id)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Editar Cerveza</DialogTitle>
                                <DialogDescription>
                                  Modifica los detalles de la cerveza
                                  seleccionada.
                                </DialogDescription>
                              </DialogHeader>
                              {editingBeer && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-name"
                                      className="text-right"
                                    >
                                      Nombre
                                    </Label>
                                    <Input
                                      id="edit-name"
                                      value={editingBeer.name}
                                      onChange={(e) =>
                                        setEditingBeer({
                                          ...editingBeer,
                                          name: e.target.value,
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-type"
                                      className="text-right"
                                    >
                                      Tipo
                                    </Label>
                                    <Input
                                      id="edit-type"
                                      value={editingBeer.type}
                                      onChange={(e) =>
                                        setEditingBeer({
                                          ...editingBeer,
                                          type: e.target.value,
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-typeId"
                                      className="text-right"
                                    >
                                      Categoría
                                    </Label>
                                    <Select
                                      value={editingBeer.typeId}
                                      onValueChange={(value) =>
                                        setEditingBeer({
                                          ...editingBeer,
                                          typeId: value as BeerType,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona una categoría" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="golden">
                                          Golden Ale
                                        </SelectItem>
                                        <SelectItem value="red">
                                          Red Ale
                                        </SelectItem>
                                        <SelectItem value="ipa">IPA</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-price"
                                      className="text-right"
                                    >
                                      Precio
                                    </Label>
                                    <Input
                                      id="edit-price"
                                      type="number"
                                      value={editingBeer.price}
                                      onChange={(e) =>
                                        setEditingBeer({
                                          ...editingBeer,
                                          price: Number(e.target.value),
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-stock"
                                      className="text-right"
                                    >
                                      Stock
                                    </Label>
                                    <Input
                                      id="edit-stock"
                                      type="number"
                                      value={editingBeer.stock}
                                      onChange={(e) =>
                                        setEditingBeer({
                                          ...editingBeer,
                                          stock: Number(e.target.value),
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-image"
                                      className="text-right"
                                    >
                                      Imagen URL
                                    </Label>
                                    <Input
                                      id="edit-image"
                                      value={editingBeer.image}
                                      onChange={(e) =>
                                        setEditingBeer({
                                          ...editingBeer,
                                          image: e.target.value,
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label
                                      htmlFor="edit-description"
                                      className="text-right pt-2"
                                    >
                                      Descripción
                                    </Label>
                                    <textarea
                                      id="edit-description"
                                      value={editingBeer.description}
                                      onChange={(e) =>
                                        setEditingBeer({
                                          ...editingBeer,
                                          description: e.target.value,
                                        })
                                      }
                                      className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingBeer(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  className="bg-amber-600 hover:bg-amber-700"
                                  onClick={handleSaveBeer}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <span className="flex items-center">
                                      <LoadingSpinner
                                        size="sm"
                                        className="mr-2"
                                      />
                                      Guardando...
                                    </span>
                                  ) : (
                                    "Guardar Cambios"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteBeer(beer.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
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
                  <DialogDescription>
                    Completa los detalles para añadir un nuevo plan de
                    suscripción.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-sub-name" className="text-right">
                      Nombre
                    </Label>
                    <Input
                      id="new-sub-name"
                      value={newSubscription.name}
                      onChange={(e) =>
                        setNewSubscription({
                          ...newSubscription,
                          name: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setNewSubscription({
                          ...newSubscription,
                          liters: Number(e.target.value),
                        })
                      }
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
                      onChange={(e) =>
                        setNewSubscription({
                          ...newSubscription,
                          price: Number(e.target.value),
                        })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label
                      htmlFor="new-sub-features"
                      className="text-right pt-2"
                    >
                      Características
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="new-feature"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Añadir característica..."
                        />
                        <Button type="button" onClick={handleAddFeatureToNew}>
                          Añadir
                        </Button>
                      </div>
                      <div className="space-y-2 mt-2">
                        {newSubscription.features?.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <span>{feature}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFeatureFromNew(index)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={handleAddSubscription}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Añadiendo...
                      </span>
                    ) : (
                      "Añadir Plan"
                    )}
                  </Button>
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
                {isLoadingSubscriptions ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex justify-center">
                        <LoadingSpinner size="md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No se encontraron planes de suscripción
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.name}
                      </TableCell>
                      <TableCell>{subscription.liters} litros</TableCell>
                      <TableCell>${subscription.price}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {subscription.features.length} características
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.popular ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 hover:bg-amber-50"
                          >
                            Popular
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleEditSubscription(subscription.id)
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>
                                  Editar Plan de Suscripción
                                </DialogTitle>
                                <DialogDescription>
                                  Modifica los detalles del plan de suscripción.
                                </DialogDescription>
                              </DialogHeader>
                              {editingSubscription && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-sub-name"
                                      className="text-right"
                                    >
                                      Nombre
                                    </Label>
                                    <Input
                                      id="edit-sub-name"
                                      value={editingSubscription.name}
                                      onChange={(e) =>
                                        setEditingSubscription({
                                          ...editingSubscription,
                                          name: e.target.value,
                                        })
                                      }
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                      htmlFor="edit-sub-liters"
                                      className="text-right"
                                    >
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
                                    <Label
                                      htmlFor="edit-sub-price"
                                      className="text-right"
                                    >
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
                                    <Label
                                      htmlFor="edit-sub-popular"
                                      className="text-right"
                                    >
                                      Popular
                                    </Label>
                                    <div className="flex items-center space-x-2 col-span-3">
                                      <Checkbox
                                        id="edit-sub-popular"
                                        checked={editingSubscription.popular}
                                        onCheckedChange={(checked) =>
                                          setEditingSubscription({
                                            ...editingSubscription,
                                            popular: checked === true,
                                          })
                                        }
                                      />
                                      <label
                                        htmlFor="edit-sub-popular"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        Marcar como plan popular
                                      </label>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-4">
                                    <Label
                                      htmlFor="edit-sub-features"
                                      className="text-right pt-2"
                                    >
                                      Características
                                    </Label>
                                    <div className="col-span-3 space-y-2">
                                      <div className="flex gap-2">
                                        <Input
                                          id="edit-feature"
                                          value={newFeature}
                                          onChange={(e) =>
                                            setNewFeature(e.target.value)
                                          }
                                          placeholder="Añadir característica..."
                                        />
                                        <Button
                                          type="button"
                                          onClick={handleAddFeature}
                                        >
                                          Añadir
                                        </Button>
                                      </div>
                                      <div className="space-y-2 mt-2">
                                        {editingSubscription.features.map(
                                          (feature, index) => (
                                            <div
                                              key={index}
                                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                            >
                                              <span>{feature}</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleRemoveFeature(index)
                                                }
                                              >
                                                <X className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingSubscription(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  className="bg-amber-600 hover:bg-amber-700"
                                  onClick={handleSaveSubscription}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <span className="flex items-center">
                                      <LoadingSpinner
                                        size="sm"
                                        className="mr-2"
                                      />
                                      Guardando...
                                    </span>
                                  ) : (
                                    "Guardar Cambios"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              handleDeleteSubscription(subscription.id)
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
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

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este{" "}
              {productToDelete?.type === "beer"
                ? "producto"
                : "plan de suscripción"}
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Eliminando...
                </span>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
