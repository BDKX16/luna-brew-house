/**
 * Servicio de Notificaciones Administrativas
 * Maneja todas las notificaciones automáticas para administradores
 */

const emailService = require("./emailService");
const User = require("../../models/user");
const { Beer } = require("../../models/products");

class AdminNotificationService {
  /**
   * Notifica cuando se crea un nuevo pedido
   */
  static async notifyNewOrder(orderData, userData) {
    try {
      const notificationData = {
        orderId: orderData.id || orderData._id,
        customerName: userData.name,
        customerEmail: userData.email,
        customerPhone: userData.phone,
        orderDate: orderData.createdAt || new Date(),
        total: orderData.total,
        items: orderData.items,
        shippingAddress: userData.address,
        specialInstructions: orderData.specialInstructions,
        urgent:
          orderData.total > 100 ||
          orderData.items.some((item) => item.quantity > 5), // Criterios de urgencia
      };

      const result = await emailService.notifyAdminNewOrder(notificationData);
      return result;
    } catch (error) {
      console.error("Error en notificación de nuevo pedido:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica cuando se crea una nueva suscripción
   */
  static async notifyNewSubscription(subscriptionData, userData) {
    try {
      const notificationData = {
        subscriptionId: subscriptionData.id,
        customerName: userData.name,
        customerEmail: userData.email,
        planName: subscriptionData.name,
        beerType: subscriptionData.beerType,
        beerName: subscriptionData.beerName,
        liters: subscriptionData.liters,
        price: subscriptionData.price,
        nextDelivery: subscriptionData.nextDelivery,
        shippingAddress: userData.address,
      };

      const result = await emailService.notifyAdminNewSubscription(
        notificationData
      );
      return result;
    } catch (error) {
      console.error("Error en notificación de nueva suscripción:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica solicitudes especiales de clientes
   */
  static async notifySpecialRequest(requestData) {
    try {
      // Determinar urgencia basada en el contenido de la solicitud
      const urgentKeywords = [
        "urgente",
        "emergencia",
        "hoy",
        "inmediato",
        "cancelar",
      ];
      const highPriorityKeywords = [
        "mañana",
        "cambiar dirección",
        "modificar",
        "problema",
      ];

      let urgency = "medium";
      const message = requestData.message?.toLowerCase() || "";

      if (urgentKeywords.some((keyword) => message.includes(keyword))) {
        urgency = "urgent";
      } else if (
        highPriorityKeywords.some((keyword) => message.includes(keyword))
      ) {
        urgency = "high";
      }

      const notificationData = {
        customerName: requestData.customerName,
        customerEmail: requestData.customerEmail,
        customerPhone: requestData.customerPhone,
        orderId: requestData.orderId,
        requestType: requestData.requestType || "Solicitud General",
        requestDate: new Date(),
        message: requestData.message,
        urgency,
        deliveryDate: requestData.deliveryDate,
        deliveryTime: requestData.deliveryTime,
        specialInstructions: requestData.specialInstructions,
      };

      const result = await emailService.notifyAdminSpecialRequest(
        notificationData
      );
      return result;
    } catch (error) {
      console.error("Error en notificación de solicitud especial:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica inventario y notifica si hay productos con stock bajo
   */
  static async checkAndNotifyLowStock() {
    try {
      const lowStockProducts = await Beer.find({
        stock: { $lte: 10 }, // Stock menor o igual a 10
        nullDate: null,
      });

      if (lowStockProducts.length === 0) {
        return { success: true, message: "No hay productos con stock bajo" };
      }

      const stockData = {
        products: lowStockProducts.map((product) => ({
          name: product.name,
          beerType: product.beerType,
          stock: product.stock,
          criticalLevel: 5,
          unit: "unidades",
        })),
      };

      const result = await emailService.notifyAdminLowStock(stockData);
      return result;
    } catch (error) {
      console.error("Error al verificar inventario:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica cuando un pago falla o es rechazado
   */
  static async notifyPaymentIssue(paymentData, orderData, userData) {
    try {
      const requestData = {
        customerName: userData.name,
        customerEmail: userData.email,
        customerPhone: userData.phone,
        orderId: orderData.id || orderData._id,
        requestType: "Problema de Pago",
        message: `Pago rechazado para el pedido #${orderData.id}. Estado: ${paymentData.status}. Cliente puede necesitar asistencia.`,
        urgency: "high",
        specialInstructions: `Monto: $${orderData.total}, Método: ${paymentData.paymentMethod}`,
      };

      const result = await this.notifySpecialRequest(requestData);
      return result;
    } catch (error) {
      console.error("Error en notificación de problema de pago:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica cuando un cliente solicita cancelación
   */
  static async notifyCancellationRequest(cancellationData) {
    try {
      const requestData = {
        customerName: cancellationData.customerName,
        customerEmail: cancellationData.customerEmail,
        customerPhone: cancellationData.customerPhone,
        orderId: cancellationData.orderId || cancellationData.subscriptionId,
        requestType:
          cancellationData.type === "subscription"
            ? "Cancelación de Suscripción"
            : "Cancelación de Pedido",
        message: `El cliente ha solicitado cancelar su ${
          cancellationData.type === "subscription" ? "suscripción" : "pedido"
        }. Razón: ${cancellationData.reason}`,
        urgency: "medium",
        specialInstructions: cancellationData.refundRequested
          ? "Cliente solicita reembolso"
          : "Sin solicitud de reembolso",
      };

      const result = await this.notifySpecialRequest(requestData);
      return result;
    } catch (error) {
      console.error("Error en notificación de cancelación:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Programar verificaciones automáticas de inventario
   */
  static setupInventoryChecks() {
    // Verificar inventario cada 6 horas
    setInterval(async () => {
      console.log("🔍 Verificando inventario automáticamente...");
      await this.checkAndNotifyLowStock();
    }, 6 * 60 * 60 * 1000); // 6 horas en milisegundos

    console.log(
      "✅ Verificaciones automáticas de inventario configuradas (cada 6 horas)"
    );
  }

  /**
   * Método para testing - simula notificaciones
   */
  static async testNotifications(adminEmail) {
    try {
      console.log("🧪 Enviando notificaciones de prueba...");

      // Test nuevo pedido
      const testOrder = {
        orderId: "TEST-001",
        customerName: "Cliente de Prueba",
        customerEmail: "test@example.com",
        customerPhone: "+1234567890",
        orderDate: new Date(),
        total: 75.5,
        items: [
          {
            name: "Luna Golden Ale",
            beerType: "golden",
            price: 15.99,
            quantity: 2,
          },
          { name: "Luna IPA", beerType: "ipa", price: 18.99, quantity: 2 },
        ],
        shippingAddress: "Calle de Prueba 123, Ciudad Test",
        urgent: true,
      };

      await emailService.notifyAdminNewOrder(testOrder);

      // Test nueva suscripción
      const testSubscription = {
        subscriptionId: "SUB-TEST-001",
        customerName: "Suscriptor de Prueba",
        customerEmail: "subscriber@example.com",
        planName: "Plan Mensual Premium",
        beerType: "ipa",
        beerName: "Luna IPA Especial",
        liters: 2,
        price: 35.99,
        nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        shippingAddress: "Avenida Suscripción 456, Ciudad Test",
      };

      await emailService.notifyAdminNewSubscription(testSubscription);

      // Test solicitud especial
      const testRequest = {
        customerName: "Cliente Especial",
        customerEmail: "special@example.com",
        customerPhone: "+1234567890",
        orderId: "ORD-123",
        message:
          "Necesito cambiar la dirección de entrega urgentemente para el pedido de mañana",
        urgency: "urgent",
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        deliveryTime: "14:00",
      };

      await emailService.notifyAdminSpecialRequest(testRequest);

      console.log("✅ Notificaciones de prueba enviadas");
      return { success: true };
    } catch (error) {
      console.error("❌ Error en notificaciones de prueba:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = AdminNotificationService;
