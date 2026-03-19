import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  totalCalories: int("totalCalories").default(0).notNull(),
  totalProtein: int("totalProtein").default(0).notNull(),
  totalCarbs: int("totalCarbs").default(0).notNull(),
  totalFats: int("totalFats").default(0).notNull(),
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
