const express = require("express");
const router = express.Router();
const { checkAuth, checkRole } = require("../middlewares/authentication");
const Order = require("../models/order");
const User = require("../models/user");
const Payment = require("../models/payment");

/**
 * RUTAS PARA LA GESTIÓN DE ÓRDENES DE VENTA
 */

// Obtener todas las órdenes
router.get(
  "/orders",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { status, startDate, endDate, limit = 100, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      // Construir filtro
      const filter = { nullDate: null };

      if (status) {
        filter.status = status;
      }

      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        filter.date = { $gte: new Date(startDate) };
      } else if (endDate) {
        filter.date = { $lte: new Date(endDate) };
      }

      // Ejecutar consulta de órdenes
      const orders = await Order.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Para cada orden, obtener información del pago asociado
      const ordersWithPayments = await Promise.all(
        orders.map(async (order) => {
          const orderObj = order.toObject();

          // Buscar pago asociado por orderId (usando el _id de MongoDB)
          const payment = await Payment.findOne({ orderId: order._id });

          // Determinar el tipo de orden (suscripción o cervezas)
          let orderType = "cervezas"; // valor por defecto
          let hasSubscription = false;
          let hasBeer = false;

          if (order.items && order.items.length > 0) {
            hasSubscription = order.items.some(
              (item) => item.type === "subscription"
            );
            hasBeer = order.items.some((item) => item.type === "beer");

            if (hasSubscription && hasBeer) {
              orderType = "mixto";
            } else if (hasSubscription) {
              orderType = "suscripción";
            } else {
              orderType = "cervezas";
            }
          }

          // Agregar información del pago y tipo de orden
          orderObj.payment = payment
            ? {
                id: payment._id,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                amount: payment.amount,
                paymentId: payment.paymentId,
                preferenceId: payment.preferenceId,
                date: payment.date,
              }
            : null;

          orderObj.orderType = orderType;
          orderObj.hasPayment = !!payment;
          orderObj.paymentStatus = payment ? payment.status : "sin_pago";

          return orderObj;
        })
      );

      // Obtener total para paginación
      const total = await Order.countDocuments(filter);

      res.status(200).json({
        orders: ordersWithPayments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Error al obtener órdenes:", error);
      res.status(500).json({ error: "Error al obtener el listado de órdenes" });
    }
  }
);

// Obtener una orden específica
router.get(
  "/orders/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const order = await Order.findOne({ id: req.params.id, nullDate: null });

      if (!order) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      // Si la orden tiene userId, buscamos información adicional del usuario
      let customerInfo = null;
      if (order.customer && order.customer.userId) {
        customerInfo = await User.findById(order.customer.userId, {
          password: 0,
        });
      }

      res.status(200).json({
        order,
        customerInfo,
      });
    } catch (error) {
      console.error("Error al obtener la orden:", error);
      res
        .status(500)
        .json({ error: "Error al obtener la información de la orden" });
    }
  }
);

// Actualizar el estado de una orden
router.patch(
  "/orders/:id/status",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (
        !status ||
        ![
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "ready_pickup",
          "waiting_schedule",
        ].includes(status)
      ) {
        return res.status(400).json({ error: "Estado no válido" });
      }

      const order = await Order.findOne({ id: req.params.id, nullDate: null });

      if (!order) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      // Actualizar estado
      order.status = status;

      // Agregar un nuevo paso al tracking si es necesario
      let trackingUpdated = false;

      // Marcar pasos actuales como no actuales
      order.trackingSteps.forEach((step) => {
        step.current = false;
      });

      // Verificar si ya existe un paso con el mismo estado
      const existingStepIndex = order.trackingSteps.findIndex(
        (step) =>
          step.status.toLowerCase() ===
          getTrackingStatusText(status).toLowerCase()
      );

      if (existingStepIndex >= 0) {
        // Actualizar el paso existente
        order.trackingSteps[existingStepIndex].completed = true;
        order.trackingSteps[existingStepIndex].current = true;
        order.trackingSteps[existingStepIndex].date = new Date();
        trackingUpdated = true;
      } else {
        // Crear un nuevo paso de tracking
        order.trackingSteps.push({
          status: getTrackingStatusText(status),
          date: new Date(),
          completed: true,
          current: true,
        });
        trackingUpdated = true;
      }

      // Marcar como completado los pasos anteriores basados en una secuencia lógica
      updateTrackingStepsBasedOnStatus(order.trackingSteps, status);

      await order.save();

      res.status(200).json({
        message: "Estado de la orden actualizado con éxito",
        order,
        trackingUpdated,
      });
    } catch (error) {
      console.error("Error al actualizar el estado de la orden:", error);
      res
        .status(500)
        .json({ error: "Error al actualizar el estado de la orden" });
    }
  }
);

