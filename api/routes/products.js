const express = require("express");
const router = express.Router();
const { checkAuth, checkRole } = require("../middlewares/authentication");
const { Beer, Subscription, Discount } = require("../models/products");

/**
 * ENDPOINTS PÚBLICOS PARA TIENDA
 */

// Obtener todas las cervezas disponibles
router.get("/beers", async (req, res) => {
  try {
    const beers = await Beer.find({ nullDate: null })
      .select("id name type typeId price image description")
      .sort({ name: 1 });

    res.status(200).json({ beers });
  } catch (error) {
    console.error("Error al obtener cervezas:", error);
    res.status(500).json({ error: "Error al obtener el listado de cervezas" });
  }
});

// Obtener detalle de una cerveza específica
router.get("/beers/:id", async (req, res) => {
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
});

// Obtener todos los planes de suscripción disponibles
router.get("/subscriptions", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ nullDate: null }).sort({
      liters: 1,
    });

    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error("Error al obtener planes de suscripción:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el listado de planes de suscripción" });
  }
});

// Obtener detalle de un plan de suscripción específico
router.get("/subscriptions/:id", async (req, res) => {
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

    res.status(200).json({ subscription });
  } catch (error) {
    console.error("Error al obtener el plan de suscripción:", error);
    res.status(500).json({ error: "Error al obtener la información del plan" });
  }
});

// Obtener planes de suscripción destacados (los marcados como populares)
router.get("/featured-subscriptions", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      nullDate: null,
      popular: true,
    });

    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error("Error al obtener planes destacados:", error);
    res.status(500).json({ error: "Error al obtener los planes destacados" });
  }
});

// Validar código de descuento
router.post("/validate-discount", async (req, res) => {
  try {
    const { code, cartItems } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ error: "Se requiere un código de descuento" });
    }

    // Buscar el código
    const discount = await Discount.findOne({
      code: code.toUpperCase(),
      active: true,
      nullDate: null,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!discount) {
      return res.status(404).json({
        valid: false,
        message: "Código de descuento inválido o expirado",
      });
    }

    // Verificar si hay productos a los que aplicar el descuento
    if (cartItems && discount.appliesTo !== "all") {
      const hasApplicableItems = cartItems.some(
        (item) => item.type === discount.appliesTo
      );

      if (!hasApplicableItems) {
        return res.status(400).json({
          valid: false,
          message: `Este código solo aplica a ${
            discount.appliesTo === "beer" ? "cervezas" : "suscripciones"
          }`,
        });
      }
    }

    // Verificar monto mínimo si existe
    if (cartItems && discount.minPurchase) {
      const subtotal = cartItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      if (subtotal < discount.minPurchase) {
        return res.status(400).json({
          valid: false,
          message: `Este código requiere una compra mínima de $${discount.minPurchase}`,
        });
      }
    }

    // Devolver la información del descuento
    res.status(200).json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
        appliesTo: discount.appliesTo,
        minPurchase: discount.minPurchase,
      },
    });
  } catch (error) {
    console.error("Error al validar código de descuento:", error);
    res.status(500).json({ error: "Error al validar el código de descuento" });
  }
});

/**
 * ENDPOINTS PROTEGIDOS (USUARIOS AUTENTICADOS)
 */

// Obtener los productos más vendidos (para recomendaciones)
router.get("/top-products", checkAuth, async (req, res) => {
  try {
    // Este endpoint debería integrarse con la lógica de órdenes para determinar
    // los productos más vendidos, pero por ahora devolvemos algunos productos fijos
    const topBeers = await Beer.find({ nullDate: null })
      .limit(3)
      .sort({ stock: -1 }); // Ordenar por stock como aproximación a popularidad

    res.status(200).json({ topProducts: topBeers });
  } catch (error) {
    console.error("Error al obtener productos destacados:", error);
    res
      .status(500)
      .json({ error: "Error al obtener los productos destacados" });
  }
});

module.exports = router;
