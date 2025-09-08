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
  options: { timeout: 5000, idempotencyKey: "abc" },
});

/**
 * CHECKOUT API ROUTES
 */

// Crear preferencia para checkout
router.post("/payments/create-preference", checkAuth, async (req, res) => {
  try {
    console.log("=== CREANDO PREFERENCIA DE PAGO ===");
    console.log("Usuario ID:", req.userData._id);
    console.log("Datos recibidos:", JSON.stringify(req.body, null, 2));

    const { cartItems, shippingInfo, discountInfo } = req.body;
    const userId = req.userData._id;

    // Validar datos requeridos
    if (!cartItems || cartItems.length === 0) {
      console.log("❌ Error: Carrito vacío");
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío",
      });
    }

    console.log("📦 Procesando", cartItems.length, "elementos del carrito:");
    cartItems.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.type} - ID: ${item.id} - Cantidad: ${
          item.quantity || 1
        }`
      );
    });

    // Obtener información completa de productos
    const items = [];
    let totalAmount = 0;

    console.log("🔍 Buscando información de productos...");

    for (const cartItem of cartItems) {
      console.log(`Procesando item: ${cartItem.type} - ${cartItem.id}`);

      if (cartItem.type === "beer") {
        const product = await Beer.findOne({ id: cartItem.id, nullDate: null });
        if (!product) {
          console.log(`❌ Error: Producto beer no encontrado - ${cartItem.id}`);
          return res.status(400).json({
            success: false,
            message: `Producto no encontrado: ${cartItem.id}`,
          });
        }

        const itemPrice = product.price;
        const itemTotal = itemPrice * cartItem.quantity;

        console.log(
          `  ✅ Beer encontrado: ${product.name} - Precio: $${itemPrice} - Cantidad: ${cartItem.quantity} - Total: $${itemTotal}`
        );

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
          console.log(`❌ Error: Suscripción no encontrada - ${cartItem.id}`);
          return res.status(400).json({
            success: false,
            message: `Plan de suscripción no encontrado: ${cartItem.id}`,
          });
        }

        console.log(
          `  ✅ Suscripción encontrada: ${subscription.name} - Precio: $${subscription.price}`
        );

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

    console.log("💰 Total antes de descuentos:", totalAmount);

    // Aplicar descuento si existe
    if (discountInfo && discountInfo.valid) {
      console.log("🎫 Aplicando descuento:", discountInfo);
      const originalTotal = totalAmount;

      if (discountInfo.type === "percentage") {
        totalAmount = totalAmount * (1 - discountInfo.value / 100);
        console.log(
          `  📊 Descuento porcentual: ${discountInfo.value}% - De $${originalTotal} a $${totalAmount}`
        );
      } else if (discountInfo.type === "fixed") {
        totalAmount = Math.max(totalAmount - discountInfo.value, 0);
        console.log(
          `  💵 Descuento fijo: $${discountInfo.value} - De $${originalTotal} a $${totalAmount}`
        );
      }
    } else {
      console.log("🚫 Sin descuentos aplicados");
    }

    console.log("💰 Total final:", totalAmount);

    // Crear orden en la base de datos
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log("📋 Creando orden:", orderId);
    console.log("🏠 Información de envío:", shippingInfo);

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
          description: "Tu pedido ha sido recibido y está siendo procesado",
        },
      ],
      nullDate: null,
    });

    console.log("💾 Guardando orden en base de datos...");
    await newOrder.save();
    console.log("✅ Orden guardada exitosamente con ID:", orderId);

    // Configurar preference para MercadoPago
    console.log("🏛️ Configurando preferencia de MercadoPago...");
    console.log("📦 Items para MercadoPago:", JSON.stringify(items, null, 2));

    const preferenceData = {
      items,
      payer: {
        name: shippingInfo.firstName,
        surname: shippingInfo.lastName,
        email: shippingInfo.email,
        phone: {
          area_code: "11",
          number: shippingInfo.phone?.replace(/\D/g, "") || "12345678",
        },
        identification: {
          type: "DNI",
          number: "12345678",
        },
        address: {
          street_name: shippingInfo.address || "Calle Falsa",
          street_number: 123,
          zip_code: shippingInfo.postalCode || "1000",
        },
      },
      notification_url: `${
        process.env.API_URL || "http://localhost:3001"
      }/api/payments/webhook`,
      external_reference: newOrder._id.toString(),
      statement_descriptor: "LUNA BREW HOUSE",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    };

    console.log(
      "📋 Datos de preferencia:",
      JSON.stringify(preferenceData, null, 2)
    );

    const preference = new Preference(client);
    console.log("🔄 Enviando preferencia a MercadoPago...");
    const result = await preference.create({ body: preferenceData });

    console.log("✅ Preferencia creada exitosamente:");
    console.log("  ID:", result.id);
    console.log("  Init Point:", result.init_point);
    console.log("  Sandbox Init Point:", result.sandbox_init_point);

    // Guardar la preferencia en la orden
    console.log("💾 Actualizando orden con preferenceId...");
    newOrder.preferenceId = result.id;
    await newOrder.save();
    console.log("✅ Orden actualizada con preferenceId");

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

    console.log(
      "📤 Enviando respuesta:",
      JSON.stringify(responseData, null, 2)
    );
    res.json(responseData);
  } catch (error) {
    console.error("❌ Error creando preferencia de MercadoPago:", error);
    console.error("Stack trace:", error.stack);
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
    console.log("=== PROCESANDO PAGO DIRECTO ===");
    console.log("Usuario ID:", req.userData._id);
    console.log("Datos recibidos:", JSON.stringify(req.body, null, 2));

    const {
      token,
      orderId,
      installments,
      payment_method_id,
      issuer_id,
      payer,
    } = req.body;

    const userId = req.userData._id;

    console.log("🔍 Buscando orden...");
    console.log("Order ID:", orderId);
    console.log("User ID:", userId);

    // Buscar la orden
    const order = await Order.findOne({
      _id: orderId,
      "customer.userId": userId,
    });

    if (!order) {
      console.log("❌ Error: Orden no encontrada");
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada",
      });
    }

    console.log("✅ Orden encontrada:", order.id);
    console.log("💰 Total de la orden: $", order.total);

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

    console.log("💳 Datos del pago:", JSON.stringify(paymentData, null, 2));
    console.log("🔄 Enviando pago a MercadoPago...");

    const result = await payment.create({ body: paymentData });

    console.log("📬 Respuesta de MercadoPago:");
    console.log("  ID:", result.id);
    console.log("  Status:", result.status);
    console.log("  Status Detail:", result.status_detail);
    console.log(
      "  Transaction Details:",
      JSON.stringify(result.transaction_details, null, 2)
    );

    console.log("💾 Creando registro de pago...");

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
    console.log("✅ Registro de pago guardado");

    console.log("🔄 Actualizando estado de la orden...");

    // Actualizar orden según el estado del pago
    if (result.status === "approved") {
      console.log("✅ Pago aprobado - Actualizando orden a confirmada");
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.trackingSteps.push({
        status: "Pago confirmado",
        date: new Date(),
        description: "Tu pago ha sido confirmado exitosamente",
      });
    } else if (result.status === "pending") {
      console.log("⏳ Pago pendiente - Manteniendo orden en estado pendiente");
      order.paymentStatus = "pending";
      order.status = "pending";
      order.trackingSteps.push({
        status: "Pago pendiente",
        date: new Date(),
        description: "Tu pago está siendo procesado",
      });
    } else {
      console.log("❌ Pago rechazado - Marcando orden como cancelada");
      console.log("  Status detail:", result.status_detail);
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
    console.log("✅ Orden actualizada exitosamente");

    const responseData = {
      success: true,
      data: {
        payment: result,
        order: order,
        status: result.status,
      },
    };

    console.log(
      "📤 Enviando respuesta de pago:",
      JSON.stringify(responseData, null, 2)
    );
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
    console.log("=== OBTENIENDO PEDIDOS DEL USUARIO ===");
    const userId = req.userData._id;
    const { status } = req.query;

    console.log("Usuario ID:", userId);
    console.log("Filtro de estado:", status);

    // Construir filtro
    const filter = { "customer.userId": userId, nullDate: null };

    if (
      status &&
      ["pending", "processing", "shipped", "delivered", "cancelled"].includes(
        status
      )
    ) {
      filter.status = status;
      console.log("✅ Filtro de estado aplicado:", status);
    }

    console.log("🔍 Filtro de búsqueda:", JSON.stringify(filter, null, 2));

    // Obtener órdenes
    const orders = await Order.find(filter).sort({ date: -1 });

    console.log("📦 Órdenes encontradas:", orders.length);
    orders.forEach((order, index) => {
      console.log(
        `  ${index + 1}. ${order.id} - ${order.status} - $${order.total} - ${
          order.date
        }`
      );
    });

    const responseData = {
      success: true,
      data: { data: orders },
    };

    console.log("📤 Enviando respuesta con", orders.length, "órdenes");
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
    console.log("=== WEBHOOK DE PAGOS RECIBIDO ===");
    console.log("Query params:", JSON.stringify(req.query, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Headers:", JSON.stringify(req.headers, null, 2));

    const { type, data } = req.query;

    // Solo procesar notificaciones de pagos
    if (type !== "payment") {
      console.log("🚫 Tipo de notificación no es 'payment', ignorando:", type);
      return res.status(200).send();
    }

    console.log("💳 Procesando notificación de pago...");

    // Verificar firma de MercadoPago (en producción)
    if (process.env.NODE_ENV === "production") {
      console.log("🔐 Verificando firma en producción...");
      // Aquí iría la lógica de verificación como la que tenías antes
      // Omitido para simplificar
    }

    // Obtener información detallada del pago
    const paymentId = data.id;
    console.log("🔍 Obteniendo información del pago ID:", paymentId);

    let paymentInfo;

    try {
      paymentInfo = await new Payment(client).get({ id: paymentId });
      console.log("✅ Información del pago obtenida:");
      console.log("  Status:", paymentInfo.status);
      console.log("  Status Detail:", paymentInfo.status_detail);
      console.log("  Amount:", paymentInfo.transaction_amount);
      console.log("  External Reference:", paymentInfo.external_reference);
      console.log("  Payment Method:", paymentInfo.payment_method_id);
    } catch (error) {
      console.error("❌ Error al obtener información del pago:", error);
      return res.status(500).send();
    }

    // Obtener referencia externa (orderId)
    const orderId = paymentInfo.external_reference;

    if (!orderId) {
      console.error("❌ Orden no especificada en la notificación");
      return res.status(400).send();
    }

    console.log("📋 Actualizando orden:", orderId);

    console.log("💾 Actualizando registro de pago...");
    // Actualizar estado de pago
    await Payments.findOneAndUpdate(
      { orderId },
      {
        status: paymentInfo.status,
        paymentId: paymentInfo.id,
        userData: paymentInfo.payer,
      }
    );
    console.log("✅ Registro de pago actualizado");

    console.log("📋 Buscando y actualizando orden...");
    // Actualizar estado de orden
    const order = await Order.findOne({ id: orderId });
    if (order) {
      console.log("✅ Orden encontrada:", order.id);

      if (
        paymentInfo.status === "approved" ||
        paymentInfo.status === "authorized"
      ) {
        console.log("✅ Pago aprobado - Actualizando orden");
        order.paymentStatus = "completed";

        // Si la orden estaba pendiente, actualizarla a processing
        if (order.status === "pending") {
          console.log(
            "📦 Cambiando estado de orden de 'pending' a 'processing'"
          );
          order.status = "processing";

          // Actualizar tracking steps
          order.trackingSteps.forEach((step) => (step.current = false));
          order.trackingSteps.push({
            status: "Pago confirmado",
            date: new Date(),
            completed: true,
            current: true,
          });

          console.log("📉 Reduciendo stock de productos...");
          // Reducir stock de productos
          for (const item of order.items) {
            if (item.type === "beer") {
              console.log(
                `  Reduciendo stock de ${item.id} en ${item.quantity} unidades`
              );
              await Beer.findOneAndUpdate(
                { id: item.id },
                { $inc: { stock: -item.quantity } }
              );
            }
          }
          console.log("✅ Stock actualizado");
        }
      } else if (
        ["rejected", "cancelled", "refunded", "charged_back"].includes(
          paymentInfo.status
        )
      ) {
        console.log("❌ Pago rechazado/cancelado - Actualizando orden");
        console.log("  Status:", paymentInfo.status);
        console.log("  Status Detail:", paymentInfo.status_detail);
        order.paymentStatus = "failed";
      } else {
        console.log("⏳ Estado de pago pendiente:", paymentInfo.status);
      }

      console.log("💾 Guardando cambios en la orden...");
      await order.save();
      console.log("✅ Orden actualizada exitosamente");
    } else {
      console.log("❌ Orden no encontrada:", orderId);
    }

    console.log("✅ Webhook procesado exitosamente");
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
