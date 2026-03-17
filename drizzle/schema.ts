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
});

export type Food = typeof foods.$inferSelect;
export type InsertFood = typeof foods.$inferInsert;
