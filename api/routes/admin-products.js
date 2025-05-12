const express = require("express");
const router = express.Router();
const { checkAuth, checkRole } = require("../middlewares/authentication");
const { Beer, Subscription, Discount } = require("../models/products");

/**
 * RUTAS PARA LA GESTIÓN DE CERVEZAS
 */

// Obtener todas las cervezas
router.get(
  "/beers",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const beers = await Beer.find({ nullDate: null });
      res.status(200).json({ beers });
    } catch (error) {
      console.error("Error al obtener cervezas:", error);
      res
        .status(500)
        .json({ error: "Error al obtener el listado de cervezas" });
    }
  }
);

// Obtener una cerveza por ID
router.get(
  "/beers/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const beer = await Beer.findOne({ id: req.params.id, nullDate: null });

      if (!beer) {
        return res.status(404).json({ error: "Cerveza no encontrada" });
      }

      res.status(200).json({ beer });
    } catch (error) {
      console.error("Error al obtener la cerveza:", error);
      res
        .status(500)
        .json({ error: "Error al obtener la información de la cerveza" });
    }
  }
);

// Crear una nueva cerveza
router.post(
  "/beers",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { id, name, type, typeId, price, image, description, stock } =
        req.body;

      // Verificar si ya existe
      const existingBeer = await Beer.findOne({ id });
      if (existingBeer) {
        return res
          .status(400)
          .json({ error: "Ya existe una cerveza con ese ID" });
      }

      const beer = new Beer({
        id,
        name,
        type,
        typeId,
        price,
        image,
        description,
        stock,
      });

      await beer.save();
      res.status(201).json({ message: "Cerveza creada con éxito", beer });
    } catch (error) {
      console.error("Error al crear cerveza:", error);
      res.status(500).json({ error: "Error al crear la cerveza" });
    }
  }
);

// Actualizar una cerveza
router.put(
  "/beers/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { name, type, typeId, price, image, description, stock } = req.body;

      const beer = await Beer.findOne({ id: req.params.id, nullDate: null });

      if (!beer) {
        return res.status(404).json({ error: "Cerveza no encontrada" });
      }

      // Actualizar campos
      beer.name = name || beer.name;
      beer.type = type || beer.type;
      beer.typeId = typeId || beer.typeId;
      beer.price = price || beer.price;
      beer.image = image || beer.image;
      beer.description = description || beer.description;
      beer.stock = stock !== undefined ? stock : beer.stock;

      await beer.save();
      res.status(200).json({ message: "Cerveza actualizada con éxito", beer });
    } catch (error) {
      console.error("Error al actualizar cerveza:", error);
      res.status(500).json({ error: "Error al actualizar la cerveza" });
    }
  }
);

// Eliminar una cerveza (soft delete)
router.delete(
  "/beers/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const beer = await Beer.findOne({ id: req.params.id, nullDate: null });

      if (!beer) {
        return res.status(404).json({ error: "Cerveza no encontrada" });
      }

      beer.nullDate = new Date();
      await beer.save();

      res.status(200).json({ message: "Cerveza eliminada con éxito" });
    } catch (error) {
      console.error("Error al eliminar cerveza:", error);
      res.status(500).json({ error: "Error al eliminar la cerveza" });
    }
  }
);

/**
 * RUTAS PARA LA GESTIÓN DE PLANES DE SUSCRIPCIÓN
 */

// Obtener todos los planes de suscripción
router.get(
  "/subscriptions",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      console.log("subscriptions");
      const subscriptions = await Subscription.find({ nullDate: null });
      console.log(subscriptions);
      res.status(200).json({ subscriptions });
    } catch (error) {
      console.error("Error al obtener planes de suscripción:", error);
      res.status(500).json({
        error: "Error al obtener el listado de planes de suscripción",
      });
    }
  }
);

// Obtener todos los planes de suscripción
router.get(
  "/subscription-plans",
  checkAuth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const subscriptions = await Subscription.find({ nullDate: null });

      res.status(200).json({ subscriptions });
    } catch (error) {
      console.error("Error al obtener planes de suscripción:", error);
      res.status(500).json({
        error: "Error al obtener el listado de planes de suscripción",
      });
    }
  }
);

// Obtener un plan de suscripción por ID
router.get(
  "/subscription-plan/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      console.log("subscriptions/:id");
      const subscription = await Subscription.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!subscription) {
        return res
          .status(404)
          .json({ error: "Plan de suscripción no encontrado" });
      }

      res.status(200).json({ subscription });
    } catch (error) {
      console.error("Error al obtener el plan de suscripción:", error);
      res
        .status(500)
        .json({ error: "Error al obtener la información del plan" });
    }
  }
);

