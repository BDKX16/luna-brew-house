const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

/**
 * Servicio de envío de emails para Luna Brew House
 * Configurado con Nodemailer y plantillas HTML personalizadas
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.from =
      process.env.EMAIL_FROM || "Luna Brew House <noreply@lunabrewhouse.com>";
    this.initializeTransporter();
  }

  /**
   * Inicializa el transportador de Nodemailer
   */
  initializeTransporter() {
    try {
      // Validar variables de entorno requeridas
      if (
        !process.env.EMAIL_HOST ||
        !process.env.EMAIL_PORT ||
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
      ) {
        console.warn(
          "⚠️  Variables de entorno de email no configuradas completamente"
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === "true", // true para 465, false para otros puertos
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized:
            process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== "false",
        },
      });

      console.log("✅ Transportador de email inicializado correctamente");
    } catch (error) {
      console.error(
        "❌ Error al inicializar el transportador de email:",
        error
      );
    }
  }

  /**
   * Verifica la conexión del transportador
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error("Transportador no inicializado");
      }

      await this.transporter.verify();
      console.log("✅ Conexión de email verificada");
      return true;
    } catch (error) {
      console.error("❌ Error al verificar conexión de email:", error);
      return false;
    }
  }

  /**
   * Plantilla base HTML para todos los emails
   */
  getBaseTemplate() {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{TITLE}}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.95;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .content h2 {
          color: #d97706;
          font-size: 24px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .content p {
          margin-bottom: 15px;
          font-size: 16px;
          line-height: 1.6;
        }
        
        .highlight-box {
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        
        .order-details {
          background-color: #f8f9fa;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .order-item:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 18px;
          color: #d97706;
        }
        
        .footer {
          background-color: #374151;
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .footer p {
          margin-bottom: 10px;
          opacity: 0.9;
        }
        
        .social-links {
          margin-top: 20px;
        }
        
        .social-links a {
          color: #f59e0b;
          text-decoration: none;
          margin: 0 10px;
          font-weight: bold;
        }
        
        .divider {
          height: 2px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          margin: 20px 0;
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
        }
        
        .status-confirmed {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .status-processing {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .status-shipped {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .beer-info {
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        
        .beer-emoji {
          font-size: 48px;
          margin-bottom: 10px;
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .header {
            padding: 20px 15px;
          }
          
          .button {
            display: block;
            width: 100%;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🍺</div>
          <h1>Luna Brew House</h1>
          <p>Cervezas artesanales de calidad premium</p>
        </div>
        
        <div class="content">
          {{CONTENT}}
        </div>
        
        <div class="footer">
          <p><strong>Luna Brew House</strong></p>
 M          <p>📍 Avenida Pedro Luro 2514</p>
          <p>📞 +54 (223) 634-4785 | ✉️ lunabrewhouse@gmail.com</p>
          
          <div class="social-links">
            <a href="https://www.instagram.com/lunabrewhouse?igsh=MW9rNTB0eWszNHluMQ==" target="_blank">Instagram</a>
          </div>
          
          <div class="divider"></div>
          <p style="font-size: 12px; opacity: 0.7;">
            Este email fue enviado porque tienes una cuenta en Luna Brew House.<br>
            Si no deseas recibir más emails, puedes <a href="#" style="color: #f59e0b;">darte de baja aquí</a>.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Plantilla para email de confirmación de registro
   */
  getWelcomeTemplate(userData) {
    const content = `
      <h2>¡Bienvenido a Luna Brew House!</h2>
      
      <p>Hola <strong>${userData.name}</strong>,</p>
      
      <p>¡Gracias por unirte a nuestra comunidad de amantes de la cerveza artesanal! Tu cuenta ha sido creada exitosamente.</p>
      
      <div class="beer-info">
        <div class="beer-emoji">🍻</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">¡Tu aventura cervecera comienza aquí!</h3>
        <p style="margin: 0;">Explora nuestras cervezas únicas y suscríbete para recibir entregas mensuales.</p>
      </div>
      
      <div class="highlight-box">
        <p><strong>¿Qué puedes hacer ahora?</strong></p>
        <ul style="margin-left: 20px;">
          <li>Explorar nuestro catálogo de cervezas artesanales</li>
          <li>Suscribirte a nuestro plan mensual</li>
          <li>Realizar pedidos individuales</li>
          <li>Seguir tu historial de compras</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONT_URL || "https://lunabrewhouse.com"
        }" class="button">
          Explorar Cervezas
        </a>
      </div>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!</p>
      
      <p>¡Salud! 🍺<br>
      <strong>El equipo de Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Bienvenido a Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para confirmación de pedido
   */
  getOrderConfirmationTemplate(orderData) {
    const orderItems = orderData.items
      .map(
        (item) => `
      <div class="order-item">
        <span>${item.name} ${item.beerType ? `(${item.beerType})` : ""}</span>
        <span>$${item.price.toFixed(2)}</span>
      </div>
    `
      )
      .join("");

    const content = `
      <h2>¡Pedido Confirmado!</h2>
      
      <p>Hola <strong>${orderData.customerName}</strong>,</p>
      
      <p>Hemos recibido tu pedido y ya estamos preparándolo con todo el cuidado que nuestras cervezas merecen.</p>
      
      <div class="highlight-box">
        <p><strong>Número de Pedido:</strong> #${orderData.orderId}</p>
        <p><strong>Estado:</strong> <span class="status-badge status-confirmed">Confirmado</span></p>
        <p><strong>Fecha de Pedido:</strong> ${new Date(
          orderData.date
        ).toLocaleDateString("es-ES")}</p>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Detalles del Pedido</h3>
        ${orderItems}
        <div class="order-item">
          <span><strong>Total</strong></span>
          <span><strong>$${orderData.total.toFixed(2)}</strong></span>
        </div>
      </div>
      
      ${
        orderData.shippingAddress
          ? `
        <div class="highlight-box">
          <p><strong>Dirección de Entrega:</strong></p>
          <p>${orderData.shippingAddress}</p>
        </div>
      `
          : ""
      }
      
      <div class="beer-info">
        <div class="beer-emoji">📦</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Tiempo de Entrega</h3>
        <p style="margin: 0;">Tu pedido será entregado en un plazo de 3-5 días hábiles.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONT_URL || "https://lunabrewhouse.com"
        }/perfil/pedidos" class="button">
          Seguir mi Pedido
        </a>
      </div>
      
      <p>Te mantendremos informado sobre el estado de tu pedido. ¡Gracias por elegir Luna Brew House!</p>
      
      <p>¡Salud! 🍺<br>
      <strong>El equipo de Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Confirmación de Pedido - Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para confirmación de suscripción
   */
  getSubscriptionConfirmationTemplate(subscriptionData) {
    const beerTypeNames = {
      golden: "Golden Ale",
      red: "Red Ale",
      ipa: "India Pale Ale",
    };

    const content = `
      <h2>¡Suscripción Activada!</h2>
      
      <p>Hola <strong>${subscriptionData.customerName}</strong>,</p>
      
      <p>¡Excelente elección! Tu suscripción a Luna Brew House ha sido activada exitosamente.</p>
      
      <div class="beer-info">
        <div class="beer-emoji">🎉</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">¡Bienvenido al Club Luna Brew!</h3>
        <p style="margin: 0;">Cada mes recibirás nuestras mejores cervezas artesanales directamente en tu puerta.</p>
      </div>
      
      <div class="highlight-box">
        <p><strong>ID de Suscripción:</strong> #${
          subscriptionData.subscriptionId
        }</p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Cerveza Seleccionada:</strong> ${
          beerTypeNames[subscriptionData.beerType] || subscriptionData.beerName
        }</p>
        <p><strong>Cantidad:</strong> ${subscriptionData.liters}L mensuales</p>
        <p><strong>Precio Mensual:</strong> $${subscriptionData.price.toFixed(
          2
        )}</p>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Próxima Entrega</h3>
        <div class="order-item">
          <span><strong>Fecha Estimada:</strong></span>
          <span>${new Date(subscriptionData.nextDelivery).toLocaleDateString(
            "es-ES"
          )}</span>
        </div>
        <div class="order-item">
          <span><strong>Estado:</strong></span>
          <span><span class="status-badge status-confirmed">Activa</span></span>
        </div>
      </div>
      
      ${
        subscriptionData.shippingAddress
          ? `
        <div class="highlight-box">
          <p><strong>Dirección de Entrega:</strong></p>
          <p>${subscriptionData.shippingAddress}</p>
        </div>
      `
          : ""
      }
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONT_URL || "https://lunabrewhouse.com"
        }/perfil/suscripciones" class="button">
          Gestionar mi Suscripción
        </a>
      </div>
      
      <p><strong>¿Qué incluye tu suscripción?</strong></p>
      <ul style="margin-left: 20px;">
        <li>Cervezas frescas y de calidad premium</li>
        <li>Entregas puntuales cada mes</li>
        <li>Flexibilidad para pausar o cancelar</li>
        <li>Acceso a cervezas exclusivas para suscriptores</li>
      </ul>
      
      <p>¡Gracias por confiar en Luna Brew House para tu experiencia cervecera mensual!</p>
      
      <p>¡Salud! 🍺<br>
      <strong>El equipo de Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Suscripción Confirmada - Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para actualización de estado de pedido
   */
  getOrderStatusTemplate(orderData) {
    const statusInfo = {
      processing: {
        badge: "status-processing",
        title: "Pedido en Preparación",
        message: "Estamos preparando tu pedido con todo el cuidado.",
        emoji: "⚙️",
      },
      shipped: {
        badge: "status-shipped",
        title: "Pedido Enviado",
        message: "Tu pedido está en camino. ¡Pronto estará contigo!",
        emoji: "🚚",
      },
      delivered: {
        badge: "status-confirmed",
        title: "Pedido Entregado",
        message:
          "¡Tu pedido ha sido entregado! Esperamos que disfrutes nuestras cervezas.",
        emoji: "✅",
      },
    };

    const status = statusInfo[orderData.status] || statusInfo.processing;

    const content = `
      <h2>${status.title}</h2>
      
      <p>Hola <strong>${orderData.customerName}</strong>,</p>
      
      <div class="beer-info">
        <div class="beer-emoji">${status.emoji}</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Actualización de tu Pedido</h3>
        <p style="margin: 0;">${status.message}</p>
      </div>
      
      <div class="highlight-box">
        <p><strong>Número de Pedido:</strong> #${orderData.orderId}</p>
        <p><strong>Estado Actual:</strong> <span class="status-badge ${
          status.badge
        }">${status.title}</span></p>
        <p><strong>Fecha de Actualización:</strong> ${new Date().toLocaleDateString(
          "es-ES"
        )}</p>
      </div>
      
      ${
        orderData.trackingNumber
          ? `
        <div class="order-details">
          <h3 style="margin-bottom: 15px; color: #d97706;">Información de Envío</h3>
          <div class="order-item">
            <span><strong>Número de Seguimiento:</strong></span>
            <span>${orderData.trackingNumber}</span>
          </div>
        </div>
      `
          : ""
      }
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONT_URL || "https://lunabrewhouse.com"
        }/perfil/pedidos" class="button">
          Ver Detalles del Pedido
        </a>
      </div>
      
      <p>Gracias por tu paciencia y por elegir Luna Brew House.</p>
      
      <p>¡Salud! 🍺<br>
      <strong>El equipo de Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", `${status.title} - Luna Brew House`)
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para recordatorio de suscripción
   */
  getSubscriptionReminderTemplate(subscriptionData) {
    const content = `
      <h2>Tu Próxima Entrega se Acerca</h2>
      
      <p>Hola <strong>${subscriptionData.customerName}</strong>,</p>
      
      <p>¡Buenas noticias! Tu próxima entrega de Luna Brew House está programada para muy pronto.</p>
      
      <div class="beer-info">
        <div class="beer-emoji">🎯</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Próxima Entrega</h3>
        <p style="margin: 0;">${new Date(
          subscriptionData.nextDelivery
        ).toLocaleDateString("es-ES")}</p>
      </div>
      
      <div class="highlight-box">
        <p><strong>Tu Suscripción:</strong></p>
        <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
        <p><strong>Cerveza:</strong> ${subscriptionData.beerName}</p>
        <p><strong>Cantidad:</strong> ${subscriptionData.liters}L</p>
      </div>
      
      <p>¿Quieres cambiar algo antes de la próxima entrega?</p>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONT_URL || "https://lunabrewhouse.com"
        }/perfil/suscripciones/${
      subscriptionData.subscriptionId
    }" class="button">
          Gestionar Suscripción
        </a>
      </div>
      
      <p><strong>Puedes:</strong></p>
      <ul style="margin-left: 20px;">
        <li>Cambiar el tipo de cerveza</li>
        <li>Pausar temporalmente la suscripción</li>
        <li>Actualizar tu dirección de entrega</li>
      </ul>
      
      <p>Si no realizas cambios, enviaremos tu cerveza habitual a la dirección registrada.</p>
      
      <p>¡Salud! 🍺<br>
      <strong>El equipo de Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Recordatorio de Entrega - Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para recuperación de contraseña
   */
  getPasswordResetTemplate(userData) {
    const content = `
      <h2>Restablecimiento de Contraseña</h2>
      
      <p>Hola <strong>${userData.name}</strong>,</p>
      
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Luna Brew House.</p>
      
      <div class="highlight-box">
        <p><strong>⚠️ Importante:</strong></p>
        <p>Si no solicitaste este cambio, puedes ignorar este email. Tu cuenta permanecerá segura.</p>
      </div>
      
      <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
      
      <div style="text-align: center;">
        <a href="${userData.resetLink}" class="button">
          Restablecer Contraseña
        </a>
      </div>
      
      <p><strong>Este enlace expirará en 1 hora por seguridad.</strong></p>
      
      <p>Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
      <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace;">
        ${userData.resetLink}
      </p>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #666;">
        <strong>Consejos de seguridad:</strong><br>
        • Nunca compartas tu contraseña con nadie<br>
        • Usa una contraseña única y segura<br>
        • Si tienes dudas, contáctanos directamente
      </p>
      
      <p>¡Salud! 🍺<br>
      <strong>El equipo de Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Restablecimiento de Contraseña - Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para solicitar fecha de entrega al cliente
   */
  getDeliveryScheduleRequestTemplate(orderData) {
    const orderItems = orderData.items
      .map(
        (item) => `
      <div class="order-item">
        <span>${item.name} ${item.beerType ? `(${item.beerType})` : ""} x${
          item.quantity || 1
        }</span>
        <span>$${item.price.toFixed(2)}</span>
      </div>
    `
      )
      .join("");

    const content = `
      <h2>📅 Es hora de programar tu entrega</h2>
      
      <p>Hola <strong>${orderData.customerName}</strong>,</p>
      
      <p>¡Excelentes noticias! Tu pedido está listo y necesitamos que selecciones tu horario de entrega preferido.</p>
      
      <div class="beer-info">
        <div class="beer-emoji">📦</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Detalles de tu Pedido</h3>
        <p style="margin: 0;"><strong>Pedido #${orderData.orderId}</strong></p>
        <p style="margin: 0;">Fecha: ${new Date(
          orderData.orderDate
        ).toLocaleDateString("es-ES")}</p>
      </div>
      
      <h3 style="color: #d97706;">Productos ordenados:</h3>
      <div class="order-items">
        ${orderItems}
      </div>
      
      <div style="border-top: 2px solid #f59e0b; padding-top: 15px; margin-top: 20px;">
        <strong style="font-size: 18px;">Total: $${orderData.total.toFixed(
          2
        )}</strong>
      </div>
      
      <div class="highlight-box">
        <h3 style="color: #d97706; margin-top: 0;">🕐 Selecciona tu horario de entrega</h3>
        <p>Para programar tu entrega, haz clic en el siguiente botón y elige el día y horario que mejor te convenga:</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${
            process.env.FRONT_URL || "https://lunabrewhouse.com"
          }/pedidos/horario/${orderData.orderId}" class="button">
            📅 Seleccionar Horario de Entrega
          </a>
        </div>
        
        <p><strong>Horarios disponibles:</strong></p>
        <ul style="margin: 10px 0;">
          <li>🌅 Mañana: 9:00 AM - 12:00 PM</li>
          <li>🌞 Tarde: 2:00 PM - 6:00 PM</li>
          <li>🌆 Noche: 6:00 PM - 9:00 PM</li>
        </ul>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>⏰ Importante:</strong> Por favor programa tu entrega dentro de los próximos 3 días para garantizar la frescura de tus cervezas.
        </p>
      </div>
      
      <p>Si tienes alguna pregunta o necesitas reprogramar, no dudes en contactarnos.</p>
      
      <div style="text-align: center;">
        <p><strong>📞 ¿Necesitas ayuda?</strong></p>
        <p>Contáctanos: <a href="mailto:contacto@lunabrewhouse.com" style="color: #d97706;">contacto@lunabrewhouse.com</a></p>
      </div>
      
      <p>¡Esperamos que disfrutes mucho tu cerveza artesanal! 🍺<br>
      <strong>El equipo de Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Programa tu Entrega - Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * PLANTILLAS PARA NOTIFICACIONES ADMINISTRATIVAS
   */

  /**
   * Plantilla para notificar nuevo pedido a administradores
   */
  getAdminNewOrderTemplate(orderData) {
    const orderItems = orderData.items
      .map(
        (item) => `
      <div class="order-item">
        <span>${item.name} ${item.beerType ? `(${item.beerType})` : ""} x${
          item.quantity || 1
        }</span>
        <span>$${item.price.toFixed(2)}</span>
      </div>
    `
      )
      .join("");

    const priorityLevel = orderData.urgent ? "Alta" : "Normal";
    const priorityColor = orderData.urgent ? "#dc2626" : "#059669";

    const content = `
      <h2>🚨 Nuevo Pedido Recibido</h2>
      
      <div class="highlight-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
        <p><strong>⚡ Acción Requerida:</strong> Nuevo pedido requiere procesamiento</p>
        <p><strong>Prioridad:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${priorityLevel}</span></p>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Información del Pedido</h3>
        <div class="order-item">
          <span><strong>Número de Pedido:</strong></span>
          <span>#${orderData.orderId}</span>
        </div>
        <div class="order-item">
          <span><strong>Cliente:</strong></span>
          <span>${orderData.customerName}</span>
        </div>
        <div class="order-item">
          <span><strong>Email:</strong></span>
          <span>${orderData.customerEmail}</span>
        </div>
        <div class="order-item">
          <span><strong>Teléfono:</strong></span>
          <span>${orderData.customerPhone || "No proporcionado"}</span>
        </div>
        <div class="order-item">
          <span><strong>Fecha del Pedido:</strong></span>
          <span>${new Date(orderData.orderDate).toLocaleDateString(
            "es-ES"
          )}</span>
        </div>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Productos Solicitados</h3>
        ${orderItems}
        <div class="order-item">
          <span><strong>Total</strong></span>
          <span><strong>$${orderData.total.toFixed(2)}</strong></span>
        </div>
      </div>
      
      ${
        orderData.shippingAddress
          ? `
        <div class="highlight-box">
          <p><strong>📍 Dirección de Entrega:</strong></p>
          <p>${orderData.shippingAddress}</p>
        </div>
      `
          : ""
      }
      
      ${
        orderData.specialInstructions
          ? `
        <div class="highlight-box" style="background-color: #fef3c7;">
          <p><strong>📝 Instrucciones Especiales:</strong></p>
          <p style="font-style: italic;">"${orderData.specialInstructions}"</p>
        </div>
      `
          : ""
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${
          process.env.FRONTEND_URL || "https://lunabrewhouse.com"
        }/admin/pedidos/${orderData.orderId}" class="button">
          🔍 Ver Pedido en Admin
        </a>
      </div>
      
      <div class="beer-info">
        <div class="beer-emoji">⏰</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Próximos Pasos</h3>
        <p style="margin: 0;">
          1. Revisar inventario<br>
          2. Confirmar disponibilidad<br>
          3. Preparar productos<br>
          4. Actualizar estado del pedido
        </p>
      </div>
      
      <p><strong>¡Un nuevo cliente confía en Luna Brew House!</strong></p>
      
      <p>Saludos,<br>
      <strong>Sistema Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Nuevo Pedido - Acción Requerida")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para notificar nueva suscripción a administradores
   */
  getAdminNewSubscriptionTemplate(subscriptionData) {
    const beerTypeNames = {
      golden: "Golden Ale",
      red: "Red Ale",
      ipa: "India Pale Ale",
    };

    const content = `
      <h2>🎉 Nueva Suscripción Activada</h2>
      
      <div class="highlight-box" style="background-color: #dcfce7; border-left-color: #059669;">
        <p><strong>✅ Información:</strong> Nuevo cliente se ha suscrito al servicio mensual</p>
        <p><strong>Ingresos Recurrentes:</strong> +$${subscriptionData.price.toFixed(
          2
        )}/mes</p>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Información del Suscriptor</h3>
        <div class="order-item">
          <span><strong>Cliente:</strong></span>
          <span>${subscriptionData.customerName}</span>
        </div>
        <div class="order-item">
          <span><strong>Email:</strong></span>
          <span>${subscriptionData.customerEmail}</span>
        </div>
        <div class="order-item">
          <span><strong>Plan:</strong></span>
          <span>${subscriptionData.planName}</span>
        </div>
        <div class="order-item">
          <span><strong>Cerveza Seleccionada:</strong></span>
          <span>${
            beerTypeNames[subscriptionData.beerType] ||
            subscriptionData.beerName
          }</span>
        </div>
        <div class="order-item">
          <span><strong>Cantidad Mensual:</strong></span>
          <span>${subscriptionData.liters}L</span>
        </div>
        <div class="order-item">
          <span><strong>Precio Mensual:</strong></span>
          <span><strong>$${subscriptionData.price.toFixed(2)}</strong></span>
        </div>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Próxima Entrega</h3>
        <div class="order-item">
          <span><strong>Fecha Programada:</strong></span>
          <span>${new Date(subscriptionData.nextDelivery).toLocaleDateString(
            "es-ES"
          )}</span>
        </div>
        <div class="order-item">
          <span><strong>Dirección:</strong></span>
          <span>${subscriptionData.shippingAddress || "Por confirmar"}</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${
          process.env.FRONTEND_URL || "https://lunabrewhouse.com"
        }/admin/suscripciones/${
      subscriptionData.subscriptionId
    }" class="button">
          📊 Ver Suscripción en Admin
        </a>
      </div>
      
      <div class="beer-info">
        <div class="beer-emoji">📅</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Recordatorio</h3>
        <p style="margin: 0;">
          Programar la primera entrega para ${new Date(
            subscriptionData.nextDelivery
          ).toLocaleDateString("es-ES")}
        </p>
      </div>
      
      <p><strong>¡Nuestro club de suscriptores sigue creciendo!</strong></p>
      
      <p>Saludos,<br>
      <strong>Sistema Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Nueva Suscripción - Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para notificar solicitud especial a administradores
   */
  getAdminSpecialRequestTemplate(requestData) {
    const urgencyLevels = {
      low: { label: "Baja", color: "#059669" },
      medium: { label: "Media", color: "#d97706" },
      high: { label: "Alta", color: "#dc2626" },
      urgent: { label: "URGENTE", color: "#991b1b" },
    };

    const urgency = urgencyLevels[requestData.urgency] || urgencyLevels.medium;

    const content = `
      <h2>🔔 Solicitud Especial de Cliente</h2>
      
      <div class="highlight-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
        <p><strong>⚠️ Atención Requerida:</strong> Cliente ha enviado una solicitud especial</p>
        <p><strong>Urgencia:</strong> <span style="color: ${
          urgency.color
        }; font-weight: bold;">${urgency.label}</span></p>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Información del Cliente</h3>
        <div class="order-item">
          <span><strong>Cliente:</strong></span>
          <span>${requestData.customerName}</span>
        </div>
        <div class="order-item">
          <span><strong>Email:</strong></span>
          <span>${requestData.customerEmail}</span>
        </div>
        <div class="order-item">
          <span><strong>Teléfono:</strong></span>
          <span>${requestData.customerPhone || "No proporcionado"}</span>
        </div>
        ${
          requestData.orderId
            ? `
        <div class="order-item">
          <span><strong>Pedido Relacionado:</strong></span>
          <span>#${requestData.orderId}</span>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="highlight-box" style="background-color: #f0f9ff; border-left-color: #0ea5e9;">
        <h3 style="color: #0ea5e9; margin-bottom: 15px;">📝 Detalles de la Solicitud</h3>
        <p><strong>Tipo:</strong> ${
          requestData.requestType || "Solicitud General"
        }</p>
        <p><strong>Fecha de Solicitud:</strong> ${new Date(
          requestData.requestDate
        ).toLocaleDateString("es-ES")}</p>
        
        ${
          requestData.deliveryDate
            ? `
        <p><strong>🚚 Fecha de Entrega Solicitada:</strong> 
        <span style="color: #dc2626; font-weight: bold;">
          ${new Date(requestData.deliveryDate).toLocaleDateString(
            "es-ES"
          )} a las ${requestData.deliveryTime || "hora por confirmar"}
        </span></p>
        `
            : ""
        }
        
        <div style="margin-top: 15px; padding: 15px; background-color: white; border-radius: 5px;">
          <p><strong>Mensaje del Cliente:</strong></p>
          <p style="font-style: italic; margin-top: 10px;">"${
            requestData.message
          }"</p>
        </div>
      </div>
      
      ${
        requestData.specialInstructions
          ? `
        <div class="highlight-box" style="background-color: #fef3c7;">
          <p><strong>📋 Instrucciones Adicionales:</strong></p>
          <p style="font-style: italic;">"${requestData.specialInstructions}"</p>
        </div>
      `
          : ""
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:${
          requestData.customerEmail
        }" class="button" style="margin-right: 10px;">
          📧 Responder al Cliente
        </a>
        ${
          requestData.orderId
            ? `
        <a href="${
          process.env.FRONTEND_URL || "https://lunabrewhouse.com"
        }/admin/pedidos/${requestData.orderId}" class="button">
          🔍 Ver Pedido
        </a>
        `
            : ""
        }
      </div>
      
      <div class="beer-info">
        <div class="beer-emoji">⏱️</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Tiempo de Respuesta</h3>
        <p style="margin: 0;">
          ${
            urgency.label === "URGENTE"
              ? "Responder inmediatamente"
              : urgency.label === "Alta"
              ? "Responder en 2-4 horas"
              : urgency.label === "Media"
              ? "Responder en 24 horas"
              : "Responder en 48 horas"
          }
        </p>
      </div>
      
      <p><strong>¡Atención personalizada hace la diferencia!</strong></p>
      
      <p>Saludos,<br>
      <strong>Sistema Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Solicitud Especial - Acción Requerida")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Plantilla para alertas de inventario bajo
   */
  getAdminLowStockTemplate(stockData) {
    const stockItems = stockData.products
      .map(
        (product) => `
      <div class="order-item" style="color: ${
        product.stock <= product.criticalLevel ? "#dc2626" : "#d97706"
      };">
        <span>
          <strong>${product.name}</strong>
          ${product.beerType ? `(${product.beerType})` : ""}
        </span>
        <span><strong>${product.stock} ${
          product.unit || "unidades"
        }</strong></span>
      </div>
    `
      )
      .join("");

    const content = `
      <h2>⚠️ Alerta de Inventario</h2>
      
      <div class="highlight-box" style="background-color: #fef2f2; border-left-color: #dc2626;">
        <p><strong>🚨 Atención Urgente:</strong> Productos con stock bajo detectados</p>
        <p><strong>Productos Afectados:</strong> ${
          stockData.products.length
        }</p>
      </div>
      
      <div class="order-details">
        <h3 style="margin-bottom: 15px; color: #d97706;">Stock Actual</h3>
        ${stockItems}
      </div>
      
      <div class="beer-info">
        <div class="beer-emoji">📊</div>
        <h3 style="color: #d97706; margin-bottom: 10px;">Niveles Críticos</h3>
        <p style="margin: 0;">
          🔴 Stock crítico: ≤ 5 unidades<br>
          🟡 Stock bajo: ≤ 10 unidades<br>
          🟢 Stock normal: > 10 unidades
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${
          process.env.FRONTEND_URL || "https://lunabrewhouse.com"
        }/admin/productos" class="button">
          📦 Gestionar Inventario
        </a>
      </div>
      
      <div class="highlight-box">
        <p><strong>⚡ Acciones Recomendadas:</strong></p>
        <ul style="margin-left: 20px;">
          <li>Verificar pedidos pendientes</li>
          <li>Coordinar producción</li>
          <li>Actualizar stock en sistema</li>
          <li>Notificar a equipo de producción</li>
        </ul>
      </div>
      
      <p><strong>¡Mantener el inventario es clave para el servicio!</strong></p>
      
      <p>Saludos,<br>
      <strong>Sistema Luna Brew House</strong></p>
    `;

    return this.getBaseTemplate()
      .replace("{{TITLE}}", "Alerta de Inventario - Luna Brew House")
      .replace("{{CONTENT}}", content);
  }

  /**
   * Envía un email usando la plantilla especificada
   */
  async sendEmail(to, subject, template, data = {}) {
    try {
      if (!this.transporter) {
        throw new Error("Transportador de email no inicializado");
      }

      if (!to || !subject || !template) {
        throw new Error("Parámetros requeridos: to, subject, template");
      }

      const mailOptions = {
        from: this.from,
        to,
        subject,
        html: template,
        // Versión de texto plano como fallback
        text: this.htmlToText(template),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado exitosamente a ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Error al enviar email a ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convierte HTML a texto plano para el fallback
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, "") // Remover tags HTML
      .replace(/\s+/g, " ") // Normalizar espacios
      .trim();
  }

  /**
   * Métodos de conveniencia para enviar emails específicos
   */
  async sendWelcomeEmail(userEmail, userData) {
    const template = this.getWelcomeTemplate(userData);
    return await this.sendEmail(
      userEmail,
      "¡Bienvenido a Luna Brew House! 🍺",
      template
    );
  }

  async sendOrderConfirmation(userEmail, orderData) {
    const template = this.getOrderConfirmationTemplate(orderData);
    return await this.sendEmail(
      userEmail,
      `Confirmación de Pedido #${orderData.orderId} - Luna Brew House`,
      template
    );
  }

  async sendSubscriptionConfirmation(userEmail, subscriptionData) {
    const template = this.getSubscriptionConfirmationTemplate(subscriptionData);
    return await this.sendEmail(
      userEmail,
      "¡Tu Suscripción está Activa! 🎉 - Luna Brew House",
      template
    );
  }

  async sendOrderStatusUpdate(userEmail, orderData) {
    const template = this.getOrderStatusTemplate(orderData);
    return await this.sendEmail(
      userEmail,
      `Actualización de Pedido #${orderData.orderId} - Luna Brew House`,
      template
    );
  }

  async sendSubscriptionReminder(userEmail, subscriptionData) {
    const template = this.getSubscriptionReminderTemplate(subscriptionData);
    return await this.sendEmail(
      userEmail,
      "Tu Próxima Entrega se Acerca 📦 - Luna Brew House",
      template
    );
  }

  async sendPasswordReset(userEmail, userData) {
    const template = this.getPasswordResetTemplate(userData);
    return await this.sendEmail(
      userEmail,
      "Restablecimiento de Contraseña - Luna Brew House",
      template
    );
  }

  async sendDeliveryScheduleRequest(userEmail, orderData) {
    const template = this.getDeliveryScheduleRequestTemplate(orderData);
    return await this.sendEmail(
      userEmail,
      `📅 Programa tu Entrega - Pedido #${orderData.orderId} - Luna Brew House`,
      template
    );
  }

  /**
   * MÉTODOS PARA NOTIFICACIONES ADMINISTRATIVAS
   */

  /**
   * Obtiene la lista de administradores activos
   */
  async getAdminEmails() {
    try {
      const User = require("../../models/user");
      const admins = await User.find({
        role: { $in: ["admin", "owner"] },
        nullDate: null,
      });
      return admins.map((admin) => admin.email).filter((email) => email);
    } catch (error) {
      console.error("Error al obtener emails de administradores:", error);
      return [];
    }
  }

  /**
   * Notifica nuevo pedido a administradores
   */
  async notifyAdminNewOrder(orderData) {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) {
        console.warn("⚠️ No hay administradores para notificar");
        return { success: false, error: "No admin emails found" };
      }

      const template = this.getAdminNewOrderTemplate(orderData);
      const subject = `🚨 Nuevo Pedido #${orderData.orderId} - ${orderData.customerName}`;

      const results = [];
      for (const email of adminEmails) {
        const result = await this.sendEmail(email, subject, template);
        results.push({ email, ...result });
      }

      console.log(
        `✅ Notificación de nuevo pedido enviada a ${adminEmails.length} administradores`
      );
      return { success: true, results };
    } catch (error) {
      console.error("Error al notificar nuevo pedido a admins:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica nueva suscripción a administradores
   */
  async notifyAdminNewSubscription(subscriptionData) {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) {
        console.warn("⚠️ No hay administradores para notificar");
        return { success: false, error: "No admin emails found" };
      }

      const template = this.getAdminNewSubscriptionTemplate(subscriptionData);
      const subject = `🎉 Nueva Suscripción - ${subscriptionData.customerName}`;

      const results = [];
      for (const email of adminEmails) {
        const result = await this.sendEmail(email, subject, template);
        results.push({ email, ...result });
      }

      console.log(
        `✅ Notificación de nueva suscripción enviada a ${adminEmails.length} administradores`
      );
      return { success: true, results };
    } catch (error) {
      console.error("Error al notificar nueva suscripción a admins:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica solicitud especial a administradores
   */
  async notifyAdminSpecialRequest(requestData) {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) {
        console.warn("⚠️ No hay administradores para notificar");
        return { success: false, error: "No admin emails found" };
      }

      const template = this.getAdminSpecialRequestTemplate(requestData);
      const urgencyIcon =
        requestData.urgency === "urgent"
          ? "🚨"
          : requestData.urgency === "high"
          ? "⚠️"
          : "🔔";
      const subject = `${urgencyIcon} Solicitud Especial - ${requestData.customerName}`;

      const results = [];
      for (const email of adminEmails) {
        const result = await this.sendEmail(email, subject, template);
        results.push({ email, ...result });
      }

      console.log(
        `✅ Notificación de solicitud especial enviada a ${adminEmails.length} administradores`
      );
      return { success: true, results };
    } catch (error) {
      console.error("Error al notificar solicitud especial a admins:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica inventario bajo a administradores
   */
  async notifyAdminLowStock(stockData) {
    try {
      const adminEmails = await this.getAdminEmails();
      if (adminEmails.length === 0) {
        console.warn("⚠️ No hay administradores para notificar");
        return { success: false, error: "No admin emails found" };
      }

      const template = this.getAdminLowStockTemplate(stockData);
      const criticalCount = stockData.products.filter(
        (p) => p.stock <= p.criticalLevel
      ).length;
      const subject = `⚠️ Alerta Inventario: ${criticalCount} productos críticos`;

      const results = [];
      for (const email of adminEmails) {
        const result = await this.sendEmail(email, subject, template);
        results.push({ email, ...result });
      }

      console.log(
        `✅ Alerta de inventario enviada a ${adminEmails.length} administradores`
      );
      return { success: true, results };
    } catch (error) {
      console.error("Error al notificar inventario bajo a admins:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía emails en lote (útil para newsletters o notificaciones masivas)
   */
  async sendBatchEmails(emailList, subject, template, delay = 1000) {
    const results = [];

    for (let i = 0; i < emailList.length; i++) {
      const { email, data } = emailList[i];

      try {
        const result = await this.sendEmail(email, subject, template, data);
        results.push({
          email,
          success: result.success,
          messageId: result.messageId,
        });

        // Delay entre emails para evitar problemas con el proveedor
        if (i < emailList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        results.push({ email, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Envía notificación a administradores sobre step de receta que requiere atención
   */
  async sendBrewingStepNotification(stepData) {
    try {
      const {
        recipeName,
        stepDescription,
        stepType,
        stepTime,
        sessionId,
        batchNumber,
      } = stepData;

      const subject = `🍺 Acción requerida: ${stepDescription} - ${recipeName}`;

      const htmlContent = this.getBaseTemplate()
        .replace("{{TITLE}}", subject)
        .replace(
          "{{MAIN_CONTENT}}",
          `
          <div style="background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); padding: 40px 0; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin-bottom: 10px;">🍺 Luna Brew House</h1>
            <p style="color: #e2e8f0; font-size: 16px;">Notificación de Elaboración</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <div style="background: #fef5e7; border-left: 4px solid #f6ad55; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
              <h2 style="color: #c05621; margin-bottom: 10px;">⚠️ Acción Requerida</h2>
              <p style="color: #744210; font-size: 16px; margin: 0;">
                Es momento de realizar el siguiente paso en la elaboración de cerveza.
              </p>
            </div>

            <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 30px; margin-bottom: 30px;">
              <h3 style="color: #1a365d; margin-bottom: 20px; font-size: 20px;">📋 Detalles del Step</h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; padding: 12px; background: #f7fafc; border-radius: 8px;">
                  <strong style="color: #2d3748; min-width: 140px;">🍺 Receta:</strong>
                  <span style="color: #4a5568;">${recipeName}</span>
                </div>
                
                <div style="display: flex; padding: 12px; background: #f7fafc; border-radius: 8px;">
                  <strong style="color: #2d3748; min-width: 140px;">📝 Descripción:</strong>
                  <span style="color: #4a5568;">${stepDescription}</span>
                </div>
                
                <div style="display: flex; padding: 12px; background: #f7fafc; border-radius: 8px;">
                  <strong style="color: #2d3748; min-width: 140px;">🔧 Tipo:</strong>
                  <span style="color: #4a5568;">${this.getStepTypeLabel(
                    stepType
                  )}</span>
                </div>
                
                <div style="display: flex; padding: 12px; background: #f7fafc; border-radius: 8px;">
                  <strong style="color: #2d3748; min-width: 140px;">⏱️ Tiempo:</strong>
                  <span style="color: #4a5568;">${this.formatBrewingTime(
                    stepTime
                  )}</span>
                </div>
                
                ${
                  batchNumber
                    ? `
                <div style="display: flex; padding: 12px; background: #f7fafc; border-radius: 8px;">
                  <strong style="color: #2d3748; min-width: 140px;">🏷️ Batch:</strong>
                  <span style="color: #4a5568;">#${batchNumber}</span>
                </div>
                `
                    : ""
                }
                
                <div style="display: flex; padding: 12px; background: #f7fafc; border-radius: 8px;">
                  <strong style="color: #2d3748; min-width: 140px;">🆔 Sesión:</strong>
                  <span style="color: #4a5568; font-family: monospace; font-size: 12px;">${sessionId}</span>
                </div>
              </div>
            </div>

            <div style="background: #e6fffa; border: 1px solid #81e6d9; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #234e52; margin-bottom: 15px;">
                📱 <strong>Accede al panel de administración para realizar esta acción</strong>
              </p>
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:3001"
              }/admin/recetas" 
                 style="display: inline-block; background: #1a365d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                🔗 Ir al Panel de Recetas
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px; text-align: center;">
              <p>Este es un mensaje automático del sistema de elaboración de Luna Brew House.</p>
              <p>No responder a este correo.</p>
            </div>
          </div>
        `
        );

      // Obtener emails de administradores
      const adminEmails = await this.getAdminEmails();

      if (adminEmails.length === 0) {
        console.warn(
          "⚠️ No se encontraron emails de administradores para notificación de step"
        );
        return false;
      }

      // Enviar a todos los administradores
      const results = await this.sendBulkEmails(
        adminEmails,
        subject,
        htmlContent
      );

      console.log(
        `📧 Notificación de step enviada a ${adminEmails.length} administradores`
      );
      return results;
    } catch (error) {
      console.error("❌ Error al enviar notificación de step:", error);
      throw error;
    }
  }

  /**
   * Obtiene etiqueta legible para el tipo de step
   */
  getStepTypeLabel(stepType) {
    const labels = {
      "hop-addition": "🌿 Adición de Lúpulo",
      "dry-hop": "🌿 Dry Hopping",
      "caramel-addition": "🍯 Adición de Caramelo",
      "yeast-addition": "🦠 Adición de Levadura",
      "temperature-change": "🌡️ Cambio de Temperatura",
      stirring: "🥄 Agitación",
      other: "⚙️ Otro",
    };
    return labels[stepType] || "❓ Desconocido";
  }

  /**
   * Obtiene emails de usuarios administradores
   */
  async getAdminEmails() {
    try {
      const User = require("../../models/user");
      const admins = await User.find({ role: "admin" }, "email name");
      return admins.map((admin) => ({
        email: admin.email,
        name: admin.name,
      }));
    } catch (error) {
      console.error("Error al obtener emails de administradores:", error);
      return [];
    }
  }
}

module.exports = new EmailService();
