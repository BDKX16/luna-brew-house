const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { checkAuth } = require("../middlewares/authentication");

//models import
const User = require("../models/user.js");

// Email service import
const emailService = require("../infraestructure/services/emailService");
const adminNotificationService = require("../infraestructure/services/adminNotificationService");

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
    const phone = req.body.phone;
    const address = req.body.address;

    const encryptedPassword = encryptPass(password);

    const newUser = {
      name: name,
      email: email,
      password: encryptedPassword,
      phone: phone,
      address: address,
    };

    // Crear el usuario en la base de datos
    const user = await User.create(newUser);

    // Enviar email de bienvenida
    try {
      await emailService.sendWelcomeEmail(user.email, {
        name: user.name,
      });
      console.log(`✅ Email de bienvenida enviado a ${user.email}`);
    } catch (emailError) {
      console.error(
        `❌ Error al enviar email de bienvenida a ${user.email}:`,
        emailError
      );
      // No fallar el registro si el email falla
    }

    // Notificar a administradores sobre nuevo usuario
    try {
      await adminNotificationService.notifyNewUser({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      });
      console.log(`📧 Notificación de nuevo usuario enviada a administradores`);
    } catch (notificationError) {
      console.error(
        `❌ Error al notificar nuevo usuario a administradores:`,
        notificationError
      );
      // No fallar el registro si la notificación falla
    }

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

    // Manejo específico para email duplicado
    if (error.code === 11000 || error.name === "MongoServerError") {
      if (error.keyPattern && error.keyPattern.email) {
        const response = {
          status: "error",
          message: "Email already exists",
          error: "Este email ya está registrado",
        };
        return res.status(409).json(response);
      }
    }

    // Manejo para errores de validación de mongoose
    if (error.name === "ValidationError") {
      const response = {
        status: "error",
        message: "Validation error",
        error: "Datos inválidos. Revisa todos los campos.",
      };
      return res.status(400).json(response);
    }

    // Error genérico del servidor
    const response = {
      status: "error",
      message: "Internal server error",
      error: "Error del servidor. Intenta de nuevo.",
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

// Actualizar perfil del usuario autenticado
router.put("/users/profile", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const { name, email, phone, address, birthDate } = req.body;
    console.log(req.body);
    // Verificar si el email ya existe (si se está cambiando)
    if (email && email !== req.userData.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          status: "error",
          message: "El email ya está en uso por otro usuario",
        });
      }
    }

    // Actualizar los campos del usuario
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (birthDate) updateData.birthDate = birthDate;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Perfil actualizado exitosamente",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

