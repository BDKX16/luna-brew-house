const express = require("express");
const router = express.Router();
const { checkAuth, checkRole } = require("../middlewares/authentication");
const Order = require("../models/order");
const User = require("../models/user");

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

      // Ejecutar consulta
      const orders = await Order.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Obtener total para paginación
      const total = await Order.countDocuments(filter);

      res.status(200).json({
        orders,
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
          "processing",
          "shipped",
          "delivered",
          "cancelled",
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
        return res
          .status(400)
          .json({
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

      // Total de ventas en el período
      const totalSalesResult = await Order.aggregate([
        {
          $match: {
            date: { $gte: startDate },
            status: { $nin: ["cancelled", "failed"] },
            nullDate: null,
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

      // Productos más vendidos
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

// Funciones auxiliares
function getTrackingStatusText(status) {
  const statusMap = {
    pending: "Pedido recibido",
    processing: "Preparando pedido",
    shipped: "En camino",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return statusMap[status] || status;
}

function updateTrackingStepsBasedOnStatus(trackingSteps, currentStatus) {
  const statusOrder = ["pending", "processing", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentIndex === -1) return; // Status no válido o cancelado

  // Mapear nombres de estado del tracking a estados internos
  const trackingStatusMap = {
    "Pedido recibido": "pending",
    "Preparando pedido": "processing",
    "En camino": "shipped",
    Entregado: "delivered",
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
