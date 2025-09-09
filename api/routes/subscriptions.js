const express = require("express");
const router = express.Router();
const { checkAuth, checkRole } = require("../middlewares/authentication");
const trackInteraction = require("../middlewares/interaction-tracker");
const UserSubscription = require("../models/subscription");
const { Subscription } = require("../models/products");
const Order = require("../models/order");

/**
 * RUTAS PARA SUSCRIPCIONES (USUARIOS FINALES)
 */

// Obtener todas las suscripciones del usuario autenticado
router.get(
  "/my-subscriptions",
  checkAuth,
  trackInteraction("landing", true),
  async (req, res) => {
    try {
      const userId = req.userData._id;

      const userSubscriptions = await UserSubscription.find({
        userId,
        nullDate: null,
      }).sort({ startDate: -1 });

      res.status(200).json({ subscriptions: userSubscriptions });
    } catch (error) {
      console.error("Error al obtener suscripciones:", error);
      res.status(500).json({ error: "Error al obtener las suscripciones" });
    }
  }
);

// Obtener detalle de una suscripción específica
router.get(
  "/my-subscriptions/:id",
  checkAuth,
  trackInteraction("landing", true),
  async (req, res) => {
    try {
      const userId = req.userData._id;
      const subscriptionId = req.params.id;

      const subscription = await UserSubscription.findOne({
        id: subscriptionId,
        userId,
        nullDate: null,
      });

      if (!subscription) {
        return res.status(404).json({ error: "Suscripción no encontrada" });
      }

      res.status(200).json({ subscription });
    } catch (error) {
      console.error("Error al obtener detalles de la suscripción:", error);
      res
        .status(500)
        .json({ error: "Error al obtener los detalles de la suscripción" });
    }
  }
);

// Cambiar el estado de una suscripción (pausar/reactivar)
router.patch("/my-subscriptions/:id/status", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const subscriptionId = req.params.id;
    const { status } = req.body;

    // Validar el estado
    if (!status || !["active", "paused"].includes(status)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    const subscription = await UserSubscription.findOne({
      id: subscriptionId,
      userId,
      nullDate: null,
    });

    if (!subscription) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    // No permitir cambios en suscripciones canceladas
    if (subscription.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "No se puede modificar una suscripción cancelada" });
    }

    // Si se está activando una suscripción pausada, verificar que el usuario no tenga otra suscripción activa
    if (status === "active" && subscription.status === "paused") {
      const activeSubscription = await UserSubscription.findOne({
        userId,
        status: "active",
        nullDate: null,
        id: { $ne: subscriptionId }, // Excluir la suscripción actual
      });

      if (activeSubscription) {
        return res.status(400).json({
          error:
            "Ya tienes una suscripción activa. Pausa o cancela tu suscripción actual antes de activar esta.",
        });
      }

      // Calcular la próxima fecha de entrega (30 días a partir de hoy)
      const nextDelivery = new Date();
      nextDelivery.setDate(nextDelivery.getDate() + 30);
      subscription.nextDelivery = nextDelivery;
    }

    // Actualizar el estado
    subscription.status = status;

    await subscription.save();

    res.status(200).json({
      message:
        status === "active" ? "Suscripción reactivada" : "Suscripción pausada",
      subscription,
    });
  } catch (error) {
    console.error("Error al cambiar el estado de la suscripción:", error);
    res
      .status(500)
      .json({ error: "Error al cambiar el estado de la suscripción" });
  }
});

// Cancelar una suscripción
router.patch("/my-subscriptions/:id/cancel", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const subscriptionId = req.params.id;
    const { reason } = req.body;

    const subscription = await UserSubscription.findOne({
      id: subscriptionId,
      userId,
      nullDate: null,
    });

    if (!subscription) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    // No permitir cancelar una suscripción ya cancelada
    if (subscription.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Esta suscripción ya ha sido cancelada" });
    }

    // Actualizar el estado
    subscription.status = "cancelled";
    subscription.cancellationReason = reason || "Cancelada por el usuario";
    subscription.cancellationDate = new Date();

    await subscription.save();

    res.status(200).json({
      message: "Suscripción cancelada con éxito",
      subscription,
    });
  } catch (error) {
    console.error("Error al cancelar la suscripción:", error);
    res.status(500).json({ error: "Error al cancelar la suscripción" });
  }
});

