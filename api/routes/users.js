const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { checkAuth } = require("../middlewares/authentication");

//models import

const User = require("../models/user.js");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "confiplant@gmail.com",
    pass: "zzgujcwwsctyhcab",
  },
});

//POST -> req.body
//GET -> req.query

//******************
//**** A P I *******
//******************

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    var user = await User.findOne({ email: email });

    //if no email
    if (!user) {
      const response = {
        status: "error",
        error: "Invalid Credentials",
      };
      return res.status(401).json(response);
    }

    //if email and email ok
    if (bcrypt.compareSync(password, user.password)) {
      user.set("password", undefined, { strict: false });

      const token = jwt.sign({ userData: user }, process.env.TOKEN_SECRET, {
        expiresIn: 60 * 60 * 24 * 30,
      });

      user.set("isAdmin", undefined, { strict: false });

      const response = {
        status: "success",
        token: token,
        userData: user,
      };

      return res.status(200).json(response);
    } else {
      const response = {
        status: "error",
        error: "Invalid Credentials",
      };
      return res.status(401).json(response);
    }
  } catch (error) {
    console.log(error);
  }
});
//REGISTER
router.post("/register", async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const encryptedPassword = encryptPass(password);

    const newUser = {
      name: name,
      email: email,
      password: encryptedPassword,
    };
    /** 
    try {
      const info = await transporter.sendMail({
        from: '"Almengala👻" <almengala@gmail.com>', // sender address
        to: newUser.email, // list of receivers
        subject: "Confirmacion de correo ✔", // Subject line
        text:
          "Gracias por registrarte " + newUser.name ||
          "" + ", por favor confirma tu email", // plain text body
        html:
          "Gracias por registrarte " + newUser.name ||
          "" + ", por favor confirma tu email", // html body
      });
    } catch (error) {
      console.error(error);
    }
*/
    const user = await User.create(newUser);

    user.set("password", undefined, { strict: false });

    const token = jwt.sign({ userData: user }, process.env.TOKEN_SECRET, {
      expiresIn: 60 * 60 * 24 * 30,
    });

    user.set("isAdmin", undefined, { strict: false });

    const response = {
      status: "success",
      token: token,
      userData: user,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.log("ERROR - REGISTER ENDPOINT");
    console.log(error);

    const response = {
      status: "error",
      error: error,
    };

    console.log(response);

    return res.status(500).json(response);
  }
});

router.post("/recuperarpassword", async (req, res) => {
  try {
    const email = req.body.email;

    var user = await User.findOne({ email: email });

    console.log(user);
    if (user != null) {
      user.set("password", undefined, { strict: false });
      const token = jwt.sign({ userData: user }, process.env.TOKEN_SECRET, {
        expiresIn: 60 * 60 * 24 * 30,
      });

      const url = process.env.FRONT_URL + "/cambiopass?peticion=" + token;
      try {
        const info = await transporter.sendMail({
          from: '"Confi Plant 👻" <confiplant@gmail.com>', // sender address
          to: email, // list of receivers
          subject: "Reinicio de contraseña ✔", // Subject line
          text: "Para cambiar tu contraseña accede al siguiente link: " + url, // plain text body
          html: "Para cambiar tu contraseña accede al siguiente link " + url, // html body
        });
      } catch (error) {
        console.error(error);
      }

      await User.updateOne({ _id: user._id }, { confirmed: false });
      const response = {
        status: "success",
      };

      return res.status(200).json(response);
    }

    const response = {
      status: "error",
      error: "Email not found",
    };

    return res.status(404).json(response);
  } catch (error) {
    console.log("ERROR - REGISTER ENDPOINT");
    console.log(error);

    const response = {
      status: "error",
      error: error,
    };

    console.log(response);

    return res.status(500).json(response);
  }
});

router.put("/nuevapassword", async (req, res) => {
  try {
    const token = req.body.token;
    const newPassword = req.body.password;

    let userData;
    const verificacion = jwt.verify(
      token,
      process.env.TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return false;
        }

        userData = decoded.userData;

        return true;
      }
    );

    if (verificacion == false) {
      const response = {
        status: "error",
        msg: "error",
      };
      console.log(response);
      return res.status(500).json(response);
    }

    const encryptedPassword = encryptPass(newPassword);
    var user = await User.updateOne(
      { _id: userData._id },
      { password: encryptedPassword, confirmed: false }
    );

    const response = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    console.log("ERROR - REGISTER ENDPOINT");
    console.log(error);

    const response = {
      status: "error",
      error: error,
    };

    console.log(response);

    return res.status(500).json(response);
  }
});

router.put("/confirm-email", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;

    var user = await User.updateOne({ userId: userId }, { confirmed: true });

    const response = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    console.log("ERROR - REGISTER ENDPOINT");
    console.log(error);

    const response = {
      status: "error",
      error: error,
    };

    console.log(response);

    return res.status(500).json(response);
  }
});

//**********************
//**** FUNCTIONS *******
//**********************

function encryptPass(newPassword) {
  return (encryptedPassword = bcrypt.hashSync(newPassword, 10));
}

module.exports = router;
