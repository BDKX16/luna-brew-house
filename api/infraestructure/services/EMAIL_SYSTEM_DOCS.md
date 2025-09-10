# Sistema de Notificaciones Luna Brew House 📧

## Descripción General

Sistema completo de notificaciones por email para Luna Brew House que incluye:

- ✅ Emails de bienvenida y confirmación para clientes
- ✅ Notificaciones automáticas para administradores
- ✅ Gestión de solicitudes especiales de clientes
- ✅ Alertas de bajo stock
- ✅ Plantillas HTML profesionales

## Configuración

### Variables de Entorno

```env
# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password
ADMIN_EMAIL=admin@lunabrew.com
EMAIL_FROM_NAME=Luna Brew House
```

### Configuración Gmail (Recomendado)

1. Activar autenticación de 2 factores
2. Generar contraseña de aplicación
3. Usar la contraseña de aplicación en EMAIL_PASSWORD

## Estructura del Sistema

### Servicios Principales

#### emailService.js

- **Ubicación**: `api/infraestructure/services/emailService.js`
- **Función**: Servicio principal de emails con plantillas HTML
- **Métodos**:
  - `sendWelcomeEmail()` - Email de bienvenida
  - `sendOrderConfirmation()` - Confirmación de pedido
  - `sendPaymentConfirmation()` - Confirmación de pago
  - `notifyAdminSpecialRequest()` - Notificar solicitud especial
  - `notifyAdminLowStock()` - Alertar bajo stock

#### adminNotificationService.js

- **Ubicación**: `api/infraestructure/services/adminNotificationService.js`
- **Función**: Servicio especializado en notificaciones administrativas
- **Métodos**:
  - `notifyNewOrder()` - Nuevo pedido
  - `notifyNewSubscription()` - Nueva suscripción
  - `notifySpecialRequest()` - Solicitud especial
  - `checkAndNotifyLowStock()` - Verificar inventario

### Rutas de API

#### Rutas para Clientes

**POST** `/api/customer/special-request`

```json
{
  "message": "Necesito cambiar la dirección de entrega",
  "requestType": "Cambio de Dirección",
  "deliveryDate": "2024-01-15",
  "deliveryTime": "14:00",
  "orderId": "ORD-123"
}
```

**POST** `/api/customer/change-delivery-address`

```json
{
  "orderId": "ORD-123",
  "newAddress": "Nueva dirección completa",
  "reason": "Cambio de domicilio"
}
```

**POST** `/api/customer/urgent-delivery`

```json
{
  "orderId": "ORD-123",
  "requestedDate": "2024-01-15",
  "requestedTime": "14:00",
  "reason": "Evento especial"
}
```

**POST** `/api/customer/report-issue`

```json
{
  "orderId": "ORD-123",
  "issueType": "Producto dañado",
  "description": "Una botella llegó rota"
}
```

#### Rutas Administrativas

**POST** `/api/customer/admin/check-inventory` (Solo Admin)

- Verifica inventario manualmente

**POST** `/api/customer/admin/test-notifications` (Solo Admin)

- Envía notificaciones de prueba

## Integración Automática

### Webhooks de Pago

El sistema se integra automáticamente con los webhooks de MercadoPago en `routes/payments.js`:

```javascript
// Después de confirmar pago exitoso
await AdminNotificationService.notifyNewOrder(orderData, userData);
```

### Registro de Usuarios

Integración en `routes/users.js`:

```javascript
// Después de registro exitoso
await emailService.sendWelcomeEmail(userData);
```

## Plantillas de Email

### Diseño Base

- **Responsive**: Compatible con móviles y desktop
- **Branding**: Logo y colores de Luna Brew House
- **Profesional**: Diseño limpio y moderno

### Tipos de Email

1. **Bienvenida**: Email de bienvenida para nuevos usuarios
2. **Confirmación de Pedido**: Detalles del pedido realizado
3. **Confirmación de Pago**: Confirmación de pago exitoso
4. **Notificación Admin - Nuevo Pedido**: Alerta de nuevo pedido
5. **Notificación Admin - Solicitud Especial**: Solicitud de cliente
6. **Notificación Admin - Bajo Stock**: Alerta de inventario

## Sistema de Urgencia

### Niveles de Urgencia

- **low**: Solicitudes generales
- **medium**: Problemas estándar
- **high**: Productos dañados, faltantes
- **urgent**: Entregas urgentes, emergencias

### Detección Automática

El sistema detecta urgencia basándose en palabras clave:

- "urgente", "emergency", "dañado", "roto", "faltante", "incorrecto"

## Manejo de Errores

### Estrategia de Recuperación

- Los errores de email no bloquean el flujo principal
- Logs detallados para debugging
- Respuestas de error informativas

### Logs de Sistema

```javascript
console.log("✅ Email enviado exitosamente");
console.error("❌ Error al enviar email:", error);
```

## Testing

### Endpoint de Prueba Admin

```bash
POST /api/customer/admin/test-notifications
Authorization: Bearer {admin_token}
```

### Verificación Manual de Inventario

```bash
POST /api/customer/admin/check-inventory
Authorization: Bearer {admin_token}
```

## Métricas y Monitoreo

### Información Incluida en Notificaciones

- **Timestamp**: Fecha y hora exacta
- **Datos del Cliente**: Nombre, email, teléfono
- **Detalles del Pedido**: ID, productos, montos
- **Prioridad**: Nivel de urgencia automático

### Seguimiento de Solicitudes

Cada solicitud genera un ID único:

- `REQ-{timestamp}` - Solicitudes generales
- `ADDR-{timestamp}` - Cambios de dirección
- `URG-{timestamp}` - Entregas urgentes
- `ISS-{timestamp}` - Reportes de problemas

## Mantenimiento

### Actualización de Plantillas

Las plantillas HTML están en `emailService.js` en los métodos:

- `getBaseTemplate()`
- `getAdminNewOrderTemplate()`
- `getAdminSpecialRequestTemplate()`

### Configuración de Proveedores

Soporta múltiples proveedores de email:

- Gmail (Recomendado)
- SendGrid
- Mailgun
- SMTP personalizado

## Roadmap Futuro

### Mejoras Planificadas

- [ ] Dashboard de métricas de email
- [ ] Plantillas personalizables desde admin
- [ ] Programación de emails automáticos
- [ ] Integración con WhatsApp
- [ ] Sistema de tickets para solicitudes

### Optimizaciones

- [ ] Queue de emails para alta demanda
- [ ] Retry automático en fallos
- [ ] Analytics de apertura y clicks
- [ ] Segmentación de clientes

---

## Soporte Técnico

Para modificaciones o problemas:

1. Verificar configuración de variables de entorno
2. Revisar logs en consola del servidor
3. Testear con endpoints de prueba
4. Verificar autenticación Gmail

**Estado**: ✅ Sistema completamente funcional y en producción
