var express = require("express");
var router = express.Router();
const { checkAuth } = require("../middlewares/authentication");
const LandingConfig = require("../models/landing-config");

//**********************
// RUTAS PÚBLICAS (para la landing)
//**********************

// Obtener configuración pública para la landing page
router.get("/public", async (req, res) => {
  try {
    const config = await LandingConfig.getActiveConfig();

    // Verificar modo mantenimiento
    if (config.maintenance.isActive) {
      const clientIP =
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.headers["x-forwarded-for"] &&
          req.headers["x-forwarded-for"].split(",")[0]) ||
        req.headers["x-real-ip"] ||
        "127.0.0.1";

      // Limpiar IP si viene con prefijo IPv6
      const cleanIP = clientIP.replace(/^::ffff:/, "");

      console.log("Client IP:", cleanIP);
      console.log("Allowed IPs:", config.maintenance.allowedIPs);

      // IPs locales comunes que siempre se permiten en desarrollo
      const localIPs = ["127.0.0.1", "localhost", "::1", "0.0.0.0"];

      const isAllowedIP =
        config.maintenance.allowedIPs.includes(cleanIP) ||
        config.maintenance.allowedIPs.includes(clientIP) ||
        localIPs.includes(cleanIP) ||
        localIPs.includes(clientIP) ||
        cleanIP.startsWith("192.168.") || // Red local común
        cleanIP.startsWith("10.") || // Red local común
        cleanIP.startsWith("172.16."); // Red local común

      console.log("Is allowed IP:", isAllowedIP);

      if (!isAllowedIP) {
        return res.status(503).json({
          status: "maintenance",
          message: config.maintenance.message,
          maintenance: true,
        });
      }
    }

    const publicConfig = config.getPublicConfig();

    res.status(200).json({
      status: "success",
      data: publicConfig,
    });
  } catch (error) {
    console.log("ERROR - GET PUBLIC CONFIG ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

// Verificar estado de mantenimiento
router.get("/maintenance-status", async (req, res) => {
  try {
    const config = await LandingConfig.getActiveConfig();

    res.status(200).json({
      status: "success",
      data: {
        maintenanceMode: config.maintenance.isActive,
        message: config.maintenance.message,
      },
    });
  } catch (error) {
    console.log("ERROR - GET MAINTENANCE STATUS ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

// Verificar IP actual para debugging
router.get("/check-ip", async (req, res) => {
  try {
    const config = await LandingConfig.getActiveConfig();

    const clientIP =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.headers["x-forwarded-for"] &&
        req.headers["x-forwarded-for"].split(",")[0]) ||
      req.headers["x-real-ip"] ||
      "127.0.0.1";

    const cleanIP = clientIP.replace(/^::ffff:/, "");
    const localIPs = ["127.0.0.1", "localhost", "::1", "0.0.0.0"];

    const isAllowedIP =
      config.maintenance.allowedIPs.includes(cleanIP) ||
      config.maintenance.allowedIPs.includes(clientIP) ||
      localIPs.includes(cleanIP) ||
      localIPs.includes(clientIP) ||
      cleanIP.startsWith("192.168.") ||
      cleanIP.startsWith("10.") ||
      cleanIP.startsWith("172.16.");

    res.status(200).json({
      status: "success",
      data: {
        clientIP: cleanIP,
        originalIP: clientIP,
        allowedIPs: config.maintenance.allowedIPs,
        isAllowed: isAllowedIP,
        maintenanceMode: config.maintenance.isActive,
        headers: {
          "x-forwarded-for": req.headers["x-forwarded-for"],
          "x-real-ip": req.headers["x-real-ip"],
        },
      },
    });
  } catch (error) {
    console.log("ERROR - GET CHECK IP ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

//**********************
// RUTAS ADMINISTRATIVAS (requieren autenticación)
//**********************

// Obtener configuración completa (solo admins)
router.get("/admin", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Acceso denegado. Se requiere rol de administrador.",
      });
    }

    const config = await LandingConfig.getActiveConfig();

    res.status(200).json({
      status: "success",
      data: config,
    });
  } catch (error) {
    console.log("ERROR - GET ADMIN CONFIG ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

// Actualizar configuración (solo admins)
router.put("/admin", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Acceso denegado. Se requiere rol de administrador.",
      });
    }

    const {
      siteName,
      tagline,
      description,
      logo,
      favicon,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage,
      canonicalUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      fontFamily,
      fontSize,
      borderRadius,
      maintenanceMode,
      maintenanceMessage,
      maintenanceAllowedIPs,
    } = req.body;

    let config = await LandingConfig.getActiveConfig();

    // Actualizar campos básicos
    if (siteName !== undefined) config.siteName = siteName;
    if (tagline !== undefined) config.tagline = tagline;
    if (description !== undefined) config.description = description;
    if (logo !== undefined) config.logo = logo;
    if (favicon !== undefined) config.favicon = favicon;

    // Actualizar SEO
    if (seoTitle !== undefined) config.seoTitle = seoTitle;
    if (seoDescription !== undefined) config.seoDescription = seoDescription;
    if (seoKeywords !== undefined) config.seoKeywords = seoKeywords;
    if (ogImage !== undefined) config.ogImage = ogImage;
    if (canonicalUrl !== undefined) config.canonicalUrl = canonicalUrl;

    // Actualizar tema
    if (primaryColor !== undefined) config.theme.primaryColor = primaryColor;
    if (secondaryColor !== undefined)
      config.theme.secondaryColor = secondaryColor;
    if (accentColor !== undefined) config.theme.accentColor = accentColor;
    if (backgroundColor !== undefined)
      config.theme.backgroundColor = backgroundColor;
    if (textColor !== undefined) config.theme.textColor = textColor;
    if (fontFamily !== undefined) config.theme.fontFamily = fontFamily;
    if (fontSize !== undefined) config.theme.fontSize = fontSize;
    if (borderRadius !== undefined) config.theme.borderRadius = borderRadius;

    // Actualizar mantenimiento
    if (maintenanceMode !== undefined)
      config.maintenance.isActive = maintenanceMode;
    if (maintenanceMessage !== undefined)
      config.maintenance.message = maintenanceMessage;
    if (maintenanceAllowedIPs !== undefined) {
      // Filtrar y limpiar IPs
      const cleanIPs = Array.isArray(maintenanceAllowedIPs)
        ? maintenanceAllowedIPs
            .filter((ip) => ip && ip.trim() !== "")
            .map((ip) => ip.trim())
        : [];
      config.maintenance.allowedIPs = cleanIPs;
    }

    // Actualizar metadatos
    config.lastUpdatedBy = req.userData._id;
    config.version = req.body.version || config.version;

    await config.save();

    res.status(200).json({
      status: "success",
      data: config,
      message: "Configuración actualizada correctamente",
    });
  } catch (error) {
    console.log("ERROR - UPDATE CONFIG ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

// Restablecer configuración a valores por defecto (solo admins)
router.post("/admin/reset", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Acceso denegado. Se requiere rol de administrador.",
      });
    }

    let config = await LandingConfig.getActiveConfig();

    // Restablecer a valores por defecto
    config.siteName = "Luna Brew House";
    config.tagline = "Cervezas Artesanales Premium";
    config.description = "Descubre nuestras cervezas artesanales únicas";
    config.logo = "";
    config.favicon = "";

    config.seoTitle = "Luna Brew House - Cervezas Artesanales Premium";
    config.seoDescription =
      "Disfruta de las mejores cervezas artesanales con entrega a domicilio y planes de suscripción personalizados.";
    config.seoKeywords =
      "cerveza artesanal, craft beer, suscripción cerveza, entrega domicilio";
    config.ogImage = "";
    config.canonicalUrl = "";

    config.theme = {
      primaryColor: "#1a365d",
      secondaryColor: "#2d5a87",
      accentColor: "#f6ad55",
      backgroundColor: "#ffffff",
      textColor: "#2d3748",
      fontFamily: "Inter",
      fontSize: "16px",
      borderRadius: "8px",
    };

    config.maintenance = {
      isActive: false,
      message: "Sitio en mantenimiento. Volvemos pronto.",
      allowedIPs: ["127.0.0.1", "localhost", "::1"],
    };

    config.lastUpdatedBy = req.userData._id;

    await config.save();

    res.status(200).json({
      status: "success",
      data: config,
      message: "Configuración restablecida a valores por defecto",
    });
  } catch (error) {
    console.log("ERROR - RESET CONFIG ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

// Exportar configuración (solo admins)
router.get("/admin/export", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Acceso denegado. Se requiere rol de administrador.",
      });
    }

    const config = await LandingConfig.getActiveConfig();

    // Crear objeto exportable (sin datos internos)
    const exportData = {
      siteName: config.siteName,
      tagline: config.tagline,
      description: config.description,
      logo: config.logo,
      favicon: config.favicon,
      seoTitle: config.seoTitle,
      seoDescription: config.seoDescription,
      seoKeywords: config.seoKeywords,
      ogImage: config.ogImage,
      canonicalUrl: config.canonicalUrl,
      primaryColor: config.theme.primaryColor,
      secondaryColor: config.theme.secondaryColor,
      accentColor: config.theme.accentColor,
      backgroundColor: config.theme.backgroundColor,
      textColor: config.theme.textColor,
      fontFamily: config.theme.fontFamily,
      fontSize: config.theme.fontSize,
      borderRadius: config.theme.borderRadius,
      maintenanceMode: config.maintenance.isActive,
      maintenanceMessage: config.maintenance.message,
      maintenanceAllowedIPs: config.maintenance.allowedIPs,
      exportDate: new Date().toISOString(),
      version: config.version,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=landing-config.json"
    );

    res.status(200).json(exportData);
  } catch (error) {
    console.log("ERROR - EXPORT CONFIG ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

// Importar configuración (solo admins)
router.post("/admin/import", checkAuth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.userData.role !== "admin") {
      return res.status(403).json({
        status: "error",
        error: "Acceso denegado. Se requiere rol de administrador.",
      });
    }

    const importData = req.body;

    // Validar que los datos requeridos estén presentes
    if (!importData.siteName) {
      return res.status(400).json({
        status: "error",
        error: "Datos de importación inválidos. Se requiere al menos siteName.",
      });
    }

    let config = await LandingConfig.getActiveConfig();

    // Actualizar con datos importados
    Object.keys(importData).forEach((key) => {
      if (
        key === "primaryColor" ||
        key === "secondaryColor" ||
        key === "accentColor" ||
        key === "backgroundColor" ||
        key === "textColor" ||
        key === "fontFamily" ||
        key === "fontSize" ||
        key === "borderRadius"
      ) {
        config.theme[key] = importData[key];
      } else if (key === "maintenanceMode") {
        config.maintenance.isActive = importData[key];
      } else if (key === "maintenanceMessage") {
        config.maintenance.message = importData[key];
      } else if (key === "maintenanceAllowedIPs") {
        config.maintenance.allowedIPs = Array.isArray(importData[key])
          ? importData[key]
          : [];
      } else if (
        key !== "exportDate" &&
        key !== "_id" &&
        config.schema.paths[key]
      ) {
        config[key] = importData[key];
      }
    });

    config.lastUpdatedBy = req.userData._id;

    await config.save();

    res.status(200).json({
      status: "success",
      data: config,
      message: "Configuración importada correctamente",
    });
  } catch (error) {
    console.log("ERROR - IMPORT CONFIG ENDPOINT");
    console.log(error);

    return res.status(500).json({
      status: "error",
      error: "Error interno del servidor",
    });
  }
});

module.exports = router;