// Crear un nuevo plan de suscripción
router.post(
  "/subscriptions",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { id, name, liters, price, features, popular } = req.body;

      // Verificar si ya existe
      const existingSubscription = await Subscription.findOne({ id });
      if (existingSubscription) {
        return res.status(400).json({ error: "Ya existe un plan con ese ID" });
      }

      const subscription = new Subscription({
        id,
        name,
        liters,
        price,
        features,
        popular: popular || false,
      });

      await subscription.save();
      res.status(201).json({ message: "Plan creado con éxito", subscription });
    } catch (error) {
      console.error("Error al crear plan de suscripción:", error);
      res.status(500).json({ error: "Error al crear el plan" });
    }
  }
);

// Actualizar un plan de suscripción
router.put(
  "/subscriptions/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { name, liters, price, features, popular } = req.body;

      const subscription = await Subscription.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!subscription) {
        return res
          .status(404)
          .json({ error: "Plan de suscripción no encontrado" });
      }

      // Actualizar campos
      subscription.name = name || subscription.name;
      subscription.liters = liters || subscription.liters;
      subscription.price = price || subscription.price;
      subscription.features = features || subscription.features;

      if (popular !== undefined) {
        subscription.popular = popular;
      }

      await subscription.save();
      res
        .status(200)
        .json({ message: "Plan actualizado con éxito", subscription });
    } catch (error) {
      console.error("Error al actualizar plan de suscripción:", error);
      res.status(500).json({ error: "Error al actualizar el plan" });
    }
  }
);

// Eliminar un plan de suscripción (soft delete)
router.delete(
  "/subscriptions/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const subscription = await Subscription.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!subscription) {
        return res
          .status(404)
          .json({ error: "Plan de suscripción no encontrado" });
      }

      subscription.nullDate = new Date();
      await subscription.save();

      res.status(200).json({ message: "Plan eliminado con éxito" });
    } catch (error) {
      console.error("Error al eliminar plan de suscripción:", error);
      res.status(500).json({ error: "Error al eliminar el plan" });
    }
  }
);

/**
 * RUTAS PARA LA GESTIÓN DE DESCUENTOS/PROMOCIONES
 */

// Obtener todos los descuentos
router.get(
  "/discounts",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const discounts = await Discount.find({ nullDate: null });
      res.status(200).json({ discounts });
    } catch (error) {
      console.error("Error al obtener descuentos:", error);
      res
        .status(500)
        .json({ error: "Error al obtener el listado de descuentos" });
    }
  }
);

// Obtener un descuento por ID
router.get(
  "/discounts/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const discount = await Discount.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!discount) {
        return res.status(404).json({ error: "Descuento no encontrado" });
      }

      res.status(200).json({ discount });
    } catch (error) {
      console.error("Error al obtener el descuento:", error);
      res
        .status(500)
        .json({ error: "Error al obtener la información del descuento" });
    }
  }
);

// Crear un nuevo descuento
router.post(
  "/discounts",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const {
        id,
        code,
        type,
        value,
        minPurchase,
        validFrom,
        validUntil,
        description,
        appliesTo,
        active,
      } = req.body;

      // Verificar si ya existe
      const existingDiscount = await Discount.findOne({
        $or: [{ id }, { code }],
        nullDate: null,
      });

      if (existingDiscount) {
        return res
          .status(400)
          .json({ error: "Ya existe un descuento con ese ID o código" });
      }

      const discount = new Discount({
        id,
        code,
        type,
        value,
        minPurchase,
        validFrom,
        validUntil,
        description,
        appliesTo,
        active: active !== undefined ? active : true,
        usageCount: 0,
      });

      await discount.save();
      res.status(201).json({ message: "Descuento creado con éxito", discount });
    } catch (error) {
      console.error("Error al crear descuento:", error);
      res.status(500).json({ error: "Error al crear el descuento" });
    }
  }
);

// Actualizar un descuento
router.put(
  "/discounts/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const {
        code,
        type,
        value,
        minPurchase,
        validFrom,
        validUntil,
        description,
        appliesTo,
        active,
      } = req.body;

      const discount = await Discount.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!discount) {
        return res.status(404).json({ error: "Descuento no encontrado" });
      }

      // Verificar si ya existe otro descuento con el mismo código
      if (code && code !== discount.code) {
        const existingDiscount = await Discount.findOne({
          code,
          nullDate: null,
        });
        if (existingDiscount) {
          return res
            .status(400)
            .json({ error: "Ya existe otro descuento con ese código" });
        }
      }

      // Actualizar campos
      discount.code = code || discount.code;
      discount.type = type || discount.type;
      discount.value = value !== undefined ? value : discount.value;
      discount.minPurchase =
        minPurchase !== undefined ? minPurchase : discount.minPurchase;
      discount.validFrom = validFrom || discount.validFrom;
      discount.validUntil = validUntil || discount.validUntil;
      discount.description = description || discount.description;
      discount.appliesTo = appliesTo || discount.appliesTo;
      discount.active = active !== undefined ? active : discount.active;

      await discount.save();
      res
        .status(200)
        .json({ message: "Descuento actualizado con éxito", discount });
    } catch (error) {
      console.error("Error al actualizar descuento:", error);
      res.status(500).json({ error: "Error al actualizar el descuento" });
    }
  }
);