// Cambiar el tipo de cerveza de una suscripción
router.patch("/my-subscriptions/:id/beer-type", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const subscriptionId = req.params.id;
    const { beerType, beerName } = req.body;

    // Validar el tipo de cerveza
    if (!beerType || !["golden", "red", "ipa"].includes(beerType)) {
      return res.status(400).json({ error: "Tipo de cerveza no válido" });
    }

    if (!beerName) {
      return res
        .status(400)
        .json({ error: "Se requiere el nombre de la cerveza" });
    }

    const subscription = await UserSubscription.findOne({
      id: subscriptionId,
      userId,
      nullDate: null,
    });

    if (!subscription) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    // No permitir cambios en suscripciones canceladas
    if (subscription.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "No se puede modificar una suscripción cancelada" });
    }

    // Actualizar el tipo de cerveza
    subscription.beerType = beerType;
    subscription.beerName = beerName;

    await subscription.save();

    res.status(200).json({
      message: "Tipo de cerveza actualizado con éxito",
      subscription,
    });
  } catch (error) {
    console.error("Error al actualizar el tipo de cerveza:", error);
    res.status(500).json({ error: "Error al actualizar el tipo de cerveza" });
  }
});

/**
 * RUTAS PARA ADMINISTRACIÓN DE SUSCRIPCIONES
 * (SÓLO PARA ADMINISTRADORES)
 */

// Obtener todas las suscripciones de usuarios (admin)
router.get(
  "/admin/subscriptions",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { status, userId, limit = 100, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      // Construir filtro
      const filter = { nullDate: null };

      if (status) {
        filter.status = status;
      }

      if (userId) {
        filter.userId = userId;
      }

      // Ejecutar consulta
      const subscriptions = await UserSubscription.find(filter)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Obtener total para paginación
      const total = await UserSubscription.countDocuments(filter);

      res.status(200).json({
        subscriptions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Error al obtener suscripciones:", error);
      res
        .status(500)
        .json({ error: "Error al obtener el listado de suscripciones" });
    }
  }
);

// Obtener información de una suscripción específica (admin)
router.get(
  "/admin/subscriptions/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const subscription = await UserSubscription.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!subscription) {
        return res.status(404).json({ error: "Suscripción no encontrada" });
      }

      res.status(200).json({ subscription });
    } catch (error) {
      console.error("Error al obtener la suscripción:", error);
      res
        .status(500)
        .json({ error: "Error al obtener la información de la suscripción" });
    }
  }
);

// Actualizar estado de suscripción (admin)
router.patch(
  "/admin/subscriptions/:id/status",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      // Validar el estado
      if (!status || !["active", "paused", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Estado no válido" });
      }

      const subscription = await UserSubscription.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!subscription) {
        return res.status(404).json({ error: "Suscripción no encontrada" });
      }

      // Si se está activando una suscripción, verificar que el usuario no tenga otra suscripción activa
      if (status === "active" && subscription.status !== "active") {
        const activeSubscription = await UserSubscription.findOne({
          userId: subscription.userId,
          status: "active",
          nullDate: null,
          id: { $ne: subscription.id }, // Excluir la suscripción actual
        });

        if (activeSubscription) {
          return res.status(400).json({
            error:
              "El usuario ya tiene una suscripción activa. Pausa o cancela esa suscripción antes de activar esta.",
            activeSubscriptionId: activeSubscription.id,
          });
        }
      }

      // Actualizar el estado
      subscription.status = status;

      // Manejar casos específicos según el estado
      if (status === "cancelled" && subscription.status !== "cancelled") {
        subscription.cancellationDate = new Date();
        subscription.cancellationReason =
          req.body.reason || "Cancelada por administrador";
      } else if (status === "active" && subscription.status !== "active") {
        // Si se reactiva, actualizar la próxima entrega
        const nextDelivery = new Date();
        nextDelivery.setDate(nextDelivery.getDate() + 30);
        subscription.nextDelivery = nextDelivery;
      }

      await subscription.save();

      res.status(200).json({
        message: `Suscripción ${
          status === "active"
            ? "activada"
            : status === "paused"
            ? "pausada"
            : "cancelada"
        } con éxito`,
        subscription,
      });
    } catch (error) {
      console.error("Error al actualizar el estado de la suscripción:", error);
      res
        .status(500)
        .json({ error: "Error al actualizar el estado de la suscripción" });
    }
  }
);

