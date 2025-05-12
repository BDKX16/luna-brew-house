"use client";

import { useState, useEffect } from "react";
import { Calendar, Copy, Edit, Plus, Trash2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getAdminDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
} from "@/services/private";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Tipos
interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase?: number;
  validFrom: string;
  validUntil: string;
  description: string;
  appliesTo: "all" | "beer" | "subscription";
  active: boolean;
  usageCount: number;
  usageLimit?: number;
}

export default function PromocionesPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({
    code: "",
    type: "percentage",
    value: 10,
    appliesTo: "all",
    description: "",
    validFrom: new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    validUntil: new Date(
      new Date().setMonth(new Date().getMonth() + 3)
    ).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    active: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { loading, callEndpoint } = useFetchAndLoad();

  // Cargar los descuentos al iniciar
  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Obtener todos los descuentos desde la API
  const fetchDiscounts = async () => {
    setIsLoadingDiscounts(true);
    try {
      const response = await callEndpoint(getAdminDiscounts());
      if (response && response.data && response.data.discounts) {
        setDiscounts(response.data.discounts);
      }
    } catch (error) {
      console.error("Error al obtener descuentos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los descuentos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDiscounts(false);
    }
  };

  // Filtrar descuentos
  const filteredDiscounts = discounts.filter(
    (discount) =>
      (activeTab === "active" ? discount.active : !discount.active) &&
      (discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        discount.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Funciones para gestionar descuentos
  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount({ ...discount });
  };

  const handleSaveDiscount = async () => {
    if (!editingDiscount) return;

    try {
      const response = await callEndpoint(
        updateDiscount(editingDiscount.id, editingDiscount)
      );

      if (response && response.data) {
        await fetchDiscounts(); // Recargar la lista de descuentos
        setEditingDiscount(null);

        toast({
          title: "Promoción actualizada",
          description: `El código ${editingDiscount.code} ha sido actualizado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al actualizar descuento:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la promoción",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!discountToDelete) return;

    try {
      const response = await callEndpoint(deleteDiscount(discountToDelete));

      if (response) {
        await fetchDiscounts(); // Recargar la lista de descuentos
        setIsDeleteDialogOpen(false);
        setDiscountToDelete(null);

        toast({
          title: "Promoción eliminada",
          description: "La promoción ha sido eliminada correctamente.",
        });
      }
    } catch (error) {
      console.error("Error al eliminar descuento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la promoción",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiscount = (id: string) => {
    setDiscountToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const response = await callEndpoint(toggleDiscount(id));

      if (response && response.data) {
        await fetchDiscounts(); // Recargar la lista de descuentos

        const discount = discounts.find((d) => d.id === id);
        toast({
          title: active ? "Promoción activada" : "Promoción desactivada",
          description: `El código ${discount?.code} ha sido ${
            active ? "activado" : "desactivado"
          } correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al cambiar estado del descuento:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la promoción",
        variant: "destructive",
      });
    }
  };

  const handleAddDiscount = async () => {
    if (!newDiscount.code || !newDiscount.description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const discountToAdd = {
        id: `disc-${Date.now()}`,
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
      };

      const response = await callEndpoint(createDiscount(discountToAdd));

      if (response && response.data) {
        await fetchDiscounts(); // Recargar la lista de descuentos
        setIsCreating(false);
        setNewDiscount({
          code: "",
          type: "percentage",
          value: 10,
          appliesTo: "all",
          description: "",
          validFrom: new Date().toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          validUntil: new Date(
            new Date().setMonth(new Date().getMonth() + 3)
          ).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          active: true,
        });

        toast({
          title: "Promoción creada",
          description: `El código ${discountToAdd.code} ha sido creado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al crear descuento:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la promoción",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado",
      description: `El código ${code} ha sido copiado al portapapeles.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestión de Promociones
          </h1>
          <p className="text-muted-foreground">
            Administra los códigos de descuento para tu tienda.
          </p>
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
                <DialogDescription>
                  Completa los detalles para crear un nuevo código de descuento.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-code">Código</Label>
                    <Input
                      id="new-code"
                      value={newDiscount.code}
                      onChange={(e) =>
                        setNewDiscount({
                          ...newDiscount,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="Ej: VERANO25"
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-type">Tipo de descuento</Label>
                    <Select
                      value={newDiscount.type}
                      onValueChange={(value) =>
                        setNewDiscount({
                          ...newDiscount,
                          type: value as "percentage" | "fixed",
                        })
                      }
                    >
                      <SelectTrigger id="new-type">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          Porcentaje (%)
                        </SelectItem>
                        <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-value">
                      {newDiscount.type === "percentage"
                        ? "Porcentaje de descuento"
                        : "Monto de descuento"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-value"
                        type="number"
                        value={newDiscount.value || ""}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            value: Number(e.target.value),
                          })
                        }
                        className="pl-8"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        {newDiscount.type === "percentage" ? "%" : "$"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-min-purchase">
                      Compra mínima (opcional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-min-purchase"
                        type="number"
                        value={newDiscount.minPurchase || ""}
                        onChange={(e) =>
                          setNewDiscount({
                            ...newDiscount,
                            minPurchase: e.target.value
                              ? Number(e.target.value)
                              : undefined,
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
                    onChange={(e) =>
                      setNewDiscount({
                        ...newDiscount,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ej: 25% de descuento en toda la tienda"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-valid-from">Válido desde</Label>
                    <Input
                      id="new-valid-from"
                      value={newDiscount.validFrom}
                      onChange={(e) =>
                        setNewDiscount({
                          ...newDiscount,
                          validFrom: e.target.value,
                        })
                      }
                      placeholder="Ej: 01 Jan, 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-valid-until">Válido hasta</Label>
                    <Input
                      id="new-valid-until"
                      value={newDiscount.validUntil}
                      onChange={(e) =>
                        setNewDiscount({
                          ...newDiscount,
                          validUntil: e.target.value,
                        })
                      }
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
                        setNewDiscount({
                          ...newDiscount,
                          appliesTo: value as "all" | "beer" | "subscription",
                        })
                      }
                    >
                      <SelectTrigger id="new-applies-to">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los productos</SelectItem>
                        <SelectItem value="beer">Solo cervezas</SelectItem>
                        <SelectItem value="subscription">
                          Solo suscripciones
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-usage-limit">
                      Límite de usos (opcional)
                    </Label>
                    <Input
                      id="new-usage-limit"
                      type="number"
                      value={newDiscount.usageLimit || ""}
                      onChange={(e) =>
                        setNewDiscount({
                          ...newDiscount,
                          usageLimit: e.target.value
                            ? Number(e.target.value)
                            : undefined,
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
                    onCheckedChange={(checked) =>
                      setNewDiscount({ ...newDiscount, active: checked })
                    }
                  />
                  <Label htmlFor="new-active">
                    Activar promoción inmediatamente
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={handleAddDiscount}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creando...
                    </span>
                  ) : (
                    "Crear Promoción"
                  )}
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

      <Tabs
        defaultValue="active"
        value={activeTab}
        onValueChange={setActiveTab}
      >
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
                  {isLoadingDiscounts ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="flex justify-center">
                          <LoadingSpinner size="md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No se encontraron promociones activas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDiscounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              {discount.code}
                            </Badge>
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
                            <div className="text-xs text-muted-foreground">
                              Mínimo: ${discount.minPurchase}
                            </div>
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
                              <span className="text-xs text-muted-foreground ml-1">
                                / {discount.usageLimit} máx.
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditDiscount(discount)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Editar Promoción</DialogTitle>
                                  <DialogDescription>
                                    Modifica los detalles del código de
                                    descuento.
                                  </DialogDescription>
                                </DialogHeader>
                                {editingDiscount && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-code">
                                          Código
                                        </Label>
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
                                        <Label htmlFor="edit-type">
                                          Tipo de descuento
                                        </Label>
                                        <Select
                                          value={editingDiscount.type}
                                          onValueChange={(value) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              type: value as
                                                | "percentage"
                                                | "fixed",
                                            })
                                          }
                                        >
                                          <SelectTrigger id="edit-type">
                                            <SelectValue placeholder="Selecciona un tipo" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">
                                              Porcentaje (%)
                                            </SelectItem>
                                            <SelectItem value="fixed">
                                              Monto fijo ($)
                                            </SelectItem>
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
                                            {editingDiscount.type ===
                                            "percentage"
                                              ? "%"
                                              : "$"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-min-purchase">
                                          Compra mínima (opcional)
                                        </Label>
                                        <div className="relative">
                                          <Input
                                            id="edit-min-purchase"
                                            type="number"
                                            value={
                                              editingDiscount.minPurchase || ""
                                            }
                                            onChange={(e) =>
                                              setEditingDiscount({
                                                ...editingDiscount,
                                                minPurchase: e.target.value
                                                  ? Number(e.target.value)
                                                  : undefined,
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
                                      <Label htmlFor="edit-description">
                                        Descripción
                                      </Label>
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
                                        <Label htmlFor="edit-valid-from">
                                          Válido desde
                                        </Label>
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
                                        <Label htmlFor="edit-valid-until">
                                          Válido hasta
                                        </Label>
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
                                        <Label htmlFor="edit-applies-to">
                                          Aplica a
                                        </Label>
                                        <Select
                                          value={editingDiscount.appliesTo}
                                          onValueChange={(value) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              appliesTo: value as
                                                | "all"
                                                | "beer"
                                                | "subscription",
                                            })
                                          }
                                        >
                                          <SelectTrigger id="edit-applies-to">
                                            <SelectValue placeholder="Selecciona una opción" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="all">
                                              Todos los productos
                                            </SelectItem>
                                            <SelectItem value="beer">
                                              Solo cervezas
                                            </SelectItem>
                                            <SelectItem value="subscription">
                                              Solo suscripciones
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-usage-limit">
                                          Límite de usos (opcional)
                                        </Label>
                                        <Input
                                          id="edit-usage-limit"
                                          type="number"
                                          value={
                                            editingDiscount.usageLimit || ""
                                          }
                                          onChange={(e) =>
                                            setEditingDiscount({
                                              ...editingDiscount,
                                              usageLimit: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
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
                                          setEditingDiscount({
                                            ...editingDiscount,
                                            active: checked,
                                          })
                                        }
                                      />
                                      <Label htmlFor="edit-active">
                                        Promoción activa
                                      </Label>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingDiscount(null)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    className="bg-amber-600 hover:bg-amber-700"
                                    onClick={handleSaveDiscount}
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
                                handleToggleActive(discount.id, false)
                              }
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
                  {isLoadingDiscounts ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="flex justify-center">
                          <LoadingSpinner size="md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
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
                            <div className="text-xs text-muted-foreground">
                              Mínimo: ${discount.minPurchase}
                            </div>
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
                              <span className="text-xs text-muted-foreground ml-1">
                                / {discount.usageLimit} máx.
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                              onClick={() =>
                                handleToggleActive(discount.id, true)
                              }
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
                                  <DialogTitle>
                                    Confirmar eliminación
                                  </DialogTitle>
                                  <DialogDescription>
                                    ¿Estás seguro de que deseas eliminar el
                                    código de descuento "{discount.code}"? Esta
                                    acción no se puede deshacer.
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
                                    onClick={() =>
                                      handleDeleteDiscount(discount.id)
                                    }
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <span className="flex items-center">
                                        <LoadingSpinner
                                          size="sm"
                                          className="mr-2"
                                        />
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

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta promoción? Esta acción
              no se puede deshacer.
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
                Usa códigos cortos y fáciles de recordar. Relaciona el código
                con la promoción (ej: VERANO25 para 25% en verano).
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Limitaciones estratégicas</h3>
              <p className="text-sm text-muted-foreground">
                Establece límites de uso o fechas de caducidad para crear
                sensación de urgencia y exclusividad.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Seguimiento y análisis</h3>
              <p className="text-sm text-muted-foreground">
                Monitorea qué códigos generan más ventas para optimizar tus
                estrategias de marketing futuras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