// Obtener pedidos del usuario actual
router.get("/users/orders", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const Order = require("../models/order.js");

    const orders = await Order.find({ "customer.userId": userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limitar a los últimos 50 pedidos

    res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

// Obtener un pedido específico del usuario por ID
router.get("/users/orders/:orderId", checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
    const orderId = req.params.orderId;
    const Order = require("../models/order.js");

    const order = await Order.findOne({
      $or: [
        { id: orderId, "customer.userId": userId },
        { _id: orderId, "customer.userId": userId },
      ],
      nullDate: null,
    });

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Pedido no encontrado",
      });
    }

    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching user order:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

// Actualizar horario de entrega de un pedido del usuario
router.patch(
  "/users/orders/:orderId/delivery-time",
  checkAuth,
  async (req, res) => {
    try {
      const userId = req.userData._id;
      const orderId = req.params.orderId;
      const { deliveryTime } = req.body;
      const Order = require("../models/order.js");

      // Validar datos de entrega
      if (!deliveryTime || !deliveryTime.date || !deliveryTime.timeRange) {
        return res.status(400).json({
          status: "error",
          message:
            "Datos de entrega no válidos. Se requiere fecha y rango horario.",
        });
      }

      // Buscar el pedido del usuario
      const order = await Order.findOne({
        $or: [
          { id: orderId, "customer.userId": userId },
          { _id: orderId, "customer.userId": userId },
        ],
        nullDate: null,
      });

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Pedido no encontrado",
        });
      }

      // Verificar que el pedido permita cambios de horario
      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({
          status: "error",
          message: `No se puede modificar la entrega de un pedido ${
            order.status === "delivered" ? "ya entregado" : "cancelado"
          }`,
        });
      }

      // Verificar si ya tiene un horario programado y está muy cerca de la entrega
      if (
        order.deliveryTime &&
        order.deliveryTime.date &&
        order.deliveryTime.timeRange
      ) {
        const deliveryDate = new Date(order.deliveryTime.date);
        const [startHour] = order.deliveryTime.timeRange
          .split("-")[0]
          .split(":");
        deliveryDate.setHours(parseInt(startHour), 0, 0, 0);

        const now = new Date();
        const hoursDifference =
          (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDifference <= 1 && hoursDifference > 0) {
          return res.status(400).json({
            status: "error",
            message:
              "No se puede cambiar el horario de entrega cuando faltan menos de 1 hora para la entrega programada",
          });
        }
      }

      // Validar que el nuevo horario no esté muy cerca en el tiempo
      const newDeliveryDate = new Date(deliveryTime.date);
      const [newStartHour] = deliveryTime.timeRange.split("-")[0].split(":");
      newDeliveryDate.setHours(parseInt(newStartHour), 0, 0, 0);

      const now = new Date();
      const newHoursDifference =
        (newDeliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (newHoursDifference <= 1) {
        return res.status(400).json({
          status: "error",
          message:
            "No se puede programar una entrega con menos de 1 hora de anticipación",
        });
      }

      // Actualizar información de entrega
      order.deliveryTime = deliveryTime;
      order.customerSelectedTime = true; // Indicar que el cliente ha seleccionado la hora

      await order.save();

      res.status(200).json({
        status: "success",
        message: "Horario de entrega actualizado con éxito",
        data: order,
      });
    } catch (error) {
      console.error("Error updating delivery time:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }
);

//**********************
//**** ADMIN ROUTES ****
//**********************

// Obtener todos los usuarios (solo admins)
router.get("/admin/users", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Access denied. Admin role required.",
      });
    }

    const users = await User.find({}, "-password").sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.log("ERROR - GET ALL USERS ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Obtener pedidos de un usuario específico
router.get("/admin/users/:userId/orders", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Access denied. Admin role required.",
      });
    }

    const { userId } = req.params;
    const Order = require("../models/order.js");

    const orders = await Order.find({ "customer.userId": userId }).sort({
      date: -1,
    });

    res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (error) {
    console.log("ERROR - GET USER ORDERS ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Actualizar estado de un usuario
router.put("/admin/users/:userId/status", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Access denied. Admin role required.",
      });
    }

    const { userId } = req.params;
    const { confirmed, role } = req.body;

    const updateData = {};
    if (confirmed !== undefined) updateData.confirmed = confirmed;
    if (role !== undefined) updateData.role = role;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password",
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        error: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.log("ERROR - UPDATE USER STATUS ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Eliminar usuario (solo admins)
router.delete("/admin/users/:userId", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Access denied. Admin role required.",
      });
    }

    const { userId } = req.params;

    // No permitir que un admin se elimine a sí mismo
    if (req.userData._id === userId) {
      return res.status(400).json({
        status: "error",
        error: "Cannot delete your own account",
      });
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        error: "User not found",
      });
    }

    // No permitir eliminar otros admins
    if (user.role === "admin") {
      return res.status(400).json({
        status: "error",
        error: "Cannot delete admin users",
      });
    }

    // Eliminar el usuario
    await User.findByIdAndDelete(userId);

    // Opcional: También eliminar datos relacionados (pedidos, suscripciones, etc.)
    const Order = require("../models/order.js");
    const UserSubscription = require("../models/subscription.js");

    // Marcar pedidos como cancelados en lugar de eliminarlos
    await Order.updateMany(
      { "customer.userId": userId },
      { status: "cancelled" }
    );

    // Cancelar suscripciones
    await UserSubscription.updateMany(
      { userId: userId },
      { status: "cancelled" }
    );

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log("ERROR - DELETE USER ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

//**********************
//**** FUNCTIONS *******
//**********************

function encryptPass(newPassword) {
  return (encryptedPassword = bcrypt.hashSync(newPassword, 10));
}

module.exports = router;