// Registrar una nueva entrega en una suscripción (admin)
router.post(
  "/admin/subscriptions/:id/deliveries",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { orderId, status = "pending", date = new Date() } = req.body;

      if (!["pending", "processing", "delivered"].includes(status)) {
        return res.status(400).json({ error: "Estado de entrega no válido" });
      }

      const subscription = await UserSubscription.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!subscription) {
        return res.status(404).json({ error: "Suscripción no encontrada" });
      }

      // No registrar entregas en suscripciones canceladas o pausadas
      if (subscription.status !== "active") {
        return res.status(400).json({
          error: `No se puede registrar una entrega en una suscripción ${
            subscription.status === "cancelled" ? "cancelada" : "pausada"
          }`,
        });
      }

      // Verificar si existe la orden asociada
      if (orderId) {
        const order = await Order.findOne({ id: orderId, nullDate: null });
        if (!order) {
          return res.status(404).json({ error: "La orden asociada no existe" });
        }
      }

      // Crear la nueva entrega
      const newDelivery = {
        date: new Date(date),
        status,
        orderId,
      };

      // Agregar al historial de entregas
      subscription.deliveries.push(newDelivery);

      // Actualizar la próxima fecha de entrega (30 días después de esta entrega)
      const nextDeliveryDate = new Date(date);
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 30);
      subscription.nextDelivery = nextDeliveryDate;

      await subscription.save();

      res.status(201).json({
        message: "Entrega registrada con éxito",
        delivery: newDelivery,
        subscription,
      });
    } catch (error) {
      console.error("Error al registrar la entrega:", error);
      res.status(500).json({ error: "Error al registrar la entrega" });
    }
  }
);

// Actualizar el estado de una entrega (admin)
router.patch(
  "/admin/subscriptions/:subId/deliveries/:deliveryIndex",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { subId, deliveryIndex } = req.params;
      const { status } = req.body;

      if (!["pending", "processing", "delivered"].includes(status)) {
        return res.status(400).json({ error: "Estado de entrega no válido" });
      }

      const subscription = await UserSubscription.findOne({
        id: subId,
        nullDate: null,
      });

      if (!subscription) {
        return res.status(404).json({ error: "Suscripción no encontrada" });
      }

      // Validar que el índice de entrega existe
      const deliveryIdx = parseInt(deliveryIndex);
      if (
        isNaN(deliveryIdx) ||
        deliveryIdx < 0 ||
        deliveryIdx >= subscription.deliveries.length
      ) {
        return res.status(404).json({ error: "Entrega no encontrada" });
      }

      // Actualizar el estado de la entrega
      subscription.deliveries[deliveryIdx].status = status;

      await subscription.save();

      res.status(200).json({
        message: "Estado de la entrega actualizado con éxito",
        delivery: subscription.deliveries[deliveryIdx],
        subscription,
      });
    } catch (error) {
      console.error("Error al actualizar el estado de la entrega:", error);
      res
        .status(500)
        .json({ error: "Error al actualizar el estado de la entrega" });
    }
  }
);

