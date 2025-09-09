"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import { createMercadoPagoPreference } from "@/services/private";
import { createCheckoutPro, createCardForm } from "@/lib/mercadopago";
import {
  CreditCard,
  Shield,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Banknote,
} from "lucide-react";

interface MercadoPagoOptionsProps {
  cart: any[];
  user: any;
  deliveryAddress?: string;
  appliedDiscount?: any;
  discountCode?: string;
  onPaymentSuccess: (data: any) => void;
  onPaymentError: (error: string) => void;
  calculateTotal: () => number;
  calculateSubtotal: () => number;
  calculateDiscountAmount: () => number;
}

export default function MercadoPagoOptions({
  cart,
  user,
  deliveryAddress,
  appliedDiscount,
  discountCode,
  onPaymentSuccess,
  onPaymentError,
  calculateTotal,
  calculateSubtotal,
  calculateDiscountAmount,
}: MercadoPagoOptionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardFormLoaded, setCardFormLoaded] = useState(false);
  const [cardFormLoading, setCardFormLoading] = useState(false);
  const [cardFormInstance, setCardFormInstance] = useState<any>(null);
  const { toast } = useToast();
  const { callEndpoint } = useFetchAndLoad();

  // Verificar si hay dirección válida para entrega
  const hasValidDeliveryAddress =
    deliveryAddress && deliveryAddress.trim().length >= 10;

  // Detectar si es dispositivo móvil
  const isMobile = () => {
    if (typeof window === "undefined") return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  };

  // Cleanup del formulario cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (cardFormInstance) {
        // Limpiar la instancia del formulario
        setCardFormInstance(null);
        setCardFormLoaded(false);
      }
    };
  }, [cardFormInstance]);

  // Preparar datos para la preferencia
  const preparePreferenceData = () => {
    const cartItems = cart.map((item) => ({
      id: item.id,
      name: item.type === "beer" ? item.product.name : item.product.name,
      type: item.type,
      quantity: item.quantity,
      price: item.type === "beer" ? item.product.price : item.product.price,
    }));

    const shippingInfo = {
      firstName: user?.firstName || "Usuario",
      lastName: user?.lastName || "Luna Brew",
      email: user?.email || "user@example.com",
      phone: user?.phone || "+54 11 1234-5678",
      address: deliveryAddress || user?.address || "Dirección de envío",
      city: "Buenos Aires",
      postalCode: "1000",
      deliveryTime: null,
    };

    const discountInfo = appliedDiscount
      ? {
          code: discountCode,
          type: appliedDiscount.type,
          value: appliedDiscount.value,
          valid: true,
        }
      : null;

    return {
      cartItems,
      shippingInfo,
      discountInfo,
    };
  };

  // Función para crear preferencia y obtener ID
  const createPreference = async () => {
    try {
      const preferenceData = preparePreferenceData();
      const response = await callEndpoint(
        createMercadoPagoPreference(preferenceData)
      );

      console.log("Respuesta completa:", response);

      // La respuesta tiene la estructura: response.data.preferenceId
      if (response?.data?.data?.preferenceId) {
        return response.data.data.preferenceId;
      } else {
        console.error("Estructura de respuesta inesperada:", response);
        throw new Error("No se recibió el ID de preferencia");
      }
    } catch (error) {
      console.error("Error creating preference:", error);
      throw new Error("No se pudo crear la preferencia de pago");
    }
  };

  // Checkout Pro (Modal oficial o redirección)
  const handleCheckoutPro = async () => {
    setIsLoading(true);
    setLoadingMethod("pro");

    try {
      const preferenceData = preparePreferenceData();
      const response = await callEndpoint(
        createMercadoPagoPreference(preferenceData)
      );

      if (response?.data?.data?.init_point || response?.data?.init_point) {
        const redirectUrl =
          response.data.data?.init_point || response.data.init_point;

        if (isMobile()) {
          // En móvil, redirigir directamente para abrir la app
          window.location.href = redirectUrl;
          toast({
            title: "Redirigiendo a MercadoPago",
            description: "Serás redirigido a la app de MercadoPago",
          });
        } else {
          // En desktop, usar modal/iframe
          const preferenceId =
            response.data.data?.preferenceId || response.data.preferenceId;
          if (preferenceId) {
            await createCheckoutPro(preferenceId);
            toast({
              title: "Abriendo MercadoPago",
              description: "Se abrirá el modal oficial de MercadoPago",
            });
          } else {
            // Fallback a redirección
            window.location.href = redirectUrl;
          }
        }
      } else {
        throw new Error("No se recibió la URL de redirección");
      }
    } catch (error) {
      console.error("Error with Checkout Pro:", error);
      onPaymentError("Error al iniciar el pago con MercadoPago");
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  // Mostrar formulario de tarjeta
  const handleShowCardForm = async () => {
    setShowCardForm(true);
    setLoadingMethod("card");
    setCardFormLoading(true);

    try {
      // Esperar un poco para que el DOM se renderice
      setTimeout(async () => {
        await initializeCardForm();
      }, 100);

      toast({
        title: "Cargando formulario de tarjeta",
        description: "Inicializando formulario seguro de MercadoPago...",
      });
    } catch (error) {
      console.error("Error showing card form:", error);
      setCardFormLoading(false);
      onPaymentError("Error al cargar el formulario de tarjeta");
    }
  };

  // Inicializar el formulario de tarjeta de MercadoPago
  const initializeCardForm = async () => {
    try {
      setCardFormLoading(true);

      const cardForm = await createCardForm("cardPaymentBrick_container", {
        amount: calculateTotal(),
        payer: {
          email: user?.email || "",
        },
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) {
              console.error("Error mounting card form:", error);
              setCardFormLoading(false);
              onPaymentError("Error al cargar el formulario de tarjeta");
              return;
            }
            console.log("Card form mounted successfully");
            setCardFormLoaded(true);
            setCardFormLoading(false);
            setLoadingMethod(null);
            toast({
              title: "Formulario listo",
              description: "Completa los datos de tu tarjeta para continuar",
            });
          },
          onSubmit: async (event: any, cardFormData?: any) => {
            if (event && event.preventDefault) {
              event.preventDefault();
            }
            setIsLoading(true);

            try {
              // Con Bricks, los datos vienen directamente en cardFormData
              const paymentData = cardFormData || event;

              if (!paymentData || !paymentData.token) {
                throw new Error("No se pudo obtener el token de la tarjeta");
              }

              // Procesar el pago con el token
              await processCardPayment(paymentData.token);
            } catch (error) {
              console.error("Error processing payment:", error);
              onPaymentError("Error al procesar el pago con tarjeta");
            } finally {
              setIsLoading(false);
            }
          },
          onFetching: (resource: string) => {
            console.log("Fetching resource:", resource);
          },
        },
      });

      setCardFormInstance(cardForm);
    } catch (error) {
      console.error("Error initializing card form:", error);
      setLoadingMethod(null);
      onPaymentError("Error al inicializar el formulario de tarjeta");
    }
  };

  // Procesar pago con tarjeta
  const processCardPayment = async (token: string) => {
    try {
      const preferenceData = preparePreferenceData();

      // Agregar el token de la tarjeta a los datos
      const paymentData = {
        ...preferenceData,
        paymentMethod: "card",
        token: token,
        totalAmount: calculateTotal(),
      };

      const response = await callEndpoint(
        createMercadoPagoPreference(paymentData)
      );

      if (response?.data?.success) {
        onPaymentSuccess(response.data);
        toast({
          title: "¡Pago exitoso!",
          description: "Tu pago con tarjeta ha sido procesado correctamente",
        });
      } else {
        throw new Error("Error en el procesamiento del pago");
      }
    } catch (error) {
      console.error("Error processing card payment:", error);
      throw error;
    }
  };

  // Función para pago en efectivo al retirar
  const handleCashPayment = async () => {
    setIsLoading(true);
    setLoadingMethod("cash");

    try {
      const orderData = {
        cartItems: cart.map((item) => ({
          id: item.id,
          name: item.type === "beer" ? item.product.name : item.product.name,
          type: item.type,
          quantity: item.quantity,
          price: item.type === "beer" ? item.product.price : item.product.price,
        })),
        total: calculateTotal(),
        subtotal: calculateSubtotal(),
        discountAmount: calculateDiscountAmount(),
        discountCode,
        paymentMethod: "cash",
        deliveryMethod: "pickup", // Retiro en local
        shippingInfo: {
          firstName: user?.firstName || "Usuario",
          lastName: user?.lastName || "Luna Brew",
          email: user?.email || "user@example.com",
          phone: user?.phone || "+54 11 1234-5678",
          address: "Retiro en local",
          city: "Buenos Aires",
          postalCode: "1000",
          deliveryTime: null,
        },
      };

      // Simular creación de orden para pago en efectivo
      // Aquí podrías llamar a un endpoint específico para órdenes de efectivo
      console.log("Orden de pago en efectivo:", orderData);

      toast({
        title: "¡Orden registrada!",
        description:
          "Tu pedido ha sido registrado para pago en efectivo al retirar.",
      });

      onPaymentSuccess({
        paymentMethod: "cash",
        orderData,
        message: "Orden registrada para pago en efectivo",
      });
    } catch (error) {
      console.error("Error creating cash order:", error);
      onPaymentError("Error al registrar la orden de pago en efectivo");
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Opciones de pago */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Elige tu método de pago preferido
        </h4>

        {/* MercadoPago - Opción recomendada */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="p-1 bg-white rounded-lg border border-gray-200 flex-shrink-0">
                  <Image
                    src="/logo-mercado-pago-icone-512.png"
                    alt="MercadoPago"
                    width={28}
                    height={28}
                    className="sm:w-8 sm:h-8 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <h5 className="font-semibold text-sm sm:text-base">
                      MercadoPago
                    </h5>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs"
                    >
                      Recomendado
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isMobile()
                      ? "Redirige a la app de MercadoPago"
                      : "Paga con MercadoPago de forma segura"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      SSL
                    </span>
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Seguro
                    </span>
                    {isMobile() && (
                      <span className="text-xs text-blue-500 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        App MP
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckoutPro}
                disabled={isLoading || !hasValidDeliveryAddress}
                className="bg-[#009ee3] hover:bg-[#008fcf] text-white w-full sm:w-auto sm:min-w-[100px] text-sm py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingMethod === "pro" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Pagar
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Tarjeta */}
        <Card className="border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-semibold text-sm sm:text-base">
                    Tarjeta de Crédito/Débito
                  </h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Completa los datos de tu tarjeta
                  </p>
                  <div className="flex items-center gap-2 sm:gap-4 mt-1">
                    <span className="text-xs text-gray-600">
                      Visa, Mastercard, Amex
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleShowCardForm}
                disabled={isLoading || !hasValidDeliveryAddress}
                variant="outline"
                className="w-full sm:w-auto sm:min-w-[100px] text-sm py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Usar Tarjeta
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opción de pago en efectivo */}
      <div className="space-y-4">
        <Card className="border border-green-200 bg-green-50/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-green-700">
                      Pago en Efectivo
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                      Pagá en efectivo al momento de retirar tu pedido en Av.
                      Pedro Luro 2514.
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Sin comisiones</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Retiro en local</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Reserva inmediata</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCashPayment}
                disabled={isLoading}
                className="w-full sm:w-auto sm:min-w-[100px] text-sm py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Reservar Pedido
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Formulario de tarjeta MercadoPago */}
      {showCardForm && (
        <div className="space-y-4">
          <Card className="border border-orange-200">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                Datos de la tarjeta
              </h4>

              {cardFormLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              )}

              {/* Contenedor del formulario de MercadoPago */}
              <div id="cardPaymentBrick_container"></div>

              <div className="mt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCardForm(false)}
                >
                  Volver a opciones de pago
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Información de seguridad */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h6 className="font-medium text-sm">Compra 100% segura</h6>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los pagos son procesados de forma segura por MercadoPago.
              Tus datos están protegidos con encriptación SSL de nivel bancario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
