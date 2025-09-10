const express = require("express");
const router = express.Router();
const { checkAuth, checkRole } = require("../middlewares/authentication");
const {
  attachEmailService,
  emailRateLimit,
  validateEmailData,
  handleEmailError,
  handleEmailSuccess,
} = require("../middlewares/emailMiddleware");
const {
  testEmailConnection,
  sendTestEmails,
  generateTestEmailData,
  emailProviders,
  isValidEmail,
} = require("../infraestructure/services/emailUtils");

// Aplicar middleware de email service a todas las rutas
router.use(attachEmailService);

/**
 * RUTAS DE ADMINISTRACIÓN DE EMAILS
 */

// Verificar configuración y estado del servicio de email
router.get(
  "/status",
  checkAuth,
  checkRole(["admin", "owner"]),
  async (req, res) => {
    try {
      // Verificar configuración
      const configStatus = {
        hasHost: !!process.env.EMAIL_HOST,
        hasPort: !!process.env.EMAIL_PORT,
        hasUser: !!process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS,
        hasFrom: !!process.env.EMAIL_FROM,
        hasFrontendUrl: !!process.env.FRONT_URL,
      };

      // Verificar conexión
      const connectionResult = await testEmailConnection(req.emailService);

      res.status(200).json({
        status: "success",
        emailService: {
          configured: Object.values(configStatus).every(Boolean),
          connected: connectionResult.success,
          configuration: configStatus,
          connection: connectionResult,
          provider: process.env.EMAIL_HOST || "No configurado",
        },
      });
    } catch (error) {
      console.error("Error al verificar estado del email service:", error);
      res.status(500).json({
        status: "error",
        message: "Error al verificar el estado del servicio de email",
        error: error.message,
      });
    }
  }
);

// Enviar email de prueba
router.post(
  "/test",
  checkAuth,
  checkRole(["admin", "owner"]),
  emailRateLimit,
  validateEmailData(["testType"]),
  async (req, res) => {
    try {
      const { email, testType } = req.body;
      const testData = generateTestEmailData();

      let result;

      switch (testType) {
        case "welcome":
          result = await req.emailService.sendWelcomeEmail(
            email,
            testData.welcomeUser
          );
          break;
        case "order":
          result = await req.emailService.sendOrderConfirmation(
            email,
            testData.orderConfirmation
          );
          break;
        case "subscription":
          result = await req.emailService.sendSubscriptionConfirmation(
            email,
            testData.subscriptionConfirmation
          );
          break;
        case "status":
          result = await req.emailService.sendOrderStatusUpdate(
            email,
            testData.orderStatus
          );
          break;
        case "reminder":
          result = await req.emailService.sendSubscriptionReminder(
            email,
            testData.subscriptionConfirmation
          );
          break;
        case "reset":
          result = await req.emailService.sendPasswordReset(
            email,
            testData.passwordReset
          );
          break;
        default:
          return res.status(400).json({
            error:
              "Tipo de test inválido. Opciones: welcome, order, subscription, status, reminder, reset",
          });
      }

      if (result.success) {
        handleEmailSuccess(
          result,
          res,
          `Email de prueba '${testType}' enviado exitosamente`
        );
      } else {
        handleEmailError(new Error(result.error), res);
      }
    } catch (error) {
      handleEmailError(error, res);
    }
  }
);

// Enviar todos los tipos de email de prueba
router.post(
  "/test-all",
  checkAuth,
  checkRole(["admin", "owner"]),
  emailRateLimit,
  validateEmailData(),
  async (req, res) => {
    try {
      const { email } = req.body;

      console.log(`🧪 Enviando todos los emails de prueba a ${email}...`);
      const results = await sendTestEmails(req.emailService, email);

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      res.status(200).json({
        status: "success",
        message: `Emails de prueba enviados: ${successful} exitosos, ${failed} fallidos`,
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        },
      });
    } catch (error) {
      handleEmailError(error, res);
    }
  }
);

// Obtener información de proveedores disponibles
router.get(
  "/providers",
  checkAuth,
  checkRole(["admin", "owner"]),
  (req, res) => {
    res.status(200).json({
      status: "success",
      providers: emailProviders,
      currentProvider: process.env.EMAIL_HOST || "No configurado",
      recommendations: {
        development: ["gmail"],
        production: ["sendgrid", "mailgun", "ses"],
        notes: {
          gmail:
            "Fácil configuración para desarrollo, requiere contraseña de aplicación",
          sendgrid: "Excelente para producción, APIs robustas, buen soporte",
          mailgun: "Muy confiable, buena documentación, precios competitivos",
          ses: "Más económico para volúmenes altos, requiere más configuración",
        },
      },
    });
  }
);

/**
 * RUTAS PARA ENVÍO DE EMAILS ESPECÍFICOS
 */