// Obtener estadísticas de suscripciones (admin)
router.get(
  "/admin/subscriptions/stats",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      // Estadísticas generales
      const totalActive = await UserSubscription.countDocuments({
        status: "active",
        nullDate: null,
      });
      const totalPaused = await UserSubscription.countDocuments({
        status: "paused",
        nullDate: null,
      });
      const totalCancelled = await UserSubscription.countDocuments({
        status: "cancelled",
        nullDate: null,
      });

      // Distribución por tipo de cerveza
      const beerTypeDistribution = await UserSubscription.aggregate([
        { $match: { nullDate: null } },
        { $group: { _id: "$beerType", count: { $sum: 1 } } },
      ]);

      // Próximas entregas a realizar
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const upcomingDeliveries = await UserSubscription.find({
        status: "active",
        nextDelivery: { $gte: now, $lte: nextWeek },
        nullDate: null,
      }).sort({ nextDelivery: 1 });

      // Retener solo la información necesaria de las próximas entregas
      const formattedUpcomingDeliveries = upcomingDeliveries.map((sub) => ({
        id: sub.id,
        name: sub.name,
        beerType: sub.beerType,
        beerName: sub.beerName,
        liters: sub.liters,
        nextDelivery: sub.nextDelivery,
        userId: sub.userId,
      }));

      res.status(200).json({
        stats: {
          totalSubscriptions: totalActive + totalPaused + totalCancelled,
          activeSubscriptions: totalActive,
          pausedSubscriptions: totalPaused,
          cancelledSubscriptions: totalCancelled,
          beerTypeDistribution: beerTypeDistribution.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          upcomingDeliveries: formattedUpcomingDeliveries,
        },
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de suscripciones:", error);
      res
        .status(500)
        .json({ error: "Error al obtener estadísticas de suscripciones" });
    }
  }
);

// Crear una nueva suscripción para un usuario
router.post("/subscriptions", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const { subscriptionId, beerType, beerName } = req.body;

    // Verificar que el usuario no tenga ya una suscripción activa
    const existingActiveSubscription = await UserSubscription.findOne({
      userId,
      status: "active",
      nullDate: null,
    });

    if (existingActiveSubscription) {
      return res.status(400).json({
        error:
          "Ya tienes una suscripción activa. Solo puedes tener una suscripción activa a la vez.",
        currentSubscription: {
          id: existingActiveSubscription.id,
          name: existingActiveSubscription.name,
          beerType: existingActiveSubscription.beerType,
          beerName: existingActiveSubscription.beerName,
        },
      });
    }

    // Verificar si el plan de suscripción existe
    const subscriptionPlan = await Subscription.findOne({
      id: subscriptionId,
      nullDate: null,
    });
    if (!subscriptionPlan) {
      return res
        .status(404)
        .json({ error: "El plan de suscripción no existe" });
    }

    // Validar el tipo de cerveza
    if (!beerType || !["golden", "red", "ipa"].includes(beerType)) {
      return res.status(400).json({ error: "Tipo de cerveza no válido" });
    }

    if (!beerName) {
      return res
        .status(400)
        .json({ error: "Se requiere el nombre de la cerveza" });
    }

    // Calcular fecha de entrega (30 días a partir de hoy)
    const nextDelivery = new Date();
    nextDelivery.setDate(nextDelivery.getDate() + 30);

    // Crear ID único para la suscripción
    const uniqueId = `SUB-${Date.now()}-${userId.toString().slice(-4)}`;

    // Crear nueva suscripción
    const newSubscription = new UserSubscription({
      id: uniqueId,
      userId,
      subscriptionId,
      name: subscriptionPlan.name,
      beerType,
      beerName,
      liters: subscriptionPlan.liters,
      price: subscriptionPlan.price,
      status: "active",
      startDate: new Date(),
      nextDelivery,
      deliveries: [],
    });

    await newSubscription.save();

    res.status(201).json({
      message: "Suscripción creada con éxito",
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Error al crear la suscripción:", error);
    res.status(500).json({ error: "Error al crear la suscripción" });
  }
});

