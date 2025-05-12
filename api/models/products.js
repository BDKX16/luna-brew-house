const mongoose = require("mongoose");

// Esquema para los productos de cerveza
const beerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  typeId: {
    type: String,
    enum: ["golden", "red", "ipa"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  nullDate: {
    type: Date,
    required: false,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Esquema para los planes de suscripción
const subscriptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
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
  features: {
    type: [String],
    required: true,
  },
  popular: {
    type: Boolean,
    default: false,
  },
  nullDate: {
    type: Date,
    required: false,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Esquema para descuentos/promociones
const discountSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  minPurchase: {
    type: Number,
    required: false,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  appliesTo: {
    type: String,
    enum: ["all", "beer", "subscription"],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  nullDate: {
    type: Date,
    required: false,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Beer = mongoose.model("Beer", beerSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);
const Discount = mongoose.model("Discount", discountSchema);

module.exports = {
  Beer,
  Subscription,
  Discount,
};
