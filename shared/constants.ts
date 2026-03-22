// Logo URLs for PDF and branding
export const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/LOGO1_ab57b4c5.png";
export const NUTRIFLOW_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp";

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

// Recommended macros per diet type (auto-adjust on selection)
export const DIET_TYPE_MACROS: Record<string, { proteinPercent: number; carbsPercent: number; fatsPercent: number }> = {
  keto: { proteinPercent: 22, carbsPercent: 8, fatsPercent: 70 },
  equilibrada: { proteinPercent: 22, carbsPercent: 50, fatsPercent: 28 },
  mediterranea: { proteinPercent: 22, carbsPercent: 50, fatsPercent: 28 },
  paleo: { proteinPercent: 30, carbsPercent: 30, fatsPercent: 40 },
  realfood: { proteinPercent: 28, carbsPercent: 42, fatsPercent: 30 },
  vegetariana: { proteinPercent: 22, carbsPercent: 50, fatsPercent: 28 },
  vegana: { proteinPercent: 20, carbsPercent: 55, fatsPercent: 25 },
  // Extended types from user requirements
  lowcarb: { proteinPercent: 30, carbsPercent: 20, fatsPercent: 50 },
  altaproteina: { proteinPercent: 40, carbsPercent: 35, fatsPercent: 25 },
  volumen: { proteinPercent: 28, carbsPercent: 55, fatsPercent: 17 },
  deficit: { proteinPercent: 32, carbsPercent: 45, fatsPercent: 23 },
};

// Cooking levels
export const COOKING_LEVELS = [
  { value: "minimal", label: "Mínima cocina", description: "Recetas rápidas y sencillas (< 15 min), sin horno ni elaboraciones" },
  { value: "moderate", label: "Cocina moderada", description: "Recetas normales (15-30 min), plancha, sartén, horno básico" },
  { value: "elaborate", label: "Cocina elaborada", description: "Recetas completas (30+ min), guisos, hornos, preparaciones complejas" },
] as const;

export type CookingLevel = typeof COOKING_LEVELS[number]["value"];

// Cartoon icon URLs
export const CARTOON_ICONS = {
  fire: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/fire-icon-fhBrSztUNc7aA3hW2PHcHG.webp",
  muscle: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/muscle-icon-guuczayrpADh7MfmRfTWWy.webp",
  balance: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/balance-icon-LPydaFACtqRiji54JqD7kr.webp",
  avocado: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/avocado-icon-NNAA96BpzP6ePiSqhku7qU.webp",
  steak: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/steak-icon-V5UkEcM6rRqYVeJEHgNrhd.webp",
  salad: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/salad-icon-KRpCLDB8arhGvBAiey7wGE.webp",
} as const;

// Quick templates
export const QUICK_TEMPLATES = [
  {
    name: "Definición",
    icon: "🔥",
    iconImage: CARTOON_ICONS.fire,
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
    iconImage: CARTOON_ICONS.muscle,
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
    iconImage: CARTOON_ICONS.balance,
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
    iconImage: CARTOON_ICONS.avocado,
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
    iconImage: CARTOON_ICONS.steak,
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
    iconImage: CARTOON_ICONS.salad,
    totalCalories: 2000,
    proteinPercent: 30,
    carbsPercent: 40,
    fatsPercent: 30,
    mealsPerDay: 4,
    dietType: "realfood" as DietType,
    cookingLevel: "moderate" as CookingLevel,
  },
] as const;

// NutriFlow Mascots / Archetypes
export const MASCOT_URLS = {
  agil: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_agil_201aaee4.webp",
  flora: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_flora_ebca1ee3.webp",
  bruto: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_bruto_f83c761f.webp",
  roca: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_roca_ec6d782d.webp",
  grupo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_grupo_a511224f.webp",
} as const;

export type ArchetypeId = "agil" | "flora" | "bruto" | "roca";