// Actualizar los datos de entrega de una orden
router.patch(
  "/orders/:id/delivery",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { deliveryTime } = req.body;

      if (!deliveryTime || !deliveryTime.date || !deliveryTime.timeRange) {
        return res.status(400).json({ error: "Datos de entrega no válidos" });
      }

      const order = await Order.findOne({ id: req.params.id, nullDate: null });

      if (!order) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      // No permitir cambios en órdenes ya entregadas o canceladas
      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({
          error: `No se puede modificar la entrega de una orden ${
            order.status === "delivered" ? "ya entregada" : "cancelada"
          }`,
        });
      }

      // Actualizar información de entrega
      order.deliveryTime = deliveryTime;
      order.customerSelectedTime = false; // Indicar que el administrador ha cambiado la hora

      await order.save();

      res.status(200).json({
        message: "Información de entrega actualizada con éxito",
        order,
      });
    } catch (error) {
      console.error("Error al actualizar la información de entrega:", error);
      res
        .status(500)
        .json({ error: "Error al actualizar la información de entrega" });
    }
  }
);

// Cancelar una orden
router.patch(
  "/orders/:id/cancel",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { cancellationReason } = req.body;

      const order = await Order.findOne({ id: req.params.id, nullDate: null });

      if (!order) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      // No cancelar órdenes ya entregadas
      if (order.status === "delivered") {
        return res
          .status(400)
          .json({ error: "No se puede cancelar una orden ya entregada" });
      }

      // Actualizar estado
      order.status = "cancelled";
      order.cancellationReason =
        cancellationReason || "Cancelada por administrador";

      // Marcar pasos como no actuales
      order.trackingSteps.forEach((step) => {
        step.current = false;
      });

      // Agregar paso de cancelación
      order.trackingSteps.push({
        status: "Orden cancelada",
        date: new Date(),
        completed: true,
        current: true,
      });

      await order.save();

      res.status(200).json({
        message: "Orden cancelada con éxito",
        order,
      });
    } catch (error) {
      console.error("Error al cancelar la orden:", error);
      res.status(500).json({ error: "Error al cancelar la orden" });
    }
  }
);

