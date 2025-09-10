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
  ArrowLeft,
  MapPin,
  Edit3,
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserAuthForm from "@/components/auth/user-auth-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getBeers,
  getSubscriptionPlans,
  validateDiscount,
} from "@/services/public";
import {
  createMercadoPagoPreference,
  processDirectPayment,
  updateUserProfile,
} from "@/services/private";
import MercadoPagoOptions from "@/components/checkout/MercadoPagoOptions";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Definición de tipos
type BeerType = "golden" | "red" | "ipa";

interface Beer {
  id: string;
  name: string;
  type: string;
  typeId: BeerType;
  price: number;
  image: string;
  description?: string;
  stock: number;
}

interface Subscription {
  id: string;
  name: string;
  liters: number;
  price: number;
  beerType?: BeerType;
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
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase?: number;
  validUntil?: string;
  description: string;
  appliesTo?: "all" | "beer" | "subscription";
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Subscription[]>(
    []
  );
  const [showSubscriptionSuggestion, setShowSubscriptionSuggestion] =
    useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "auth" | "payment">(
    "cart"
  );
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [loadingBeers, setLoadingBeers] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "cash">(
    "mercadopago"
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [hasValidAddress, setHasValidAddress] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalPhone, setModalPhone] = useState("");
  const [modalAddress, setModalAddress] = useState("");
  const [modalErrors, setModalErrors] = useState({ phone: "", address: "" });
  const [savingAddress, setSavingAddress] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, updateUser } = useAuth();
  const { callEndpoint } = useFetchAndLoad();

  // Definir los precios de los tipos de cerveza
  const beerPrices = {
    golden: 3500,
    red: 4500,
    ipa: 5000,
  };

  // Cargar datos del backend
  useEffect(() => {
    const loadProductsData = async () => {
      try {
        // Cargar cervezas
        setLoadingBeers(true);
        const beersResponse = await callEndpoint(getBeers());
        if (beersResponse && beersResponse.data && beersResponse.data.beers) {
          setBeers(beersResponse.data.beers);
        }
      } catch (error) {
        console.error("Error al cargar cervezas:", error);
        setError("Error al cargar productos");
      } finally {
        setLoadingBeers(false);
      }

      try {
        // Cargar planes de suscripción
        setLoadingSubscriptions(true);
        const subsResponse = await callEndpoint(getSubscriptionPlans());
        if (
          subsResponse &&
          subsResponse.data &&
          subsResponse.data.subscriptions
        ) {
          const subsWithDefaults = subsResponse.data.subscriptions.map(
            (sub: any) => ({
              ...sub,
              beerType: "golden", // Valor por defecto
            })
          );
          setSubscriptionPlans(subsWithDefaults);
        }
      } catch (error) {
        console.error("Error al cargar planes de suscripción:", error);
        setError("Error al cargar planes de suscripción");
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    loadProductsData();
  }, []);

  // Simular que venimos de una página anterior con un producto ya seleccionado
  useEffect(() => {
    // Solo procesar una vez y solo del lado del cliente
    if (
      typeof window !== "undefined" &&
      !loadingBeers &&
      !loadingSubscriptions
    ) {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get("product");
      const productType = params.get("type");
      const beerType = params.get("beer-type") as BeerType | null;

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
  }, [beers, subscriptionPlans, loadingBeers, loadingSubscriptions]); // Ejecutar cuando los datos estén disponibles

  // Manejar productos desde localStorage (para "volver a pedir" con múltiples productos)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !loadingBeers &&
      !loadingSubscriptions
    ) {
      const pendingItems = localStorage.getItem("pendingCartItems");
      if (pendingItems) {
        try {
          const cartItems = JSON.parse(pendingItems);

          // Agregar cada producto al carrito
          cartItems.forEach((item: any) => {
            if (item.type === "beer") {
              // Buscar la cerveza en los productos cargados
              const beer = beers.find((b) => b.id === item.product.id);
              if (beer) {
                addToCart({
                  id: beer.id,
                  type: "beer",
                  quantity: item.quantity || 1,
                  product: beer,
                });
              }
            } else if (item.type === "subscription") {
              // Buscar la suscripción en los planes cargados
              const subscription = subscriptionPlans.find(
                (s) => s.id === item.product.id
              );
              if (subscription) {
                addToCart({
                  id: subscription.id,
                  type: "subscription",
                  quantity: 1, // Suscripciones siempre cantidad 1
                  product: {
                    ...subscription,
                    beerType:
                      item.product.beerType ||
                      subscription.beerType ||
                      "golden",
                  },
                });
              }
            }
          });

          // Limpiar localStorage después de procesar
          localStorage.removeItem("pendingCartItems");
        } catch (error) {
          console.error("Error al procesar productos pendientes:", error);
          localStorage.removeItem("pendingCartItems");
        }
      }
    }
  }, [beers, subscriptionPlans, loadingBeers, loadingSubscriptions]);

  // Verificar si debemos mostrar sugerencias de suscripción
  useEffect(() => {
    const hasSubscription = cart.some((item) => item.type === "subscription");
    const hasOnlyBeers =
      cart.length > 0 && cart.every((item) => item.type === "beer");

    setShowSubscriptionSuggestion(hasOnlyBeers && !hasSubscription);
  }, [cart]);

  // Inicializar dirección de entrega cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user?.address) {
      setDeliveryAddress(user.address);
      setTempAddress(user.address);
      setHasValidAddress(true);
    } else if (isAuthenticated) {
      // Usuario autenticado pero sin dirección
      setDeliveryAddress("");
      setTempAddress("");
      setHasValidAddress(false);
    }
  }, [isAuthenticated, user]);

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

    // Para cervezas, verificar stock disponible
    if (item.type === "beer") {
      const beer = item.product as Beer;

      // Verificar si hay stock disponible
      if (beer.stock <= 0) {
        toast({
          title: "Producto agotado",
          description: `${beer.name} no tiene stock disponible.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Verificar si el producto específico ya está en el carrito
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      // Para cervezas, verificar que no exceda el stock disponible
      if (item.type === "beer") {
        const beer = item.product as Beer;
        const newQuantity = existingItem.quantity + item.quantity;

        // Si la nueva cantidad excede el stock, limitar a la cantidad disponible
        if (newQuantity > beer.stock) {
          toast({
            title: "Stock limitado",
            description: `Solo hay ${beer.stock} unidades disponibles de ${beer.name}`,
            variant: "destructive",
          });

          // Actualizar cantidad al máximo disponible
          setCart((prevCart) =>
            prevCart.map((cartItem) =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: beer.stock }
                : cartItem
            )
          );
          return;
        }
      }

      // Actualizar cantidad (si hay suficiente stock)
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

    // Find the item in the cart
    const cartItem = cart.find((item) => item.id === itemId);

    // Check if we're updating a beer and validate against stock
    if (cartItem && cartItem.type === "beer") {
      const beer = cartItem.product as Beer;

      // Don't allow quantity to exceed available stock
      if (beer.stock < newQuantity) {
        toast({
          title: "Cantidad no disponible",
          description: `Solo hay ${beer.stock} unidades disponibles de ${beer.name}`,
          variant: "destructive",
        });

        // Set quantity to maximum available stock
        newQuantity = beer.stock;
      }
    }

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

  // Funciones para manejo de dirección de entrega
  const handleEditAddress = () => {
    setIsEditingAddress(true);
    setTempAddress(deliveryAddress);
  };

  const handleSaveAddress = () => {
    if (tempAddress.trim().length < 10) {
      toast({
        title: "Dirección inválida",
        description:
          "La dirección debe ser más específica (al menos 10 caracteres)",
        variant: "destructive",
      });
      return;
    }
    setDeliveryAddress(tempAddress.trim());
    setHasValidAddress(true);
    setIsEditingAddress(false);
    toast({
      title: "Dirección actualizada",
      description:
        "La dirección de entrega ha sido actualizada para este pedido",
    });
  };

  const handleCancelEditAddress = () => {
    setTempAddress(deliveryAddress);
    setIsEditingAddress(false);
  };

  // Cálculos para el carrito
  const calculateSubscriptionPrice = (subscription: Subscription) => {
    const beerType = subscription.beerType || "golden";
    const regularPrice = beerPrices[beerType] * subscription.liters;
    return Math.round(regularPrice * 0.8); // 20% de descuento
  };

  const calculateRegularSubscriptionPrice = (subscription: Subscription) => {
    const beerType = subscription.beerType || "golden";
    return beerPrices[beerType] * subscription.liters;
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
    const shippingCost = calculateShippingCost();
    return subtotal - discountAmount + shippingCost;
  };

  // Función para calcular la cantidad total de cervezas
  const getTotalBeerQuantity = () => {
    return cart
      .filter((item) => item.type === "beer")
      .reduce((total, item) => total + item.quantity, 0);
  };

  // Función para calcular el costo de envío
  const calculateShippingCost = () => {
    const totalBeers = getTotalBeerQuantity();
    const hasSubscription = cart.some((item) => item.type === "subscription");
    // Envío gratis a partir de 3 cervezas o si hay una suscripción
    return totalBeers >= 3 || hasSubscription ? 0 : 1500; // $1500 pesos de envío si es menos de 3 cervezas y no hay suscripción
  };

  // Función para verificar si califica para envío gratis
  const qualifiesForFreeShipping = () => {
    const totalBeers = getTotalBeerQuantity();
    const hasSubscription = cart.some((item) => item.type === "subscription");
    return totalBeers >= 3 || hasSubscription;
  };

  const hasSubscription = cart.some((item) => item.type === "subscription");

  const handleAuthComplete = () => {
    setCheckoutStep("payment");
  };

  const handleCreateAccount = () => {
    router.push("/auth/registro");
  };

  // Función para aplicar código de descuento
  const applyDiscountCode = async () => {
    // Limpiar error previo
    setDiscountError("");

    // Verificar si el código está vacío
    if (!discountCode.trim()) {
      setDiscountError("Por favor ingresa un código de descuento");
      return;
    }

    try {
      setLoadingDiscount(true);

      // Preparar items para enviar al backend
      const cartItems = cart.map((item) => ({
        id: item.id,
        type: item.type,
        quantity: item.quantity,
        price:
          item.type === "beer"
            ? (item.product as Beer).price
            : calculateSubscriptionPrice(item.product as Subscription),
      }));

      // Validar el código con el backend
      const response = await callEndpoint(
        validateDiscount(discountCode.trim(), cartItems)
      );

      if (response && response.data && response.data.valid) {
        // El código es válido
        setAppliedDiscount(response.data.discount);
        toast({
          title: "¡Código aplicado!",
          description: response.data.discount.description,
        });
      } else {
        // El código no es válido
        setDiscountError(
          response.data?.message || "Código de descuento inválido"
        );
      }
    } catch (error) {
      console.error("Error al validar código de descuento:", error);
      setDiscountError("Error al validar el código de descuento");
    } finally {
      setLoadingDiscount(false);
    }
  };

  // Función para eliminar código de descuento
  const removeDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    toast({
      title: "Código de descuento eliminado",
    });
  };

  // Función para proceder al checkout con MercadoPago
  const handleProceedToCheckout = async () => {
    if (!isAuthenticated) {
      setCheckoutStep("auth");
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de proceder al pago",
        variant: "destructive",
      });
      return;
    }

    // Verificar que haya una dirección válida
    if (!hasValidAddress || !deliveryAddress.trim()) {
      // Abrir modal para ingresar dirección
      setModalPhone(user?.phone || "");
      setModalAddress(user?.address || "");
      setShowAddressModal(true);
      return;
    }

    // Avanzar al paso de pago
    setCheckoutStep("payment");
  };

  // Función para manejar el pago exitoso
  const handlePaymentSuccess = (paymentData: any) => {
    toast({
      title: "¡Pago exitoso!",
      description: "Tu pedido ha sido procesado correctamente.",
    });

    // Limpiar el carrito
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode("");

    // Redirigir a página de confirmación o pedidos
    router.push("/perfil/pedidos");
  };

  // Función para manejar errores de pago
  const handlePaymentError = (error: string) => {
    toast({
      title: "Error en el pago",
      description: error,
      variant: "destructive",
    });

    // Volver al paso de carrito
    setCheckoutStep("cart");
  };

  // Funciones para el modal de dirección
  const validateModalFields = () => {
    const errors = { phone: "", address: "" };

    if (!modalPhone.trim()) {
      errors.phone = "El teléfono es requerido";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(modalPhone.trim())) {
      errors.phone = "Formato de teléfono inválido";
    }

    if (!modalAddress.trim()) {
      errors.address = "La dirección es requerida";
    } else if (modalAddress.trim().length < 10) {
      errors.address = "La dirección debe tener al menos 10 caracteres";
    }

    setModalErrors(errors);
    return !errors.phone && !errors.address;
  };

  const handleSaveModalAddress = async () => {
    if (!validateModalFields()) {
      return;
    }

    setSavingAddress(true);

    try {
      // Llamar al API para actualizar el perfil del usuario
      const updateResult = await callEndpoint(
        updateUserProfile({
          phone: modalPhone.trim(),
          address: modalAddress.trim(),
        })
      );

      if (updateResult.status === 200 && updateResult.data) {
        // Actualizar el contexto de autenticación con los nuevos datos
        const updatedUserData = updateResult.data.data;
        updateUser(updatedUserData);

        // Actualizar el estado local
        setDeliveryAddress(modalAddress.trim());
        setHasValidAddress(true);

        // Cerrar modal
        setShowAddressModal(false);
        setModalErrors({ phone: "", address: "" });

        toast({
          title: "Dirección guardada",
          description:
            "Tu información de entrega ha sido actualizada correctamente",
        });

        // Proceder al checkout
        setCheckoutStep("payment");
      } else {
        throw new Error("Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error al guardar",
        description:
          "No se pudo guardar la dirección. Verifica tu conexión e intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddressModal(false);
    setModalErrors({ phone: "", address: "" });
    setModalPhone(user?.phone || "");
    setModalAddress(user?.address || "");
  };

  // Loading state
  if (loadingBeers || loadingSubscriptions) {
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
          </div>
        </header>

        <main className="flex-1 py-10">
          <div className="container flex flex-col items-center justify-center h-full">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Cargando productos...</p>
          </div>
        </main>
      </div>
    );
  }

  // Si hay error al cargar
  if (error) {
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
          </div>
        </header>

        <main className="flex-1 py-10">
          <div className="container flex flex-col items-center justify-center h-full">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button
                className="rounded-full bg-amber-600 hover:bg-amber-700"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <Alert
              className={`${
                qualifiesForFreeShipping()
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <Truck
                className={`h-4 w-4 ${
                  qualifiesForFreeShipping()
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              />
              <AlertDescription
                className={
                  qualifiesForFreeShipping()
                    ? "text-green-800"
                    : "text-amber-800"
                }
              >
                {qualifiesForFreeShipping() ? (
                  <span>
                    <span className="font-bold">¡Envío GRATIS!</span> 
                    {cart.some((item) => item.type === "subscription") ? (
                      " Tienes una suscripción en tu carrito."
                    ) : (
                      ` Tienes ${getTotalBeerQuantity()} cervezas en tu carrito.`
                    )}
                  </span>
                ) : (
                  <span>
                    <span className="font-bold">Envío gratis</span> a partir de
                    3 cervezas o con cualquier suscripción. Tienes {getTotalBeerQuantity()}/3 cervezas en tu
                    carrito.
                  </span>
                )}
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
                                          value={
                                            subscription.beerType || "golden"
                                          }
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
                                                  subscription.beerType ||
                                                    "golden"
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
                                                  subscription.beerType ||
                                                    "golden"
                                                ] * 0.8
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-sm text-amber-700 font-medium">
                                          ¡Ahorras $
                                          {Math.round(
                                            beerPrices[
                                              subscription.beerType || "golden"
                                            ] * 0.2
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
                                      <div className="flex flex-col items-start gap-2">
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
                                            disabled={
                                              item.type === "beer" &&
                                              item.quantity >=
                                                (item.product as Beer).stock
                                            }
                                            title={
                                              item.type === "beer" &&
                                              item.quantity >=
                                                (item.product as Beer).stock
                                                ? `Máximo stock disponible: ${
                                                    (item.product as Beer).stock
                                                  }`
                                                : ""
                                            }
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        {item.type === "beer" && (
                                          <div className="text-xs text-muted-foreground">
                                            {item.quantity ===
                                            (item.product as Beer).stock ? (
                                              <span className="text-amber-600">
                                                Las ultimas{" "}
                                                {(item.product as Beer).stock}!
                                              </span>
                                            ) : (
                                              <span>
                                                Disponible:{" "}
                                                {(item.product as Beer).stock}
                                              </span>
                                            )}
                                          </div>
                                        )}
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
                        Suscríbite a nuestro Club Luna y obtene un 20% de ahorro
                        en tus cervezas favoritas, además de una botella de
                        edición especial gratis cada mes.
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
                                            product: {
                                              ...plan,
                                              beerType: "golden" as BeerType,
                                            },
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

                {/* Añadir más productos - Solo visible en desktop */}
                {cart.length > 0 && (
                  <div className="mt-8 hidden lg:block">
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
                                className={`w-full rounded-full mt-3 ${
                                  beer.stock <= 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-amber-600 hover:bg-amber-700"
                                }`}
                                disabled={isInCart || beer.stock <= 0}
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
                                  : beer.stock <= 0
                                  ? "Agotado"
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
                                    disabled={loadingDiscount}
                                  />
                                  <Button
                                    variant="outline"
                                    className="rounded-full border-amber-600 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                    onClick={applyDiscountCode}
                                    disabled={loadingDiscount}
                                  >
                                    {loadingDiscount ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      "Aplicar"
                                    )}
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

                            <div className="flex justify-between">
                              <span>Envío</span>
                              <span
                                className={
                                  calculateShippingCost() === 0
                                    ? "text-green-600 font-medium"
                                    : ""
                                }
                              >
                                {calculateShippingCost() === 0
                                  ? "GRATIS"
                                  : `$${calculateShippingCost()}`}
                              </span>
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
                            {/* Mensaje de error si no hay dirección */}
                            {isAuthenticated && !hasValidAddress && (
                              <div className="p-3 rounded-md bg-orange-50 border border-orange-200">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <p className="text-orange-700 text-sm font-medium">
                                    Dirección requerida
                                  </p>
                                </div>
                                <p className="text-orange-600 text-xs mt-1">
                                  Haz clic en "Proceder al Pago" para agregar tu
                                  dirección de entrega
                                </p>
                              </div>
                            )}

                            <Button
                              className="w-full rounded-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              onClick={handleProceedToCheckout}
                              disabled={loadingCheckout}
                            >
                              {loadingCheckout ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  <span className="ml-2">Procesando...</span>
                                </>
                              ) : isAuthenticated && !hasValidAddress ? (
                                "Agregar Dirección"
                              ) : (
                                "Proceder al pago"
                              )}
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

              <div className="lg:col-span-1 w-full">
                <div className="lg:sticky lg:top-24 space-y-4">
                  {/* Sección de dirección de entrega */}
                  {isAuthenticated && (
                    <Card className="rounded-xl overflow-hidden w-full">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="h-5 w-5 text-amber-600" />
                          <h3 className="text-lg font-semibold">
                            Dirección de entrega
                          </h3>
                        </div>

                        {isEditingAddress ? (
                          <div className="space-y-3">
                            <textarea
                              value={tempAddress}
                              onChange={(e) => setTempAddress(e.target.value)}
                              placeholder="Ingresa la dirección completa de entrega"
                              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              maxLength={200}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveAddress}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditAddress}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div
                              className={`p-3 rounded-lg ${
                                !hasValidAddress
                                  ? "bg-red-50 border border-red-200"
                                  : "bg-gray-50"
                              }`}
                            >
                              {!hasValidAddress ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <p className="text-red-700 text-sm font-medium">
                                    No hay dirección especificada
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-700">
                                  {deliveryAddress}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant={!hasValidAddress ? "default" : "outline"}
                              onClick={handleEditAddress}
                              className={`flex items-center gap-2 w-full ${
                                !hasValidAddress
                                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                                  : ""
                              }`}
                            >
                              <Edit3 className="h-4 w-4" />
                              {!hasValidAddress
                                ? "Agregar dirección de entrega"
                                : "Cambiar dirección para esta entrega"}
                            </Button>
                          </div>
                        )}

                        {deliveryAddress && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                              <p className="text-xs text-blue-700">
                                Si cambias la dirección aquí, solo se aplicará a
                                este pedido. Para actualizarla permanentemente,
                                ve a tu perfil.
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Resumen de compra */}
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

                        <div className="flex justify-between">
                          <span>Envío</span>
                          <span
                            className={
                              calculateShippingCost() === 0
                                ? "text-green-600 font-medium"
                                : ""
                            }
                          >
                            {calculateShippingCost() === 0
                              ? "GRATIS"
                              : `$${calculateShippingCost()}`}
                          </span>
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
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 w-full">
                <Card className="rounded-xl overflow-hidden w-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <h3 className="text-xl font-bold">Método de pago</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCheckoutStep("cart")}
                        className="flex items-center gap-2 w-fit"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                      </Button>
                    </div>

                    {isAuthenticated ? (
                      <div className="space-y-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                          <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                            <p className="text-green-800">
                              Sesión iniciada como{" "}
                              <span className="font-bold">
                                {user?.firstName} {user?.lastName} (
                                {user?.email})
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Componente de MercadoPago */}
                        <MercadoPagoOptions
                          cart={cart}
                          user={user}
                          deliveryAddress={deliveryAddress}
                          appliedDiscount={appliedDiscount}
                          discountCode={discountCode}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentError={handlePaymentError}
                          calculateTotal={() => calculateTotal()}
                          calculateSubtotal={() => calculateSubtotal()}
                          calculateDiscountAmount={() =>
                            calculateDiscountAmount()
                          }
                        />
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

              <div className="lg:col-span-1 w-full">
                <div className="lg:sticky lg:top-24 space-y-4">
                  {/* Sección de dirección de entrega */}
                  {isAuthenticated && (
                    <Card className="rounded-xl overflow-hidden w-full">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="h-5 w-5 text-amber-600" />
                          <h3 className="text-lg font-semibold">
                            Dirección de entrega
                          </h3>
                        </div>

                        {isEditingAddress ? (
                          <div className="space-y-3">
                            <textarea
                              value={tempAddress}
                              onChange={(e) => setTempAddress(e.target.value)}
                              placeholder="Ingresa la dirección completa de entrega"
                              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              maxLength={200}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveAddress}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditAddress}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div
                              className={`p-3 rounded-lg ${
                                !hasValidAddress
                                  ? "bg-red-50 border border-red-200"
                                  : "bg-gray-50"
                              }`}
                            >
                              {!hasValidAddress ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <p className="text-red-700 text-sm font-medium">
                                    No hay dirección especificada
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-700">
                                  {deliveryAddress}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant={!hasValidAddress ? "default" : "outline"}
                              onClick={handleEditAddress}
                              className={`flex items-center gap-2 w-full ${
                                !hasValidAddress
                                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                                  : ""
                              }`}
                            >
                              <Edit3 className="h-4 w-4" />
                              {!hasValidAddress
                                ? "Agregar dirección de entrega"
                                : "Cambiar dirección para esta entrega"}
                            </Button>
                          </div>
                        )}

                        {deliveryAddress && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                              <p className="text-xs text-blue-700">
                                Si cambias la dirección aquí, solo se aplicará a
                                este pedido. Para actualizarla permanentemente,
                                ve a tu perfil.
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Resumen de compra */}
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

                        <div className="flex justify-between">
                          <span>Envío</span>
                          <span
                            className={
                              calculateShippingCost() === 0
                                ? "text-green-600 font-medium"
                                : ""
                            }
                          >
                            {calculateShippingCost() === 0
                              ? "GRATIS"
                              : `$${calculateShippingCost()}`}
                          </span>
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

      {/* Modal para ingresar dirección */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Información de Entrega
            </DialogTitle>
            <DialogDescription>
              Para proceder con el pago, necesitamos tu número de teléfono y
              dirección de entrega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-phone">Número de Teléfono</Label>
              <Input
                id="modal-phone"
                type="tel"
                placeholder="+54 11 1234-5678"
                value={modalPhone}
                onChange={(e) => {
                  setModalPhone(e.target.value);
                  if (modalErrors.phone) {
                    setModalErrors((prev) => ({ ...prev, phone: "" }));
                  }
                }}
                className={modalErrors.phone ? "border-red-500" : ""}
              />
              {modalErrors.phone && (
                <p className="text-sm text-red-500">{modalErrors.phone}</p>
              )}
              <p className="text-xs text-gray-500">
                Lo usaremos para coordinar la entrega
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-address">Dirección de Entrega</Label>
              <Input
                id="modal-address"
                placeholder="Calle, número, piso, dpto, localidad"
                value={modalAddress}
                onChange={(e) => {
                  setModalAddress(e.target.value);
                  if (modalErrors.address) {
                    setModalErrors((prev) => ({ ...prev, address: "" }));
                  }
                }}
                className={modalErrors.address ? "border-red-500" : ""}
              />
              {modalErrors.address && (
                <p className="text-sm text-red-500">{modalErrors.address}</p>
              )}
              <p className="text-xs text-gray-500">
                Incluye todos los detalles necesarios para la entrega
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={savingAddress}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveModalAddress}
              disabled={
                savingAddress || !modalPhone.trim() || !modalAddress.trim()
              }
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              {savingAddress ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                "Guardar y Continuar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
