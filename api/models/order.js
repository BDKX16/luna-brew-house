const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Esquema para items dentro de una orden
const orderItemSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

// Esquema para tiempo de entrega
const deliveryTimeSchema = new Schema({
  date: {
    type: String,
    required: true,
  },
  timeRange: {
    type: String,
    required: true,
  },
});

// Esquema principal de orden/pedido
const orderSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  total: {
    type: Number,
    required: true,
  },
  items: [orderItemSchema],
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  deliveryTime: {
    type: deliveryTimeSchema,
    required: false,
  },
  customerSelectedTime: {
    type: Boolean,
    default: false,
  },
  trackingSteps: [
    {
      status: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      current: {
        type: Boolean,
        default: false,
      },
    },
  ],
  discountCode: {
    type: String,
    required: false,
  },
  discountAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  nullDate: {
    type: Date,
    required: false,
    default: null,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
