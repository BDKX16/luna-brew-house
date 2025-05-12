const Interaction = require("../models/interaction");

/**
 * Middleware para registrar interacciones en la plataforma
 * @param {string} type - Tipo de interacción ('landing', 'checkout')
 * @param {boolean} state - Estado de la interacción (true para exitosa, false para no exitosa)
 * @returns {function} Middleware para Express
 */
const trackInteraction = (type, state) => {
  return async (req, res, next) => {
    try {
      // Extraer userId del token si el usuario está autenticado
      const userId = req.user ? req.user.id : null;

      // Crear nueva interacción
      const interaction = new Interaction({
        userId,
        type,
        state,
        // Si hay un ID de contenido/producto en params o body, lo guardamos
        videoId: req.params.id || req.body.productId || null,
      });

      // Guardar la interacción de forma asíncrona sin bloquear la respuesta
      interaction.save().catch((err) => {
        console.error("Error al guardar la interacción:", err);
      });

      // Continuar con la ejecución normal del endpoint
      next();
    } catch (error) {
      console.error("Error en el middleware de interacciones:", error);
      next(); // Continuar incluso si hay un error en el tracking
    }
  };
};

module.exports = trackInteraction;