// Enviar email solicitando fecha de entrega
router.post(
  "/send/delivery-schedule",
  checkAuth,
  checkRole(["admin", "owner"]),
  emailRateLimit,
  validateEmailData(["orderId", "customerName"]),
  async (req, res) => {
    try {
      const { email, orderId, customerName, orderData } = req.body;

      // Validar que se proporcionen los datos mínimos de la orden
      if (!orderData || !orderData.items || !orderData.total) {
        return res.status(400).json({
          error: "Se requieren los datos completos de la orden (items, total)",
        });
      }

      // Buscar la orden en la base de datos usando el ObjectId
      const Order = require("../models/order");
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          error: "Orden no encontrada",
        });
      }

      // Verificar que la orden no esté ya entregada o cancelada
      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({
          error: `No se puede solicitar horario para una orden ${
            order.status === "delivered" ? "ya entregada" : "cancelada"
          }`,
        });
      }

      // Preparar datos para el email
      const deliveryRequestData = {
        orderId: orderData.orderId, // Usar el ID personalizado para mostrar al cliente
        customerName,
        orderDate: orderData.orderDate || new Date(),
        total: orderData.total,
        items: orderData.items,
      };

      const result = await req.emailService.sendDeliveryScheduleRequest(
        email,
        deliveryRequestData
      );

      if (result.success) {
        // Actualizar el estado de la orden a "waiting_schedule" si no está ya en un estado posterior
        if (["pending", "confirmed", "processing"].includes(order.status)) {
          order.status = "waiting_schedule";

          // Agregar paso de tracking
          order.trackingSteps = order.trackingSteps || [];
          order.trackingSteps.push({
            status: "Solicitud de horario enviada",
            date: new Date(),
            completed: true,
            current: false,
          });

          await order.save();
        }

        handleEmailSuccess(
          result,
          res,
          `Email de programación de entrega enviado a ${customerName}. Estado de orden actualizado a "Esperando horario".`
        );
      } else {
        handleEmailError(new Error(result.error), res);
      }
    } catch (error) {
      console.error("Error al enviar email de programación de entrega:", error);
      handleEmailError(error, res);
    }
  }
);

// Enviar email de bienvenida manual
router.post(
  "/send/welcome",
  checkAuth,
  checkRole(["admin", "owner"]),
  emailRateLimit,
  validateEmailData(["name"]),
  async (req, res) => {
    try {
      const { email, name } = req.body;

      const result = await req.emailService.sendWelcomeEmail(email, { name });

      if (result.success) {
        handleEmailSuccess(result, res, "Email de bienvenida enviado");
      } else {
        handleEmailError(new Error(result.error), res);
      }
    } catch (error) {
      handleEmailError(error, res);
    }
  }
);

// Enviar notificación personalizada
router.post(
  "/send/custom",
  checkAuth,
  checkRole(["admin", "owner"]),
  emailRateLimit,
  validateEmailData(["subject", "message"]),
  async (req, res) => {
    try {
      const { email, subject, message, customerName = "Cliente" } = req.body;

      // Crear plantilla personalizada usando la base
      const customContent = `
        <h2>${subject}</h2>
        
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          ${message
            .split("\n")
            .map((line) => `<p>${line}</p>`)
            .join("")}
        </div>
        
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        
        <p>¡Salud! 🍺<br>
        <strong>El equipo de Luna Brew House</strong></p>
      `;

      const customTemplate = req.emailService
        .getBaseTemplate()
        .replace("{{TITLE}}", subject)
        .replace("{{CONTENT}}", customContent);

      const result = await req.emailService.sendEmail(
        email,
        subject,
        customTemplate
      );

      if (result.success) {
        handleEmailSuccess(result, res, "Email personalizado enviado");
      } else {
        handleEmailError(new Error(result.error), res);
      }
    } catch (error) {
      handleEmailError(error, res);
    }
  }
);

// Enviar newsletter o email masivo
router.post(
  "/send/newsletter",
  checkAuth,
  checkRole(["admin", "owner"]),
  validateEmailData(["subject", "message", "recipients"]),
  async (req, res) => {
    try {
      const { subject, message, recipients, delay = 2000 } = req.body;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          error: "Se requiere un array de recipients con al menos un email",
        });
      }

      // Validar todos los emails
      const invalidEmails = recipients.filter((email) => !isValidEmail(email));
      if (invalidEmails.length > 0) {
        return res.status(400).json({
          error: "Emails inválidos detectados",
          invalidEmails,
        });
      }

      // Crear plantilla de newsletter
      const newsletterContent = `
        <h2>${subject}</h2>
        
        <div class="beer-info">
          <div class="beer-emoji">📧</div>
          <h3 style="color: #d97706; margin-bottom: 10px;">Newsletter Luna Brew House</h3>
          <p style="margin: 0;">Mantente al día con nuestras novedades y ofertas especiales</p>
        </div>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          ${message
            .split("\n")
            .map((line) => `<p>${line}</p>`)
            .join("")}
        </div>
        
        <div style="text-align: center;">
          <a href="${
            process.env.FRONT_URL || "https://lunabrewhouse.com"
          }" class="button">
            Visitar Luna Brew House
          </a>
        </div>
        
        <p>¡Gracias por ser parte de la comunidad Luna Brew House!</p>
        
        <p>¡Salud! 🍺<br>
        <strong>El equipo de Luna Brew House</strong></p>
      `;

      const newsletterTemplate = req.emailService
        .getBaseTemplate()
        .replace("{{TITLE}}", subject)
        .replace("{{CONTENT}}", newsletterContent);

      // Preparar lista para envío en lote
      const emailList = recipients.map((email) => ({ email, data: {} }));

      console.log(
        `📧 Enviando newsletter a ${recipients.length} destinatarios...`
      );
      const results = await req.emailService.sendBatchEmails(
        emailList,
        subject,
        newsletterTemplate,
        parseInt(delay)
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      res.status(200).json({
        status: "success",
        message: `Newsletter enviada: ${successful} exitosos, ${failed} fallidos`,
        results,
        summary: {
          total: results.length,
          successful,
          failed,
          failedEmails: results.filter((r) => !r.success).map((r) => r.email),
        },
      });
    } catch (error) {
      handleEmailError(error, res);
    }
  }
);

// Obtener estadísticas de emails (placeholder para futuras métricas)
router.get("/stats", checkAuth, checkRole(["admin", "owner"]), (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Estadísticas de email no implementadas aún",
    suggestion:
      "Considerar integrar con servicios como SendGrid Analytics o implementar logging local",
  });
});

module.exports = router;
