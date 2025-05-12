const express = require("express");

const { checkAuth, checkRole } = require("../middlewares/authentication");
const router = express.Router();

// GET public configuration
router.get("/theme", async (req, res) => {
  try {
    // Logic to retrieve the public configuration
    //

    res.status(200).json();
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
