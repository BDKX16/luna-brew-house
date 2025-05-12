const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Esquema para historiales de entregas de suscripción
const deliveryHistorySchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["delivered", "pending", "processing"],
    default: "pending",
  },
  orderId: {
    type: String,
    required: false,
  },
});

// Esquema para suscripciones activas de usuarios
const userSubscriptionSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscriptionId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  beerType: {
    type: String,
    enum: ["golden", "red", "ipa"],
    required: true,
  },
  beerName: {
    type: String,
    required: true,
  },
  liters: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "paused", "cancelled"],
    default: "active",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  nextDelivery: {
    type: Date,
    required: true,
  },
  deliveries: [deliveryHistorySchema],
  billingInfo: {
    type: Object,
    required: false,
  },
  nullDate: {
    type: Date,
    required: false,
    default: null,
  },
});

// Índices para optimizar búsquedas comunes
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ nextDelivery: 1 });

const UserSubscription = mongoose.model(
  "UserSubscription",
  userSubscriptionSchema
);
module.exports = UserSubscription;
