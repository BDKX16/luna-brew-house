import { loadMercadoPago } from "@mercadopago/sdk-js";

let mp: any = null;

export const initMercadoPago = async () => {
  if (typeof window === "undefined") return null;

  if (!mp) {
    await loadMercadoPago();
    mp = new (window as any).MercadoPago(
      process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
      {
        locale: "es-AR",
      }
    );
  }

  return mp;
};

// Checkout Pro (Modal oficial de MercadoPago)
export const createCheckoutPro = async (preferenceId: string) => {
  const mercadoPago = await initMercadoPago();
  if (!mercadoPago) throw new Error("MercadoPago no se pudo inicializar");

  return mercadoPago.checkout({
    preference: {
      id: preferenceId,
    },
    autoOpen: true, // Abre automáticamente el modal
  });
};

// Wallet Connect (Para pagar con cuenta de MercadoPago)
export const createWallet = async (
  preferenceId: string,
  containerId: string
) => {
  const mercadoPago = await initMercadoPago();
  if (!mercadoPago) throw new Error("MercadoPago no se pudo inicializar");

  return mercadoPago.bricks().create("wallet", containerId, {
    initialization: {
      preferenceId: preferenceId,
    },
    customization: {
      texts: {
        valueProp: "smart_option",
      },
    },
  });
};

// Checkout integrado (contenedor específico)
export const createCheckout = async (
  preferenceId: string,
  containerId: string = ".cho-container"
) => {
  const mercadoPago = await initMercadoPago();
  if (!mercadoPago) throw new Error("MercadoPago no se pudo inicializar");

  return mercadoPago.checkout({
    preference: {
      id: preferenceId,
    },
    render: {
      container: containerId,
      label: "Pagar con MercadoPago",
    },
  });
};

export const createCardForm = async (containerId: string, options: any) => {
  const mercadoPago = await initMercadoPago();
  if (!mercadoPago) throw new Error("MercadoPago no se pudo inicializar");

  // Usar la nueva API de Bricks
  const bricksBuilder = mercadoPago.bricks();

  return bricksBuilder.create("cardPayment", containerId, {
    initialization: {
      amount: options.amount,
      payer: {
        email: options.payer?.email || "",
      },
    },
    callbacks: {
      onReady: () => {
        console.log("Card payment brick ready");
        if (options.callbacks?.onFormMounted) {
          options.callbacks.onFormMounted(null);
        }
      },
      onSubmit: async (cardFormData: any) => {
        console.log("Card form data:", cardFormData);
        if (options.callbacks?.onSubmit) {
          // Crear un evento mock para mantener compatibilidad
          const mockEvent = { preventDefault: () => {} };
          await options.callbacks.onSubmit(mockEvent, cardFormData);
        }
        return cardFormData;
      },
      onError: (error: any) => {
        console.error("Card payment brick error:", error);
        if (options.callbacks?.onFormMounted) {
          options.callbacks.onFormMounted(error);
        }
      },
    },
    customization: {
      visual: {
        style: {
          theme: "default",
        },
      },
    },
  });
};
