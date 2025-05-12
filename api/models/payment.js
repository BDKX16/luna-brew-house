const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
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
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    required: false,
  },
  videoId: {
    type: String,
    required: true,
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
  userData: {
    type: Object,
    required: false,
  },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  phone: { type: String, required: false },
  address: { type: String, required: false },
  address2: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  country: { type: String, required: false },
  postalCode: { type: String, required: false },
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
