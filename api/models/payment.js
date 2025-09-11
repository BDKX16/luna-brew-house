const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  netAmount: {
    type: Number,
    required: false,
  },
  currency: {
    type: String,
    required: true,
    default: "ARS",
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["mercadopago", "paypal", "transfer", "cash"],
  },
  paymentId: {
    type: String,
    required: false,
  },
  preferenceId: {
    type: String,
    required: false,
  },
  // Información del producto/servicio
  items: [
    {
      id: String,
      name: String,
      type: {
        type: String,
        enum: ["beer", "subscription", "shipping"],
        required: true,
      },
      quantity: Number,
      price: Number,
    },
  ],
  // Información de descuento
  discountCode: {
    type: String,
    required: false,
  },
  discountAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  nullDate: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "completed",
      "failed",
      "approved",
      "accredited",
      "cancelled",
      "rejected",
      "authorized",
      "in_process",
      "in_mediation",
      "refunded",
      "charged_back",
    ],
    default: "pending",
  },
  preferenceUrl: {
    type: String,
    required: false,
  },
  // Información del cliente
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
  },
  // Metadatos adicionales
  metadata: {
    type: Object,
    required: false,
  },
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
