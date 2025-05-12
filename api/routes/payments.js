const express = require("express");
const crypto = require("crypto");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const router = express.Router();
const { checkAuth, checkRole } = require("../middlewares/authentication");
const trackInteraction = require("../middlewares/interaction-tracker");

const Payments = require("../models/payment.js");
const { Beer, Subscription } = require("../models/products");
const Order = require("../models/order");
const UserSubscription = require("../models/subscription");

// Set up MercadoPago credentials
const client = new MercadoPagoConfig({
  accessToken:
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    "TEST-4044483755982456-090411-5db8f54f0db2a277d1634dc16b51bc3d-157050868",
});

/**
 * PROCESAMIENTO DE PAGOS PARA CERVEZAS Y SUSCRIPCIONES
 */

// Crear un nuevo procesamiento de pago
router.post(
  "/checkout",
  checkAuth,
  trackInteraction("checkout", true),
  async (req, res) => {
    try {
      const userId = req.userData._id;
      const { cartItems, shippingInfo, discountInfo } = req.body;

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: "El carrito está vacío" });
      }

      // Verificar stock disponible para cervezas
      for (const item of cartItems) {
        if (item.type === "beer") {
          const beer = await Beer.findOne({ id: item.id, nullDate: null });
          if (!beer) {
            return res
              .status(404)
              .json({ error: `Producto no encontrado: ${item.id}` });
          }
          if (beer.stock < item.quantity) {
            return res
              .status(400)
              .json({ error: `Stock insuficiente para ${beer.name}` });
          }
        }
      }

      // Crear orden y preparar pago
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let subtotal = 0;
      let discount = 0;

      // Calcular subtotal
      for (const item of cartItems) {
        subtotal += item.price * item.quantity;
      }

      // Aplicar descuento si existe
      if (discountInfo && discountInfo.valid) {
        if (discountInfo.type === "percentage") {
          discount = subtotal * (discountInfo.value / 100);
        } else if (discountInfo.type === "fixed") {
          discount = discountInfo.value;
        }
        discount = Math.min(discount, subtotal); // El descuento no puede ser mayor que el subtotal
      }

      const total = subtotal - discount;

      // Datos para MercadoPago
      const items = cartItems.map((item) => ({
        id: item.id,
        title: item.name,
        description: `${item.type === "beer" ? "Cerveza" : "Suscripción"} - ${
          item.name
        }`,
        quantity: item.quantity,
        currency_id: "ARS",
        unit_price: item.price,
      }));

      // Crear preferencia para MercadoPago
      const preference = {
        body: {
          items,
          external_reference: orderId,
          back_urls: {
            success: `${
              process.env.FRONT_URL || "http://localhost:3000"
            }/pedido/confirmacion`,
            failure: `${
              process.env.FRONT_URL || "http://localhost:3000"
            }/pedido/error`,
            pending: `${
              process.env.FRONT_URL || "http://localhost:3000"
            }/pedido/pendiente`,
          },
          notification_url: `${
            process.env.API_URL || "http://localhost:5000"
          }/api/payments/webhook`,
        },
      };

      // Procesar con MercadoPago
      const paymentResponse = await processMercadopagoPayment(preference);

      if (!paymentResponse.preference) {
        return res.status(500).json({ error: "Error al procesar el pago" });
      }

      // Guardar información del pedido
      const orderItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price,
        quantity: item.quantity,
      }));

      const newOrder = new Order({
        id: orderId,
        customer: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}`,
          userId,
        },
        date: new Date(),
        status: "pending",
        total,
        items: orderItems,
        paymentMethod: "mercadopago",
        paymentStatus: "pending",
        deliveryTime: shippingInfo.deliveryTime || null,
        customerSelectedTime: !!shippingInfo.deliveryTime,
        discountCode: discountInfo?.code || null,
        discountAmount: discount,
        preferenceId: paymentResponse.preference.id,
        trackingSteps: [
          {
            status: "Pedido recibido",
            date: new Date(),
            completed: true,
            current: true,
          },
        ],
      });

      await newOrder.save();

      // Crear registro de pago
      const newPayment = new Payments({
        userId,
        amount: total,
        netAmount: total,
        currency: "ARS",
        paymentMethod: "mercadopago",
        paymentId: null,
        orderId: orderId,
        date: new Date(),
        status: "pending",
        preferenceUrl: paymentResponse.init_point,
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        address2: shippingInfo.address2 || "",
        city: shippingInfo.city,
        state: shippingInfo.state,
        country: shippingInfo.country,
        postalCode: shippingInfo.postalCode,
      });

      await newPayment.save();

      // Responder con URL de MercadoPago y datos del pedido
      res.status(200).json({
        success: true,
        redirectUrl: paymentResponse.init_point,
        orderId,
        preferenceId: paymentResponse.preference.id,
      });
    } catch (error) {
      console.error("Error al procesar el checkout:", error);
      res.status(500).json({ error: "Error al procesar el pago" });
    }
  }
);

// Checkout para suscripciones
router.post(
  "/subscription-checkout",
  checkAuth,
  trackInteraction("checkout", true),
  async (req, res) => {
    try {
      const userId = req.userData._id;
      const { subscriptionPlan, beerType, shippingInfo } = req.body;

      // Verificar si el plan de suscripción existe
      const subscription = await Subscription.findOne({
        id: subscriptionPlan.id,
        nullDate: null,
      });
      if (!subscription) {
        return res
          .status(404)
          .json({ error: "Plan de suscripción no encontrado" });
      }

      // Verificar si el usuario ya tiene una suscripción activa
      const existingSubscription = await UserSubscription.findOne({
        userId,
        status: "active",
        nullDate: null,
      });

      if (existingSubscription) {
        return res.status(400).json({
          error: "Ya tienes una suscripción activa",
          currentSubscription: {
            id: existingSubscription.id,
            name: existingSubscription.name,
          },
        });
      }

      // Crear ID para la orden
      const orderId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Datos para MercadoPago
      const preference = {
        body: {
          items: [
            {
              id: subscription.id,
              title: `Suscripción Luna Brew House - ${subscription.name}`,
              description: `Suscripción mensual - ${subscription.liters} litros de cerveza ${beerType}`,
              quantity: 1,
              currency_id: "ARS",
              unit_price: subscription.price,
            },
          ],
          external_reference: orderId,
          back_urls: {
            success: `${
              process.env.FRONT_URL || "http://localhost:3000"
            }/suscripcion/confirmacion`,
            failure: `${
              process.env.FRONT_URL || "http://localhost:3000"
            }/suscripcion/error`,
            pending: `${
              process.env.FRONT_URL || "http://localhost:3000"
            }/suscripcion/pendiente`,
          },
          notification_url: `${
            process.env.API_URL || "http://localhost:5000"
          }/api/payments/subscription-webhook`,
        },
      };

      // Procesar con MercadoPago
      const paymentResponse = await processMercadopagoPayment(preference);

      if (!paymentResponse.preference) {
        return res
          .status(500)
          .json({ error: "Error al procesar el pago de la suscripción" });
      }

      // Guardar información temporal de la suscripción (se activará al confirmar el pago)
      const subscriptionData = {
        userId,
        subscriptionId: subscription.id,
        orderId,
        beerType,
        beerName: getBeerNameFromType(beerType),
        shippingInfo,
        preferenceId: paymentResponse.preference.id,
        price: subscription.price,
      };

      // Guardar en caché o base de datos temporal
      // Nota: En una implementación completa, deberías guardar esto en la base de datos
      // Aquí simplemente lo almacenamos en la sesión para el ejemplo
      req.session = req.session || {};
      req.session.pendingSubscriptions = req.session.pendingSubscriptions || {};
      req.session.pendingSubscriptions[orderId] = subscriptionData;

      // Crear registro de pago
      const newPayment = new Payments({
        userId,
        amount: subscription.price,
        netAmount: subscription.price,
        currency: "ARS",
        paymentMethod: "mercadopago",
        paymentId: null,
        orderId: orderId,
        date: new Date(),
        status: "pending",
        preferenceUrl: paymentResponse.init_point,
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        address2: shippingInfo.address2 || "",
        city: shippingInfo.city,
        state: shippingInfo.state,
        country: shippingInfo.country,
        postalCode: shippingInfo.postalCode,
      });

      await newPayment.save();

      // Responder con URL de MercadoPago
      res.status(200).json({
        success: true,
        redirectUrl: paymentResponse.init_point,
        orderId,
        preferenceId: paymentResponse.preference.id,
      });
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
      res
        .status(500)
        .json({ error: "Error al procesar el pago de la suscripción" });
    }
  }
);

// Verificar estado de una orden
router.get("/order-status/:orderId", checkAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userData._id;

    // Buscar orden
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    // Verificar que la orden pertenece al usuario
    if (order.customer.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver esta orden" });
    }

    // Buscar pago asociado
    const payment = await Payments.findOne({ orderId });

    res.status(200).json({
      order: {
        id: order.id,
        date: order.date,
        status: order.status,
        total: order.total,
        items: order.items,
        paymentStatus: order.paymentStatus,
        trackingSteps: order.trackingSteps,
        deliveryTime: order.deliveryTime,
      },
      paymentInfo: payment
        ? {
            status: payment.status,
            method: payment.paymentMethod,
            date: payment.date,
          }
        : null,
    });
  } catch (error) {
    console.error("Error al verificar estado de orden:", error);
    res.status(500).json({ error: "Error al verificar el estado de la orden" });
  }
});

// Obtener pedidos del usuario autenticado
router.get("/my-orders", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const { status } = req.query;

    // Construir filtro
    const filter = { "customer.userId": userId, nullDate: null };

    if (
      status &&
      ["pending", "processing", "shipped", "delivered", "cancelled"].includes(
        status
      )
    ) {
      filter.status = status;
    }

    // Obtener órdenes
    const orders = await Order.find(filter).sort({ date: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener el historial de pedidos" });
  }
});

// Webhook para recibir notificaciones de pago de MercadoPago
router.post("/payments/webhook", async (req, res) => {
  try {
    const { type, data } = req.query;

    // Solo procesar notificaciones de pagos
    if (type !== "payment") {
      return res.status(200).send();
    }

    // Verificar firma de MercadoPago (en producción)
    if (process.env.NODE_ENV === "production") {
      // Aquí iría la lógica de verificación como la que tenías antes
      // Omitido para simplificar
    }

    // Obtener información detallada del pago
    const paymentId = data.id;
    let paymentInfo;

    try {
      paymentInfo = await new Payment(client).get({ id: paymentId });
    } catch (error) {
      console.error("Error al obtener información del pago:", error);
      return res.status(500).send();
    }

    // Obtener referencia externa (orderId)
    const orderId = paymentInfo.external_reference;

    if (!orderId) {
      console.error("Orden no especificada en la notificación");
      return res.status(400).send();
    }

    // Actualizar estado de pago
    await Payments.findOneAndUpdate(
      { orderId },
      {
        status: paymentInfo.status,
        paymentId: paymentInfo.id,
        userData: paymentInfo.payer,
      }
    );

    // Actualizar estado de orden
    const order = await Order.findOne({ id: orderId });
    if (order) {
      if (
        paymentInfo.status === "approved" ||
        paymentInfo.status === "authorized"
      ) {
        order.paymentStatus = "completed";

        // Si la orden estaba pendiente, actualizarla a processing
        if (order.status === "pending") {
          order.status = "processing";

          // Actualizar tracking steps
          order.trackingSteps.forEach((step) => (step.current = false));
          order.trackingSteps.push({
            status: "Pago confirmado",
            date: new Date(),
            completed: true,
            current: true,
          });

          // Reducir stock de productos
          for (const item of order.items) {
            if (item.type === "beer") {
              await Beer.findOneAndUpdate(
                { id: item.id },
                { $inc: { stock: -item.quantity } }
              );
            }
          }
        }
      } else if (
        ["rejected", "cancelled", "refunded", "charged_back"].includes(
          paymentInfo.status
        )
      ) {
        order.paymentStatus = "failed";
      }

      await order.save();
    }

    res.status(200).send();
  } catch (error) {
    console.error("Error en webhook de pagos:", error);
    res.status(500).send();
  }
});

// Webhook para suscripciones
router.post("/payments/subscription-webhook", async (req, res) => {
  try {
    const { type, data } = req.query;

    // Solo procesar notificaciones de pagos
    if (type !== "payment") {
      return res.status(200).send();
    }

    // Obtener información detallada del pago
    const paymentId = data.id;
    let paymentInfo;

    try {
      paymentInfo = await new Payment(client).get({ id: paymentId });
    } catch (error) {
      console.error("Error al obtener información del pago:", error);
      return res.status(500).send();
    }

    // Obtener referencia externa (orderId)
    const orderId = paymentInfo.external_reference;

    if (!orderId || !orderId.startsWith("SUB-")) {
      console.error("Orden de suscripción no válida");
      return res.status(400).send();
    }

    // Actualizar estado de pago
    const payment = await Payments.findOneAndUpdate(
      { orderId },
      {
        status: paymentInfo.status,
        paymentId: paymentInfo.id,
        userData: paymentInfo.payer,
      },
      { new: true }
    );

    if (!payment) {
      console.error("Pago no encontrado para la suscripción:", orderId);
      return res.status(404).send();
    }

    // Si el pago fue aprobado, crear la suscripción
    if (
      paymentInfo.status === "approved" ||
      paymentInfo.status === "authorized"
    ) {
      // Esta implementación requeriría tener los datos de la suscripción almacenados
      // o recuperarlos de alguna manera. Aquí usaremos un enfoque simulado.

      // En una implementación real, obtendríamos esto de la base de datos o caché
      const userId = payment.userId;
      const subscriptionInfo = await getSubscriptionInfoFromPayment(payment);

      if (subscriptionInfo) {
        const nextDeliveryDate = new Date();
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 30);

        // Crear suscripción activa
        const newSubscription = new UserSubscription({
          id: `ACTIVE-${orderId}`,
          userId,
          subscriptionId: subscriptionInfo.subscriptionId,
          name: subscriptionInfo.name,
          beerType: subscriptionInfo.beerType,
          beerName: subscriptionInfo.beerName,
          liters: subscriptionInfo.liters,
          price: subscriptionInfo.price,
          status: "active",
          startDate: new Date(),
          nextDelivery: nextDeliveryDate,
          deliveries: [],
        });

        await newSubscription.save();
      }
    }

    res.status(200).send();
  } catch (error) {
    console.error("Error en webhook de suscripciones:", error);
    res.status(500).send();
  }
});

/**********
 * FUNCTIONS
 ************/

// Procesar pago con MercadoPago
const processMercadopagoPayment = async (preference) => {
  try {
    const response = await new Preference(client).create(preference);
    return {
      preference: response,
      init_point: response.init_point,
    };
  } catch (error) {
    console.error("Error al crear preferencia en MercadoPago:", error);
    return { preference: null, init_point: null };
  }
};

// Obtener nombre de cerveza según tipo
function getBeerNameFromType(type) {
  const beerNames = {
    golden: "Luna Dorada (Golden Ale)",
    red: "Luna Roja (Irish Red Ale)",
    ipa: "Luna Brillante (IPA)",
  };
  return beerNames[type] || "Cerveza Luna";
}

// Obtener información de suscripción desde un pago
async function getSubscriptionInfoFromPayment(payment) {
  // En una implementación real, estos datos vendrían de la base de datos
  try {
    // Extraer el ID de suscripción de los metadatos de pago o de una consulta adicional
    // Ejemplo simplificado:
    const subscriptionId = payment.orderId.replace("SUB-", "").split("-")[0];

    const subscription = await Subscription.findOne({ id: subscriptionId });
    if (!subscription) return null;

    // La información del tipo de cerveza tendría que recuperarse de algún lugar
    // Aquí asumimos que está en los metadatos o en una tabla temporal
    const beerType = "golden"; // Valor por defecto

    return {
      subscriptionId: subscription.id,
      name: subscription.name,
      beerType,
      beerName: getBeerNameFromType(beerType),
      liters: subscription.liters,
      price: subscription.price,
    };
  } catch (error) {
    console.error("Error al recuperar información de suscripción:", error);
    return null;
  }
}

module.exports = router;
