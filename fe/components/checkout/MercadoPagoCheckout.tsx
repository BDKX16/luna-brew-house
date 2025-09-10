"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Loader2 } from "lucide-react";
import { initMercadoPago, createCardForm } from "@/lib/mercadopago";
import {
  createMercadoPagoPreference,
  processDirectPayment,
} from "@/services/private";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  type: "beer" | "subscription";
  product: any;
  quantity: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Discount {
  code: string;
  type: string;
  value: number;
}

interface MercadoPagoCheckoutProps {
  cartItems: CartItem[];
  user: User;
  appliedDiscount?: Discount | null;
  discountCode?: string;
  onSuccess: (payment: any) => void;
  onError: (error: string) => void;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
}

export default function MercadoPagoCheckout({
  cartItems,
  user,
  appliedDiscount,
  discountCode,
  onSuccess,
  onError,
  totalAmount,
  subtotalAmount,
  discountAmount,
}: MercadoPagoCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    identificationType: "DNI",
    identificationNumber: "",
  });
  const cardFormRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeMP = async () => {
      try {
        await initMercadoPago();
        setMpLoaded(true);
      } catch (error) {
        console.error("Error inicializando MercadoPago:", error);
        onError("Error inicializando el sistema de pagos");
      }
    };

    initializeMP();
  }, []);

  useEffect(() => {
    if (mpLoaded && totalAmount > 0) {
      initializeCardForm();
    }
  }, [mpLoaded, totalAmount]);

  const initializeCardForm = async () => {
    try {
      const cardForm = await createCardForm("form-checkout", {
        amount: totalAmount,
        formId: "form-checkout",
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) {
              console.error("Error montando el formulario:", error);
              onError("Error cargando el formulario de pago");
            }
          },
          onSubmit: handleSubmit,
          onFetching: (resource: string) => {
            console.log("Fetching resource: ", resource);
          },
        },
      });

      cardFormRef.current = cardForm;
    } catch (error) {
      console.error("Error creando card form:", error);
      onError("Error inicializando el formulario de pago");
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Función para calcular el costo de envío
      const calculateShippingCost = () => {
        const totalBeers = cartItems
          .filter((item) => item.type === "beer")
          .reduce((total, item) => total + item.quantity, 0);
        const hasSubscription = cartItems.some(
          (item) => item.type === "subscription"
        );
        return totalBeers >= 3 || hasSubscription ? 0 : 1500;
      };

      // Primero crear la preferencia de pago
      const preferenceData = {
        cartItems: cartItems.map((item) => ({
          id: item.id,
          name: item.type === "beer" ? item.product.name : item.product.name,
          type: item.type,
          quantity: item.quantity,
          price: item.type === "beer" ? item.product.price : item.product.price,
        })),
        shippingInfo: {
          firstName: user.name.split(" ")[0] || "Usuario",
          lastName: user.name.split(" ").slice(1).join(" ") || "Cliente",
          email: user.email,
          phone: user.phone || "",
          address: user.address || "",
          city: "Buenos Aires",
          postalCode: "1000",
        },
        discountInfo: appliedDiscount
          ? {
              code: discountCode,
              type: appliedDiscount.type,
              value: appliedDiscount.value,
              valid: true,
            }
          : null,
        shippingCost: calculateShippingCost(), // Agregar el costo del envío
      };

      const preferenceResponse = await createMercadoPagoPreference(
        preferenceData
      );

      if (!preferenceResponse?.data?.preferenceId) {
        throw new Error("No se pudo crear la preferencia de pago");
      }

      const formData = new FormData(event.target as HTMLFormElement);

      const paymentData = {
        token: formData.get("token"),
        preferenceId: preferenceResponse.data.preferenceId,
        installments: formData.get("installments"),
        payment_method_id: formData.get("payment_method_id"),
        issuer_id: formData.get("issuer"),
        payer: {
          email: formData.get("cardholderEmail"),
          identification: {
            type: formData.get("identificationType"),
            number: formData.get("identificationNumber"),
          },
        },
      };

      const response = await fetch("/api/payments/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success) {
        if (result.data.status === "approved") {
          toast({
            title: "¡Pago aprobado!",
            description: "Tu pedido ha sido procesado exitosamente.",
          });
          onSuccess(result.data);
        } else if (result.data.status === "pending") {
          toast({
            title: "Pago pendiente",
            description:
              "Tu pago está siendo procesado. Te notificaremos cuando se complete.",
            variant: "default",
          });
          onSuccess(result.data);
        } else {
          throw new Error("Pago rechazado");
        }
      } else {
        throw new Error(result.message || "Error procesando el pago");
      }
    } catch (error) {
      console.error("Error en el pago:", error);
      onError(
        error instanceof Error ? error.message : "Error procesando el pago"
      );
      toast({
        title: "Error en el pago",
        description: "Hubo un problema procesando tu pago. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mpLoaded) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando sistema de pagos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Datos de Pago</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="form-checkout" className="space-y-4">
          {/* Información del pagador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-checkout__cardholderEmail">Email</Label>
              <Input
                id="form-checkout__cardholderEmail"
                name="cardholderEmail"
                type="email"
                placeholder="tu-email@ejemplo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="form-checkout__identificationType">
                Tipo de documento
              </Label>
              <select
                id="form-checkout__identificationType"
                name="identificationType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                defaultValue="DNI"
              >
                <option value="DNI">DNI</option>
                <option value="CI">Cédula de Identidad</option>
                <option value="LC">Libreta Cívica</option>
                <option value="LE">Libreta de Enrolamiento</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="form-checkout__identificationNumber">
              Número de documento
            </Label>
            <Input
              id="form-checkout__identificationNumber"
              name="identificationNumber"
              placeholder="12345678"
              required
            />
          </div>

          {/* Datos de la tarjeta */}
          <div>
            <Label htmlFor="form-checkout__cardholderName">
              Titular de la tarjeta
            </Label>
            <Input
              id="form-checkout__cardholderName"
              name="cardholderName"
              placeholder="Nombre como aparece en la tarjeta"
              required
            />
          </div>

          <div>
            <Label htmlFor="form-checkout__cardNumber">Número de tarjeta</Label>
            <Input
              id="form-checkout__cardNumber"
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-checkout__expirationDate">
                Fecha de vencimiento
              </Label>
              <Input
                id="form-checkout__expirationDate"
                name="expirationDate"
                placeholder="MM/YY"
                required
              />
            </div>
            <div>
              <Label htmlFor="form-checkout__securityCode">
                Código de seguridad
              </Label>
              <Input
                id="form-checkout__securityCode"
                name="securityCode"
                placeholder="123"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="form-checkout__issuer">Banco emisor</Label>
            <select
              id="form-checkout__issuer"
              name="issuer"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Selecciona tu banco</option>
              {/* Los bancos se cargarán dinámicamente por MercadoPago */}
            </select>
          </div>

          <div>
            <Label htmlFor="form-checkout__installments">Cuotas</Label>
            <select
              id="form-checkout__installments"
              name="installments"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Selecciona las cuotas</option>
              {/* Las cuotas se cargarán dinámicamente por MercadoPago */}
            </select>
          </div>

          <Alert>
            <AlertDescription>
              Total a pagar:{" "}
              <strong>${totalAmount.toLocaleString("es-AR")} ARS</strong>
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando pago...
              </>
            ) : (
              "Pagar ahora"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