// Obtener estadísticas de ventas
router.get(
  "/stats",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { period = "month" } = req.query;

      const today = new Date();
      let startDate;

      // Determinar fecha de inicio según el período
      switch (period) {
        case "day":
          startDate = new Date(today.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay()); // Inicio de semana (domingo)
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }

      // Total de ventas en el período - solo órdenes con pagos acreditados/aprobados
      const totalSalesResult = await Order.aggregate([
        {
          $match: {
            date: { $gte: startDate },
            status: { $nin: ["cancelled", "failed"] },
            nullDate: null,
          },
        },
        {
          $addFields: {
            orderIdString: { $toString: "$_id" },
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "orderIdString",
            foreignField: "orderId",
            as: "payment",
          },
        },
        {
          $match: {
            $or: [
              {
                "payment.status": {
                  $in: ["approved", "accredited", "completed"],
                },
              },
              { paymentMethod: "cash" }, // Incluir pagos en efectivo
            ],
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      // Productos más vendidos - solo de órdenes con pagos acreditados/aprobados
      const topProducts = await Order.aggregate([
        {
          $match: {
            date: { $gte: startDate },
            status: { $nin: ["cancelled", "failed"] },
            nullDate: null,
          },
        },
        {
          $addFields: {
            orderIdString: { $toString: "$_id" },
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "orderIdString",
            foreignField: "orderId",
            as: "payment",
          },
        },
        {
          $match: {
            $or: [
              {
                "payment.status": {
                  $in: ["approved", "accredited", "completed"],
                },
              },
              { paymentMethod: "cash" }, // Incluir pagos en efectivo
            ],
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.id",
            name: { $first: "$items.name" },
            type: { $first: "$items.type" },
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]);

      // Ventas por estado
      const salesByStatus = await Order.aggregate([
        {
          $match: {
            date: { $gte: startDate },
            nullDate: null,
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$total" },
          },
        },
      ]);

      // Formatear resultados
      const stats = {
        period,
        totalSales:
          totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0,
        orderCount:
          totalSalesResult.length > 0 ? totalSalesResult[0].orderCount : 0,
        topProducts,
        salesByStatus: salesByStatus.reduce((acc, curr) => {
          acc[curr._id] = {
            count: curr.count,
            amount: curr.amount,
          };
          return acc;
        }, {}),
      };

      res.status(200).json({ stats });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res
        .status(500)
        .json({ error: "Error al obtener las estadísticas de ventas" });
    }
  }
);

/**
 * NUEVOS ENDPOINTS PARA EL DASHBOARD
 */

// Obtener estadísticas completas para el dashboard
router.get("/dashboard", checkAuth, checkRole(["admin"]), async (req, res) => {
  try {
    // Obtener métricas actuales y comparativas
    const dashboardStats = await getDashboardStats();
    res.status(200).json(dashboardStats);
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({
      error: "Error al obtener las estadísticas del dashboard",
    });
  }
});

// Obtener los productos más vendidos
router.get(
  "/dashboard/top-products",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { limit = 5 } = req.query;

      // Obtener fecha de inicio del mes actual
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

      const topProducts = await Order.aggregate([
        {
          $match: {
            date: { $gte: startDate },
            status: { $nin: ["cancelled", "failed"] },
            nullDate: null,
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.id",
            name: { $first: "$items.name" },
            type: { $first: "$items.type" },
            sales: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { sales: -1 } },
        { $limit: parseInt(limit) },
        {
          $project: {
            _id: 0,
            id: "$_id",
            name: 1,
            type: 1,
            sales: 1,
            revenue: 1,
          },
        },
      ]);

      res.status(200).json({ topProducts });
    } catch (error) {
      console.error("Error al obtener productos más vendidos:", error);
      res.status(500).json({
        error: "Error al obtener el listado de productos más vendidos",
      });
    }
  }
);

// Obtener pedidos recientes
router.get(
  "/dashboard/recent-orders",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { limit = 5 } = req.query;

      const recentOrders = await Order.find({
        nullDate: null,
      })
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .lean();

      // Enriquecer con información de clientes
      const ordersWithCustomerInfo = await Promise.all(
        recentOrders.map(async (order) => {
          let customerName = "Cliente no registrado";

          if (order.customer && order.customer.userId) {
            const user = await User.findById(order.customer.userId, {
              name: 1,
              email: 1,
            });

            if (user) {
              customerName = user.name || user.email;
            }
          } else if (order.customer && order.customer.name) {
            customerName = order.customer.name;
          }

          return {
            id: order.id,
            customer: customerName,
            date: order.date,
            status: order.status,
            total: order.total,
          };
        })
      );

      res.status(200).json({ recentOrders: ordersWithCustomerInfo });
    } catch (error) {
      console.error("Error al obtener pedidos recientes:", error);
      res.status(500).json({
        error: "Error al obtener el listado de pedidos recientes",
      });
    }
  }
);

// Función auxiliar para obtener todas las estadísticas del dashboard
async function getDashboardStats() {
  // Fecha actual
  const today = new Date();

  // Período actual (mes actual)
  const currentPeriodStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Período anterior (mes anterior)
  const previousPeriodStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );
  const previousPeriodEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // Obtener estadísticas del período actual
  const currentStats = await getPeriodStats(currentPeriodStart, today);

  // Obtener estadísticas del período anterior
  const previousStats = await getPeriodStats(
    previousPeriodStart,
    previousPeriodEnd
  );

  // Calcular cambios porcentuales
  const percentageChanges = calculatePercentageChanges(
    currentStats,
    previousStats
  );

  // Obtener productos más vendidos
  const topProducts = await getTopProducts(5, currentPeriodStart);

  // Obtener pedidos recientes
  const recentOrders = await getRecentOrders(5);

  return {
    stats: [
      {
        title: "Ventas Totales",
        value: formatCurrency(currentStats.totalSales),
        change: percentageChanges.salesChange,
        trend: percentageChanges.salesChange >= 0 ? "up" : "down",
      },
      {
        title: "Pedidos",
        value: currentStats.orderCount.toString(),
        change: percentageChanges.orderCountChange,
        trend: percentageChanges.orderCountChange >= 0 ? "up" : "down",
      },
      {
        title: "Clientes",
        value: currentStats.customerCount.toString(),
        change: percentageChanges.customerCountChange,
        trend: percentageChanges.customerCountChange >= 0 ? "up" : "down",
      },
      {
        title: "Tasa de Conversión",
        value: `${currentStats.conversionRate.toFixed(1)}%`,
        change: percentageChanges.conversionRateChange,
        trend: percentageChanges.conversionRateChange >= 0 ? "up" : "down",
      },
    ],
    topProducts,
    recentOrders,
  };
}

