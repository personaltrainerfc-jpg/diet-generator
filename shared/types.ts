/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Types for LLM-generated diet structure

export interface GeneratedFood {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  alternativeName: string;
  alternativeQuantity: string;
  alternativeCalories: number;
  alternativeProtein: number;
  alternativeCarbs: number;
  alternativeFats: number;
}

export interface GeneratedMeal {
  mealNumber: number;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foods: GeneratedFood[];
}

export interface GeneratedMenu {
  menuNumber: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  meals: GeneratedMeal[];
}

export interface GeneratedDiet {
  menus: GeneratedMenu[];
}

export interface DietConfig {
  totalCalories: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
  mealsPerDay: number;
  totalMenus: number;
  avoidFoods: string[];
}

export interface FullFood {
  id: number;
  mealId: number;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  alternativeName: string | null;
  alternativeQuantity: string | null;
  alternativeCalories: number | null;
  alternativeProtein: number | null;
  alternativeCarbs: number | null;
  alternativeFats: number | null;
}

export interface FullMeal {
  id: number;
  menuId: number;
  mealNumber: number;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foods: FullFood[];
}

export interface FullMenu {
  id: number;
  dietId: number;
  menuNumber: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  createdAt: Date;
  meals: FullMeal[];
}

export interface FullDiet {
  id: number;
  userId: number;
  name: string;
  totalCalories: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
  mealsPerDay: number;
  totalMenus: number;
  avoidFoods: string[] | null;
  createdAt: Date;
  menus: FullMenu[];
}
