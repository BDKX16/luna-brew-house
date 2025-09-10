/**
 * Middleware de Email para Express.js
 * Integra el Email Service con las rutas de la aplicación
 */

const emailService = require("../infraestructure/services/emailService");
const {
  EmailRateLimiter,
  isValidEmail,
} = require("../infraestructure/services/emailUtils");

// Rate limiter global para emails
const emailRateLimiter = new EmailRateLimiter(10); // 10 emails por minuto

/**
 * Middleware para agregar el email service a req
 */
const attachEmailService = (req, res, next) => {
  req.emailService = emailService;
  next();
};

/**
 * Middleware para rate limiting de emails
 */
const emailRateLimit = (req, res, next) => {
  const identifier = req.ip || "unknown";

  if (!emailRateLimiter.isAllowed(identifier)) {
    return res.status(429).json({
      error: "Demasiados emails enviados. Intenta nuevamente en un minuto.",
      remainingEmails: emailRateLimiter.getRemainingEmails(identifier),
    });
  }

  next();
};

/**
 * Middleware para validar datos de email
 */
const validateEmailData = (requiredFields = []) => {
  return (req, res, next) => {
    const { email } = req.body;

    // Validar email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        error: "Email inválido o faltante",
      });
    }

    // Validar campos requeridos
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `Campo requerido faltante: ${field}`,
        });
      }
    }

    next();
  };
};

/**
 * Helper para manejar errores de email de forma consistente
 */
const handleEmailError = (error, res) => {
  console.error("Error en envío de email:", error);

  // No exponer detalles técnicos al cliente
  return res.status(500).json({
    error: "Error interno al enviar email. Intenta nuevamente más tarde.",
  });
};

/**
 * Helper para respuesta exitosa de email
 */
const handleEmailSuccess = (
  result,
  res,
  message = "Email enviado exitosamente"
) => {
  return res.status(200).json({
    success: true,
    message,
    messageId: result.messageId,
  });
};

module.exports = {
  attachEmailService,
  emailRateLimit,
  validateEmailData,
  handleEmailError,
  handleEmailSuccess,
};
