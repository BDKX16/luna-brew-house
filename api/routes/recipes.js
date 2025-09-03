const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Recipe = require("../models/recipe");
const { v4: uuidv4 } = require("uuid");

// Obtener todas las recetas
router.get("/recipes", async (req, res) => {
  try {
    const { status, difficulty, style, createdBy } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;
    if (style) filter.style = new RegExp(style, "i");
    if (createdBy) filter.createdBy = createdBy;

    const recipes = await Recipe.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ recipes });
  } catch (error) {
    console.error("Error al obtener recetas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener una receta por ID
router.get("/recipes/:id", async (req, res) => {
  try {
    // Buscar por id personalizado primero, luego por _id de MongoDB
    let recipe = await Recipe.findOne({ id: req.params.id }).populate(
      "createdBy",
      "name email"
    );

    // Si no se encuentra por id personalizado, intentar con _id de MongoDB
    if (!recipe && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      recipe = await Recipe.findById(req.params.id).populate(
        "createdBy",
        "name email"
      );
    }

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    res.json(recipe);
  } catch (error) {
    console.error("Error al obtener receta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear una nueva receta
router.post("/recipes", async (req, res) => {
  try {
    const recipeData = {
      ...req.body,
      id: uuidv4(),
      createdBy: req.user?.id || null,
    };

    // Asignar IDs únicos a los pasos si no los tienen
    if (recipeData.steps) {
      recipeData.steps = recipeData.steps.map((step) => ({
        ...step,
        id: step.id || uuidv4(),
      }));
    }

    const recipe = new Recipe(recipeData);
    await recipe.save();

    res.status(201).json({ recipe });
  } catch (error) {
    console.error("Error al crear receta:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Datos de receta inválidos",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar una receta
router.put("/recipes/:id", async (req, res) => {
  try {
    // Buscar por _id de MongoDB primero, luego por id personalizado
    let recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      recipe = await Recipe.findOne({ id: req.params.id });
    }

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    // Solo permitir actualización si el usuario es el creador (si hay autenticación)
    if (
      req.user &&
      recipe.createdBy &&
      recipe.createdBy.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para modificar esta receta" });
    }

    // Asignar IDs a pasos nuevos
    if (req.body.steps) {
      req.body.steps = req.body.steps.map((step) => ({
        ...step,
        id: step.id || uuidv4(),
      }));
    }

    Object.assign(recipe, req.body);
    await recipe.save();

    res.json({ recipe });
  } catch (error) {
    console.error("Error al actualizar receta:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Datos de receta inválidos",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar una receta
router.delete("/recipes/:id", async (req, res) => {
  try {
    console.log("Intentando eliminar receta con ID:", req.params.id);

    // Buscar por _id de MongoDB primero, luego por id personalizado
    let recipe = null;
    try {
      recipe = await Recipe.findById(req.params.id);
    } catch (err) {
      // Si falla findById (ID inválido), intentar con el campo id personalizado
      console.log(
        "ID no es un ObjectId válido, buscando por campo id personalizado"
      );
    }

    if (!recipe) {
      recipe = await Recipe.findOne({ id: req.params.id });
    }

    console.log("Receta encontrada:", !!recipe);

    if (!recipe) {
      console.log("Receta no encontrada en la base de datos");
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    // Eliminar la receta usando el método apropiado
    let deleteResult;
    try {
      if (recipe._id.toString() === req.params.id) {
        deleteResult = await Recipe.findByIdAndDelete(req.params.id);
      } else {
        deleteResult = await Recipe.deleteOne({ id: req.params.id });
      }
    } catch (err) {
      // Si falla findByIdAndDelete, usar deleteOne
      deleteResult = await Recipe.deleteOne({ _id: recipe._id });
    }

    console.log("Resultado de eliminación:", deleteResult);

    res.json({
      success: true,
      message: "Receta eliminada correctamente",
      data: { deletedId: req.params.id },
    });
  } catch (error) {
    console.error("Error al eliminar receta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// === RUTAS PARA SESIONES DE ELABORACIÓN ===

// Iniciar una nueva sesión de elaboración
router.post("/recipes/:id/start", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    // Verificar si ya hay una sesión activa usando el nuevo método
    if (recipe.hasActiveSession()) {
      const activeSession = recipe.getActiveSession();
      return res.status(400).json({
        error: "Ya hay una sesión de elaboración activa",
        activeSession: {
          sessionId: activeSession.sessionId,
          status: activeSession.status,
          isRunning: activeSession.isRunning,
          isPaused: activeSession.isPaused,
          startDate: activeSession.startDate,
          pausedAt: activeSession.pausedAt,
        },
      });
    }

    const sessionId = recipe.startBrewingSession();
    await recipe.save();

    res.json({
      message: "Sesión de elaboración iniciada",
      sessionId,
      session: recipe.getCurrentSession(),
    });
  } catch (error) {
    console.error("Error al iniciar sesión de elaboración:", error);

    if (error.message.includes("Ya hay una sesión")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Pausar la sesión actual
router.post("/recipes/:id/pause", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    const activeSession = recipe.getActiveSession();
    if (!activeSession) {
      return res
        .status(400)
        .json({ error: "No hay sesión activa para pausar" });
    }

    if (!activeSession.isRunning) {
      return res.status(400).json({ error: "La sesión ya está pausada" });
    }

    // Actualizar currentSession si es necesario
    if (recipe.currentSession !== activeSession.sessionId) {
      recipe.currentSession = activeSession.sessionId;
    }

    recipe.pauseCurrentSession();
    await recipe.save();

    res.json({
      message: "Sesión pausada",
      session: recipe.getCurrentSession(),
    });
  } catch (error) {
    console.error("Error al pausar sesión:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Reanudar la sesión actual
router.post("/recipes/:id/resume", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    const activeSession = recipe.getActiveSession();
    if (!activeSession) {
      return res
        .status(400)
        .json({ error: "No hay sesión activa para reanudar" });
    }

    if (!activeSession.isPaused) {
      return res.status(400).json({ error: "La sesión no está pausada" });
    }

    // Actualizar currentSession si es necesario
    if (recipe.currentSession !== activeSession.sessionId) {
      recipe.currentSession = activeSession.sessionId;
    }

    recipe.resumeCurrentSession();
    await recipe.save();

    res.json({
      message: "Sesión reanudada",
      session: recipe.getCurrentSession(),
    });
  } catch (error) {
    console.error("Error al reanudar sesión:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar tiempo actual de la sesión
router.patch("/recipes/:id/time", async (req, res) => {
  try {
    const { currentTime } = req.body;

    if (typeof currentTime !== "number") {
      return res.status(400).json({ error: "currentTime debe ser un número" });
    }

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    if (!recipe.currentSession) {
      return res.status(400).json({ error: "No hay sesión activa" });
    }

    const session = recipe.getCurrentSession();
    session.currentTime = currentTime;
    await recipe.save();

    res.json({
      message: "Tiempo actualizado",
      session: recipe.getCurrentSession(),
    });
  } catch (error) {
    console.error("Error al actualizar tiempo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar mediciones de gravedad y ABV
router.patch("/recipes/:id/gravity", async (req, res) => {
  try {
    const {
      originalGravity,
      finalGravity,
      calculatedABV,
      batchNumber,
      batchLiters,
      batchNotes,
    } = req.body;

    // Validar tipos de datos
    if (originalGravity !== undefined && typeof originalGravity !== "number") {
      return res
        .status(400)
        .json({ error: "originalGravity debe ser un número" });
    }
    if (finalGravity !== undefined && typeof finalGravity !== "number") {
      return res.status(400).json({ error: "finalGravity debe ser un número" });
    }
    if (calculatedABV !== undefined && typeof calculatedABV !== "number") {
      return res
        .status(400)
        .json({ error: "calculatedABV debe ser un número" });
    }
    if (batchLiters !== undefined && typeof batchLiters !== "number") {
      return res.status(400).json({ error: "batchLiters debe ser un número" });
    }

    // Validar rangos
    if (
      originalGravity !== undefined &&
      (originalGravity < 1.0 || originalGravity > 1.2)
    ) {
      return res
        .status(400)
        .json({ error: "originalGravity debe estar entre 1.000 y 1.200" });
    }
    if (
      finalGravity !== undefined &&
      (finalGravity < 0.99 || finalGravity > 1.1)
    ) {
      return res
        .status(400)
        .json({ error: "finalGravity debe estar entre 0.990 y 1.100" });
    }
    if (batchLiters !== undefined && (batchLiters <= 0 || batchLiters > 1000)) {
      return res
        .status(400)
        .json({ error: "batchLiters debe estar entre 0 y 1000" });
    }

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    // Buscar la sesión activa
    const activeSession = recipe.getActiveSession();
    if (!activeSession) {
      return res.status(400).json({
        error: "No hay sesión de brewing activa para actualizar las mediciones",
      });
    }

    // Actualizar valores en la sesión activa
    if (originalGravity !== undefined) {
      activeSession.originalGravity = originalGravity;
    }
    if (finalGravity !== undefined) {
      activeSession.finalGravity = finalGravity;
    }
    if (calculatedABV !== undefined) {
      activeSession.calculatedABV = calculatedABV;
    }
    if (batchNumber !== undefined) {
      activeSession.batchNumber = batchNumber;
    }
    if (batchLiters !== undefined) {
      activeSession.batchLiters = batchLiters;
    }
    if (batchNotes !== undefined) {
      activeSession.batchNotes = batchNotes;
    }

    await recipe.save();

    res.json({
      message: "Mediciones de gravedad actualizadas en la sesión",
      session: {
        sessionId: activeSession.sessionId,
        originalGravity: activeSession.originalGravity,
        finalGravity: activeSession.finalGravity,
        calculatedABV: activeSession.calculatedABV,
        batchNumber: activeSession.batchNumber,
        batchLiters: activeSession.batchLiters,
        batchNotes: activeSession.batchNotes,
      },
    });
  } catch (error) {
    console.error("Error al actualizar mediciones de gravedad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Marcar paso como completado
router.post("/recipes/:id/steps/:stepId/complete", async (req, res) => {
  try {
    const { stepId } = req.params;

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    if (!recipe.currentSession) {
      return res.status(400).json({ error: "No hay sesión activa" });
    }

    // Verificar que el paso existe
    const step = recipe.steps.find((s) => s.id === stepId);
    if (!step) {
      return res.status(404).json({ error: "Paso no encontrado" });
    }

    recipe.completeStep(stepId);
    await recipe.save();

    res.json({
      message: "Paso marcado como completado",
      step: step,
      session: recipe.getCurrentSession(),
    });
  } catch (error) {
    console.error("Error al completar paso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Desmarcar paso como completado
router.delete("/recipes/:id/steps/:stepId/complete", async (req, res) => {
  try {
    const { stepId } = req.params;

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    if (!recipe.currentSession) {
      return res.status(400).json({ error: "No hay sesión activa" });
    }

    // Verificar que el paso existe
    const step = recipe.steps.find((s) => s.id === stepId);
    if (!step) {
      return res.status(404).json({ error: "Paso no encontrado" });
    }

    recipe.uncompleteStep(stepId);
    await recipe.save();

    res.json({
      message: "Paso desmarcado como completado",
      step: step,
      session: recipe.getCurrentSession(),
    });
  } catch (error) {
    console.error("Error al descompletar paso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Finalizar sesión de elaboración
router.post("/recipes/:id/complete", async (req, res) => {
  try {
    const { status = "completed" } = req.body;

    if (!["completed", "fermenting", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Estado final inválido" });
    }

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    if (!recipe.currentSession) {
      return res
        .status(400)
        .json({ error: "No hay sesión activa para finalizar" });
    }

    // Encontrar la sesión ANTES de finalizarla
    const currentSession = recipe.brewingSessions.find(
      (s) => s.sessionId === recipe.currentSession
    );

    recipe.endCurrentSession(status);
    await recipe.save();

    res.json({
      message: `Sesión finalizada con estado: ${status}`,
      session: currentSession,
    });
  } catch (error) {
    console.error("Error al finalizar sesión:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener estado actual de elaboración
router.get("/recipes/:id/status", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    const activeSession = recipe.getActiveSession();
    const hasActiveSession = recipe.hasActiveSession();

    res.json({
      hasActiveSession,
      activeSession: activeSession
        ? {
            sessionId: activeSession.sessionId,
            status: activeSession.status,
            isRunning: activeSession.isRunning,
            isPaused: activeSession.isPaused,
            startDate: activeSession.startDate,
            pausedAt: activeSession.pausedAt,
            currentTime: activeSession.currentTime,
            completedSteps: activeSession.completedSteps,
            fermentationStartDate: activeSession.fermentationStartDate,
            originalGravity: activeSession.originalGravity,
            finalGravity: activeSession.finalGravity,
            calculatedABV: activeSession.calculatedABV,
            batchNumber: activeSession.batchNumber,
            batchLiters: activeSession.batchLiters,
            batchNotes: activeSession.batchNotes,
            notes: activeSession.notes,
          }
        : null,
      currentSession: recipe.getCurrentSession(),
      completedSteps: activeSession?.completedSteps || [],
      totalSessions: recipe.brewingSessions.length,
    });
  } catch (error) {
    console.error("Error al obtener estado de elaboración:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener historial de sesiones
router.get("/recipes/:id/history", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    res.json({
      sessions: recipe.brewingSessions
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .map((session) => ({
          ...session.toObject(),
          recipe: {
            steps: recipe.steps,
            fermentationDays: recipe.fermentationDays,
          },
          recipeName: recipe.name,
          recipeStyle: recipe.style,
          recipeId: recipe.id,
        })),
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// === RUTAS PARA GESTIÓN DE PASOS ===

// Agregar un nuevo paso a una receta
router.post("/recipes/:id/steps", async (req, res) => {
  try {
    const { time, type, description, amount, temperature } = req.body;

    if ((!time && time !== 0) || !type || !description) {
      return res.status(400).json({
        error: "time, type y description son requeridos",
      });
    }

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    const newStep = {
      id: uuidv4(),
      time: Number(time),
      type,
      description,
      amount: amount || undefined,
      temperature: temperature ? Number(temperature) : undefined,
    };

    recipe.steps.push(newStep);
    await recipe.save();

    res.status(201).json({
      message: "Paso agregado correctamente",
      step: newStep,
      recipe: recipe,
    });
  } catch (error) {
    console.error("Error al agregar paso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar un paso existente
router.put("/recipes/:id/steps/:stepId", async (req, res) => {
  try {
    const { stepId } = req.params;
    const { time, type, description, amount, temperature } = req.body;

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    const stepIndex = recipe.steps.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) {
      return res.status(404).json({ error: "Paso no encontrado" });
    }

    // Actualizar campos si están presentes
    if (time !== undefined) recipe.steps[stepIndex].time = Number(time);
    if (type) recipe.steps[stepIndex].type = type;
    if (description) recipe.steps[stepIndex].description = description;
    if (amount !== undefined) recipe.steps[stepIndex].amount = amount;
    if (temperature !== undefined)
      recipe.steps[stepIndex].temperature = temperature
        ? Number(temperature)
        : undefined;

    await recipe.save();

    res.json({
      message: "Paso actualizado correctamente",
      step: recipe.steps[stepIndex],
      recipe: recipe,
    });
  } catch (error) {
    console.error("Error al actualizar paso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar un paso de una receta
router.delete("/recipes/:id/steps/:stepId", async (req, res) => {
  try {
    const { stepId } = req.params;

    const recipe = await Recipe.findOne({ id: req.params.id });

    if (!recipe) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    const stepIndex = recipe.steps.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) {
      return res.status(404).json({ error: "Paso no encontrado" });
    }

    recipe.steps.splice(stepIndex, 1);
    await recipe.save();

    res.json({
      message: "Paso eliminado correctamente",
      recipe: recipe,
    });
  } catch (error) {
    console.error("Error al eliminar paso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener historial de todas las sesiones de brewing
router.get("/brewing-sessions", async (req, res) => {
  try {
    // Buscar todas las recetas que tengan sesiones de brewing
    const recipes = await Recipe.find({
      "brewingSessions.0": { $exists: true },
    }).populate("createdBy", "name email");

    // Extraer todas las sesiones y agregar información de la receta
    const allSessions = [];

    recipes.forEach((recipe) => {
      if (recipe.brewingSessions && recipe.brewingSessions.length > 0) {
        recipe.brewingSessions.forEach((session) => {
          allSessions.push({
            sessionId: session.sessionId,
            recipeId: recipe._id.toString(),
            recipeName: recipe.name,
            recipeStyle: recipe.style,
            startDate: session.startDate,
            endDate: session.fermentationStartDate || null,
            currentTime: session.currentTime || 0,
            isRunning: session.isRunning || false,
            isPaused: session.isPaused || false,
            status: session.status || "not-started",
            batchNumber: session.batchNumber || null,
            originalGravity: session.originalGravity || null,
            finalGravity: session.finalGravity || null,
            calculatedABV: session.calculatedABV || null,
            notes: session.notes || null,
            batchNotes: session.batchNotes || null,
            packagingDate: session.packagingDate || null,
            batchLiters: session.batchLiters || null,
            completedSteps: session.completedSteps || [],
            recipe: {
              steps: recipe.steps,
              fermentationDays: recipe.fermentationDays,
              mashTime: recipe.mashTime,
              boilTime: recipe.boilTime,
            },
          });
        });
      }
    });

    // Ordenar por fecha de inicio (más reciente primero)
    allSessions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    res.json({
      sessions: allSessions,
      total: allSessions.length,
    });
  } catch (error) {
    console.error("Error al obtener sesiones de brewing:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar una sesión de brewing
router.delete("/brewing-sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Buscar la receta que contiene esta sesión de brewing
    const recipe = await Recipe.findOne({
      "brewingSessions.sessionId": sessionId,
    });

    if (!recipe) {
      return res.status(404).json({ error: "Sesión de brewing no encontrada" });
    }

    // Filtrar la sesión que se quiere eliminar
    const originalLength = recipe.brewingSessions.length;
    recipe.brewingSessions = recipe.brewingSessions.filter(
      (session) => session.sessionId !== sessionId
    );

    // Verificar que se eliminó algo
    if (recipe.brewingSessions.length === originalLength) {
      return res.status(404).json({ error: "Sesión de brewing no encontrada" });
    }

    // Guardar los cambios
    await recipe.save();

    res.json({
      message: "Sesión de brewing eliminada exitosamente",
      data: { deletedSessionId: sessionId },
    });
  } catch (error) {
    console.error("Error al eliminar sesión de brewing:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar fecha de envasado de una sesión
router.patch("/brewing-sessions/:sessionId/packaging", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { packagingDate } = req.body;

    // Buscar la receta que contiene esta sesión de brewing
    const recipe = await Recipe.findOne({
      "brewingSessions.sessionId": sessionId,
    });

    if (!recipe) {
      return res.status(404).json({ error: "Sesión de brewing no encontrada" });
    }

    // Encontrar y actualizar la sesión específica
    const session = recipe.brewingSessions.find(
      (s) => s.sessionId === sessionId
    );
    if (!session) {
      return res.status(404).json({ error: "Sesión de brewing no encontrada" });
    }

    // Actualizar la fecha de envasado
    session.packagingDate = packagingDate;

    // Guardar los cambios
    await recipe.save();

    res.json({
      message: "Fecha de envasado actualizada exitosamente",
      data: {
        sessionId,
        packagingDate,
      },
    });
  } catch (error) {
    console.error("Error al actualizar fecha de envasado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ===== RUTAS PARA PASOS PERSONALIZADOS DE SESIÓN =====

// Agregar paso personalizado a una sesión específica
router.post(
  "/recipes/:recipeId/brewing-sessions/:sessionId/custom-steps",
  async (req, res) => {
    try {
      const { recipeId, sessionId } = req.params;
      const { time, type, description, amount, temperature } = req.body;

      if ((!time && time !== 0) || !type || !description) {
        return res.status(400).json({
          error: "time, type y description son requeridos",
        });
      }

      // Buscar la receta por ID
      let recipe = await Recipe.findOne({ id: recipeId });

      // Si no se encuentra por id personalizado, intentar con _id de MongoDB
      if (!recipe && recipeId.match(/^[0-9a-fA-F]{24}$/)) {
        recipe = await Recipe.findById(recipeId);
      }

      if (!recipe) {
        return res.status(404).json({ error: "Receta no encontrada" });
      }

      // Verificar que la sesión existe en esta receta
      const session = recipe.brewingSessions.find(
        (s) => s.sessionId === sessionId
      );
      if (!session) {
        return res
          .status(404)
          .json({ error: "Sesión no encontrada en esta receta" });
      }

      // Usar el método del modelo para agregar el paso personalizado
      const customStep = recipe.addCustomStepToSession(sessionId, {
        time,
        type,
        description,
        amount,
        temperature,
      });

      await recipe.save();

      res.status(201).json({
        message: "Paso personalizado agregado exitosamente",
        step: customStep,
      });
    } catch (error) {
      console.error("Error al agregar paso personalizado:", error);
      res
        .status(500)
        .json({ error: error.message || "Error interno del servidor" });
    }
  }
);

// Editar paso personalizado de una sesión específica
router.put(
  "/recipes/:recipeId/brewing-sessions/:sessionId/custom-steps/:stepId",
  async (req, res) => {
    try {
      const { recipeId, sessionId, stepId } = req.params;
      const { time, type, description, amount, temperature } = req.body;

      // Buscar la receta por ID
      let recipe = await Recipe.findOne({ id: recipeId });

      // Si no se encuentra por id personalizado, intentar con _id de MongoDB
      if (!recipe && recipeId.match(/^[0-9a-fA-F]{24}$/)) {
        recipe = await Recipe.findById(recipeId);
      }

      if (!recipe) {
        return res.status(404).json({ error: "Receta no encontrada" });
      }

      // Verificar que la sesión existe en esta receta
      const session = recipe.brewingSessions.find(
        (s) => s.sessionId === sessionId
      );
      if (!session) {
        return res
          .status(404)
          .json({ error: "Sesión no encontrada en esta receta" });
      }

      // Usar el método del modelo para actualizar el paso personalizado
      const updatedStep = recipe.updateCustomStepInSession(sessionId, stepId, {
        time,
        type,
        description,
        amount,
        temperature,
      });

      await recipe.save();

      res.json({
        message: "Paso personalizado actualizado exitosamente",
        step: updatedStep,
      });
    } catch (error) {
      console.error("Error al actualizar paso personalizado:", error);
      res
        .status(500)
        .json({ error: error.message || "Error interno del servidor" });
    }
  }
);

// Eliminar paso personalizado de una sesión específica
router.delete(
  "/recipes/:recipeId/brewing-sessions/:sessionId/custom-steps/:stepId",
  async (req, res) => {
    try {
      const { recipeId, sessionId, stepId } = req.params;

      // Buscar la receta por ID
      let recipe = await Recipe.findOne({ id: recipeId });

      // Si no se encuentra por id personalizado, intentar con _id de MongoDB
      if (!recipe && recipeId.match(/^[0-9a-fA-F]{24}$/)) {
        recipe = await Recipe.findById(recipeId);
      }

      if (!recipe) {
        return res.status(404).json({ error: "Receta no encontrada" });
      }

      // Verificar que la sesión existe en esta receta
      const session = recipe.brewingSessions.find(
        (s) => s.sessionId === sessionId
      );
      if (!session) {
        return res
          .status(404)
          .json({ error: "Sesión no encontrada en esta receta" });
      }

      // Usar el método del modelo para eliminar el paso personalizado
      recipe.removeCustomStepFromSession(sessionId, stepId);

      await recipe.save();

      res.json({
        message: "Paso personalizado eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar paso personalizado:", error);
      res
        .status(500)
        .json({ error: error.message || "Error interno del servidor" });
    }
  }
);

module.exports = router;
