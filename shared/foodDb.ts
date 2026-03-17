import foodData from "./foodDatabase.json";

export interface FoodEntry {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const foodDatabase: FoodEntry[] = foodData as FoodEntry[];

/**
 * Search foods by name (case-insensitive, accent-insensitive partial match)
 */
export function searchFoods(query: string, limit = 20): FoodEntry[] {
  if (!query || query.length < 2) return [];
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return foodDatabase
    .filter((food) => {
      const normalizedName = food.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return normalizedName.includes(normalizedQuery);
    })
    .slice(0, limit);
}

/**
 * Get a summary of the food database for LLM context (top categories)
 */
export function getFoodDatabaseSummary(): string {
  return `Base de datos de ${foodDatabase.length} alimentos disponibles con valores nutricionales por 100g. 
Incluye: carnes (pollo, ternera, cerdo, pavo), pescados (salmón, merluza, atún, lubina), 
huevos, lácteos (yogures, quesos, leche), cereales (arroz, avena, pan, pasta), 
legumbres (garbanzos, lentejas, alubias), verduras, frutas, frutos secos, aceites y más.`;
}