// Obtener estadísticas para un período específico
async function getPeriodStats(startDate, endDate) {
  // Total de ventas y pedidos - solo órdenes con pagos acreditados/aprobados
  const salesResult = await Order.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: { $nin: ["cancelled", "failed"] },
        nullDate: null,
      },
    },
    {
      $addFields: {
        orderIdString: { $toString: "$_id" },
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "orderIdString",
        foreignField: "orderId",
        as: "payment",
      },
    },
    {
      $match: {
        $or: [
          {
            "payment.status": { $in: ["approved", "accredited", "completed"] },
          },
          { paymentMethod: "cash" }, // Incluir pagos en efectivo
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  // Contar clientes únicos que realizaron pedidos
  const customerResult = await Order.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        nullDate: null,
      },
    },
    {
      $group: {
        _id: "$customer.userId",
      },
    },
    {
      $count: "uniqueCustomers",
    },
  ]);

  // Contar visitas totales (simular con datos de ejemplo - esto necesitaría implementarse con analytics reales)
  // En una implementación real, esto vendría de Google Analytics o alguna otra fuente de datos
  const totalVisits = 15000; // Valor de ejemplo - en producción, obtendrías este dato de una fuente real

  // Calcular tasa de conversión (pedidos / visitas)
  const orderCount = salesResult.length > 0 ? salesResult[0].orderCount : 0;
  const conversionRate = totalVisits > 0 ? (orderCount / totalVisits) * 100 : 0;

  return {
    totalSales: salesResult.length > 0 ? salesResult[0].totalSales : 0,
    orderCount,
    customerCount:
      customerResult.length > 0 ? customerResult[0].uniqueCustomers : 0,
    conversionRate,
    totalVisits,
  };
}

// Calcular cambios porcentuales entre períodos
function calculatePercentageChanges(current, previous) {
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  return {
    salesChange: calculateChange(current.totalSales, previous.totalSales),
    orderCountChange: calculateChange(current.orderCount, previous.orderCount),
    customerCountChange: calculateChange(
      current.customerCount,
      previous.customerCount
    ),
    conversionRateChange: calculateChange(
      current.conversionRate,
      previous.conversionRate
    ),
  };
}

// Obtener productos más vendidos
async function getTopProducts(limit, startDate) {
  const topProducts = await Order.aggregate([
    {
      $match: {
        date: { $gte: startDate },
        status: { $nin: ["cancelled", "failed"] },
        nullDate: null,
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.id",
        name: { $first: "$items.name" },
        sales: { $sum: "$items.quantity" },
        revenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
    },
    { $sort: { sales: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        name: 1,
        sales: 1,
        revenue: 1,
      },
    },
  ]);

  // Formatear revenue como moneda
  return topProducts.map((product) => ({
    ...product,
    revenue: formatCurrency(product.revenue),
  }));
}

// Obtener pedidos recientes
async function getRecentOrders(limit) {
  const recentOrders = await Order.find({ nullDate: null })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return Promise.all(
    recentOrders.map(async (order) => {
      let customerName = "Cliente no registrado";

      if (order.customer && order.customer.userId) {
        const user = await User.findById(order.customer.userId, {
          name: 1,
          email: 1,
        });

        if (user) {
          customerName = user.name || user.email;
        }
      } else if (order.customer && order.customer.name) {
        customerName = order.customer.name;
      }

      return {
        id: order.id,
        customer: customerName,
        date: formatDate(order.date),
        status: translateStatus(order.status),
        total: formatCurrency(order.total),
      };
    })
  );
}

// Funciones auxiliares para formateo
function formatCurrency(amount) {
  return `$${amount.toLocaleString("es-MX")}`;
}

function formatDate(date) {
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(date).toLocaleDateString("es-MX", options);
}

function translateStatus(status) {
  const statusMap = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    processing: "En preparación",
    shipped: "En camino",
    delivered: "Completado",
    cancelled: "Cancelado",
    failed: "Fallido",
    ready_pickup: "Listo para recoger",
    waiting_schedule: "Esperando horario",
  };

  return statusMap[status] || status;
}

// Funciones auxiliares para tracking
function getTrackingStatusText(status) {
  const statusMap = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    processing: "En preparación",
    shipped: "En camino",
    delivered: "Entregado",
    cancelled: "Cancelado",
    ready_pickup: "Listo para recoger",
    waiting_schedule: "Esperando horario",
  };

  return statusMap[status] || status;
}

function updateTrackingStepsBasedOnStatus(trackingSteps, currentStatus) {
  const statusOrder = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentIndex === -1) return; // Status no válido o cancelado

  // Mapear nombres de estado del tracking a estados internos
  const trackingStatusMap = {
    Pendiente: "pending",
    Confirmado: "confirmed",
    "En preparación": "processing",
    "En camino": "shipped",
    Entregado: "delivered",
    "Listo para recoger": "ready_pickup",
    "Esperando horario": "waiting_schedule",
  };

  // Actualizar los pasos anteriores como completados
  trackingSteps.forEach((step) => {
    const stepInternalStatus = trackingStatusMap[step.status];
    if (
      stepInternalStatus &&
      statusOrder.indexOf(stepInternalStatus) <= currentIndex
    ) {
      step.completed = true;
    }
  });
}

module.exports = router;
