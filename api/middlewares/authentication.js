const jwt = require("jsonwebtoken");

let checkAuth = (req, res, next) => {
  let token = req.get("token");

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log("ERROR JWT");
      return res.status(401).json({
        status: "error",
        error: err,
      });
    }

    req.userData = decoded.userData;

    next();
  });
};

let checkRole = (roles) => {
  if (typeof roles === "string") {
    roles = [roles]; // Convert the string to an array
  }
  return (req, res, next) => {
    if (req.userData.confirmed == true && !roles.includes(req.userData.role)) {
      console.log("ERROR ROLE");
      return res.status(401).json({
        status: "error",
        error: "Unauthorized",
      });
    }

    next();
  };
};

module.exports = { checkAuth, checkRole };
