const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const InteractionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  type: {
    type: String,
    required: true,
    enum: ["landing", "checkout"],
  },
  state: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Interaction", InteractionSchema);
