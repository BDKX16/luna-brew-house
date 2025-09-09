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
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: "abc",
  },
});

// Verificar que estamos usando credenciales de test
const isTestEnvironment =
  process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("TEST-");
console.log(
  "🔧 MercadoPago Environment:",
  isTestEnvironment ? "TEST/SANDBOX" : "PRODUCTION"
);

if (!isTestEnvironment && process.env.NODE_ENV !== "production") {
  console.warn(
    "⚠️  ADVERTENCIA: Usando credenciales de PRODUCCIÓN en entorno de desarrollo"
  );
}

/**
 * CHECKOUT API ROUTES
 */

// Crear preferencia para checkout
router.post("/payments/create-preference", checkAuth, async (req, res) => {
  try {
    const { cartItems, shippingInfo, discountInfo } = req.body;
    const userId = req.userData._id;

    // Validar datos requeridos
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío",
      });
    }

    // Obtener información completa de productos
    const items = [];
    let totalAmount = 0;

    for (const cartItem of cartItems) {
      if (cartItem.type === "beer") {
        const product = await Beer.findOne({ id: cartItem.id, nullDate: null });
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Producto no encontrado: ${cartItem.id}`,
          });
        }

        const itemPrice = product.price;
        const itemTotal = itemPrice * cartItem.quantity;

        items.push({
          id: product.id,
          title: product.name,
          description: product.description || `Cerveza ${product.type}`,
          picture_url: product.image || "https://via.placeholder.com/150",
          category_id: "beer",
          quantity: cartItem.quantity,
          currency_id: "ARS",
          unit_price: itemPrice,
        });

        totalAmount += itemTotal;
      } else if (cartItem.type === "subscription") {
        const subscription = await Subscription.findOne({
          id: cartItem.id,
          nullDate: null,
        });
        if (!subscription) {
          return res.status(400).json({
            success: false,
            message: `Plan de suscripción no encontrado: ${cartItem.id}`,
          });
        }

        items.push({
          id: subscription.id,
          title: subscription.name,
          description: `Suscripción ${subscription.liters}L`,
          picture_url: "https://via.placeholder.com/150",
          category_id: "subscription",
          quantity: 1,
          currency_id: "ARS",
          unit_price: subscription.price,
        });

        totalAmount += subscription.price;
      }
    }

    // Aplicar descuento si existe
    if (discountInfo && discountInfo.valid) {
      const originalTotal = totalAmount;

      if (discountInfo.type === "percentage") {
        totalAmount = totalAmount * (1 - discountInfo.value / 100);
      } else if (discountInfo.type === "fixed") {
        totalAmount = Math.max(totalAmount - discountInfo.value, 0);
      }
    }

    // Crear orden en la base de datos
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
      total: totalAmount,
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price,
        quantity: item.quantity,
      })),
      paymentMethod: "mercadopago",
      paymentStatus: "pending",
      deliveryTime: shippingInfo.deliveryTime || null,
      customerSelectedTime: !!shippingInfo.deliveryTime,
      discountCode: discountInfo?.code || null,
      discountAmount: discountInfo
        ? discountInfo.type === "percentage"
          ? totalAmount * (discountInfo.value / 100)
          : discountInfo.value
        : 0,
      trackingSteps: [
        {
          status: "Pedido recibido",
          date: new Date(),
          description:
            "Tu pedido ha sido recibido y está siendo procesado, te avisaremos cuando se haya acreditado el pago, no te preocupes",
        },
      ],
      nullDate: null,
    });

    await newOrder.save();

    // Configurar preference para MercadoPago
    const preferenceData = {
      items,
      payer: {
        name: shippingInfo.firstName,
        surname: shippingInfo.lastName,
        email: shippingInfo.email,
        phone: {
          area_code: "223",
          number: shippingInfo.phone?.replace(/\D/g, ""),
        },
        identification: {
          type: "DNI",
          number: "12345678",
        },
        address: {
          street_name: shippingInfo.address,
          street_number: 0,
          zip_code: shippingInfo.postalCode,
        },
      },
      // URLs de notificación y retorno
      notification_url: `${
        process.env.API_URL || "http://localhost:3001"
      }/api/payments/webhook`,
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
      external_reference: newOrder._id.toString(),
      statement_descriptor: "LUNA BREW HOUSE",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceData });

    // Crear registro de pago inicial
    const initialPayment = new Payments({
      userId,
      orderId: newOrder._id.toString(),
      amount: totalAmount,
      currency: "ARS",
      paymentMethod: "mercadopago",
      preferenceId: result.id,
      status: "pending",
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name || item.title,
        type: item.type,
        quantity: item.quantity || 1,
        price: item.price,
      })),
      createdAt: new Date(),
    });

    await initialPayment.save();

    const responseData = {
      success: true,
      data: {
        preferenceId: result.id,
        orderId: newOrder._id,
        totalAmount,
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error creando preferencia de MercadoPago:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

// Procesar pago directo con tarjeta (Checkout API)
router.post("/payments/process-payment", checkAuth, async (req, res) => {
  try {
    const {
      token,
      orderId,
      installments,
      payment_method_id,
      issuer_id,
      payer,
    } = req.body;

    const userId = req.userData._id;

    // Buscar la orden
    const order = await Order.findOne({
      _id: orderId,
      "customer.userId": userId,
    });

    if (!order) {
      console.error("❌ Error: Orden no encontrada");
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada",
      });
    }

    const payment = new Payment(client);

    const paymentData = {
      transaction_amount: order.total,
      token,
      description: `Pedido Luna Brew House - ${order.id}`,
      installments: parseInt(installments),
      payment_method_id,
      issuer_id,
      payer: {
        email: payer.email,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number,
        },
      },
      external_reference: order._id.toString(),
      statement_descriptor: "LUNA BREW HOUSE",
      notification_url: `${
        process.env.API_URL || "http://localhost:3001"
      }/api/payments/webhook`,
    };

    const result = await payment.create({ body: paymentData });

    // Crear registro de pago
    const paymentRecord = new Payments({
      orderId: order.id,
      userId,
      amount: order.total,
      currency: "ARS",
      method: "credit_card",
      status: result.status,
      mercadoPagoId: result.id.toString(),
      details: {
        payment_method_id,
        installments: parseInt(installments),
        issuer_id,
        transaction_details: result.transaction_details,
      },
      createdAt: new Date(),
      nullDate: null,
    });

    await paymentRecord.save();

    // Actualizar orden según el estado del pago
    if (result.status === "approved") {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.trackingSteps.push({
        status: "Pago confirmado",
        date: new Date(),
        description: "Tu pago ha sido confirmado exitosamente",
      });
    } else if (result.status === "pending") {
      order.paymentStatus = "pending";
      order.status = "pending";
      order.trackingSteps.push({
        status: "Pago pendiente",
        date: new Date(),
        description: "Tu pago está siendo procesado",
      });
    } else {
      order.paymentStatus = "failed";
      order.status = "cancelled";
      order.trackingSteps.push({
        status: "Pago rechazado",
        date: new Date(),
        description: "Tu pago ha sido rechazado",
      });
    }

    order.paymentId = paymentRecord._id;
    await order.save();

    const responseData = {
      success: true,
      data: {
        payment: result,
        order: order,
        status: result.status,
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error procesando pago:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error procesando el pago",
      error: error.message,
    });
  }
});

/**
 * PROCESAMIENTO DE PAGOS PARA CERVEZAS Y SUSCRIPCIONES (CHECKOUT PRO)
 */

// Crear un nuevo procesamiento de pago
router.post(
  "/payments/checkout",
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
        orderId: orderId,
        amount: total,
        netAmount: total,
        currency: "ARS",
        paymentMethod: "mercadopago",
        paymentId: null,
        preferenceId: paymentResponse.preference.id,
        items: orderItems,
        discountCode: discountInfo?.code || null,
        discountAmount: discount,
        date: new Date(),
        status: "pending",
        preferenceUrl: paymentResponse.init_point,
        customerInfo: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
        },
      });

      await newPayment.save();

      // Responder con URL de MercadoPago y datos del pedido
      res.status(200).json({
        success: true,
        init_point: paymentResponse.init_point,
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
  "/payments/subscription-checkout",
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
          }/api/payments/webhook`,
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
        orderId: orderId,
        amount: subscription.price,
        netAmount: subscription.price,
        currency: "ARS",
        paymentMethod: "mercadopago",
        paymentId: null,
        preferenceId: paymentResponse.preference.id,
        items: [
          {
            id: subscription.id,
            name: subscription.name,
            type: "subscription",
            quantity: 1,
            price: subscription.price,
          },
        ],
        discountCode: null,
        discountAmount: 0,
        date: new Date(),
        status: "pending",
        preferenceUrl: paymentResponse.init_point,
        customerInfo: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
        },
        metadata: {
          subscriptionType: "monthly",
          beerType: beerType,
        },
      });

      await newPayment.save();

      // Responder con URL de MercadoPago
      res.status(200).json({
        success: true,
        init_point: paymentResponse.init_point,
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
router.get("/payments/order-status/:orderId", checkAuth, async (req, res) => {
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
router.get("/payments/my-orders", checkAuth, async (req, res) => {
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

    const responseData = {
      success: true,
      data: { data: orders },
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Error al obtener pedidos:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      error: "Error al obtener el historial de pedidos",
    });
  }
});

// Webhook para recibir notificaciones de pago de MercadoPago
router.post("/payments/webhook", async (req, res) => {
  try {
    const { type } = req.query;
    const paymentId = req.query["data.id"]; // Obtener el ID del pago de los query params

    // Solo procesar notificaciones de pagos
    if (type !== "payment") {
      return res.status(200).send();
    }

    // Validar que tenemos el ID del pago
    if (!paymentId) {
      return res.status(400).send();
    }

    // Verificar firma de MercadoPago (en producción)
    if (process.env.NODE_ENV === "production") {
      try {
        const xSignature = req.headers["x-signature"];
        const xRequestId = req.headers["x-request-id"];

        if (!xSignature) {
          return res.status(401).send();
        }

        // Extraer timestamp y hash de la firma
        const signatureParts = xSignature.split(",");
        let ts, hash;

        signatureParts.forEach((part) => {
          const [key, value] = part.split("=");
          if (key === "ts") ts = value;
          if (key === "v1") hash = value;
        });

        if (!ts || !hash) {
          return res.status(401).send();
        }

        // Crear string para verificar firma
        const dataId = paymentId;
        const stringToSign = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

        // Calcular hash esperado usando el webhook secret
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
        if (!webhookSecret) {
          return res.status(500).send();
        }

        const expectedHash = crypto
          .createHmac("sha256", webhookSecret)
          .update(stringToSign)
          .digest("hex");

        if (hash !== expectedHash) {
          return res.status(401).send();
        }
      } catch (signatureError) {
        console.error("❌ Error verificando firma:", signatureError);
        return res.status(401).send();
      }
    }

    let paymentInfo;

    try {
      paymentInfo = await new Payment(client).get({ id: paymentId });
    } catch (error) {
      // Si es un pago de prueba (ID 123456), crear una respuesta mock para testing
      if (paymentId === "123456") {
        paymentInfo = {
          id: "123456",
          status: "approved",
          status_detail: "approved",
          transaction_amount: 1000,
          external_reference: null, // Esto causará que se salte el procesamiento
          payment_method_id: "master",
          payer: {
            email: "test@test.com",
            identification: { number: "12345678" },
          },
        };
      } else {
        return res.status(500).send();
      }
    }

    // Obtener referencia externa (orderId)
    const orderId = paymentInfo.external_reference;

    if (!orderId) {
      console.error("❌ Orden no especificada en la notificación");
      return res.status(400).send();
    }

    const finalOrderId = paymentInfo.external_reference;
    // Buscar registro de pago existente
    const existingPayment = await Payments.findOne({ orderId: finalOrderId });
    if (!existingPayment) {
      if (paymentInfo.id) {
        const paymentByMpId = await Payments.findOne({
          paymentId: paymentInfo.id,
        });
      }
    }

    // Actualizar estado de pago
    const paymentUpdateResult = await Payments.findOneAndUpdate(
      { orderId: finalOrderId },
      {
        status: paymentInfo.status,
        paymentId: paymentInfo.id,
        userData: paymentInfo.payer,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (paymentUpdateResult) {
      // Registro actualizado
    } else {
      console.warn(
        "⚠️ No se encontró registro de pago para orden:",
        finalOrderId
      );
    }

    // Actualizar estado de orden - buscar por ObjectId de MongoDB
    const order = await Order.findById(finalOrderId);
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

          // Reducir stock de productos y crear suscripciones
          for (const item of order.items) {
            if (item.type === "beer") {
              await Beer.findOneAndUpdate(
                { id: item.id },
                { $inc: { stock: -item.quantity } }
              );
            } else if (item.type === "subscription") {
              // Crear suscripción del usuario
              try {
                const subscription = await Subscription.findOne({
                  id: item.id,
                });
                if (subscription) {
                  // Verificar si ya existe una suscripción activa para este usuario y plan
                  const existingSubscription = await UserSubscription.findOne({
                    userId: order.customer.userId,
                    subscriptionId: item.id,
                    status: "active",
                    nullDate: null,
                  });

                  if (!existingSubscription) {
                    // Crear nueva suscripción
                    const newSubscription = new UserSubscription({
                      id: `sub_${Date.now()}_${order.customer.userId}`,
                      userId: order.customer.userId,
                      subscriptionId: item.id,
                      name: subscription.name,
                      beerType: subscription.beerType || "golden", // Valor por defecto
                      beerName: subscription.name,
                      liters: subscription.liters,
                      price: subscription.price,
                      status: "active",
                      startDate: new Date(),
                      nextDelivery: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                      ), // 30 días
                      deliveries: [],
                      billingInfo: {
                        orderId: order._id,
                        paymentId: paymentInfo.id,
                        paymentDate: new Date(),
                      },
                    });

                    await newSubscription.save();
                    console.log(
                      `✅ Suscripción creada para usuario ${order.customer.userId}: ${subscription.name}`
                    );
                  } else {
                    console.log(
                      `⚠️ Suscripción ya existe para usuario ${order.customer.userId}: ${subscription.name}`
                    );
                  }
                } else {
                  console.error(
                    `❌ Plan de suscripción no encontrado: ${item.id}`
                  );
                }
              } catch (subscriptionError) {
                console.error(
                  "❌ Error creando suscripción:",
                  subscriptionError
                );
              }
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
    } else {
      // Intentar búsqueda alternativa por campo 'id'
      const orderByField = await Order.findOne({ id: finalOrderId });

      if (orderByField) {
        // Actualizar usando la orden encontrada
        if (
          paymentInfo.status === "approved" ||
          paymentInfo.status === "authorized"
        ) {
          orderByField.paymentStatus = "completed";

          // Si la orden estaba pendiente, procesarla
          if (orderByField.status === "pending") {
            orderByField.status = "processing";

            // Procesar items y crear suscripciones si es necesario
            for (const item of orderByField.items) {
              if (item.type === "beer") {
                await Beer.findOneAndUpdate(
                  { id: item.id },
                  { $inc: { stock: -item.quantity } }
                );
              } else if (item.type === "subscription") {
                // Crear suscripción del usuario
                try {
                  const subscription = await Subscription.findOne({
                    id: item.id,
                  });
                  if (subscription) {
                    // Verificar si ya existe una suscripción activa
                    const existingSubscription = await UserSubscription.findOne(
                      {
                        userId: orderByField.customer.userId,
                        subscriptionId: item.id,
                        status: "active",
                        nullDate: null,
                      }
                    );

                    if (!existingSubscription) {
                      // Crear nueva suscripción
                      const newSubscription = new UserSubscription({
                        id: `sub_${Date.now()}_${orderByField.customer.userId}`,
                        userId: orderByField.customer.userId,
                        subscriptionId: item.id,
                        name: subscription.name,
                        beerType: subscription.beerType || "golden",
                        beerName: subscription.name,
                        liters: subscription.liters,
                        price: subscription.price,
                        status: "active",
                        startDate: new Date(),
                        nextDelivery: new Date(
                          Date.now() + 30 * 24 * 60 * 60 * 1000
                        ),
                        deliveries: [],
                        billingInfo: {
                          orderId: orderByField._id,
                          paymentId: paymentInfo.id,
                          paymentDate: new Date(),
                        },
                      });

                      await newSubscription.save();
                      console.log(
                        `✅ Suscripción creada (búsqueda alt) para usuario ${orderByField.customer.userId}: ${subscription.name}`
                      );
                    }
                  }
                } catch (subscriptionError) {
                  console.error(
                    "❌ Error creando suscripción (búsqueda alt):",
                    subscriptionError
                  );
                }
              }
            }
          }
        } else {
          orderByField.paymentStatus = "failed";
        }

        await orderByField.save();
      }
    }

    res.status(200).send();
  } catch (error) {
    console.error("❌ Error en webhook de pagos:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).send();
  }
});

// Webhook para suscripciones
router.post("/payments/subscription-webhook", async (req, res) => {
  try {
    const { type } = req.query;
    const paymentId = req.query["data.id"]; // Obtener el ID del pago de los query params

    // Solo procesar notificaciones de pagos
    if (type !== "payment") {
      return res.status(200).send();
    }

    // Validar que tenemos el ID del pago
    if (!paymentId) {
      console.error(
        "❌ No se encontró data.id en los query params para suscripción"
      );
      return res.status(400).send();
    }

    // Obtener información detallada del pago
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
  try {
    console.log(
      "🔍 Recuperando información de suscripción del pago:",
      payment.orderId
    );

    // Método 1: Obtener información desde los items del pago
    if (payment.items && payment.items.length > 0) {
      const subscriptionItem = payment.items.find(
        (item) => item.type === "subscription"
      );
      if (subscriptionItem) {
        console.log("✅ Información encontrada en items del pago");

        // Obtener la suscripción desde la base de datos
        const subscription = await Subscription.findOne({
          id: subscriptionItem.id,
        });
        if (!subscription) {
          console.error(
            "❌ Suscripción no encontrada en base de datos:",
            subscriptionItem.id
          );
          return null;
        }

        // Obtener beerType desde metadata si existe
        let beerType = "golden"; // valor por defecto
        if (payment.metadata && payment.metadata.beerType) {
          beerType = payment.metadata.beerType;
        }

        return {
          subscriptionId: subscription.id,
          name: subscription.name,
          beerType,
          beerName: getBeerNameFromType(beerType),
          liters: subscription.liters,
          price: subscription.price,
        };
      }
    }

    // Método 2: Buscar por ID extraído del orderId (método de respaldo)
    console.log("🔄 Intentando método de respaldo con orderId");
    const orderIdParts = payment.orderId.replace("SUB-", "").split("-");
    if (orderIdParts.length === 0) {
      console.error("❌ Formato de orderId inválido:", payment.orderId);
      return null;
    }

    // Intentar encontrar suscripción por los primeros dígitos del timestamp
    const subscriptions = await Subscription.find({ nullDate: null });

    // Si solo hay una suscripción activa, usar esa
    if (subscriptions.length === 1) {
      console.log("✅ Usando única suscripción activa disponible");
      const subscription = subscriptions[0];

      // Obtener beerType desde metadata si existe
      let beerType = "golden"; // valor por defecto
      if (payment.metadata && payment.metadata.beerType) {
        beerType = payment.metadata.beerType;
      }

      return {
        subscriptionId: subscription.id,
        name: subscription.name,
        beerType,
        beerName: getBeerNameFromType(beerType),
        liters: subscription.liters,
        price: subscription.price,
      };
    }

    console.error("❌ No se pudo determinar la suscripción desde el pago");
    return null;
  } catch (error) {
    console.error("❌ Error al recuperar información de suscripción:", error);
    return null;
  }
}

module.exports = router;
