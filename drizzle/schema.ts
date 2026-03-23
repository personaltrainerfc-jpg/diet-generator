import { int, json, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const diets = mysqlTable("diets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalCalories: int("totalCalories").notNull(),
  proteinPercent: int("proteinPercent").notNull(),
  carbsPercent: int("carbsPercent").notNull(),
  fatsPercent: int("fatsPercent").notNull(),
  mealsPerDay: int("mealsPerDay").notNull(),
  totalMenus: int("totalMenus").notNull(),
  avoidFoods: json("avoidFoods").$type<string[]>(),
  dietType: varchar("dietType", { length: 50 }).default("equilibrada").notNull(),
  cookingLevel: varchar("cookingLevel", { length: 50 }).default("moderate").notNull(),
  preferences: text("preferences"),
  useHomeMeasures: int("useHomeMeasures").default(0).notNull(),
  supermarket: varchar("supermarket", { length: 50 }),
  dailyTargets: json("dailyTargets").$type<Array<{ day: number; calories: number; proteinPercent: number; carbsPercent: number; fatsPercent: number }>>(),
  selectedRecipeIds: json("selectedRecipeIds").$type<number[]>(),
  preferredFoods: json("preferredFoods").$type<string[]>(),
  allergies: json("allergies").$type<string[]>(),
  fastingProtocol: varchar("fastingProtocol", { length: 20 }),
  folderId: int("folderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Diet = typeof diets.$inferSelect;
export type InsertDiet = typeof diets.$inferInsert;

export const menus = mysqlTable("menus", {
  id: int("id").autoincrement().primaryKey(),
  dietId: int("dietId").notNull(),
  menuNumber: int("menuNumber").notNull(),
  totalCalories: int("totalCalories").notNull(),
  totalProtein: int("totalProtein").notNull(),
  totalCarbs: int("totalCarbs").notNull(),
  totalFats: int("totalFats").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Menu = typeof menus.$inferSelect;
export type InsertMenu = typeof menus.$inferInsert;

export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  menuId: int("menuId").notNull(),
  mealNumber: int("mealNumber").notNull(),
  mealName: varchar("mealName", { length: 255 }).notNull(),
  calories: int("calories").notNull(),
  protein: int("protein").notNull(),
  carbs: int("carbs").notNull(),
  fats: int("fats").notNull(),
  notes: text("notes"),
  description: text("description"),
  enabled: int("enabled").default(1).notNull(),
});

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;

export const foods = mysqlTable("foods", {
  id: int("id").autoincrement().primaryKey(),
  mealId: int("mealId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 100 }).notNull(),
  calories: int("calories").notNull(),
  protein: int("protein").notNull(),
  carbs: int("carbs").notNull(),
  fats: int("fats").notNull(),
  alternativeName: varchar("alternativeName", { length: 255 }),
  alternativeQuantity: varchar("alternativeQuantity", { length: 100 }),
  alternativeCalories: int("alternativeCalories"),
  alternativeProtein: int("alternativeProtein"),
  alternativeCarbs: int("alternativeCarbs"),
  alternativeFats: int("alternativeFats"),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type Food = typeof foods.$inferSelect;
export type InsertFood = typeof foods.$inferInsert;

export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),  // null for system recipes
  name: varchar("name", { length: 255 }).notNull(),
  totalCalories: int("totalCalories").default(0).notNull(),
  totalProtein: int("totalProtein").default(0).notNull(),
  totalCarbs: int("totalCarbs").default(0).notNull(),
  totalFats: int("totalFats").default(0).notNull(),
  category: varchar("category", { length: 50 }).default("otro"),
  isSystem: tinyint("isSystem").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

export const recipeIngredients = mysqlTable("recipe_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 100 }).notNull(),
  calories: int("calories").default(0).notNull(),
  protein: int("protein").default(0).notNull(),
  carbs: int("carbs").default(0).notNull(),
  fats: int("fats").default(0).notNull(),
});

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;

// ── Supplements (suplementación por dieta) ──
export const supplements = mysqlTable("supplements", {
  id: int("id").autoincrement().primaryKey(),
  dietId: int("dietId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dose: varchar("dose", { length: 100 }),
  timing: varchar("timing", { length: 100 }),
  notes: text("notes"),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type Supplement = typeof supplements.$inferSelect;
export type InsertSupplement = typeof supplements.$inferInsert;

// ── Folders (carpetas para agrupar planes) ──
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

// ── Custom Foods (alimentos personalizados del usuario) ──
export const customFoods = mysqlTable("custom_foods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  caloriesPer100g: int("caloriesPer100g").notNull(),
  proteinPer100g: int("proteinPer100g").notNull(),
  carbsPer100g: int("carbsPer100g").notNull(),
  fatsPer100g: int("fatsPer100g").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomFood = typeof customFoods.$inferSelect;
export type InsertCustomFood = typeof customFoods.$inferInsert;

// ── Diet Instructions (instrucciones editables para el PDF) ──
export const dietInstructions = mysqlTable("diet_instructions", {
  id: int("id").autoincrement().primaryKey(),
  dietId: int("dietId").notNull(),
  hungerManagement: text("hungerManagement"),
  portionControl: text("portionControl"),
  weighingFood: text("weighingFood"),
  weekendGuidelines: text("weekendGuidelines"),
  healthIndications: text("healthIndications"),
  professionalNotes: text("professionalNotes"),
});

export type DietInstruction = typeof dietInstructions.$inferSelect;
export type InsertDietInstruction = typeof dietInstructions.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE B: Módulo Cliente-Entrenador
// ═══════════════════════════════════════════════════════

// ── Clients (perfiles de clientes del entrenador) ──
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(), // userId del entrenador
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  age: int("age"),
  weight: int("weight"), // en gramos (ej: 75000 = 75kg)
  height: int("height"), // en cm
  goal: varchar("goal", { length: 100 }), // pérdida peso, ganancia muscular, mantenimiento
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive", "paused"]).default("active").notNull(),
  archetype: varchar("archetype", { length: 20 }), // agil, flora, bruto, roca
  accessCode: varchar("accessCode", { length: 32 }).notNull().unique(), // código para que el cliente acceda
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ── Client-Diet assignments ──
export const clientDiets = mysqlTable("client_diets", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  dietId: int("dietId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  active: int("active").default(1).notNull(),
});

export type ClientDiet = typeof clientDiets.$inferSelect;
export type InsertClientDiet = typeof clientDiets.$inferInsert;

// ── Adherence Logs (registro diario de adherencia) ──
export const adherenceLogs = mysqlTable("adherence_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  dietId: int("dietId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  mealNumber: int("mealNumber").notNull(),
  completed: int("completed").default(0).notNull(), // 0 = no, 1 = sí
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdherenceLog = typeof adherenceLogs.$inferSelect;
export type InsertAdherenceLog = typeof adherenceLogs.$inferInsert;

// ── Progress Photos ──
export const progressPhotos = mysqlTable("progress_photos", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  photoType: mysqlEnum("photoType", ["front", "side", "back", "other"]).default("front").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export type InsertProgressPhoto = typeof progressPhotos.$inferInsert;

// ── Weekly Check-Ins ──
export const weeklyCheckIns = mysqlTable("weekly_check_ins", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(), // YYYY-MM-DD (lunes)
  currentWeight: int("currentWeight"), // gramos
  energyLevel: int("energyLevel"), // 1-5
  hungerLevel: int("hungerLevel"), // 1-5
  sleepQuality: int("sleepQuality"), // 1-5
  adherenceRating: int("adherenceRating"), // 1-5 autoevaluación
  notes: text("notes"),
  trainerFeedback: text("trainerFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyCheckIn = typeof weeklyCheckIns.$inferSelect;
export type InsertWeeklyCheckIn = typeof weeklyCheckIns.$inferInsert;

// ── Chat Messages ──
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  senderType: mysqlEnum("senderType", ["trainer", "client"]).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ── Achievements (definiciones de logros) ──
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("trophy").notNull(),
  condition: varchar("condition", { length: 100 }).notNull(), // ej: "adherence_streak_7", "weight_loss_5kg"
  threshold: int("threshold").default(1).notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// ── Client Achievements (logros desbloqueados) ──
export const clientAchievements = mysqlTable("client_achievements", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type ClientAchievement = typeof clientAchievements.$inferSelect;
export type InsertClientAchievement = typeof clientAchievements.$inferInsert;

// ── Body Measurements ──
export const bodyMeasurements = mysqlTable("body_measurements", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  weight: int("weight"), // gramos
  bodyFat: int("bodyFat"), // porcentaje x10 (ej: 155 = 15.5%)
  chest: int("chest"), // cm
  waist: int("waist"), // cm
  hips: int("hips"), // cm
  arms: int("arms"), // cm
  thighs: int("thighs"), // cm
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type InsertBodyMeasurement = typeof bodyMeasurements.$inferInsert;

// ── Initial Assessments (valoración inicial del cliente) ──
export const initialAssessments = mysqlTable("initial_assessments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  currentDiet: text("currentDiet"),
  exerciseFrequency: varchar("exerciseFrequency", { length: 50 }),
  exerciseType: text("exerciseType"),
  medicalConditions: text("medicalConditions"),
  medications: text("medications"),
  allergiesIntolerances: text("allergiesIntolerances"),
  sleepHours: int("sleepHours"),
  stressLevel: int("stressLevel"), // 1-5
  waterIntake: int("waterIntake"), // ml/día
  alcoholFrequency: varchar("alcoholFrequency", { length: 50 }),
  smokingStatus: varchar("smokingStatus", { length: 50 }),
  goals: text("goals"),
  trainerNotes: text("trainerNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InitialAssessment = typeof initialAssessments.$inferSelect;
export type InsertInitialAssessment = typeof initialAssessments.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE C: Mejoras App Entrenador
// ═══════════════════════════════════════════════════════

// ── Diet Templates (plantillas reutilizables) ──
export const dietTemplates = mysqlTable("diet_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dietId: int("dietId").notNull(), // dieta origen
  name: varchar("name", { length: 255 }).notNull(),
  tags: json("tags").$type<string[]>(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DietTemplate = typeof dietTemplates.$inferSelect;
export type InsertDietTemplate = typeof dietTemplates.$inferInsert;

// ── Client Favorite Foods (alimentos favoritos por cliente) ──
export const clientFavoriteFoods = mysqlTable("client_favorite_foods", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  foodName: varchar("foodName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientFavoriteFood = typeof clientFavoriteFoods.$inferSelect;
export type InsertClientFavoriteFood = typeof clientFavoriteFoods.$inferInsert;

// ── Client Tags (etiquetas para clientes) ──
export const clientTags = mysqlTable("client_tags", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#6BCB77").notNull(),
});

export type ClientTag = typeof clientTags.$inferSelect;
export type InsertClientTag = typeof clientTags.$inferInsert;

// ── Client-Tag assignments ──
export const clientTagAssignments = mysqlTable("client_tag_assignments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  tagId: int("tagId").notNull(),
});

export type ClientTagAssignment = typeof clientTagAssignments.$inferSelect;
export type InsertClientTagAssignment = typeof clientTagAssignments.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE D: Mejoras App Cliente
// ═══════════════════════════════════════════════════════

// ── Hydration Logs (registro de hidratación) ──
export const hydrationLogs = mysqlTable("hydration_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  glasses: int("glasses").default(0).notNull(), // vasos de 250ml
  goalGlasses: int("goalGlasses").default(8).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HydrationLog = typeof hydrationLogs.$inferSelect;
export type InsertHydrationLog = typeof hydrationLogs.$inferInsert;

// ── Sleep Logs (registro de sueño) ──
export const sleepLogs = mysqlTable("sleep_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  hoursSlept: int("hoursSlept").notNull(), // minutos (ej: 480 = 8h)
  quality: int("quality").notNull(), // 1-5
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SleepLog = typeof sleepLogs.$inferSelect;
export type InsertSleepLog = typeof sleepLogs.$inferInsert;

// ── Wellness Logs (diario de bienestar) ──
export const wellnessLogs = mysqlTable("wellness_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  energy: int("energy").notNull(), // 1-5
  mood: int("mood").notNull(), // 1-5
  digestion: int("digestion").notNull(), // 1-5
  bloating: int("bloating").notNull(), // 1-5 (1=mucha, 5=nada)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WellnessLog = typeof wellnessLogs.$inferSelect;
export type InsertWellnessLog = typeof wellnessLogs.$inferInsert;

// ── Meal Reminders (recordatorios de comida) ──
export const mealReminders = mysqlTable("meal_reminders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  mealName: varchar("mealName", { length: 100 }).notNull(),
  reminderTime: varchar("reminderTime", { length: 5 }).notNull(), // HH:MM
  enabled: int("enabled").default(1).notNull(),
});

export type MealReminder = typeof mealReminders.$inferSelect;
export type InsertMealReminder = typeof mealReminders.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE E: Mejoras sesión 5
// ═══════════════════════════════════════════════════════

// ── Client Invitations (invitaciones por email) ──
export const clientInvitations = mysqlTable("client_invitations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

export type ClientInvitation = typeof clientInvitations.$inferSelect;
export type InsertClientInvitation = typeof clientInvitations.$inferInsert;

// ── Motivation Message Log (historial para evitar repeticiones) ──
export const motivationLogs = mysqlTable("motivation_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  message: text("message").notNull(),
  sentByTrainer: int("sentByTrainer").default(0).notNull(), // 0=solo sugerido, 1=enviado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MotivationLog = typeof motivationLogs.$inferSelect;
export type InsertMotivationLog = typeof motivationLogs.$inferInsert;

// ── Weekend Meals (comidas de fin de semana del cliente) ──
export const weekendMeals = mysqlTable("weekend_meals", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  mealType: varchar("mealType", { length: 50 }).notNull(), // desayuno, almuerzo, cena, snack
  description: text("description").notNull(),
  photoUrl: text("photoUrl"),
  calories: int("calories"),
  isHealthy: int("isHealthy"), // 1=sí, 0=no (autoevaluación)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeekendMeal = typeof weekendMeals.$inferSelect;
export type InsertWeekendMeal = typeof weekendMeals.$inferInsert;

// ── Weekend AI Feedback (feedback IA sobre fin de semana) ──
export const weekendFeedback = mysqlTable("weekend_feedback", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  weekendDate: varchar("weekendDate", { length: 10 }).notNull(), // YYYY-MM-DD del sábado
  feedback: text("feedback").notNull(),
  score: int("score"), // 1-10 puntuación global
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeekendFeedbackType = typeof weekendFeedback.$inferSelect;
export type InsertWeekendFeedback = typeof weekendFeedback.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE F: Asistente IA Conversacional
// ═══════════════════════════════════════════════════════

// ── AI Conversations (historial de chat con el asistente IA) ──
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  messages: json("messages").$type<Array<{ role: "user" | "assistant"; content: string; timestamp: number }>>().notNull(),
  summary: text("summary"), // resumen automático para contexto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

// ── AI Assistant Config (configuración del asistente por entrenador) ──
export const aiAssistantConfig = mysqlTable("ai_assistant_config", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  assistantName: varchar("assistantName", { length: 100 }).default("NutriBot").notNull(),
  tone: varchar("tone", { length: 50 }).default("amigable").notNull(), // amigable, profesional, motivador
  customRules: text("customRules"), // reglas personalizadas del entrenador
  escalationKeywords: json("escalationKeywords").$type<string[]>(), // palabras que disparan alerta
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAssistantConfig = typeof aiAssistantConfig.$inferSelect;
export type InsertAiAssistantConfig = typeof aiAssistantConfig.$inferInsert;

// ── AI Escalation Alerts (alertas cuando el cliente necesita al entrenador) ──
export const aiEscalationAlerts = mysqlTable("ai_escalation_alerts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  trainerId: int("trainerId").notNull(),
  reason: text("reason").notNull(),
  conversationId: int("conversationId"),
  resolved: int("resolved").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiEscalationAlert = typeof aiEscalationAlerts.$inferSelect;
export type InsertAiEscalationAlert = typeof aiEscalationAlerts.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE G: Motor de Personalización Progresiva
// ═══════════════════════════════════════════════════════

// ── Learned Preferences (preferencias aprendidas del cliente) ──
export const learnedPreferences = mysqlTable("learned_preferences", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // food_likes, food_dislikes, schedule, habits
  key: varchar("key_name", { length: 100 }).notNull(),
  value: text("value").notNull(),
  confidence: int("confidence").default(50).notNull(), // 0-100
  source: varchar("source", { length: 50 }).notNull(), // ai_chat, adherence, checkin, manual
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnedPreference = typeof learnedPreferences.$inferSelect;
export type InsertLearnedPreference = typeof learnedPreferences.$inferInsert;

// ── Personalization Profiles (perfil evolutivo compilado) ──
export const personalizationProfiles = mysqlTable("personalization_profiles", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  profileData: json("profileData").$type<{
    foodLikes: string[];
    foodDislikes: string[];
    preferredMealTimes: string[];
    cookingSkill: string;
    shoppingPreferences: string[];
    activityPattern: string;
    sleepPattern: string;
    stressFactors: string[];
    motivationTriggers: string[];
  }>().notNull(),
  lastAnalyzedAt: timestamp("lastAnalyzedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PersonalizationProfile = typeof personalizationProfiles.$inferSelect;
export type InsertPersonalizationProfile = typeof personalizationProfiles.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE H: Integración Wearables
// ═══════════════════════════════════════════════════════

// ── Activity Logs (datos de actividad del wearable o manual) ──
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  steps: int("steps"),
  activeMinutes: int("activeMinutes"),
  caloriesBurned: int("caloriesBurned"),
  heartRateAvg: int("heartRateAvg"),
  heartRateMax: int("heartRateMax"),
  source: varchar("source", { length: 50 }).default("manual").notNull(), // manual, fitbit, garmin, apple_health
  rawData: json("rawData").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ── Wearable Connections (conexiones de dispositivos) ──
export const wearableConnections = mysqlTable("wearable_connections", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // fitbit, garmin, apple_health, google_fit
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  lastSyncAt: timestamp("lastSyncAt"),
  status: mysqlEnum("wearableStatus", ["connected", "disconnected", "expired"]).default("connected").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WearableConnection = typeof wearableConnections.$inferSelect;
export type InsertWearableConnection = typeof wearableConnections.$inferInsert;

// ═══════════════════════════════════════════════════════
// BLOQUE I: Gamificación de Actividad
// ═══════════════════════════════════════════════════════

// ── Activity Badges (definición de badges disponibles) ──
export const activityBadges = mysqlTable("activity_badges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // steps_5k, steps_10k, active_30, streak_7, etc.
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // emoji or icon name
  category: varchar("category", { length: 30 }).notNull(), // steps, active_minutes, streak, calories
  threshold: int("threshold").notNull(), // valor para desbloquear
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "diamond"]).default("bronze").notNull(),
});

export type ActivityBadge = typeof activityBadges.$inferSelect;
export type InsertActivityBadge = typeof activityBadges.$inferInsert;

// ── Client Activity Badges (badges desbloqueados por cliente) ──
export const clientActivityBadges = mysqlTable("client_activity_badges", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  badgeId: int("badgeId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  value: int("value"), // valor alcanzado cuando se desbloqueó
});

export type ClientActivityBadge = typeof clientActivityBadges.$inferSelect;
export type InsertClientActivityBadge = typeof clientActivityBadges.$inferInsert;

// ── Activity Streaks (rachas de actividad) ──
export const activityStreaks = mysqlTable("activity_streaks", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }), // YYYY-MM-DD
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActivityStreak = typeof activityStreaks.$inferSelect;
export type InsertActivityStreak = typeof activityStreaks.$inferInsert;
