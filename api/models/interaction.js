const mongoose = require("mongoose");
const { create } = require("./content");

const Schema = mongoose.Schema;

const InteractionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  videoId: {
    type: Schema.Types.ObjectId,
    ref: "Content",
    required: false,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "like",
      "dislike",
      "visita",
      "visita-trailer",
      "visita-web",
      "comment",
      "share",
      "save",
      "report",
      "favorite",
    ],
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
