// Logo URL for PDF and branding
export const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/LOGO1_ab57b4c5.png";

// Diet types
export const DIET_TYPES = [
  { value: "equilibrada", label: "Equilibrada", description: "Dieta variada y balanceada sin restricciones especiales" },
  { value: "mediterranea", label: "Mediterránea", description: "Basada en aceite de oliva, pescado, legumbres, frutas y verduras" },
  { value: "keto", label: "Keto / Cetogénica", description: "Muy baja en carbohidratos, alta en grasas saludables" },
  { value: "paleo", label: "Paleo", description: "Alimentos no procesados: carnes, pescados, verduras, frutas, frutos secos" },
  { value: "realfood", label: "Real Food", description: "Solo alimentos reales, sin ultraprocesados ni aditivos" },
  { value: "vegetariana", label: "Vegetariana", description: "Sin carne ni pescado, incluye huevos y lácteos" },
  { value: "vegana", label: "Vegana", description: "Sin productos de origen animal" },
] as const;

export type DietType = typeof DIET_TYPES[number]["value"];

// Cooking levels
export const COOKING_LEVELS = [
  { value: "minimal", label: "Mínima cocina", description: "Recetas rápidas y sencillas (< 15 min), sin horno ni elaboraciones" },
  { value: "moderate", label: "Cocina moderada", description: "Recetas normales (15-30 min), plancha, sartén, horno básico" },
  { value: "elaborate", label: "Cocina elaborada", description: "Recetas completas (30+ min), guisos, hornos, preparaciones complejas" },
] as const;

export type CookingLevel = typeof COOKING_LEVELS[number]["value"];

// Quick templates
export const QUICK_TEMPLATES = [
  {
    name: "Definición",
    icon: "🔥",
    totalCalories: 1800,
    proteinPercent: 35,
    carbsPercent: 40,
    fatsPercent: 25,
    mealsPerDay: 5,
    dietType: "equilibrada" as DietType,
    cookingLevel: "moderate" as CookingLevel,
  },
  {
    name: "Volumen",
    icon: "💪",
    totalCalories: 2800,
    proteinPercent: 30,
    carbsPercent: 45,
    fatsPercent: 25,
    mealsPerDay: 5,
    dietType: "equilibrada" as DietType,
    cookingLevel: "moderate" as CookingLevel,
  },
  {
    name: "Mantenimiento",
    icon: "⚖️",
    totalCalories: 2200,
    proteinPercent: 30,
    carbsPercent: 45,
    fatsPercent: 25,
    mealsPerDay: 4,
    dietType: "mediterranea" as DietType,
    cookingLevel: "moderate" as CookingLevel,
  },
  {
    name: "Keto",
    icon: "🥑",
    totalCalories: 2000,
    proteinPercent: 25,
    carbsPercent: 5,
    fatsPercent: 70,
    mealsPerDay: 3,
    dietType: "keto" as DietType,
    cookingLevel: "moderate" as CookingLevel,
  },
  {
    name: "Paleo",
    icon: "🥩",
    totalCalories: 2200,
    proteinPercent: 30,
    carbsPercent: 30,
    fatsPercent: 40,
    mealsPerDay: 4,
    dietType: "paleo" as DietType,
    cookingLevel: "elaborate" as CookingLevel,
  },
  {
    name: "Real Food",
    icon: "🥗",
    totalCalories: 2000,
    proteinPercent: 30,
    carbsPercent: 40,
    fatsPercent: 30,
    mealsPerDay: 4,
    dietType: "realfood" as DietType,
    cookingLevel: "moderate" as CookingLevel,
  },
] as const;
