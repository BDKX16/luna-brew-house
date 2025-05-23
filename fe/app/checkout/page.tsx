"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Check,
  Info,
  Truck,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import UserAuthForm from "@/components/auth/user-auth-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Definición de tipos
type BeerType = "golden" | "red" | "ipa";

interface Beer {
  id: string;
  name: string;
  type: string;
  typeId: BeerType;
  price: number;
  image: string;
}

interface Subscription {
  id: string;
  name: string;
  liters: number;
  beerType: BeerType;
  features: string[];
  popular?: boolean;
}

interface CartItem {
  id: string;
  type: "beer" | "subscription";
  quantity: number;
  product: Beer | Subscription;
}

interface Discount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase?: number;
  validUntil: string;
  description: string;
  appliesTo?: "all" | "beer" | "subscription";
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSubscriptionSuggestion, setShowSubscriptionSuggestion] =
    useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "auth" | "payment">(
    "cart"
  );
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountError, setDiscountError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Usar una referencia para evitar múltiples ejecuciones
  const hasProcessedUrl = React.useRef(false);

  // Simular que venimos de una página anterior con un producto ya seleccionado
  useEffect(() => {
    // Solo procesar una vez y solo del lado del cliente
    if (typeof window !== "undefined" && !hasProcessedUrl.current) {
      hasProcessedUrl.current = true;

      const params = new URLSearchParams(window.location.search);
      const productId = params.get("product");
      const productType = params.get("type");
      const beerType = params.get("beer-type") as BeerType | null;

      console.log(productId);

      if (productId && productType) {
        // Verificar si ya existe un producto del mismo tipo
        const existingOfSameType = cart.find(
          (item) =>
            (productType === "subscription" && item.type === "subscription") ||
            item.id === productId
        );

        if (!existingOfSameType) {
          if (productType === "beer") {
            const beer = beers.find((b) => b.id === productId);
            if (beer) {
              addToCart({
                id: beer.id,
                type: "beer",
                quantity: 1,
                product: beer,
              });
            }
          } else if (productType === "subscription") {
            const subscription = subscriptionPlans.find(
              (s) => s.id === productId
            );
            if (subscription && beerType) {
              // Si viene un tipo de cerveza en los parámetros, lo usamos
              addToCart({
                id: subscription.id,
                type: "subscription",
                quantity: 1,
                product: {
                  ...subscription,
                  beerType: beerType, // Asignar el tipo de cerveza recibido por parámetro
                },
              });
            } else if (subscription) {
              // Si no viene tipo de cerveza, usar el predeterminado de la suscripción
              addToCart({
                id: subscription.id,
                type: "subscription",
                quantity: 1,
                product: subscription,
              });
            }
          }
        }
      }
    }
  }, []); // Sin dependencias para ejecutar solo en el montaje

  // Verificar si debemos mostrar sugerencias de suscripción
  useEffect(() => {
    const hasSubscription = cart.some((item) => item.type === "subscription");
    const hasOnlyBeers =
      cart.length > 0 && cart.every((item) => item.type === "beer");

    setShowSubscriptionSuggestion(hasOnlyBeers && !hasSubscription);
  }, [cart]);

  // Funciones para el carrito
  const addToCart = (item: CartItem) => {
    // Si es una suscripción, verificar que no haya otra suscripción en el carrito
    if (item.type === "subscription") {
      const existingSubscription = cart.find(
        (cartItem) => cartItem.type === "subscription"
      );
      if (existingSubscription) {
        // Reemplazar la suscripción existente
        setCart((prevCart) =>
          prevCart.map((cartItem) =>
            cartItem.type === "subscription" ? item : cartItem
          )
        );
        return;
      }
    }

    // Verificar si el producto específico ya está en el carrito
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      // Actualizar cantidad
      setCart((prevCart) =>
        prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        )
      );
    } else {
      // Añadir nuevo item
      setCart((prevCart) => [...prevCart, item]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));

    // Si se elimina un producto, también eliminar el descuento aplicado
    if (appliedDiscount) {
      setAppliedDiscount(null);
      setDiscountCode("");
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );

    // Si cambia la cantidad, verificar si el descuento sigue siendo válido
    if (appliedDiscount && appliedDiscount.minPurchase) {
      const newSubtotal = calculateSubtotal();
      if (newSubtotal < appliedDiscount.minPurchase) {
        setAppliedDiscount(null);
        setDiscountCode("");
        toast({
          title: "Descuento eliminado",
          description: `El descuento requiere una compra mínima de $${appliedDiscount.minPurchase}`,
          variant: "destructive",
        });
      }
    }
  };

  const updateSubscriptionBeerType = (
    subscriptionId: string,
    beerType: BeerType
  ) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === subscriptionId
          ? {
              ...item,
              product: {
                ...(item.product as Subscription),
                beerType,
              } as Subscription,
            }
          : item
      )
    );
  };

  // Cálculos para el carrito
  const calculateSubscriptionPrice = (subscription: Subscription) => {
    const regularPrice =
      beerPrices[subscription.beerType] * subscription.liters;
    return Math.round(regularPrice * 0.8); // 20% de descuento
  };

  const calculateRegularSubscriptionPrice = (subscription: Subscription) => {
    return beerPrices[subscription.beerType] * subscription.liters;
  };

  const calculateItemPrice = (item: CartItem) => {
    if (item.type === "beer") {
      return (item.product as Beer).price * item.quantity;
    } else {
      return (
        calculateSubscriptionPrice(item.product as Subscription) * item.quantity
      );
    }
  };

  const calculateTotalSavings = () => {
    let savings = 0;

    cart.forEach((item) => {
      if (item.type === "subscription") {
        const subscription = item.product as Subscription;
        const regularPrice = calculateRegularSubscriptionPrice(subscription);
        const discountedPrice = calculateSubscriptionPrice(subscription);
        savings += (regularPrice - discountedPrice) * item.quantity;
      }
    });

    return savings;
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;

    const subtotal = calculateSubtotal();

    // Si el descuento aplica solo a ciertos productos, calcular el subtotal de esos productos
    let applicableSubtotal = subtotal;
    if (appliedDiscount.appliesTo && appliedDiscount.appliesTo !== "all") {
      applicableSubtotal = cart
        .filter((item) => item.type === appliedDiscount.appliesTo)
        .reduce((total, item) => total + calculateItemPrice(item), 0);
    }

    if (appliedDiscount.type === "percentage") {
      return Math.round((applicableSubtotal * appliedDiscount.value) / 100);
    } else {
      // Para descuentos de monto fijo, asegurarse de que no exceda el subtotal
      return Math.min(appliedDiscount.value, applicableSubtotal);
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return subtotal - discountAmount;
  };

  const hasSubscription = cart.some((item) => item.type === "subscription");

  const handleProceedToCheckout = () => {
    if (isAuthenticated) {
      // Si el usuario está autenticado, ir directamente al pago
      setCheckoutStep("payment");
    } else {
      // Si no está autenticado, mostrar opciones de autenticación
      setCheckoutStep("auth");
    }
  };

  const handleAuthComplete = () => {
    setCheckoutStep("payment");
  };

  const handleCreateAccount = () => {
    router.push("/auth/registro");
  };

  // Función para aplicar código de descuento
  const applyDiscountCode = () => {
    // Limpiar error previo
    setDiscountError("");

    // Verificar si el código está vacío
    if (!discountCode.trim()) {
      setDiscountError("Por favor ingresa un código de descuento");
      return;
    }

    // Buscar el código en los descuentos disponibles
    const discount = availableDiscounts.find(
      (d) => d.code.toLowerCase() === discountCode.trim().toLowerCase()
    );

    // Verificar si el código existe
    if (!discount) {
      setDiscountError("Código de descuento inválido");
      return;
    }

    // Verificar si el código ha expirado
    const validUntil = new Date(discount.validUntil);
    const now = new Date();
    if (validUntil < now) {
      setDiscountError("Este código de descuento ha expirado");
      return;
    }

    // Verificar si cumple con la compra mínima
    if (discount.minPurchase && calculateSubtotal() < discount.minPurchase) {
      setDiscountError(
        `Este código requiere una compra mínima de $${discount.minPurchase}`
      );
      return;
    }

    // Verificar si aplica al tipo de productos en el carrito
    if (discount.appliesTo && discount.appliesTo !== "all") {
      const hasApplicableItems = cart.some(
        (item) => item.type === discount.appliesTo
      );
      if (!hasApplicableItems) {
        setDiscountError(
          `Este código solo aplica a ${
            discount.appliesTo === "beer" ? "cervezas" : "suscripciones"
          }`
        );
        return;
      }
    }

    // Aplicar el descuento
    setAppliedDiscount(discount);
    toast({
      title: "¡Código aplicado!",
      description: discount.description,
    });
  };

  // Función para eliminar código de descuento
  const removeDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    toast({
      title: "Código de descuento eliminado",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image
                  src="/images/luna-logo.png"
                  alt="Luna logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold">Luna Brew House</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium flex items-center gap-1 hover:text-amber-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver a la tienda
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Tu Carrito</h1>
            <p className="text-muted-foreground mt-1">
              Revisa y completa tu compra
            </p>
          </div>

          <div className="mb-6">
            <Alert className="bg-amber-50 border-amber-200">
              <Truck className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <span className="font-bold">¡Envío GRATIS!</span> Acercamos la
                cerveza a tu casa sin cargo adicional en Mar del Plata.
              </AlertDescription>
            </Alert>
          </div>

          {checkoutStep === "cart" && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {/* Carrito vacío */}
                {cart.length === 0 && (
                  <div className="rounded-lg border border-dashed p-12 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                      Tu carrito está vacío
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Parece que aún no has añadido ningún producto a tu
                      carrito.
                    </p>
                    <Button
                      asChild
                      className="mt-6 rounded-full bg-amber-600 hover:bg-amber-700"
                    >
                      <Link href="/">Explorar productos</Link>
                    </Button>
                  </div>
                )}

                {/* Productos en el carrito */}
                {cart.length > 0 && (
                  <div className="space-y-6">
                    {/* Suscripciones */}
                    {cart
                      .filter((item) => item.type === "subscription")
                      .map((item) => {
                        const subscription = item.product as Subscription;
                        const regularPrice =
                          calculateRegularSubscriptionPrice(subscription);
                        const discountedPrice =
                          calculateSubscriptionPrice(subscription);
                        const savings = regularPrice - discountedPrice;

                        return (
                          <Card
                            key={item.id}
                            className="overflow-hidden rounded-xl"
                          >
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row">
                                <div className="bg-amber-50 p-4 sm:p-6 sm:w-1/3">
                                  <div className="flex items-center justify-between">
                                    <Badge className="bg-amber-600 hover:bg-amber-700">
                                      Suscripción
                                    </Badge>
                                    {subscription.popular && (
                                      <Badge className="bg-amber-800 hover:bg-amber-900">
                                        Popular
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="mt-3 text-xl font-bold">
                                    {subscription.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {subscription.liters} litros por mes
                                  </p>

                                  <div className="mt-4 space-y-1">
                                    <p className="text-sm font-medium">
                                      Incluye:
                                    </p>
                                    <ul className="space-y-1">
                                      {subscription.features.map(
                                        (feature, i) => (
                                          <li
                                            key={i}
                                            className="flex items-start gap-2 text-xs"
                                          >
                                            <Check className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                          </li>
                                        )
                                      )}
                                      <li className="flex items-start gap-2 text-xs font-medium text-amber-700">
                                        <Check className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                                        <span>
                                          1 botella de Luna Especial GRATIS
                                        </span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>

                                <div className="p-4 sm:p-6 flex-1">
                                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium">
                                          Variedad de cerveza:
                                        </label>
                                        <Select
                                          value={subscription.beerType}
                                          onValueChange={(value: BeerType) =>
                                            updateSubscriptionBeerType(
                                              item.id,
                                              value
                                            )
                                          }
                                        >
                                          <SelectTrigger className="w-full mt-1 rounded-full">
                                            <SelectValue placeholder="Selecciona una variedad" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="golden">
                                              Luna Dorada (Golden Ale)
                                            </SelectItem>
                                            <SelectItem value="red">
                                              Luna Roja (Irish Red Ale)
                                            </SelectItem>
                                            <SelectItem value="ipa">
                                              Luna Brillante (IPA)
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <p className="text-sm font-medium">
                                              Precio regular por litro:
                                            </p>
                                            <p className="text-lg line-through text-muted-foreground">
                                              $
                                              {
                                                beerPrices[
                                                  subscription.beerType
                                                ]
                                              }
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-medium">
                                              Tu precio por litro:
                                            </p>
                                            <p className="text-xl font-bold text-amber-700">
                                              $
                                              {Math.round(
                                                beerPrices[
                                                  subscription.beerType
                                                ] * 0.8
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-sm text-amber-700 font-medium">
                                          ¡Ahorras $
                                          {Math.round(
                                            beerPrices[subscription.beerType] *
                                              0.2
                                          )}{" "}
                                          por litro con esta suscripción!
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-amber-100">
                                          <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium">
                                              Total mensual:
                                            </p>
                                            <p className="text-lg font-bold text-amber-700">
                                              $
                                              {calculateSubscriptionPrice(
                                                subscription
                                              )}
                                            </p>
                                          </div>
                                          <p className="text-xs text-amber-600 text-right">
                                            por {subscription.liters} litros
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-row sm:flex-col justify-between items-end">
                                      {/* Eliminado el selector de cantidad para suscripciones */}
                                      <div className="bg-amber-100 px-3 py-1 rounded-full text-amber-800 font-medium">
                                        Plan mensual
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                        onClick={() => removeFromCart(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                    {/* Cervezas individuales */}
                    {cart
                      .filter((item) => item.type === "beer")
                      .map((item) => {
                        const beer = item.product as Beer;

                        return (
                          <Card
                            key={item.id}
                            className="overflow-hidden rounded-xl"
                          >
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row">
                                <div className="relative h-32 sm:h-auto sm:w-1/4">
                                  <Image
                                    src={beer.image || "/placeholder.svg"}
                                    alt={beer.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>

                                <div className="p-4 sm:p-6 flex-1">
                                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div>
                                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                        {beer.type}
                                      </Badge>
                                      <h3 className="mt-2 text-xl font-bold">
                                        {beer.name}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        Cerveza artesanal premium
                                      </p>

                                      <div className="mt-4">
                                        <p className="text-lg font-bold text-amber-700">
                                          ${beer.price}{" "}
                                          <span className="text-sm font-normal">
                                            /litro
                                          </span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-row sm:flex-col justify-between items-end">
                                      <div className="flex items-center gap-3">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={() =>
                                            updateQuantity(
                                              item.id,
                                              item.quantity - 1
                                            )
                                          }
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center">
                                          {item.quantity}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={() =>
                                            updateQuantity(
                                              item.id,
                                              item.quantity + 1
                                            )
                                          }
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                        onClick={() => removeFromCart(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}

                {/* Sugerencia de suscripción */}
                {showSubscriptionSuggestion && (
                  <div className="mt-8">
                    <Alert className="bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">
                        ¿Sabías que puedes ahorrar?
                      </AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Suscríbite a nuestro Club Luna y obtene un 20% de
                        descuento en tus cervezas favoritas, además de una
                        botella de edición especial gratis cada mes.
                      </AlertDescription>
                    </Alert>

                    <div className="mt-4">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="subscription-plans">
                          <AccordionTrigger className="text-amber-700 hover:text-amber-800">
                            Ver planes de suscripción
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              {subscriptionPlans.map((plan) => (
                                <Card
                                  key={plan.id}
                                  className={`overflow-hidden rounded-xl border ${
                                    plan.popular ? "border-amber-500" : ""
                                  }`}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      {plan.popular && (
                                        <Badge className="bg-amber-500 hover:bg-amber-600">
                                          Más popular
                                        </Badge>
                                      )}
                                      <h3 className="font-bold">{plan.name}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {plan.liters} litros por mes
                                      </p>

                                      <div className="pt-2">
                                        <p className="text-sm font-medium">
                                          Desde
                                        </p>
                                        <p className="text-xl font-bold text-amber-700">
                                          $
                                          {Math.round(
                                            beerPrices.golden *
                                              plan.liters *
                                              0.8
                                          )}
                                          <span className="text-sm font-normal text-muted-foreground">
                                            {" "}
                                            /mes
                                          </span>
                                        </p>
                                      </div>

                                      <Button
                                        className={`w-full rounded-full mt-2 ${
                                          plan.popular
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : "bg-amber-500 hover:bg-amber-600"
                                        }`}
                                        onClick={() =>
                                          addToCart({
                                            id: plan.id,
                                            type: "subscription",
                                            quantity: 1,
                                            product: plan,
                                          })
                                        }
                                      >
                                        Añadir al carrito
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                )}

                {/* Añadir más productos */}
                {cart.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">
                      ¿Quieres añadir más productos?
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {beers.map((beer) => {
                        const isInCart = cart.some(
                          (item) => item.id === beer.id
                        );

                        return (
                          <Card
                            key={beer.id}
                            className="overflow-hidden rounded-xl"
                          >
                            <div className="relative h-32">
                              <Image
                                src={beer.image || "/placeholder.svg"}
                                alt={beer.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-bold">{beer.name}</h3>
                              <p className="text-sm text-amber-700">
                                {beer.type}
                              </p>
                              <p className="text-lg font-bold text-amber-700 mt-2">
                                ${beer.price}{" "}
                                <span className="text-sm font-normal">
                                  /litro
                                </span>
                              </p>

                              <Button
                                className="w-full rounded-full mt-3 bg-amber-600 hover:bg-amber-700"
                                disabled={isInCart}
                                onClick={() =>
                                  addToCart({
                                    id: beer.id,
                                    type: "beer",
                                    quantity: 1,
                                    product: beer,
                                  })
                                }
                              >
                                {isInCart
                                  ? "Ya en el carrito"
                                  : "Añadir al carrito"}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de compra */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">
                        Resumen de compra
                      </h3>

                      {cart.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          No hay productos en el carrito
                        </p>
                      ) : (
                        <>
                          <div className="space-y-4">
                            {cart.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm"
                              >
                                <div>
                                  <span className="font-medium">
                                    {item.type === "beer"
                                      ? (item.product as Beer).name
                                      : (item.product as Subscription).name}
                                  </span>
                                  {item.type === "beer" && (
                                    <span className="text-muted-foreground ml-1">
                                      x{item.quantity}
                                    </span>
                                  )}
                                </div>
                                <span>${calculateItemPrice(item)}</span>
                              </div>
                            ))}
                          </div>

                          <Separator className="my-4" />

                          {/* Código de descuento */}
                          <div className="mb-4">
                            {appliedDiscount ? (
                              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-green-600" />
                                    <div>
                                      <p className="text-sm font-medium text-green-800">
                                        {appliedDiscount.code}
                                      </p>
                                      <p className="text-xs text-green-700">
                                        {appliedDiscount.description}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-green-700 hover:text-green-800 hover:bg-green-100 rounded-full"
                                    onClick={removeDiscountCode}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Código de descuento"
                                    value={discountCode}
                                    onChange={(e) =>
                                      setDiscountCode(e.target.value)
                                    }
                                    className="rounded-full"
                                  />
                                  <Button
                                    variant="outline"
                                    className="rounded-full border-amber-600 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                    onClick={applyDiscountCode}
                                  >
                                    Aplicar
                                  </Button>
                                </div>
                                {discountError && (
                                  <p className="text-xs text-red-500 px-2">
                                    {discountError}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>${calculateSubtotal()}</span>
                            </div>

                            {hasSubscription && (
                              <div className="flex justify-between text-green-600 font-medium">
                                <span>Ahorro por suscripción</span>
                                <span>-${calculateTotalSavings()}</span>
                              </div>
                            )}

                            {appliedDiscount && (
                              <div className="flex justify-between text-green-600 font-medium">
                                <span>Descuento ({appliedDiscount.code})</span>
                                <span>-${calculateDiscountAmount()}</span>
                              </div>
                            )}

                            <Separator className="my-2" />

                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span>${calculateTotal()}</span>
                            </div>
                          </div>

                          <div className="mt-6 space-y-4">
                            <Button
                              className="w-full rounded-full bg-amber-600 hover:bg-amber-700"
                              onClick={handleProceedToCheckout}
                            >
                              Proceder al pago
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                              Al proceder con tu compra, aceptas nuestros
                              términos y condiciones y política de privacidad.
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === "auth" && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <Tabs defaultValue="guest" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="guest">
                          Continuar como invitado
                        </TabsTrigger>
                        <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                      </TabsList>
                      <TabsContent value="guest">
                        <UserAuthForm
                          onComplete={handleAuthComplete}
                          onCreateAccount={handleCreateAccount}
                        />
                      </TabsContent>
                      <TabsContent value="login">
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-medium">
                            Inicia sesión para continuar
                          </h3>
                          <Button
                            className="bg-amber-600 hover:bg-amber-700 rounded-full"
                            asChild
                          >
                            <Link
                              href={`/auth/login?redirect=${encodeURIComponent(
                                window.location.pathname +
                                  window.location.search
                              )}`}
                            >
                              Ir a iniciar sesión
                            </Link>
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            ¿No tienes una cuenta?{" "}
                            <Link
                              href="/auth/registro"
                              className="text-amber-600 hover:text-amber-700"
                            >
                              Regístrate
                            </Link>
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">
                        Resumen de compra
                      </h3>
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <div>
                              <span className="font-medium">
                                {item.type === "beer"
                                  ? (item.product as Beer).name
                                  : (item.product as Subscription).name}
                              </span>
                              {item.type === "beer" && (
                                <span className="text-muted-foreground ml-1">
                                  x{item.quantity}
                                </span>
                              )}
                            </div>
                            <span>${calculateItemPrice(item)}</span>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${calculateSubtotal()}</span>
                        </div>

                        {hasSubscription && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Ahorro por suscripción</span>
                            <span>-${calculateTotalSavings()}</span>
                          </div>
                        )}

                        {appliedDiscount && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Descuento ({appliedDiscount.code})</span>
                            <span>-${calculateDiscountAmount()}</span>
                          </div>
                        )}

                        <Separator className="my-2" />

                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>${calculateTotal()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === "payment" && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-6">Método de pago</h3>

                    {isAuthenticated ? (
                      <div className="space-y-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                          <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                            <p className="text-green-800">
                              Sesión iniciada como{" "}
                              <span className="font-bold">
                                {user?.name || user?.email || "Usuario"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <Button className="w-full h-12 rounded-full bg-[#009ee3] hover:bg-[#008fcf] text-white flex items-center justify-center gap-2">
                          <Image
                            src="logo-mercado-pago-icone-512.png"
                            alt="Mercado Pago"
                            width={100}
                            height={24}
                            className="h-6 w-auto"
                          />
                          <span>Pagar con Mercado Pago</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-amber-600">
                          Por favor inicia sesión para continuar con el pago.
                        </p>
                        <Button
                          className="w-full rounded-full bg-amber-600 hover:bg-amber-700"
                          asChild
                        >
                          <Link
                            href={`/auth/login?redirect=${encodeURIComponent(
                              window.location.pathname
                            )}`}
                          >
                            Iniciar sesión
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">
                        Resumen de compra
                      </h3>
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <div>
                              <span className="font-medium">
                                {item.type === "beer"
                                  ? (item.product as Beer).name
                                  : (item.product as Subscription).name}
                              </span>
                              {item.type === "beer" && (
                                <span className="text-muted-foreground ml-1">
                                  x{item.quantity}
                                </span>
                              )}
                            </div>
                            <span>${calculateItemPrice(item)}</span>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${calculateSubtotal()}</span>
                        </div>

                        {hasSubscription && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Ahorro por suscripción</span>
                            <span>-${calculateTotalSavings()}</span>
                          </div>
                        )}

                        {appliedDiscount && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Descuento ({appliedDiscount.code})</span>
                            <span>-${calculateDiscountAmount()}</span>
                          </div>
                        )}

                        <Separator className="my-2" />

                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>${calculateTotal()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-amber-900/5 mt-16">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image
                  src="/images/luna-logo.png"
                  alt="Luna logo"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-bold">Luna Brew House</span>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Luna Brew House. Todos los
              derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
