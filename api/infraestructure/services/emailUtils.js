/**
 * Utilidades adicionales para el Email Service
 * Funciones helper y validaciones
 */

/**
 * Valida si un email tiene formato correcto
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza datos de entrada para las plantillas
 */
function sanitizeEmailData(data) {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      // Escapar caracteres HTML peligrosos
      sanitized[key] = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Formatea moneda para mostrar en emails
 */
function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea fechas para mostrar en emails
 */
function formatDate(date, options = {}) {
  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Mexico_City",
  };

  return new Intl.DateTimeFormat("es-ES", {
    ...defaultOptions,
    ...options,
  }).format(new Date(date));
}

/**
 * Genera un ID único para tracking de emails
 */
function generateEmailTrackingId() {
  return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida la configuración del email service
 */
function validateEmailConfig() {
  const requiredVars = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes para email service: ${missing.join(", ")}`
    );
  }

  return true;
}

/**
 * Genera una lista de emails de prueba para testing
 */
function generateTestEmailData() {
  return {
    welcomeUser: {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
    },
    orderConfirmation: {
      customerName: "María García",
      orderId: "ORD-123456",
      orderDate: new Date(),
      total: 45.99,
      items: [
        { name: "Luna Golden Ale", beerType: "golden", price: 15.99 },
        { name: "Luna Red Ale", beerType: "red", price: 15.99 },
        { name: "Envío", price: 14.01 },
      ],
      shippingAddress: "Calle Falsa 123, Ciudad de México, CDMX 12345",
    },
    subscriptionConfirmation: {
      customerName: "Carlos López",
      subscriptionId: "SUB-789012",
      planName: "Plan Mensual Premium",
      beerType: "ipa",
      beerName: "Luna IPA Especial",
      liters: 2,
      price: 35.99,
      nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      shippingAddress: "Avenida Principal 456, Guadalajara, JAL 54321",
    },
    orderStatus: {
      customerName: "Ana Martínez",
      orderId: "ORD-345678",
      status: "shipped",
      trackingNumber: "TRK-987654321",
    },
    passwordReset: {
      name: "Luis Rodríguez",
      resetLink: "https://lunabrewhouse.com/reset-password?token=abc123xyz789",
    },
  };
}

/**
 * Templates de asunto para diferentes tipos de email
 */
const emailSubjects = {
  welcome: "¡Bienvenido a Luna Brew House! 🍺",
  orderConfirmation: (orderId) =>
    `Confirmación de Pedido #${orderId} - Luna Brew House`,
  subscriptionConfirmation: "¡Tu Suscripción está Activa! 🎉 - Luna Brew House",
  orderStatusUpdate: (orderId) =>
    `Actualización de Pedido #${orderId} - Luna Brew House`,
  subscriptionReminder: "Tu Próxima Entrega se Acerca 📦 - Luna Brew House",
  passwordReset: "Restablecimiento de Contraseña - Luna Brew House",
  newsletter: "Novedades Luna Brew House 🍻",
  promotion: "Oferta Especial Luna Brew House 🎁",
};

/**
 * Configuraciones predefinidas para diferentes proveedores de email
 */
const emailProviders = {
  gmail: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireAuth: true,
    note: "Requiere contraseña de aplicación habilitada",
  },
  outlook: {
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    requireAuth: true,
    note: "Compatible con Outlook.com y Hotmail",
  },
  sendgrid: {
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    requireAuth: true,
    note: "Servicio profesional recomendado para producción",
  },
  mailgun: {
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    requireAuth: true,
    note: "Servicio profesional con APIs robustas",
  },
  ses: {
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    requireAuth: true,
    note: "Amazon SES - muy económico para volúmenes altos",
  },
};

/**
 * Función para testear la conectividad del email
 */
async function testEmailConnection(emailService) {
  try {
    console.log("🧪 Iniciando test de conectividad de email...");

    const isConnected = await emailService.verifyConnection();

    if (isConnected) {
      console.log("✅ Conexión de email verificada exitosamente");
      return { success: true, message: "Conexión exitosa" };
    } else {
      console.log("❌ Fallo en la verificación de conexión");
      return { success: false, message: "Fallo en la conexión" };
    }
  } catch (error) {
    console.error("❌ Error en test de conectividad:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Función para enviar emails de prueba
 */
async function sendTestEmails(emailService, testEmail) {
  const testData = generateTestEmailData();
  const results = [];

  try {
    console.log(`🧪 Enviando emails de prueba a ${testEmail}...`);

    // Test email de bienvenida
    const welcomeResult = await emailService.sendWelcomeEmail(
      testEmail,
      testData.welcomeUser
    );
    results.push({ type: "welcome", ...welcomeResult });

    // Test email de confirmación de pedido
    const orderResult = await emailService.sendOrderConfirmation(
      testEmail,
      testData.orderConfirmation
    );
    results.push({ type: "orderConfirmation", ...orderResult });

    // Test email de confirmación de suscripción
    const subscriptionResult = await emailService.sendSubscriptionConfirmation(
      testEmail,
      testData.subscriptionConfirmation
    );
    results.push({ type: "subscriptionConfirmation", ...subscriptionResult });

    console.log("✅ Tests de email completados");
    return results;
  } catch (error) {
    console.error("❌ Error en tests de email:", error);
    return [{ type: "error", success: false, error: error.message }];
  }
}

/**
 * Middleware para rate limiting de emails
 */
class EmailRateLimiter {
  constructor(maxEmailsPerMinute = 10) {
    this.maxEmails = maxEmailsPerMinute;
    this.emailCounts = new Map();
    this.windowMs = 60000; // 1 minuto
  }

  isAllowed(identifier = "global") {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.emailCounts.has(identifier)) {
      this.emailCounts.set(identifier, []);
    }

    const timestamps = this.emailCounts.get(identifier);

    // Limpiar timestamps antiguos
    const validTimestamps = timestamps.filter(
      (timestamp) => timestamp > windowStart
    );
    this.emailCounts.set(identifier, validTimestamps);

    // Verificar límite
    if (validTimestamps.length >= this.maxEmails) {
      return false;
    }

    // Agregar timestamp actual
    validTimestamps.push(now);
    return true;
  }

  getRemainingEmails(identifier = "global") {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.emailCounts.has(identifier)) {
      return this.maxEmails;
    }

    const validTimestamps = this.emailCounts
      .get(identifier)
      .filter((timestamp) => timestamp > windowStart);

    return Math.max(0, this.maxEmails - validTimestamps.length);
  }
}

module.exports = {
  isValidEmail,
  sanitizeEmailData,
  formatCurrency,
  formatDate,
  generateEmailTrackingId,
  validateEmailConfig,
  generateTestEmailData,
  emailSubjects,
  emailProviders,
  testEmailConnection,
  sendTestEmails,
  EmailRateLimiter,
};
