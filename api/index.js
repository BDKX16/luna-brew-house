//requires
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const colors = require("colors");

require("dotenv").config();

//instances
const app = express();

//express config
app.use(morgan("tiny"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors());

//express
app.use("/api", require("./routes/users.js"));
app.use("/api", require("./routes/products.js"));
app.use("/api", require("./routes/payments.js"));
app.use("/api", require("./routes/subscriptions.js"));
app.use("/api/landing", require("./routes/landing-config.js"));
app.use("/api/admin", require("./routes/recipes.js"));
app.use("/api/admin", require("./routes/admin-payments.js"));
app.use("/api/admin", require("./routes/admin-products.js"));
app.use("/api/admin", require("./routes/configuration.js"));
app.use("/api/admin/emails", require("./routes/admin-emails.js"));

module.exports = app;

//listener
app.listen(process.env.API_PORT, () => {
  console.log("API server listening on port " + process.env.API_PORT);
});

//Mongo Connection
const mongoUserName = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;
const mongoDatabase = process.env.MONGO_DATABASE;

var uri =
  "mongodb://" +
  mongoUserName +
  ":" +
  mongoPassword +
  "@" +
  mongoHost +
  ":" +
  mongoPort +
  "/" +
  mongoDatabase +
  "?authSource=admin";

console.log(uri);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: "admin",
};

mongoose.connect(uri, options).then(
  () => {
    console.log("\n");
    console.log("*******************************".green);
    console.log("✔ Mongo Successfully Connected!".green);
    console.log("*******************************".green);
    console.log("\n");
  },
  (err) => {
    console.log("\n");
    console.log("*******************************".red);
    console.log("    Mongo Connection Failed    ".red);
    console.log("*******************************".red);
    console.log("\n");
    console.log(err);
  }
);
