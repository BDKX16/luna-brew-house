const mongoose = require("mongoose");

// Esquema para los pasos de la receta
const recipeStepSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  time: {
    type: Number, // tiempo en minutos
    required: true,
  },
  type: {
    type: String,
    enum: [
      "hop-addition",
      "dry-hop",
      "caramel-addition",
      "yeast-addition",
      "temperature-change",
      "stirring",
      "other",
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: false,
  },
  temperature: {
    type: Number,
    required: false,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    required: false,
  },
});

// Esquema para el estado de elaboración (brewing session)
const brewingSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  currentTime: {
    type: Number, // tiempo actual en segundos
    default: 0,
  },
  isRunning: {
    type: Boolean,
    default: false,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  pausedAt: {
    type: Date,
    required: false,
  },
  resumedAt: {
    type: Date,
    required: false,
  },
  completedSteps: [
    {
      stepId: String,
      completedAt: Date,
    },
  ],
  status: {
    type: String,
    enum: ["not-started", "brewing", "fermenting", "completed"],
    default: "not-started",
  },
  fermentationStartDate: {
    type: Date,
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
  batchNotes: {
    type: String,
    required: false,
  },
  // Mediciones de gravedad específicas del batch
  originalGravity: {
    type: Number,
    required: false,
  },
  finalGravity: {
    type: Number,
    required: false,
  },
  calculatedABV: {
    type: Number,
    required: false,
  },
  batchNumber: {
    type: String,
    required: false,
  },
  // Nuevos campos añadidos
  packagingDate: {
    type: Date,
    required: false,
  },
  batchLiters: {
    type: Number, // litros finales del batch
    required: false,
  },
});