// Eliminar un descuento (soft delete)
router.delete(
  "/discounts/:id",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const discount = await Discount.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!discount) {
        return res.status(404).json({ error: "Descuento no encontrado" });
      }

      discount.nullDate = new Date();
      await discount.save();

      res.status(200).json({ message: "Descuento eliminado con éxito" });
    } catch (error) {
      console.error("Error al eliminar descuento:", error);
      res.status(500).json({ error: "Error al eliminar el descuento" });
    }
  }
);

// Activar o desactivar un descuento
router.patch(
  "/discounts/:id/toggle",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const discount = await Discount.findOne({
        id: req.params.id,
        nullDate: null,
      });

      if (!discount) {
        return res.status(404).json({ error: "Descuento no encontrado" });
      }

      discount.active = !discount.active;
      await discount.save();

      res.status(200).json({
        message: discount.active
          ? "Descuento activado"
          : "Descuento desactivado",
        active: discount.active,
      });
    } catch (error) {
      console.error("Error al cambiar el estado del descuento:", error);
      res
        .status(500)
        .json({ error: "Error al cambiar el estado del descuento" });
    }
  }
);

// Obtener estadísticas de conversión (basadas en interacciones de usuarios)
router.get(
  "/conversion-stats",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Establecer período de tiempo para la consulta
      const queryStartDate = startDate
        ? new Date(startDate)
        : new Date(new Date().setDate(new Date().getDate() - 30));
      const queryEndDate = endDate ? new Date(endDate) : new Date();

      // Traer el modelo de Interaction
      const Interaction = require("../models/interaction");

      // Contar las interacciones de tipo landing
      const landingInteractions = await Interaction.countDocuments({
        type: "landing",
        state: true,
        createdAt: { $gte: queryStartDate, $lte: queryEndDate },
      });

      // Contar las interacciones de tipo checkout
      const checkoutInteractions = await Interaction.countDocuments({
        type: "checkout",
        state: true,
        createdAt: { $gte: queryStartDate, $lte: queryEndDate },
      });

      // Calcular tasa de conversión
      const conversionRate =
        landingInteractions > 0
          ? ((checkoutInteractions / landingInteractions) * 100).toFixed(2)
          : 0;

      // Obtener las interacciones por producto (videoId)
      const productInteractions = await Interaction.aggregate([
        {
          $match: {
            videoId: { $ne: null },
            createdAt: { $gte: queryStartDate, $lte: queryEndDate },
          },
        },
        {
          $group: {
            _id: "$videoId",
            visits: { $sum: { $cond: [{ $eq: ["$type", "landing"] }, 1, 0] } },
            checkouts: {
              $sum: { $cond: [{ $eq: ["$type", "checkout"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 1,
            visits: 1,
            checkouts: 1,
            conversionRate: {
              $cond: [
                { $gt: ["$visits", 0] },
                { $multiply: [{ $divide: ["$checkouts", "$visits"] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { visits: -1 } },
        { $limit: 10 },
      ]);

      // Obtener datos por día
      const dailyStats = await Interaction.aggregate([
        {
          $match: {
            createdAt: { $gte: queryStartDate, $lte: queryEndDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            visits: { $sum: { $cond: [{ $eq: ["$type", "landing"] }, 1, 0] } },
            checkouts: {
              $sum: { $cond: [{ $eq: ["$type", "checkout"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            date: "$_id",
            visits: 1,
            checkouts: 1,
            conversionRate: {
              $cond: [
                { $gt: ["$visits", 0] },
                { $multiply: [{ $divide: ["$checkouts", "$visits"] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { date: 1 } },
      ]);

      res.status(200).json({
        stats: {
          period: {
            from: queryStartDate,
            to: queryEndDate,
          },
          overall: {
            totalVisits: landingInteractions,
            totalCheckouts: checkoutInteractions,
            conversionRate,
          },
          productStats: productInteractions,
          dailyStats,
        },
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de conversión:", error);
      res
        .status(500)
        .json({ error: "Error al obtener estadísticas de conversión" });
    }
  }
);

module.exports = router;