/**
 * RUTAS PARA ADMINISTRACIÓN DE SUSCRIPCIONES (ADMIN ONLY)
 */

// Obtener todas las suscripciones (admin)
router.get("/admin/all", checkAuth, checkRole("admin"), async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 50 } = req.query;

    // Construir filtros
    const filters = { nullDate: null };
    if (status) filters.status = status;
    if (userId) filters.userId = userId;

    // Paginación
    const skip = (page - 1) * limit;

    const subscriptions = await UserSubscription.find(filters)
      .populate("userId", "name email phone address")
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserSubscription.countDocuments(filters);

    // Transformar datos para el frontend
    const transformedSubscriptions = subscriptions.map((sub) => ({
      _id: sub._id,
      userId: sub.userId._id,
      user: {
        name: sub.userId.name,
        email: sub.userId.email,
        phone: sub.userId.phone,
      },
      planId: sub.subscriptionId,
      planName: sub.name,
      planType: "monthly", // Asumiendo mensual por defecto
      startDate: sub.startDate,
      endDate: null, // Calcular basado en el tipo de plan si es necesario
      status: sub.status,
      price: sub.price,
      deliveryFrequency: 30, // Asumiendo 30 días
      nextDelivery: sub.nextDelivery,
      deliveryAddress: sub.userId.address || "Sin dirección",
      createdAt: sub.startDate,
      updatedAt: sub.startDate,
    }));

    res.status(200).json({
      status: "success",
      data: transformedSubscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener suscripciones admin:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener las suscripciones",
      error: error.message,
    });
  }
});

// Actualizar estado de una suscripción (admin)
router.put(
  "/admin/:id/status",
  checkAuth,
  checkRole("admin"),
  async (req, res) => {
    try {
      const subscriptionId = req.params.id;
      const { status } = req.body;

      // Validar estado
      const validStatuses = ["active", "paused", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: "error",
          message: "Estado inválido",
        });
      }

      const subscription = await UserSubscription.findByIdAndUpdate(
        subscriptionId,
        { status },
        { new: true }
      ).populate("userId", "name email phone");

      if (!subscription) {
        return res.status(404).json({
          status: "error",
          message: "Suscripción no encontrada",
        });
      }

      res.status(200).json({
        status: "success",
        message: "Estado de suscripción actualizado",
        data: subscription,
      });
    } catch (error) {
      console.error("Error al actualizar estado de suscripción:", error);
      res.status(500).json({
        status: "error",
        message: "Error al actualizar el estado de la suscripción",
        error: error.message,
      });
    }
  }
);

// Eliminar una suscripción (admin) - soft delete
router.delete("/admin/:id", checkAuth, checkRole("admin"), async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    const subscription = await UserSubscription.findByIdAndUpdate(
      subscriptionId,
      { nullDate: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        status: "error",
        message: "Suscripción no encontrada",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Suscripción eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar suscripción:", error);
    res.status(500).json({
      status: "error",
      message: "Error al eliminar la suscripción",
      error: error.message,
    });
  }
});

// Obtener suscripciones de un usuario específico (admin)
router.get(
  "/admin/user/:userId",
  checkAuth,
  checkRole("admin"),
  async (req, res) => {
    try {
      const userId = req.params.userId;

      const subscriptions = await UserSubscription.find({
        userId,
        nullDate: null,
      })
        .populate("userId", "name email phone")
        .sort({ startDate: -1 });

      res.status(200).json({
        status: "success",
        data: subscriptions,
      });
    } catch (error) {
      console.error("Error al obtener suscripciones del usuario:", error);
      res.status(500).json({
        status: "error",
        message: "Error al obtener las suscripciones del usuario",
        error: error.message,
      });
    }
  }
);

module.exports = router;