// Esquema principal para las recetas
const recipeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  style: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  abv: {
    type: Number, // alcohol by volume
    required: true,
  },
  ibu: {
    type: Number, // international bitterness units
    required: true,
  },
  srm: {
    type: Number, // standard reference method (color)
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Fácil", "Intermedio", "Avanzado"],
    required: true,
  },
  batchSize: {
    type: Number, // tamaño del lote en litros
    required: true,
  },
  boilTime: {
    type: Number, // tiempo de hervido en minutos
    required: true,
  },
  steps: [recipeStepSchema],
  status: {
    type: String,
    enum: ["Borrador", "Activa", "Archivada"],
    default: "Borrador",
  },
  fermentationDays: {
    type: Number,
    required: false,
  },

  // Datos técnicos adicionales
  mashTemp: {
    type: Number, // temperatura de macerado en °C
    required: false,
  },
  mashTime: {
    type: Number, // tiempo de macerado en minutos
    required: false,
  },
  spargeTemp: {
    type: Number, // temperatura de lavado en °C
    required: false,
  },
  targetOriginalGravity: {
    type: Number, // densidad inicial objetivo
    required: false,
  },
  targetFinalGravity: {
    type: Number, // densidad final objetivo
    required: false,
  },
  efficiency: {
    type: Number, // eficiencia en porcentaje
    required: false,
  },
  waterProfile: {
    type: String,
    required: false,
  },
  yeastStrain: {
    type: String,
    required: false,
  },
  fermentationTemp: {
    type: Number, // temperatura de fermentación en °C
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
  grainBill: {
    type: String, // Campo para cantidad y tipo de granos
    required: false,
  },

  // Perfil del agua
  waterVolume: {
    type: Number, // Volumen de agua en litros
    required: false,
  },
  saltAdditions: {
    gypsum: { type: Number, default: 0 }, // CaSO4·2H2O en gramos
    calciumChloride: { type: Number, default: 0 }, // CaCl2 en gramos
    epsom: { type: Number, default: 0 }, // MgSO4·7H2O en gramos
    table: { type: Number, default: 0 }, // NaCl en gramos
    bakingSoda: { type: Number, default: 0 }, // NaHCO3 en gramos
    chalk: { type: Number, default: 0 }, // CaCO3 en gramos
  },
  waterProfile: {
    calcium: { type: Number, default: 0 }, // Ca2+ en ppm
    magnesium: { type: Number, default: 0 }, // Mg2+ en ppm
    sodium: { type: Number, default: 0 }, // Na+ en ppm
    sulfate: { type: Number, default: 0 }, // SO4 2- en ppm
    chloride: { type: Number, default: 0 }, // Cl- en ppm
    bicarbonate: { type: Number, default: 0 }, // HCO3- en ppm
  },

  // Sesiones de elaboración
  brewingSessions: [brewingSessionSchema],

  // Sesión activa actual (referencia a la sesión en curso)
  currentSession: {
    type: String,
    required: false,
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para actualizar el timestamp de modificación
recipeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Métodos del esquema
recipeSchema.methods.hasActiveSession = function () {
  // Verificar si hay alguna sesión activa (brewing o paused)
  return this.brewingSessions.some(
    (session) =>
      session.status === "brewing" && (session.isRunning || session.isPaused)
  );
};

recipeSchema.methods.getActiveSession = function () {
  // Obtener la sesión activa (brewing o paused)
  return this.brewingSessions.find(
    (session) =>
      session.status === "brewing" && (session.isRunning || session.isPaused)
  );
};

recipeSchema.methods.startBrewingSession = function () {
  // Verificar si ya hay una sesión activa
  if (this.hasActiveSession()) {
    throw new Error("Ya hay una sesión de elaboración activa o pausada");
  }

  const sessionId = new mongoose.Types.ObjectId().toString();
  const newSession = {
    sessionId,
    startDate: new Date(),
    currentTime: 0,
    isRunning: true,
    isPaused: false,
    completedSteps: [],
    status: "brewing",
  };

  this.brewingSessions.push(newSession);
  this.currentSession = sessionId;

  return sessionId;
};

recipeSchema.methods.pauseCurrentSession = function () {
  const session = this.brewingSessions.find(
    (s) => s.sessionId === this.currentSession
  );
  if (session && session.isRunning) {
    // Calcular tiempo transcurrido hasta ahora
    const now = new Date();
    const startTime = new Date(session.startDate);
    const elapsedSeconds = Math.floor(
      (now.getTime() - startTime.getTime()) / 1000
    );

    // Actualizar el currentTime con el tiempo transcurrido
    session.currentTime = Math.max(session.currentTime || 0, elapsedSeconds);

    session.isRunning = false;
    session.isPaused = true;
    session.pausedAt = now;
  }
};

recipeSchema.methods.resumeCurrentSession = function () {
  const session = this.brewingSessions.find(
    (s) => s.sessionId === this.currentSession
  );
  if (session && session.isPaused) {
    // Ajustar la fecha de inicio para que los cálculos futuros sean correctos
    // Nueva fecha de inicio = ahora - tiempo ya transcurrido
    const now = new Date();
    const elapsedMilliseconds = (session.currentTime || 0) * 1000;
    session.startDate = new Date(now.getTime() - elapsedMilliseconds);

    session.isRunning = true;
    session.isPaused = false;
    session.resumedAt = now;
  }
};

recipeSchema.methods.completeStep = function (stepId) {
  const session = this.brewingSessions.find(
    (s) => s.sessionId === this.currentSession
  );
  if (session) {
    const existingStep = session.completedSteps.find(
      (s) => s.stepId === stepId
    );
    if (!existingStep) {
      session.completedSteps.push({
        stepId,
        completedAt: new Date(),
      });
    }
  }

  // También marcar el paso en la receta como completado
  const step = this.steps.find((s) => s.id === stepId);
  if (step) {
    step.isCompleted = true;
    step.completedAt = new Date();
  }
};

recipeSchema.methods.uncompleteStep = function (stepId) {
  const session = this.brewingSessions.find(
    (s) => s.sessionId === this.currentSession
  );
  if (session) {
    session.completedSteps = session.completedSteps.filter(
      (s) => s.stepId !== stepId
    );
  }

  // También desmarcar el paso en la receta
  const step = this.steps.find((s) => s.id === stepId);
  if (step) {
    step.isCompleted = false;
    step.completedAt = null;
  }
};

recipeSchema.methods.getCurrentSession = function () {
  // Primero intentar obtener por currentSession
  if (this.currentSession) {
    const session = this.brewingSessions.find(
      (s) => s.sessionId === this.currentSession
    );
    if (
      session &&
      session.status === "brewing" &&
      (session.isRunning || session.isPaused)
    ) {
      return session;
    }
  }

  // Si no hay currentSession válida, buscar cualquier sesión activa
  return this.getActiveSession();
};

recipeSchema.methods.endCurrentSession = function (status = "completed") {
  const session = this.brewingSessions.find(
    (s) => s.sessionId === this.currentSession
  );
  if (session) {
    session.isRunning = false;
    session.isPaused = false;
    session.status = status;

    if (status === "fermenting") {
      session.fermentationStartDate = new Date();
    }
  }

  if (status === "completed") {
    this.currentSession = null;
  }
};

// Índices
recipeSchema.index({ id: 1 });
recipeSchema.index({ name: 1 });
recipeSchema.index({ style: 1 });
recipeSchema.index({ status: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ createdBy: 1 });
recipeSchema.index({ "brewingSessions.sessionId": 1 }, { sparse: true }); // sparse: true permite múltiples documentos sin este campo

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;