export const ARCHETYPES = [
  {
    id: "agil" as ArchetypeId,
    name: "ÁGIL",
    animal: "Gacela",
    description: "Velocidad, resistencia y agilidad. Para quienes buscan rendimiento y superación constante.",
    image: MASCOT_URLS.agil,
    accentColor: "#2563EB",    // azul eléctrico
    secondaryColor: "#F97316", // naranja
  },
  {
    id: "flora" as ArchetypeId,
    name: "FLORA",
    animal: "Vaca Fitness",
    description: "Equilibrio, bienestar y constancia. Para quienes priorizan la salud y el cuidado personal.",
    image: MASCOT_URLS.flora,
    accentColor: "#EC4899",    // rosa
    secondaryColor: "#000000", // negro
  },
  {
    id: "bruto" as ArchetypeId,
    name: "BRUTO",
    animal: "Gorila",
    description: "Fuerza bruta, potencia y determinación. Para quienes buscan ganar masa y volumen.",
    image: MASCOT_URLS.bruto,
    accentColor: "#D4A017",    // dorado
    secondaryColor: "#1A1A1A", // negro profundo
  },
  {
    id: "roca" as ArchetypeId,
    name: "ROCA",
    animal: "Rinoceronte",
    description: "Resistencia, disciplina y constancia inquebrantable. Para quienes nunca se rinden.",
    image: MASCOT_URLS.roca,
    accentColor: "#DC2626",    // rojo
    secondaryColor: "#6B7280", // gris
  },
] as const;

// Empty state messages per archetype
export const EMPTY_STATE_MESSAGES: Record<ArchetypeId, Record<string, string>> = {
  agil: {
    diet: "Aún no tienes un plan. ¡Tu entrenador está preparando algo a tu velocidad!",
    progress: "Sin datos aún. Cada dato cuenta para mejorar tu rendimiento.",
    adherence: "Empieza a registrar tu adherencia. ¡Cada día es una carrera ganada!",
    weekend: "Registra tu fin de semana. ¡Ágil también descansa para rendir más!",
    wellness: "Registra cómo te sientes. Tu cuerpo es tu mejor herramienta.",
    shopping: "Tu lista de la compra aparecerá aquí cuando tengas un plan activo.",
  },
  flora: {
    diet: "Aún no tienes un plan. Tu entrenador está en ello.",
    progress: "Aquí verás tu progreso. ¡Empieza registrando hoy!",
    adherence: "Registra tu adherencia diaria. ¡La constancia es la clave!",
    weekend: "Cuéntanos cómo fue tu fin de semana. ¡Flora quiere saber!",
    wellness: "Registra tu bienestar. El equilibrio es lo más importante.",
    shopping: "Tu lista de la compra aparecerá aquí cuando tengas un plan activo.",
  },
  bruto: {
    diet: "Aún no tienes un plan. ¡Tu entrenador está diseñando algo bestial!",
    progress: "Sin datos aún. ¡Bruto necesita ver tus números para crecer!",
    adherence: "Registra tu adherencia. ¡La disciplina construye monstruos!",
    weekend: "Registra tu fin de semana. ¡Hasta Bruto necesita recuperarse!",
    wellness: "Registra cómo te sientes. La fuerza empieza por dentro.",
    shopping: "Tu lista de la compra aparecerá aquí cuando tengas un plan activo.",
  },
  roca: {
    diet: "Aún no tienes un plan. Tu entrenador está preparando algo sólido.",
    progress: "Sin datos aún. Cada dato es un paso más hacia tu objetivo.",
    adherence: "Registra tu adherencia. ¡Roca no falla ni un día!",
    weekend: "Registra tu fin de semana. ¡La constancia no descansa!",
    wellness: "Registra tu bienestar. Un cuerpo fuerte necesita una mente fuerte.",
    shopping: "Tu lista de la compra aparecerá aquí cuando tengas un plan activo.",
  },
};
