const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: [true] },
  email: { type: String, required: [true], unique: true },
  password: { type: String, required: [true] },
  confirmed: { type: Boolean, required: [true], default: false },
  role: { type: String, required: [true], default: "user" },
  nullDate: { type: Date, required: false, default: null },
  createdAt: { type: Date, required: true, default: Date.now },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  phone: { type: String, required: false },
  address: { type: String, required: false },
  address2: { type: String, required: false },
});

//Validator
userSchema.plugin(uniqueValidator, { message: "Error, email already exists." });

// convert to model
const User = mongoose.model("User", userSchema);

module.exports = User;
