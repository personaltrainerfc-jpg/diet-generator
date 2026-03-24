import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { menus as menusTable, diets as dietsTable, meals as mealsTable, foods as foodsTable } from "../drizzle/schema";
import {
  createDiet, getUserDiets, getFullDiet, deleteDiet,
  createMenu, createMeal, createFood,
  updateMealName, updateMealNotes, updateMealDescription, updateFood, getMealById, getFoodById,
  updateMealMacros, updateMenuMacros,
  getMealsByMenuId, getMenusByDietId, getDietById,
  deleteMeal, deleteFood, getMenuById,
  createRecipe, getUserRecipes, getFullRecipe, deleteRecipe,
  addRecipeIngredient, deleteRecipeIngredient, updateRecipeMacros, getRecipeById,
  updateDietCalories, copyMealToMenu, getFoodsByMealId,
  getSupplementsByDietId, createSupplement, updateSupplement, deleteSupplement, getSupplementById,
  getUserFolders, createFolder, deleteFolder, renameFolder, moveDietToFolder, getFolderById,
  getUserCustomFoods, createCustomFood, deleteCustomFood,
  getDietInstructions, upsertDietInstructions,
  reorderFoods, reorderMeals, toggleMealEnabled, saveMealAsRecipe,
} from "./db";
import type { GeneratedDiet } from "@shared/types";
import { searchFoods, getFoodDatabaseSummary, foodDatabase } from "@shared/foodDb";
import { MEAL_PHILOSOPHY } from "@shared/mealPhilosophy";
import { clientRouter, clientPortalRouter } from "./clientRouters";

const dietConfigSchema = z.object({
  name: z.string().min(1).max(255),
  totalCalories: z.number().int().min(800).max(10000),
  proteinPercent: z.number().int().min(0).max(100),
  carbsPercent: z.number().int().min(0).max(100),
  fatsPercent: z.number().int().min(0).max(100),
  mealsPerDay: z.number().int().min(1).max(10),
  totalMenus: z.number().int().min(1).max(7),
  avoidFoods: z.array(z.string()).default([]),
  dietType: z.string().default("equilibrada"),
  cookingLevel: z.string().default("moderate"),
  preferences: z.string().max(2000).optional(),
  useHomeMeasures: z.boolean().default(false),
  supermarket: z.string().max(50).optional(),
  dailyTargets: z.array(z.object({
    day: z.number().int().min(1).max(7),
    calories: z.number().int().min(800).max(10000),
    proteinPercent: z.number().int().min(0).max(100),
    carbsPercent: z.number().int().min(0).max(100),
    fatsPercent: z.number().int().min(0).max(100),
  })).optional(),
  selectedRecipeIds: z.array(z.number()).optional(),
  recipesText: z.string().optional(),
  preferredFoods: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  fastingProtocol: z.string().max(20).optional(),
});

function buildDietPrompt(config: z.infer<typeof dietConfigSchema>, previousDietFoods?: string[]): string {
  const proteinGrams = Math.round((config.totalCalories * config.proteinPercent / 100) / 4);
  const carbsGrams = Math.round((config.totalCalories * config.carbsPercent / 100) / 4);
  const fatsGrams = Math.round((config.totalCalories * config.fatsPercent / 100) / 9);

  const avoidText = config.avoidFoods.length > 0
    ? `\nALIMENTOS A EVITAR (NO incluir bajo ningún concepto): ${config.avoidFoods.join(", ")}`
    : "";

  // Diet type specific instructions
  const dietTypeInstructions: Record<string, string> = {
    equilibrada: "Dieta equilibrada y variada sin restricciones especiales. Incluye todo tipo de alimentos de forma balanceada.",
    mediterranea: "Dieta MEDITERRÁNEA: Prioriza aceite de oliva virgen extra, pescado azul y blanco, legumbres, frutas, verduras de temporada, frutos secos, cereales integrales. Limita carnes rojas. Usa hierbas aromáticas y especias mediterráneas.",
    keto: "Dieta KETO/CETOGÉNICA: MUY baja en carbohidratos (máximo 20-50g/día). Alta en grasas saludables (aguacate, aceite de oliva, frutos secos, mantequilla, queso). Proteína moderada. PROHIBIDO: pan, arroz, pasta, patatas, frutas altas en azúcar, legumbres, cereales. Permitido: verduras bajas en carbos (espinacas, brócoli, calabacín, coliflor), carnes, pescados, huevos, lácteos enteros.",
    paleo: "Dieta PALEO: Solo alimentos que podrían obtenerse mediante caza y recolección. PERMITIDO: carnes, pescados, huevos, verduras, frutas, frutos secos, semillas, aceite de oliva/coco. PROHIBIDO: cereales (arroz, trigo, avena), legumbres, lácteos, azúcar refinado, alimentos procesados, pan, pasta.",
    realfood: "Dieta REAL FOOD: Solo alimentos reales y mínimamente procesados. PROHIBIDO: ultraprocesados, azúcares añadidos, harinas refinadas, aceites de semillas, aditivos artificiales. PERMITIDO: carnes frescas, pescados, huevos, verduras, frutas, legumbres, cereales integrales, frutos secos, lácteos naturales, aceite de oliva.",
    vegetariana: "Dieta VEGETARIANA: Sin carne ni pescado. PERMITIDO: huevos, lácteos, legumbres, tofu, tempe, seitán, cereales, verduras, frutas, frutos secos. Asegura proteína completa combinando legumbres + cereales.",
    vegana: "Dieta VEGANA: Sin ningún producto de origen animal. PERMITIDO: legumbres, tofu, tempe, seitán, cereales, verduras, frutas, frutos secos, semillas, leches vegetales. PROHIBIDO: carne, pescado, huevos, lácteos, miel. Asegura proteína completa y vitamina B12.",
  };

  const cookingInstructions: Record<string, string> = {
    minimal: "NIVEL DE COCINA MÍNIMO: Recetas MUY rápidas y sencillas (menos de 15 minutos). Prioriza: alimentos que se comen crudos o con mínima preparación (ensaladas, tostadas, yogures, fruta, jamón, queso, atún de lata, huevos cocidos, alimentos precocinados saludables). Evita: guisos largos, horno, elaboraciones complejas.",
    moderate: "NIVEL DE COCINA MODERADO: Recetas normales (15-30 minutos). Incluye: plancha, sartén, horno básico, hervidos rápidos. Recetas sencillas pero con algo de elaboración.",
    elaborate: "NIVEL DE COCINA ELABORADO: Recetas completas sin restricción de tiempo. Incluye: guisos, estofados, horno, preparaciones complejas, marinados, salsas caseras. Máxima variedad y creatividad culinaria.",
  };

  const dietTypeText = dietTypeInstructions[config.dietType] || dietTypeInstructions.equilibrada;
  const cookingText = cookingInstructions[config.cookingLevel] || cookingInstructions.moderate;

  // Build a compact food reference from the database (top common foods)
  const commonCategories = [
    "Pechuga de pollo", "Solomillo de ternera", "Lomo de cerdo", "Pechuga de pavo",
    "Salmón", "Merluza", "Atún", "Lubina", "Huevos", "Clara de huevo",
    "Arroz blanco hervido", "Arroz integral", "Pasta", "Pasta integral", "Pan integral",
    "Pan blanco", "Avena en copos", "Patata cruda", "Boniato",
    "Garbanzos cocidos", "Lentejas secas", "Alubias hervidas",
    "Brócoli", "Espinaca", "Judías verdes", "Calabacín", "Tomate", "Lechuga",
    "Plátano", "Manzana", "Fresas", "Naranja", "Kiwi",
    "Aceite de oliva", "Aguacate", "Almendras", "Nueces",
    "Yogur griego natural", "Yogur desnatado 0%", "Leche semidesnatada", "Queso fresco batido 0%",
    "Jamón serrano", "Jamón cocido bajo en grasa",
    "Café solo espresso (30ml)", "Café americano (150ml)", "Café con leche desnatada cortado (60ml leche)",
    "Café con leche semidesnatada (150ml leche)", "Café con leche entera (150ml leche)",
    "Café con leche desnatada (150ml leche)", "Café con bebida de avena sin azúcar (150ml)",
    "Café con bebida de almendra sin azúcar (150ml)", "Café descafeinado solo",
  ];

  const foodRef = commonCategories
    .map(name => {
      const found = foodDatabase.find(f => f.name === name);
      if (!found) return null;
      return `${found.name}: ${found.calories}kcal, P${found.protein}g, C${found.carbs}g, G${found.fats}g (por 100g)`;
    })
    .filter(Boolean)
    .join("\n");

  // Define meal structure based on number of meals
  let mealStructure = "";
  if (config.mealsPerDay === 3) {
    mealStructure = `Las 3 comidas DEBEN ser exactamente:
1. DESAYUNO: Alimentos típicos de desayuno (tostadas, avena, yogur, fruta, huevos revueltos, bowls de avena, cereales, café con leche). NUNCA incluir pescado, carne a la plancha, guisos o platos de almuerzo/cena.
2. COMIDA PRINCIPAL: Platos completos tipo almuerzo (arroz/pasta/legumbres con carne o pescado, ensaladas completas, guisos, verduras con proteína).
3. CENA PRINCIPAL: Platos ligeros pero completos tipo cena (pescado/carne a la plancha con verduras, tortillas, cremas de verduras con proteína, ensaladas templadas).`;
  } else if (config.mealsPerDay === 4) {
    mealStructure = `Las 4 comidas DEBEN ser exactamente:
1. DESAYUNO: Alimentos típicos de desayuno (tostadas, avena, yogur, fruta, huevos revueltos, bowls de avena, cereales). NUNCA incluir pescado, carne a la plancha, guisos o platos de almuerzo/cena.
2. SNACK MEDIA MAÑANA: Snack ligero (fruta, yogur, frutos secos, tostada pequeña, batido de proteínas). NO es una comida principal.
3. COMIDA PRINCIPAL: Platos completos tipo almuerzo (arroz/pasta/legumbres con carne o pescado, ensaladas completas, guisos, verduras con proteína).
4. CENA PRINCIPAL: Platos ligeros pero completos tipo cena (pescado/carne a la plancha con verduras, tortillas, cremas de verduras con proteína, ensaladas templadas).`;
  } else if (config.mealsPerDay === 5) {
    mealStructure = `Las 5 comidas DEBEN ser exactamente:
1. DESAYUNO: Alimentos típicos de desayuno (tostadas, avena, yogur, fruta, huevos revueltos, bowls de avena, cereales). NUNCA incluir pescado, carne a la plancha, guisos o platos de almuerzo/cena.
2. SNACK MEDIA MAÑANA: Snack ligero (fruta, yogur, frutos secos, tostada pequeña, batido de proteínas). NO es una comida principal.
3. COMIDA PRINCIPAL: Platos completos tipo almuerzo (arroz/pasta/legumbres con carne o pescado, ensaladas completas, guisos, verduras con proteína).
4. SNACK MEDIA TARDE: Snack ligero (fruta, yogur, frutos secos, tostada pequeña, batido de proteínas). NO es una comida principal.
5. CENA PRINCIPAL: Platos ligeros pero completos tipo cena (pescado/carne a la plancha con verduras, tortillas, cremas de verduras con proteína, ensaladas templadas).`;
  } else if (config.mealsPerDay === 6) {
    mealStructure = `Las 6 comidas DEBEN ser exactamente:
1. DESAYUNO: Alimentos típicos de desayuno.
2. SNACK MEDIA MAÑANA: Snack ligero.
3. COMIDA PRINCIPAL: Plato completo tipo almuerzo.
4. SNACK MEDIA TARDE: Snack ligero.
5. CENA PRINCIPAL: Plato ligero pero completo tipo cena.
6. RECENA/SNACK NOCTURNO: Snack muy ligero (yogur, fruta, caseína).`;
  } else {
    mealStructure = `Distribuye las ${config.mealsPerDay} comidas de forma lógica a lo largo del día, empezando por desayuno y terminando por cena. Los snacks intermedios deben ser ligeros. Los desayunos NUNCA deben incluir pescado ni carne a la plancha.`;
  }

  return `INSTRUCCIÓN CRÍTICA E INNEGOCIABLE: Debes generar EXACTAMENTE ${config.totalMenus} menú(s). Ni uno más ni uno menos. Si generas un número diferente, la respuesta será rechazada y tendrás que repetirla. Verifica antes de responder que el array "menus" contiene exactamente ${config.totalMenus} elemento(s).

Eres un nutricionista profesional. Genera exactamente ${config.totalMenus} menú(s) diario(s) completo(s) con las siguientes especificaciones:

OBJETIVOS NUTRICIONALES DIARIOS:
- Calorías totales: ${config.totalCalories} kcal
- Proteínas: ${proteinGrams}g (${config.proteinPercent}%)
- Carbohidratos: ${carbsGrams}g (${config.carbsPercent}%)
- Grasas: ${fatsGrams}g (${config.fatsPercent}%)

CONTROL DE CALORÍAS (OBLIGATORIO Y CRÍTICO):
- El objetivo calórico es ${config.totalCalories} kcal por día. EXACTAMENTE.
- Tolerancia máxima permitida: ±${Math.round(config.totalCalories * 0.05)} kcal (5%).
- Rango aceptable: entre ${Math.round(config.totalCalories * 0.95)} y ${Math.round(config.totalCalories * 1.05)} kcal.
- ANTES de finalizar cada menú, suma las calorías de todos los alimentos de todas las comidas y verifica que el total está dentro del rango aceptable.
- Si el total no está dentro del rango, ajusta las cantidades de los alimentos proporcionalmente hasta que lo esté.
- Un menú con menos de ${Math.round(config.totalCalories * 0.90)} kcal o más de ${Math.round(config.totalCalories * 1.10)} kcal es un ERROR GRAVE.
- Los valores de calorías de cada alimento deben calcularse según la cantidad exacta indicada, no por 100g.

ESTRUCTURA DE COMIDAS (OBLIGATORIO - RESPETAR EXACTAMENTE):
- Número de comidas por día: ${config.mealsPerDay}
- Número de menús a generar: ${config.totalMenus}

${mealStructure}
${avoidText}

TIPO DE DIETA (OBLIGATORIO - RESPETAR ESTRICTAMENTE):
${dietTypeText}

NIVEL DE COCINA:
${cookingText}

COHERENCIA POR MOMENTO DEL DÍA (MUY IMPORTANTE):
- DESAYUNO: SOLO alimentos de desayuno: tostadas, pan, avena, cereales, yogur, fruta, huevos (revueltos, cocidos), leche, café, mantequilla, mermelada, jamón serrano/cocido en tostada, aguacate en tostada. PROHIBIDO: pescado a la plancha, filetes de carne, guisos, arroces, pastas, legumbres.
- SNACKS (media mañana/tarde): Snacks ligeros: fruta, yogur, frutos secos, tostada pequeña, batido de proteínas, queso fresco, barrita. PROHIBIDO: platos principales, guisos, arroces.
- COMIDA PRINCIPAL: Platos completos: arroz, pasta, legumbres, patatas, verduras salteadas, ensaladas completas, siempre acompañados de carne o pescado. Inspirarse en: judías verdes con cebolla y jamón + carne/pescado, guisantes + carne/pescado, ensaladas con proteína.
- CENA PRINCIPAL: Platos más ligeros que la comida pero completos: pescado/carne a la plancha con verduras, tortillas, cremas de verduras con proteína, ensaladas templadas.

REFERENCIA NUTRICIONAL DE ALIMENTOS (valores por 100g):
${foodRef}

${MEAL_PHILOSOPHY}

COMBINACIONES DE ALIMENTOS COHERENTES E INTELIGENTES (OBLIGATORIO):
- Cada comida debe representar un PLATO REAL de la gastronomía cotidiana (preferiblemente española/mediterránea).
- Estructura de cada plato: proteína principal + vegetal o guarnición compatible + fuente de carbohidrato si corresponde.
- Los métodos de cocción deben ser coherentes: plancha, horno, cocido, salteado, al vapor, guisado.
- PROHIBIDO combinar alimentos que no tienen sentido juntos: atún con leche, arroz con yogur como plato principal, salmón con plátano, pollo con mermelada.
- Ejemplos de combinaciones CORRECTAS: judías verdes salteadas con jamón serrano + pechuga de pollo a la plancha, lentejas estofadas con verduras + arroz, salmón al horno con patatas y espinacas, tortilla francesa con ensalada mixta, garbanzos con espinacas y huevo pochado.
- Ejemplos de combinaciones INCORRECTAS: atún con leche y plátano, arroz con yogur y almendras como comida principal, pollo con fresas y avena en la cena.

${config.useHomeMeasures ? `MEDIDAS CASERAS (OBLIGATORIO):\nExpresa TODAS las cantidades en medidas caseras en lugar de gramos. Usa medidas como: 1 puñado, 1 filete mediano, 1 taza, 2 cucharadas soperas, 1 rebanada, 1 loncha, 1 pieza mediana, medio vaso, 1 cucharadita, etc. Los valores de macros deben calcularse según la cantidad real que representa esa medida casera.\n` : ""}
${config.supermarket ? `PRODUCTOS DE SUPERMERCADO (OBLIGATORIO):\nAjusta los alimentos propuestos a productos reales disponibles en ${config.supermarket}. Usa nombres de productos que se puedan encontrar fácilmente en ${config.supermarket}. Por ejemplo, en vez de "yogur griego", usa el nombre del producto específico de ${config.supermarket} si es conocido.\n` : ""}
${config.dailyTargets && config.dailyTargets.length > 0 ? `CALORÍAS Y MACROS DIFERENTES POR DÍA (OBLIGATORIO):\nCada menú/día tiene objetivos nutricionales diferentes:\n${config.dailyTargets.map(dt => {
  const pG = Math.round((dt.calories * dt.proteinPercent / 100) / 4);
  const cG = Math.round((dt.calories * dt.carbsPercent / 100) / 4);
  const fG = Math.round((dt.calories * dt.fatsPercent / 100) / 9);
  return `- Día/Menú ${dt.day}: ${dt.calories} kcal, Proteínas ${pG}g (${dt.proteinPercent}%), Carbohidratos ${cG}g (${dt.carbsPercent}%), Grasas ${fG}g (${dt.fatsPercent}%)`;
}).join("\n")}\nRespeta estos objetivos individuales para cada menú en lugar de los objetivos globales.\n` : ""}
${config.recipesText ? `RECETAS PROPIAS DEL USUARIO (INCORPORAR OBLIGATORIAMENTE):\nEl usuario quiere que las siguientes recetas aparezcan en el menú. Incorpóralas en los días/comidas que mejor encajen respetando los macros del plan:\n${config.recipesText}\n` : ""}
${config.preferredFoods && config.preferredFoods.length > 0 ? `ALIMENTOS A POTENCIAR/PREFERIDOS (OBLIGATORIO):\nEl usuario quiere que los siguientes alimentos aparezcan con MAYOR FRECUENCIA en los menús. Priorízalos siempre que encajen con los macros y la coherencia culinaria del plan:\n${config.preferredFoods.join(", ")}\nInclúyelos en tantas comidas como sea posible sin forzar combinaciones ilógicas.\n` : ""}
${config.allergies && config.allergies.length > 0 ? `ALERGIAS E INTOLERANCIAS (EXCLUSIÓN TOTAL OBLIGATORIA):\nEl usuario tiene las siguientes alergias o intolerancias. NUNCA incluyas estos alimentos ni derivados en ninguna comida del plan:\n${config.allergies.join(", ")}\nEsto es una restricción absoluta de salud. Verifica cada alimento propuesto.\n` : ""}
${config.fastingProtocol ? `PROTOCOLO DE AYUNO INTERMITENTE (OBLIGATORIO):\nEl usuario sigue un protocolo de ayuno intermitente ${config.fastingProtocol}. Distribuye TODAS las comidas del día dentro de la ventana de alimentación correspondiente. Por ejemplo, si es 16/8, las comidas deben concentrarse en 8 horas (ej: 12:00 a 20:00). Ajusta los nombres de las comidas para reflejar los horarios reales (ej: "Primera comida (12:00)", "Segunda comida (15:00)", "Tercera comida (19:30)"). El desayuno tradicional NO existe en ayuno intermitente.\n` : ""}
${config.preferences ? `PREFERENCIAS DEL USUARIO (CUMPLIMIENTO OBLIGATORIO Y PRIORITARIO):\nLas siguientes preferencias escritas por el usuario son de cumplimiento obligatorio y tienen prioridad sobre cualquier criterio de variedad o distribución automática. Sigue cada instrucción del usuario de forma literal:\n${config.preferences}\n` : ""}
${previousDietFoods && previousDietFoods.length > 0 ? `VARIEDAD GARANTIZADA - PLATOS A EVITAR (ya usados en dietas anteriores, NO repetir):\n${previousDietFoods.join(", ")}\nDEBES usar combinaciones y platos COMPLETAMENTE DIFERENTES a los listados arriba. Rota las fuentes de proteína, carbohidratos y verduras.\n` : ""}
REGLAS IMPORTANTES:
1. Cada comida debe tener entre 2 y 6 alimentos.
2. Para CADA alimento, proporciona SIEMPRE UNA alternativa equivalente con macros similares Y coherente con el momento del día. NUNCA dejes un alimento sin alternativa.
3. Las alternativas deben ser intercambiables sin alterar significativamente los macros totales.
   REGLA DE GRUPO ALIMENTARIO: La alternativa SIEMPRE debe pertenecer al MISMO grupo alimentario que el alimento original:
   - Proteína → otra proteína (pollo → pavo, salmón → merluza, huevos → atún)
   - Carbohidrato → otro carbohidrato (arroz → pasta, patata → boniato, pan → avena)
   - Verdura → otra verdura (brócoli → judías verdes, espinacas → acelgas)
   - Fruta → otra fruta (manzana → pera, plátano → kiwi)
   - Lácteo → otro lácteo (yogur griego → queso fresco, leche → kefir)
   - Frutos secos → otros frutos secos (almendras → nueces, anacardos → pistachos)
   EXCEPCIÓN SIN ALTERNATIVA: Los aceites (aceite de oliva, aceite de coco), condimentos (sal, pimienta, especias), y bebidas básicas (café, infusión) NO necesitan alternativa. Para estos, pon el campo "alternative" con el MISMO alimento y los MISMOS macros. Ejemplo: aceite de oliva → alternativa: aceite de oliva (mismos macros).
4. Usa alimentos reales, comunes y accesibles. Prioriza los alimentos de la referencia nutricional.
5. Indica cantidades precisas (en gramos o unidades). REDONDEO PRÁCTICO: Las cantidades en gramos deben ser múltiplos de 5 (hasta 100g) o múltiplos de 10 (por encima de 100g). Ejemplo: 25g, 40g, 80g, 120g, 150g, 200g. NUNCA uses cantidades como 37g, 123g o 87g.
6. Usa EXACTAMENTE los nombres de comida indicados en la estructura de comidas.
7. Asegúrate de que la suma de macros de todas las comidas se aproxime a los objetivos diarios.
8. Todos los valores numéricos deben ser enteros (sin decimales).
9. Los macros de cada alimento deben ser proporcionales a la cantidad indicada (no por 100g).
10. MENÚS DIFERENTES: Si se generan varios menús, CADA MENÚ DEBE SER COMPLETAMENTE DIFERENTE en sus platos principales. Varía las fuentes de proteína, carbohidratos y verduras en cada menú.
    ROTACIÓN DE PROTEÍNAS OBLIGATORIA: Distribuye las proteínas entre los días de forma rotativa. Si tienes 7 menús, usa al menos 5 fuentes de proteína diferentes en las comidas principales (pollo, ternera, cerdo, salmón, merluza, atún, huevos, legumbres, pavo, lubina). NO repitas la misma proteína en comida y cena del mismo día.
    ROTACIÓN DE CARBOHIDRATOS: Alterna entre arroz, pasta, patata, boniato, legumbres, pan, quinoa, cuscus. No uses el mismo carbohidrato más de 2 veces en todo el plan.
    ROTACIÓN DE VERDURAS: Usa al menos 6 verduras diferentes a lo largo del plan (brócoli, judías verdes, espinacas, calabacín, tomate, pimiento, berenjena, coliflor, acelgas, champiñones).
    VARIEDAD EN DESAYUNOS: No repitas el mismo desayuno dos días seguidos. Alterna entre tostadas, avena/porridge, yogur con fruta, huevos revueltos, bowl de avena, tortitas, etc.
    VARIEDAD EN SNACKS: Alterna entre fruta, yogur, frutos secos, tostada pequeña, batido de proteínas. No repitas el mismo snack dos días seguidos.
11. DESCRIPCIÓN DE CADA COMIDA (OBLIGATORIO): Para cada comida, genera un campo "description" con una línea legible que describa el plato de forma natural, como un nombre de receta. Ejemplo: "Judías verdes salteadas con jamón serrano y cebolla pochada + pechuga de pollo a la plancha". NO es un listado de ingredientes, es un nombre de plato cocinado.
12. SIN REPETICIÓN ENTRE DÍAS: No repitas el mismo alimento principal (proteína, verdura o carbohidrato principal) en dos días/menús distintos del plan. Distribuye verduras, proteínas y carbohidratos de forma variada a lo largo de todos los días del menú. Si un día usas pechuga de pollo, otro día usa lomo de cerdo o merluza. Si un día usas brócoli, otro día usa judías verdes o calabacín. Maximiza la variedad.
    COHERENCIA CULINARIA: Cada comida debe tener sentido como plato real. Los alimentos dentro de una comida deben combinar bien entre sí. Evita mezclas absurdas como "atún con yogur y plátano" o "salmón con avena y fresas". Piensa en platos que un cocinero real prepararía.
13. VERIFICACIÓN CALÓRICA OBLIGATORIA: Antes de cerrar el JSON de cada menú, realiza internamente esta comprobación: suma las calorías de todos los alimentos de todas las comidas de ese menú. El resultado debe estar entre ${Math.round(config.totalCalories * 0.95)} y ${Math.round(config.totalCalories * 1.05)} kcal. Si no cumple, redistribuye las cantidades antes de responder.

CANTIDADES REALISTAS (OBLIGATORIO - MUY IMPORTANTE):
- Proteínas (carne, pescado): entre 100g y 200g por ración. Ejemplo: 150g pechuga de pollo, 120g salmón, 180g merluza. NUNCA poner 30g de carne ni 400g.
- Verduras y hortalizas: entre 150g y 300g por ración. Ejemplo: 200g judías verdes, 150g brócoli, 250g ensalada mixta. NUNCA poner 50g de verdura.
- Carbohidratos (arroz, pasta, patata): entre 60g y 150g en crudo. Ejemplo: 80g arroz, 100g pasta, 200g patata. NUNCA poner 30g de arroz ni 300g.
- Legumbres cocidas: entre 150g y 250g. Ejemplo: 200g garbanzos cocidos, 180g lentejas.
- Pan: entre 40g y 80g por toma. Ejemplo: 50g pan integral (2 rebanadas), 60g pan de molde.
- Huevos: 1-3 unidades (55-60g cada uno). Ejemplo: 2 huevos (120g).
- Fruta: 1 pieza mediana (120-200g). Ejemplo: 150g manzana, 120g kiwi, 130g naranja.
- Yogur: 125-150g por unidad. Ejemplo: 125g yogur griego, 120g yogur proteínas.
- Frutos secos: entre 15g y 30g. Ejemplo: 20g almendras, 25g nueces.
- Aceite de oliva: entre 5g y 15g (1-3 cucharaditas). Ejemplo: 10g aceite de oliva.
- Queso fresco/batido: entre 60g y 150g. Ejemplo: 100g queso fresco batido 0%.
- Avena: entre 30g y 60g. Ejemplo: 40g avena en copos.

PLATOS RECONOCIBLES (OBLIGATORIO):
- Cada comida principal y cena debe ser un PLATO RECONOCIBLE de la cocina cotidiana, no una combinación aleatoria de ingredientes.
- Ejemplos de platos correctos: "Lentejas estofadas con verduras", "Salmón al horno con patatas y espinacas", "Poke de arroz con pollo y aguacate", "Tortilla francesa con ensalada mixta", "Pasta boloñesa con carne picada".
- Ejemplos de platos INCORRECTOS: "Pollo 150g + arroz 80g + brócoli 200g" (esto es un listado, no un plato). Siempre describe el método de cocción y la combinación.
- Los alimentos dentro de cada comida deben formar parte del MISMO PLATO o ser un acompañamiento lógico (ej: ensalada + plato principal, no 5 ingredientes sueltos sin relación).

Responde ÚNICAMENTE con un JSON válido siguiendo exactamente esta estructura (sin texto adicional):`;
}

const dietJsonSchema = {
  name: "generated_diet",
  strict: true,
  schema: {
    type: "object",
    properties: {
      menus: {
        type: "array",
        items: {
          type: "object",
          properties: {
            menuNumber: { type: "integer" },
            totalCalories: { type: "integer" },
            totalProtein: { type: "integer" },
            totalCarbs: { type: "integer" },
            totalFats: { type: "integer" },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mealNumber: { type: "integer" },
                  mealName: { type: "string" },
                  description: { type: "string" },
                  calories: { type: "integer" },
                  protein: { type: "integer" },
                  carbs: { type: "integer" },
                  fats: { type: "integer" },
                  foods: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "string" },
                        calories: { type: "integer" },
                        protein: { type: "integer" },
                        carbs: { type: "integer" },
                        fats: { type: "integer" },
                        alternativeName: { type: "string" },
                        alternativeQuantity: { type: "string" },
                        alternativeCalories: { type: "integer" },
                        alternativeProtein: { type: "integer" },
                        alternativeCarbs: { type: "integer" },
                        alternativeFats: { type: "integer" },
                      },
                      required: ["name", "quantity", "calories", "protein", "carbs", "fats", "alternativeName", "alternativeQuantity", "alternativeCalories", "alternativeProtein", "alternativeCarbs", "alternativeFats"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["mealNumber", "mealName", "description", "calories", "protein", "carbs", "fats", "foods"],
                additionalProperties: false,
              },
            },
          },
          required: ["menuNumber", "totalCalories", "totalProtein", "totalCarbs", "totalFats", "meals"],
          additionalProperties: false,
        },
      },
    },
    required: ["menus"],
    additionalProperties: false,
  },
};

/**
 * Attempts to repair truncated JSON from LLM by closing open brackets/braces.
 * Uses a stack to track opening order and close in reverse (LIFO).
 */
/**
 * Rounds a food quantity to the nearest practical measurement.
 * - Quantities <= 15g: round to nearest 5 (5, 10, 15)
 * - Quantities <= 100g: round to nearest 5 (20, 25, 30...)
 * - Quantities > 100g: round to nearest 10 (110, 120, 130...)
 * - Minimum: 5g
 */
function roundToNearestPractical(grams: number): number {
  if (grams <= 0) return 5;
  if (grams <= 15) return Math.max(5, Math.round(grams / 5) * 5);
  if (grams <= 100) return Math.round(grams / 5) * 5;
  return Math.round(grams / 10) * 10;
}

function repairTruncatedDietJson(truncated: string): string {
  let json = truncated.trim();
  
  // Remove trailing comma
  json = json.replace(/,\s*$/, '');
  
  // Check if we're inside an unterminated string
  let quoteCount = 0;
  let esc = false;
  for (const ch of json) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') quoteCount++;
  }
  
  // If inside a string, truncate to last complete entry
  if (quoteCount % 2 !== 0) {
    const lastCompleteObj = json.lastIndexOf('},');
    const lastCompleteArr = json.lastIndexOf('],');
    const lastComplete = Math.max(lastCompleteObj, lastCompleteArr);
    if (lastComplete > 0) {
      json = json.slice(0, lastComplete + 1);
    } else {
      json += '"';
    }
  }
  
  json = json.replace(/,\s*$/, '');
  
  // Check if tail after last complete entry has unclosed structures
  const lastCompleteEntry = json.lastIndexOf('},');
  if (lastCompleteEntry > 0) {
    const tail = json.slice(lastCompleteEntry + 1);
    const tOB = (tail.match(/{/g) || []).length;
    const tCB = (tail.match(/}/g) || []).length;
    const tOBr = (tail.match(/\[/g) || []).length;
    const tCBr = (tail.match(/]/g) || []).length;
    if (tOB > tCB || tOBr > tCBr) {
      json = json.slice(0, lastCompleteEntry + 1);
    }
  }
  
  json = json.replace(/,\s*$/, '');
  
  // Use a stack to track open structures in order
  const stack: string[] = [];
  let inStr = false;
  let escaped = false;
  
  for (const ch of json) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') stack.push('}');
    if (ch === '[') stack.push(']');
    if (ch === '}' || ch === ']') stack.pop();
  }
  
  // Close in reverse order (LIFO)
  while (stack.length > 0) {
    json += stack.pop();
  }
  
  return json;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Food database search ──
  foodDb: router({
    search: protectedProcedure
      .input(z.object({ query: z.string().min(2).max(100) }))
      .query(({ input }) => {
        return searchFoods(input.query, 20);
      }),
  }),

  clientMgmt: clientRouter,
  clientPortal: clientPortalRouter,

  diet: router({
    generate: protectedProcedure
      .input(dietConfigSchema)
      .mutation(async ({ ctx, input }) => {
        const macroSum = input.proteinPercent + input.carbsPercent + input.fatsPercent;
        if (macroSum < 95 || macroSum > 105) {
          throw new Error(`La suma de macronutrientes debe ser aproximadamente 100%. Actual: ${macroSum}%`);
        }

        // Get recent diets for variety guarantee
        let previousDietFoods: string[] = [];
        try {
          const recentDiets = await getUserDiets(ctx.user.id);
          const last3 = recentDiets.slice(0, 3);
          for (const d of last3) {
            const fullD = await getFullDiet(d.id);
            if (fullD) {
              for (const m of fullD.menus) {
                for (const meal of m.meals) {
                  for (const food of meal.foods) {
                    if (!previousDietFoods.includes(food.name)) {
                      previousDietFoods.push(food.name);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn("Could not fetch previous diets for variety:", e);
        }

        // Build recipes text if user selected recipes
        let recipesText = input.recipesText || "";
        if (input.selectedRecipeIds && input.selectedRecipeIds.length > 0 && !recipesText) {
          const recipeTexts: string[] = [];
          for (const rid of input.selectedRecipeIds) {
            const fullRecipe = await getFullRecipe(rid);
            if (fullRecipe) {
              const ingredientsList = fullRecipe.ingredients.map(i => `  - ${i.name}: ${i.quantity} (${i.calories}kcal, P${i.protein}g, C${i.carbs}g, G${i.fats}g)`).join("\n");
              recipeTexts.push(`Receta "${fullRecipe.name}" (${fullRecipe.totalCalories}kcal, P${fullRecipe.totalProtein}g, C${fullRecipe.totalCarbs}g, G${fullRecipe.totalFats}g):\n${ingredientsList}`);
            }
          }
          if (recipeTexts.length > 0) {
            recipesText = recipeTexts.join("\n\n");
          }
        }
        const configWithRecipes = { ...input, recipesText };

        const basePrompt = buildDietPrompt(configWithRecipes, previousDietFoods);
        const systemMsg = "Eres un nutricionista profesional con 15 años de experiencia en planificación de dietas para deportistas y personas activas en España. Responde siempre en español. Genera dietas con CANTIDADES REALISTAS (150g de proteína, 200g de verdura, 80g de arroz crudo, etc.), PLATOS RECONOCIBLES de la cocina cotidiana española/mediterránea (no listados de ingredientes sueltos), y COMBINACIONES CULINARIAS COHERENTES. Cada comida debe ser un plato que alguien cocinaría en su casa. Usa los valores nutricionales de referencia proporcionados para calcular macros precisos según las cantidades.";

        // Retry loop: up to 3 attempts
        let generatedDiet: GeneratedDiet | null = null;
        let lastError = '';
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const retryPrefix = attempt > 1
            ? `CORRECCIÓN NECESARIA (intento ${attempt}/${maxAttempts}): El intento anterior falló porque: ${lastError}. Corrige este problema específico en este intento.\n\n`
            : '';

          const prompt = retryPrefix + basePrompt;

          const dynamicMaxTokens = Math.min(4000 * input.totalMenus, 32768);
          const llmResponse = await invokeLLM({
            messages: [
              { role: "system", content: systemMsg },
              { role: "user", content: prompt },
            ],
            maxTokens: dynamicMaxTokens,
            response_format: {
              type: "json_schema",
              json_schema: dietJsonSchema,
            },
          });

          const content = llmResponse.choices[0]?.message?.content;
          const finishReason = llmResponse.choices[0]?.finish_reason;
          console.log(`[DietGen] attempt=${attempt}, finish_reason=${finishReason}, content_length=${typeof content === 'string' ? content.length : 'N/A'}, usage=${JSON.stringify(llmResponse.usage || {})}`);

          if (!content || typeof content !== "string") {
            console.error('[DietGen] Empty content from LLM. Full response:', JSON.stringify(llmResponse.choices[0]));
            lastError = 'La IA no devolvió contenido. Respuesta vacía.';
            continue;
          }

          let parsed: GeneratedDiet;
          try {
            parsed = JSON.parse(content);
          } catch (parseErr) {
            console.error(`[DietGen] JSON parse failed. finish_reason=${finishReason}, content_length=${content.length}`);
            console.error(`[DietGen] Content tail (last 200 chars): ${content.slice(-200)}`);
            if (finishReason === 'length' || finishReason === 'max_tokens') {
              try {
                const repaired = repairTruncatedDietJson(content);
                parsed = JSON.parse(repaired);
                console.log('[DietGen] Successfully repaired truncated JSON');
              } catch {
                lastError = `La respuesta JSON se truncó (finish_reason=${finishReason}). Genera una respuesta más compacta.`;
                continue;
              }
            } else {
              lastError = 'La respuesta no es JSON válido. Asegúrate de responder SOLO con JSON.';
              continue;
            }
          }

          // Validation 1: Number of menus
          if (parsed.menus.length !== input.totalMenus) {
            lastError = `Se solicitaron ${input.totalMenus} menú(s) pero generaste ${parsed.menus.length}. Genera EXACTAMENTE ${input.totalMenus} menú(s).`;
            console.warn(`[DietGen] Menu count mismatch: expected=${input.totalMenus}, got=${parsed.menus.length}`);
            continue;
          }

          // Calorie check per menu (warning only - not blocking, macros are recalculated on save)
          const targetCal = input.totalCalories;
          for (const menu of parsed.menus) {
            const menuCalories = (menu.meals || []).reduce((sum: number, meal: any) =>
              sum + (meal.foods || []).reduce((s: number, f: any) => s + (f.calories || 0), 0), 0);
            const diff = Math.abs(menuCalories - targetCal);
            if (diff > targetCal * 0.15) {
              console.warn(`[DietGen] Calorie warning menu ${menu.menuNumber}: target=${targetCal}, actual=${menuCalories}, diff=${diff} (will be recalculated on save)`);
            }
          }

          // All validations passed
          generatedDiet = parsed;
          if (attempt > 1) {
            console.log(`[DietGen] Succeeded on attempt ${attempt}`);
          }
          break;
        }

        if (!generatedDiet) {
          throw new Error(`No se pudo generar la dieta correctamente después de ${maxAttempts} intentos. Último error: ${lastError}. Inténtalo de nuevo.`);
        }

        const dietId = await createDiet({
          userId: ctx.user.id,
          name: input.name,
          totalCalories: input.totalCalories,
          proteinPercent: input.proteinPercent,
          carbsPercent: input.carbsPercent,
          fatsPercent: input.fatsPercent,
          mealsPerDay: input.mealsPerDay,
          totalMenus: input.totalMenus,
          avoidFoods: input.avoidFoods,
          dietType: input.dietType,
          cookingLevel: input.cookingLevel,
          preferences: input.preferences || null,
          useHomeMeasures: input.useHomeMeasures ? 1 : 0,
          supermarket: input.supermarket || null,
          dailyTargets: input.dailyTargets || null,
          selectedRecipeIds: input.selectedRecipeIds || null,
          preferredFoods: input.preferredFoods.length > 0 ? input.preferredFoods : null,
          allergies: input.allergies.length > 0 ? input.allergies : null,
          fastingProtocol: input.fastingProtocol || null,
        });

        for (const menu of generatedDiet.menus) {
          const menuId = await createMenu({
            dietId,
            menuNumber: menu.menuNumber,
            totalCalories: menu.totalCalories,
            totalProtein: menu.totalProtein,
            totalCarbs: menu.totalCarbs,
            totalFats: menu.totalFats,
          });

          for (const meal of menu.meals) {
            // Calculate real totals from foods instead of trusting LLM meal-level values
            const realMealTotals = meal.foods.reduce(
              (acc, f) => ({
                calories: acc.calories + (f.calories || 0),
                protein: acc.protein + (f.protein || 0),
                carbs: acc.carbs + (f.carbs || 0),
                fats: acc.fats + (f.fats || 0),
              }),
              { calories: 0, protein: 0, carbs: 0, fats: 0 }
            );

            const mealId = await createMeal({
              menuId,
              mealNumber: meal.mealNumber,
              mealName: meal.mealName,
              calories: realMealTotals.calories,
              protein: realMealTotals.protein,
              carbs: realMealTotals.carbs,
              fats: realMealTotals.fats,
              description: meal.description || null,
            });

            for (const food of meal.foods) {
              await createFood({
                mealId,
                name: food.name,
                quantity: food.quantity,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
                alternativeName: food.alternativeName,
                alternativeQuantity: food.alternativeQuantity,
                alternativeCalories: food.alternativeCalories,
                alternativeProtein: food.alternativeProtein,
                alternativeCarbs: food.alternativeCarbs,
                alternativeFats: food.alternativeFats,
              });
            }
          }

          // Recalculate menu totals from actual meal values
          await updateMenuMacros(menuId);

          // Post-save calorie validation (warning only)
          const menuTotals = await getMenuById(menuId);
          if (menuTotals) {
            const calorieDiff = Math.abs(menuTotals.totalCalories - input.totalCalories);
            const maxDiffWarn = input.totalCalories * 0.15;
            if (calorieDiff > maxDiffWarn) {
              console.warn(
                `[DietGen] Menú ${menu.menuNumber}: objetivo ${input.totalCalories}kcal, generado ${menuTotals.totalCalories}kcal (diferencia: ${calorieDiff}kcal)`
              );
            }
          }
        }

        try {
          await notifyOwner({
            title: "Nueva dieta generada",
            content: `El usuario ${ctx.user.name || ctx.user.email || "Anónimo"} ha generado una nueva dieta "${input.name}" con ${input.totalCalories} kcal, ${input.totalMenus} menú(s) y ${input.mealsPerDay} comida(s)/día.`,
          });
        } catch (e) {
          console.warn("Failed to notify owner:", e);
        }

        return { dietId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserDiets(ctx.user.id);
    }),

    createManual: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        totalCalories: z.number().min(500).max(10000),
        proteinPercent: z.number().min(5).max(60).default(30),
        carbsPercent: z.number().min(5).max(70).default(45),
        fatsPercent: z.number().min(5).max(60).default(25),
        totalMenus: z.number().min(1).max(14),
        mealNames: z.array(z.string().min(1)).min(1).max(10),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dietId = await createDiet({
          userId: ctx.user.id,
          name: input.name,
          totalCalories: input.totalCalories,
          proteinPercent: input.proteinPercent,
          carbsPercent: input.carbsPercent,
          fatsPercent: input.fatsPercent,
          totalMenus: input.totalMenus,
          mealsPerDay: input.mealNames.length,
          dietType: "personalizada",
          allergies: [],
          preferences: "",
        });
        for (let m = 1; m <= input.totalMenus; m++) {
          const menuId = await createMenu({
            dietId,
            menuNumber: m,
            totalCalories: input.totalCalories,
            totalProtein: Math.round(input.totalCalories * input.proteinPercent / 100 / 4),
            totalCarbs: Math.round(input.totalCalories * input.carbsPercent / 100 / 4),
            totalFats: Math.round(input.totalCalories * input.fatsPercent / 100 / 9),
          });
          for (let i = 0; i < input.mealNames.length; i++) {
            await createMeal({
              menuId,
              mealNumber: i + 1,
              mealName: input.mealNames[i],
              calories: 0, protein: 0, carbs: 0, fats: 0,
            });
          }
        }
        console.log(`[ManualDiet] Created diet ${dietId} with ${input.totalMenus} menus x ${input.mealNames.length} meals`);
        return { dietId };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const diet = await getFullDiet(input.id);
        if (!diet) throw new Error("Dieta no encontrada");
        if (diet.userId !== ctx.user.id) throw new Error("No tienes acceso a esta dieta");
        return diet;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const diet = await getFullDiet(input.id);
        if (!diet) throw new Error("Dieta no encontrada");
        if (diet.userId !== ctx.user.id) throw new Error("No tienes acceso a esta dieta");
        await deleteDiet(input.id);
        return { success: true };
      }),

    // ── Edit meal name ──
    updateMealName: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        mealName: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");
        // Verify ownership through chain: meal -> menu -> diet -> user
        const menuList = await getMenusByDietId(0); // We need to find the menu
        // Simplified: get menu by meal's menuId, then diet, then check user
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, meal.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        await updateMealName(input.mealId, input.mealName);
        return { success: true };
      }),

    // ── Add a new meal to a menu (via LLM) ──
    addMeal: protectedProcedure
      .input(z.object({
        menuId: z.number(),
        mealName: z.string().min(1).max(255).default("Nueva comida"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership: menu -> diet -> user
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, input.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        // Get existing meals to determine next mealNumber
        const existingMeals = await getMealsByMenuId(input.menuId);
        const nextMealNumber = existingMeals.length > 0
          ? Math.max(...existingMeals.map(m => m.mealNumber)) + 1
          : 1;

        // Get diet config to generate a meal with appropriate macros
        const diet = dietResult[0];
        const totalMealsAfter = existingMeals.length + 1;
        const approxCalories = Math.round(diet.totalCalories / totalMealsAfter);
        const proteinGrams = Math.round((approxCalories * diet.proteinPercent / 100) / 4);
        const carbsGrams = Math.round((approxCalories * diet.carbsPercent / 100) / 4);
        const fatsGrams = Math.round((approxCalories * diet.fatsPercent / 100) / 9);

        // Use LLM to generate a single meal
        const prompt = `Genera UNA comida llamada "${input.mealName}" con aproximadamente ${approxCalories} kcal, ${proteinGrams}g proteína, ${carbsGrams}g carbohidratos, ${fatsGrams}g grasa. Incluye entre 2 y 5 alimentos con una alternativa para cada uno. Responde SOLO con JSON.`;

        const singleMealSchema = {
          name: "single_meal",
          strict: true,
          schema: {
            type: "object" as const,
            properties: {
              mealName: { type: "string" as const },
              calories: { type: "integer" as const },
              protein: { type: "integer" as const },
              carbs: { type: "integer" as const },
              fats: { type: "integer" as const },
              foods: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    name: { type: "string" as const },
                    quantity: { type: "string" as const },
                    calories: { type: "integer" as const },
                    protein: { type: "integer" as const },
                    carbs: { type: "integer" as const },
                    fats: { type: "integer" as const },
                    alternativeName: { type: "string" as const },
                    alternativeQuantity: { type: "string" as const },
                    alternativeCalories: { type: "integer" as const },
                    alternativeProtein: { type: "integer" as const },
                    alternativeCarbs: { type: "integer" as const },
                    alternativeFats: { type: "integer" as const },
                  },
                  required: ["name", "quantity", "calories", "protein", "carbs", "fats", "alternativeName", "alternativeQuantity", "alternativeCalories", "alternativeProtein", "alternativeCarbs", "alternativeFats"] as const,
                  additionalProperties: false,
                },
              },
            },
            required: ["mealName", "calories", "protein", "carbs", "fats", "foods"] as const,
            additionalProperties: false,
          },
        };

        console.log(`[AddMeal] Calling LLM for menuId=${input.menuId}`);
        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista profesional. Genera comidas equilibradas con alimentos reales y cantidades precisas en gramos. Todos los valores numéricos deben ser enteros." },
            { role: "user", content: prompt },
          ],
          maxTokens: 4096,
          response_format: { type: "json_schema", json_schema: singleMealSchema },
        });

        const content = llmResponse.choices[0]?.message?.content;
        const finishReason = llmResponse.choices[0]?.finish_reason;
        console.log(`[AddMeal] finish_reason=${finishReason}, content_length=${typeof content === 'string' ? content.length : 'N/A'}`);
        if (!content || typeof content !== "string") throw new Error("No se pudo generar la comida. Inténtalo de nuevo.");

        let generated: any;
        try {
          generated = JSON.parse(content);
        } catch {
          if (finishReason === 'length' || finishReason === 'max_tokens') {
            try { generated = JSON.parse(repairTruncatedDietJson(content)); console.log('[AddMeal] Repaired truncated JSON'); } catch { throw new Error("La respuesta se truncó. Inténtalo de nuevo."); }
          } else {
            throw new Error("Error al procesar la comida generada. Inténtalo de nuevo.");
          }
        }

        // Save to DB
        const mealId = await createMeal({
          menuId: input.menuId,
          mealNumber: nextMealNumber,
          mealName: generated.mealName || input.mealName,
          calories: generated.calories,
          protein: generated.protein,
          carbs: generated.carbs,
          fats: generated.fats,
        });

        for (const food of generated.foods) {
          await createFood({
            mealId,
            name: food.name,
            quantity: food.quantity,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fats: food.fats,
            alternativeName: food.alternativeName,
            alternativeQuantity: food.alternativeQuantity,
            alternativeCalories: food.alternativeCalories,
            alternativeProtein: food.alternativeProtein,
            alternativeCarbs: food.alternativeCarbs,
            alternativeFats: food.alternativeFats,
          });
        }

        // Recalculate menu macros
        await updateMenuMacros(input.menuId);

        return { success: true, mealId };
      }),

    // ── Delete a meal from a menu ──
    deleteMeal: protectedProcedure
      .input(z.object({ mealId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");

        // Verify ownership
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, meal.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        // Check that there's at least 1 meal remaining
        const remainingMeals = await getMealsByMenuId(meal.menuId);
        if (remainingMeals.length <= 1) throw new Error("No puedes eliminar la última comida del menú");

        await deleteMeal(input.mealId);

        // Recalculate menu macros
        await updateMenuMacros(meal.menuId);

        return { success: true };
      }),

    // ── Delete a food from a meal ──
    deleteFood: protectedProcedure
      .input(z.object({ foodId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const food = await getFoodById(input.foodId);
        if (!food) throw new Error("Alimento no encontrado");

        // Verify ownership
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const mealResult = await db.select().from(mealsTable).where(eq(mealsTable.id, food.mealId)).limit(1);
        if (!mealResult[0]) throw new Error("Comida no encontrada");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, mealResult[0].menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        await deleteFood(input.foodId);

        // Recalculate meal and menu macros
        await updateMealMacros(food.mealId);
        await updateMenuMacros(mealResult[0].menuId);

        return { success: true };
      }),

    // ── Update food (replace or edit quantity) ──
    updateFood: protectedProcedure
      .input(z.object({
        foodId: z.number(),
        name: z.string().min(1).max(255).optional(),
        quantity: z.string().min(1).max(100).optional(),
        calories: z.number().int().min(0).optional(),
        protein: z.number().int().min(0).optional(),
        carbs: z.number().int().min(0).optional(),
        fats: z.number().int().min(0).optional(),
        alternativeName: z.string().max(255).optional(),
        alternativeQuantity: z.string().max(100).optional(),
        alternativeCalories: z.number().int().min(0).optional(),
        alternativeProtein: z.number().int().min(0).optional(),
        alternativeCarbs: z.number().int().min(0).optional(),
        alternativeFats: z.number().int().min(0).optional(),
        recalcFromDb: z.boolean().optional(), // If true, recalculate macros from food DB based on new quantity
        generateAlternative: z.boolean().optional(), // If true, auto-generate a new alternative via LLM
        mealName: z.string().optional(), // Name of the meal (for context when generating alternative)
      }))
      .mutation(async ({ ctx, input }) => {
        const food = await getFoodById(input.foodId);
        if (!food) throw new Error("Alimento no encontrado");

        // Verify ownership
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const mealResult = await db.select().from(mealsTable).where(eq(mealsTable.id, food.mealId)).limit(1);
        if (!mealResult[0]) throw new Error("Comida no encontrada");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, mealResult[0].menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        const { foodId, recalcFromDb, generateAlternative, mealName: inputMealName, ...updateData } = input;

        // If recalcFromDb is true and quantity changed, recalculate macros proportionally
        if (recalcFromDb && updateData.quantity) {
          const newQtyMatch = updateData.quantity.match(/(\d+)/);
          const newGrams = newQtyMatch ? parseInt(newQtyMatch[1]) : null;
          if (newGrams) {
            // Try to find the food in the database
            const dbFood = foodDatabase.find(f =>
              f.name.toLowerCase() === food.name.toLowerCase()
            ) || searchFoods(food.name, 1)[0];

            if (dbFood) {
              const factor = newGrams / 100;
              updateData.calories = Math.round(dbFood.calories * factor);
              updateData.protein = Math.round(dbFood.protein * factor);
              updateData.carbs = Math.round(dbFood.carbs * factor);
              updateData.fats = Math.round(dbFood.fats * factor);
            } else {
              // Fallback: proportional recalculation from current values
              const oldQtyMatch = food.quantity.match(/(\d+)/);
              const oldGrams = oldQtyMatch ? parseInt(oldQtyMatch[1]) : 100;
              if (oldGrams > 0) {
                const ratio = newGrams / oldGrams;
                updateData.calories = Math.round(food.calories * ratio);
                updateData.protein = Math.round(food.protein * ratio);
                updateData.carbs = Math.round(food.carbs * ratio);
                updateData.fats = Math.round(food.fats * ratio);
              }
            }
          }
        }

        // If replacing the food (name changed), auto-generate a new alternative
        if (generateAlternative && updateData.name && updateData.name !== food.name) {
          try {
            const newFoodName = updateData.name;
            const qty = updateData.quantity || food.quantity;
            const cal = updateData.calories ?? food.calories;
            const prot = updateData.protein ?? food.protein;
            const carb = updateData.carbs ?? food.carbs;
            const fat = updateData.fats ?? food.fats;
            const contextMealName = inputMealName || mealResult[0].mealName || "comida";

            const altPrompt = `Dado el alimento "${newFoodName}" (${qty}, ${cal}kcal, P${prot}g, C${carb}g, G${fat}g) que forma parte de la comida "${contextMealName}", sugiere UNA alternativa equivalente que:
1. Tenga macros similares (misma cantidad aproximada de cal/prot/carbs/grasas)
2. Sea coherente con el momento del día (si es desayuno, debe ser un alimento de desayuno; si es comida/cena, un alimento de comida/cena; si es snack, un snack)
3. Sea un alimento real, común y accesible
4. Indique la cantidad precisa en gramos

Responde SOLO con JSON.`;

            const altSchema = {
              name: "food_alternative",
              strict: true,
              schema: {
                type: "object" as const,
                properties: {
                  alternativeName: { type: "string" as const },
                  alternativeQuantity: { type: "string" as const },
                  alternativeCalories: { type: "integer" as const },
                  alternativeProtein: { type: "integer" as const },
                  alternativeCarbs: { type: "integer" as const },
                  alternativeFats: { type: "integer" as const },
                },
                required: ["alternativeName", "alternativeQuantity", "alternativeCalories", "alternativeProtein", "alternativeCarbs", "alternativeFats"] as const,
                additionalProperties: false,
              },
            };

            const altResponse = await invokeLLM({
              messages: [
                { role: "system", content: "Eres un nutricionista profesional. Sugiere alternativas de alimentos coherentes con el momento del día. Todos los valores numéricos deben ser enteros." },
                { role: "user", content: altPrompt },
              ],
              maxTokens: 1024,
              response_format: { type: "json_schema", json_schema: altSchema },
            });

            const altContent = altResponse.choices[0]?.message?.content;
            if (altContent && typeof altContent === "string") {
              const alt = JSON.parse(altContent);
              updateData.alternativeName = alt.alternativeName;
              updateData.alternativeQuantity = alt.alternativeQuantity;
              updateData.alternativeCalories = alt.alternativeCalories;
              updateData.alternativeProtein = alt.alternativeProtein;
              updateData.alternativeCarbs = alt.alternativeCarbs;
              updateData.alternativeFats = alt.alternativeFats;
            }
          } catch (e) {
            console.warn("Failed to generate alternative:", e);
            // Continue without updating alternative - not critical
          }
        }

        // Remove undefined values
        const cleanData = Object.fromEntries(
          Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(cleanData).length > 0) {
          await updateFood(foodId, cleanData);
        }

        // Recalculate meal and menu macros
        await updateMealMacros(food.mealId);
        await updateMenuMacros(mealResult[0].menuId);

        return { success: true };
      }),

    // ── Add food manually (from food database) ──
    addFood: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        name: z.string().min(1).max(255),
        quantity: z.string().min(1).max(100),
        calories: z.number().int().min(0),
        protein: z.number().int().min(0),
        carbs: z.number().int().min(0),
        fats: z.number().int().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership: meal -> menu -> diet -> user
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const mealResult = await db.select().from(mealsTable).where(eq(mealsTable.id, input.mealId)).limit(1);
        if (!mealResult[0]) throw new Error("Comida no encontrada");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, mealResult[0].menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        // Auto-generate alternative for the new food via LLM
        let altName: string | null = null;
        let altQty: string | null = null;
        let altCal: number | null = null;
        let altProt: number | null = null;
        let altCarbs: number | null = null;
        let altFats: number | null = null;

        try {
          const contextMealName = mealResult[0].mealName || "comida";
          const altPrompt = `Dado el alimento "${input.name}" (${input.quantity}, ${input.calories}kcal, P${input.protein}g, C${input.carbs}g, G${input.fats}g) que forma parte de la comida "${contextMealName}", sugiere UNA alternativa equivalente que:
1. Tenga macros similares (misma cantidad aproximada de cal/prot/carbs/grasas)
2. Sea coherente con el momento del día (si es desayuno, debe ser un alimento de desayuno; si es comida/cena, un alimento de comida/cena; si es snack, un snack)
3. Sea un alimento real, común y accesible
4. Indique la cantidad precisa en gramos
Responde SOLO con JSON.`;

          const altSchema = {
            name: "food_alternative",
            strict: true,
            schema: {
              type: "object" as const,
              properties: {
                alternativeName: { type: "string" as const },
                alternativeQuantity: { type: "string" as const },
                alternativeCalories: { type: "integer" as const },
                alternativeProtein: { type: "integer" as const },
                alternativeCarbs: { type: "integer" as const },
                alternativeFats: { type: "integer" as const },
              },
              required: ["alternativeName", "alternativeQuantity", "alternativeCalories", "alternativeProtein", "alternativeCarbs", "alternativeFats"] as const,
              additionalProperties: false,
            },
          };

          const altResponse = await invokeLLM({
            messages: [
              { role: "system", content: "Eres un nutricionista profesional. Sugiere alternativas de alimentos coherentes con el momento del día. Todos los valores numéricos deben ser enteros." },
              { role: "user", content: altPrompt },
            ],
            maxTokens: 1024,
            response_format: { type: "json_schema", json_schema: altSchema },
          });

          const altContent = altResponse.choices[0]?.message?.content;
          if (altContent && typeof altContent === "string") {
            const alt = JSON.parse(altContent);
            altName = alt.alternativeName;
            altQty = alt.alternativeQuantity;
            altCal = alt.alternativeCalories;
            altProt = alt.alternativeProtein;
            altCarbs = alt.alternativeCarbs;
            altFats = alt.alternativeFats;
          }
        } catch (e) {
          console.warn("Failed to generate alternative for added food:", e);
        }

        const foodId = await createFood({
          mealId: input.mealId,
          name: input.name,
          quantity: input.quantity,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fats: input.fats,
          alternativeName: altName,
          alternativeQuantity: altQty,
          alternativeCalories: altCal,
          alternativeProtein: altProt,
          alternativeCarbs: altCarbs,
          alternativeFats: altFats,
        });

        // Recalculate meal and menu macros
        await updateMealMacros(input.mealId);
        await updateMenuMacros(mealResult[0].menuId);

        return { success: true, foodId };
      }),

    // ── Update meal notes ──
    updateMealNotes: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        notes: z.string().max(1000).nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");

        // Verify ownership
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, meal.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        await updateMealNotes(input.mealId, input.notes);
        return { success: true };
      }),

    // ── Update meal description ──
    updateMealDescription: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        description: z.string().max(500).nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");

        // Verify ownership
        const db = await getDb();
        if (db) {
          const [menu] = await db.select().from(menusTable).where(eq(menusTable.id, meal.menuId)).limit(1);
          if (menu) {
            const [diet] = await db.select().from(dietsTable).where(eq(dietsTable.id, menu.dietId)).limit(1);
            if (diet && diet.userId !== ctx.user.id) throw new Error("No tienes acceso a esta comida");
          }
        }

        await updateMealDescription(input.mealId, input.description);
        return { success: true };
      }),

    // ── Regenerate a meal (replace all foods with different ones) ──
    regenerateMeal: protectedProcedure
      .input(z.object({
        mealId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log(`[RegenMeal] Starting for mealId=${input.mealId}`);
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");

        // Verify ownership
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, meal.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        // Get current foods to know what to avoid
        const currentFoods = await db.select().from(foodsTable).where(eq(foodsTable.mealId, input.mealId));
        const currentFoodNames = currentFoods.map(f => f.name).join(", ");

        // Get diet preferences for context
        const diet = dietResult[0];
        const dietType = (diet as any).dietType || '';
        const preferences = (diet as any).preferences || '';
        const allergies = (diet as any).allergies || '';

        // Determine meal-time context
        const mealNameLower = meal.mealName.toLowerCase();
        let mealTimeContext = '';
        if (mealNameLower.includes('desayuno') || mealNameLower.includes('primera comida')) {
          mealTimeContext = 'DESAYUNO: Alimentos típicos de desayuno español. Ejemplos: tostadas con AOVE y tomate, avena con fruta, yogur con granola, huevos revueltos, tortitas de avena, porridge, café con leche. NUNCA incluyas carne roja, pescado al horno ni platos de comida/cena.';
        } else if (mealNameLower.includes('snack') || mealNameLower.includes('media mañana') || mealNameLower.includes('media tarde') || mealNameLower.includes('merienda')) {
          mealTimeContext = 'SNACK/TENTEMPIE: Alimentos ligeros entre comidas. Ejemplos: fruta + frutos secos, yogur con semillas, tostada pequeña con pavo, batido de proteínas, queso fresco con membrillo. Porciones pequeñas (100-300kcal).';
        } else if (mealNameLower.includes('comida') || mealNameLower.includes('almuerzo') || mealNameLower.includes('segunda comida')) {
          mealTimeContext = 'COMIDA PRINCIPAL: Plato completo con proteína + carbohidrato + verdura. Ejemplos: lentejas estofadas, salmón al horno con patatas, pasta boloñesa, pollo a la plancha con arroz y ensalada. Debe ser un PLATO RECONOCIBLE, no ingredientes sueltos.';
        } else if (mealNameLower.includes('cena') || mealNameLower.includes('tercera comida') || mealNameLower.includes('última comida')) {
          mealTimeContext = 'CENA: Plato más ligero que la comida pero completo. Ejemplos: merluza al horno con verduras, tortilla francesa con ensalada, crema de calabacín con pechuga a la plancha, revuelto de champiñones con jamón. Evita carbohidratos pesados (pasta, arroz abundante).';
        }

        const prompt = `Genera UNA comida "${meal.mealName}" con ~${meal.calories}kcal, ${meal.protein}g proteína, ${meal.carbs}g carbs, ${meal.fats}g grasa.

${mealTimeContext}
${dietType ? `Tipo de dieta: ${dietType}.` : ''}
${allergies ? `ALERGIAS (EXCLUIR TOTALMENTE): ${allergies}.` : ''}
${preferences ? `Preferencias del usuario: ${preferences}.` : ''}

NO uses estos alimentos (ya están en la comida actual): ${currentFoodNames}. Usa alimentos COMPLETAMENTE DIFERENTES.
Cantidades en gramos, múltiplos de 5 (hasta 100g) o de 10 (>100g). Cocina sencilla (plancha, horno, airfryer, vapor).
Incluye 2-6 alimentos. Cada alimento con alternativa del MISMO grupo alimentario (proteína→proteína, verdura→verdura). Aceites/condimentos: alternativa = mismo alimento.
Valores numéricos enteros. Solo JSON.`;

        const singleMealSchema = {
          name: "single_meal",
          strict: true,
          schema: {
            type: "object" as const,
            properties: {
              mealName: { type: "string" as const },
              calories: { type: "integer" as const },
              protein: { type: "integer" as const },
              carbs: { type: "integer" as const },
              fats: { type: "integer" as const },
              foods: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    name: { type: "string" as const },
                    quantity: { type: "string" as const },
                    calories: { type: "integer" as const },
                    protein: { type: "integer" as const },
                    carbs: { type: "integer" as const },
                    fats: { type: "integer" as const },
                    alternativeName: { type: "string" as const },
                    alternativeQuantity: { type: "string" as const },
                    alternativeCalories: { type: "integer" as const },
                    alternativeProtein: { type: "integer" as const },
                    alternativeCarbs: { type: "integer" as const },
                    alternativeFats: { type: "integer" as const },
                  },
                  required: ["name", "quantity", "calories", "protein", "carbs", "fats", "alternativeName", "alternativeQuantity", "alternativeCalories", "alternativeProtein", "alternativeCarbs", "alternativeFats"] as const,
                  additionalProperties: false,
                },
              },
            },
            required: ["mealName", "calories", "protein", "carbs", "fats", "foods"] as const,
            additionalProperties: false,
          },
        };

        // Retry up to 2 times for LLM failures
        let generated: any = null;
        let lastErr = '';
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[RegenMeal] LLM attempt ${attempt}`);
            const llmResponse = await invokeLLM({
              messages: [
                { role: "system", content: "Eres un nutricionista profesional. Genera comidas equilibradas con alimentos reales y cantidades en gramos. Valores numéricos enteros. Responde SOLO con JSON." },
                { role: "user", content: prompt },
              ],
              maxTokens: 4096,
              response_format: { type: "json_schema", json_schema: singleMealSchema },
            });

            const content = llmResponse.choices[0]?.message?.content;
            const finishReason = llmResponse.choices[0]?.finish_reason;
            console.log(`[RegenMeal] attempt=${attempt}, finish_reason=${finishReason}, content_length=${typeof content === 'string' ? content.length : 'N/A'}`);

            if (!content || typeof content !== "string") {
              lastErr = 'La IA no devolvió contenido.';
              continue;
            }

            try {
              generated = JSON.parse(content);
            } catch {
              // Try to repair if truncated
              if (finishReason === 'length' || finishReason === 'max_tokens') {
                try {
                  generated = JSON.parse(repairTruncatedDietJson(content));
                  console.log('[RegenMeal] Repaired truncated JSON');
                } catch {
                  lastErr = 'JSON truncado e irreparable.';
                  continue;
                }
              } else {
                lastErr = 'Respuesta no es JSON válido.';
                continue;
              }
            }

            if (!generated.foods || !Array.isArray(generated.foods) || generated.foods.length === 0) {
              lastErr = 'La comida generada no tiene alimentos.';
              generated = null;
              continue;
            }

            break; // Success
          } catch (err: any) {
            lastErr = err.message || 'Error desconocido en LLM';
            console.error(`[RegenMeal] attempt ${attempt} failed:`, lastErr);
          }
        }

        if (!generated) {
          throw new Error(`No se pudo regenerar la comida. ${lastErr} Inténtalo de nuevo.`);
        }

        // Delete old foods
        for (const f of currentFoods) {
          await deleteFood(f.id);
        }

        // Update meal name
        await updateMealName(input.mealId, generated.mealName || meal.mealName);

        // Create new foods
        for (const food of generated.foods) {
          await createFood({
            mealId: input.mealId,
            name: food.name,
            quantity: food.quantity,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fats: food.fats,
            alternativeName: food.alternativeName,
            alternativeQuantity: food.alternativeQuantity,
            alternativeCalories: food.alternativeCalories,
            alternativeProtein: food.alternativeProtein,
            alternativeCarbs: food.alternativeCarbs,
            alternativeFats: food.alternativeFats,
          });
        }

        // Recalculate meal and menu macros
        await updateMealMacros(input.mealId);
        await updateMenuMacros(meal.menuId);

        console.log(`[RegenMeal] Success for mealId=${input.mealId}`);
        return { success: true };
      }),

    // ── Shopping list ──
    shoppingList: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const diet = await getFullDiet(input.id);
        if (!diet) throw new Error("Dieta no encontrada");
        if (diet.userId !== ctx.user.id) throw new Error("No tienes acceso a esta dieta");

        // Aggregate all foods across all menus
        const foodMap = new Map<string, { name: string; totalGrams: number; count: number }>();

        for (const menu of diet.menus) {
          for (const meal of menu.meals) {
            for (const food of meal.foods) {
              const key = food.name.toLowerCase().trim();
              const qtyMatch = food.quantity.match(/(\d+)/);
              const grams = qtyMatch ? parseInt(qtyMatch[1]) : 0;

              if (foodMap.has(key)) {
                const existing = foodMap.get(key)!;
                existing.totalGrams += grams;
                existing.count += 1;
              } else {
                foodMap.set(key, { name: food.name, totalGrams: grams, count: 1 });
              }
            }
          }
        }

        const items = Array.from(foodMap.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(item => ({
            name: item.name,
            totalQuantity: item.totalGrams > 0 ? `${item.totalGrams}g` : `${item.count} uds`,
            appearances: item.count,
          }));

        return { dietName: diet.name, items };
      }),

    // ── Duplicate diet ──
    duplicate: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).max(255).optional() }))
      .mutation(async ({ ctx, input }) => {
        const original = await getFullDiet(input.id);
        if (!original) throw new Error("Dieta no encontrada");
        if (original.userId !== ctx.user.id) throw new Error("No tienes acceso a esta dieta");

        // Create a copy of the diet
        const newDietId = await createDiet({
          userId: ctx.user.id,
          name: input.name || `${original.name} (copia)`,
          totalCalories: original.totalCalories,
          proteinPercent: original.proteinPercent,
          carbsPercent: original.carbsPercent,
          fatsPercent: original.fatsPercent,
          mealsPerDay: original.mealsPerDay,
          totalMenus: original.totalMenus,
          avoidFoods: (original.avoidFoods as string[]) || [],
          dietType: (original as any).dietType || 'equilibrada',
          cookingLevel: (original as any).cookingLevel || 'moderate',
          preferences: (original as any).preferences || null,
        });

        // Copy all menus, meals and foods
        for (const menu of original.menus) {
          const newMenuId = await createMenu({
            dietId: newDietId,
            menuNumber: menu.menuNumber,
            totalCalories: menu.totalCalories,
            totalProtein: menu.totalProtein,
            totalCarbs: menu.totalCarbs,
            totalFats: menu.totalFats,
          });

          for (const meal of menu.meals) {
            const newMealId = await createMeal({
              menuId: newMenuId,
              mealNumber: meal.mealNumber,
              mealName: meal.mealName,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fats: meal.fats,
              description: (meal as any).description || null,
              notes: (meal as any).notes || null,
            });

            for (const food of meal.foods) {
              await createFood({
                mealId: newMealId,
                name: food.name,
                quantity: food.quantity,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
                alternativeName: food.alternativeName,
                alternativeQuantity: food.alternativeQuantity,
                alternativeCalories: food.alternativeCalories,
                alternativeProtein: food.alternativeProtein,
                alternativeCarbs: food.alternativeCarbs,
                alternativeFats: food.alternativeFats,
              });
            }
          }
        }

        return { dietId: newDietId };
      }),

    // ── Redo diet (regenerate with same params but different foods) ──
    redoDiet: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const original = await getFullDiet(input.id);
        if (!original) throw new Error("Dieta no encontrada");
        if (original.userId !== ctx.user.id) throw new Error("No tienes acceso a esta dieta");

        // Collect all food names from this diet to avoid them
        const currentFoodNames: string[] = [];
        for (const menu of original.menus) {
          for (const meal of menu.meals) {
            for (const food of meal.foods) {
              if (!currentFoodNames.includes(food.name)) {
                currentFoodNames.push(food.name);
              }
            }
          }
        }

        // Also get foods from other recent diets
        let allPreviousFoods = [...currentFoodNames];
        try {
          const recentDiets = await getUserDiets(ctx.user.id);
          const others = recentDiets.filter(d => d.id !== input.id).slice(0, 2);
          for (const d of others) {
            const fullD = await getFullDiet(d.id);
            if (fullD) {
              for (const m of fullD.menus) {
                for (const meal of m.meals) {
                  for (const food of meal.foods) {
                    if (!allPreviousFoods.includes(food.name)) {
                      allPreviousFoods.push(food.name);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn("Could not fetch other diets for variety:", e);
        }

        const config = {
          name: original.name,
          totalCalories: original.totalCalories,
          proteinPercent: original.proteinPercent,
          carbsPercent: original.carbsPercent,
          fatsPercent: original.fatsPercent,
          mealsPerDay: original.mealsPerDay,
          totalMenus: original.totalMenus,
          avoidFoods: (original.avoidFoods as string[]) || [],
          dietType: (original as any).dietType || 'equilibrada',
          cookingLevel: (original as any).cookingLevel || 'moderate',
          preferences: (original as any).preferences || undefined,
          useHomeMeasures: !!(original as any).useHomeMeasures,
          supermarket: (original as any).supermarket || undefined,
          dailyTargets: (original as any).dailyTargets || undefined,
          selectedRecipeIds: (original as any).selectedRecipeIds || undefined,
          preferredFoods: (original as any).preferredFoods || [],
          allergies: (original as any).allergies || [],
          fastingProtocol: (original as any).fastingProtocol || undefined,
        };

        const basePromptRedo = buildDietPrompt(config, allPreviousFoods);
        const systemMsgRedo = "Eres un nutricionista profesional experto en planificación de dietas. Responde siempre en español. Genera dietas realistas, equilibradas y con alimentos variados. Construye platos culinariamente lógicos que representen recetas reales de la gastronomía cotidiana española/mediterránea. Usa los valores nutricionales de referencia proporcionados para calcular macros precisos según las cantidades.";

        // Retry loop: up to 3 attempts
        let generatedDiet: GeneratedDiet | null = null;
        let lastErrorRedo = '';
        const maxAttemptsRedo = 3;

        for (let attempt = 1; attempt <= maxAttemptsRedo; attempt++) {
          const retryPrefix = attempt > 1
            ? `CORRECCIÓN NECESARIA (intento ${attempt}/${maxAttemptsRedo}): El intento anterior falló porque: ${lastErrorRedo}. Corrige este problema específico en este intento.\n\n`
            : '';

          const prompt = retryPrefix + basePromptRedo;

          const dynamicMaxTokensRedo = Math.min(4000 * config.totalMenus, 32768);
          const llmResponse = await invokeLLM({
            messages: [
              { role: "system", content: systemMsgRedo },
              { role: "user", content: prompt },
            ],
            maxTokens: dynamicMaxTokensRedo,
            response_format: {
              type: "json_schema",
              json_schema: dietJsonSchema,
            },
          });

          const content = llmResponse.choices[0]?.message?.content;
          const finishReasonRedo = llmResponse.choices[0]?.finish_reason;
          console.log(`[RedoDiet] attempt=${attempt}, finish_reason=${finishReasonRedo}, content_length=${typeof content === 'string' ? content.length : 'N/A'}, usage=${JSON.stringify(llmResponse.usage || {})}`);

          if (!content || typeof content !== "string") {
            console.error('[RedoDiet] Empty content from LLM. Full response:', JSON.stringify(llmResponse.choices[0]));
            lastErrorRedo = 'La IA no devolvió contenido. Respuesta vacía.';
            continue;
          }

          let parsed: GeneratedDiet;
          try {
            parsed = JSON.parse(content);
          } catch (parseErr) {
            console.error(`[RedoDiet] JSON parse failed. finish_reason=${finishReasonRedo}, content_length=${content.length}`);
            console.error(`[RedoDiet] Content tail (last 200 chars): ${content.slice(-200)}`);
            if (finishReasonRedo === 'length' || finishReasonRedo === 'max_tokens') {
              try {
                const repaired = repairTruncatedDietJson(content);
                parsed = JSON.parse(repaired);
                console.log('[RedoDiet] Successfully repaired truncated JSON');
              } catch {
                lastErrorRedo = `La respuesta JSON se truncó (finish_reason=${finishReasonRedo}). Genera una respuesta más compacta.`;
                continue;
              }
            } else {
              lastErrorRedo = 'La respuesta no es JSON válido. Asegúrate de responder SOLO con JSON.';
              continue;
            }
          }

          // Validation 1: Number of menus
          if (parsed.menus.length !== config.totalMenus) {
            lastErrorRedo = `Se solicitaron ${config.totalMenus} menú(s) pero generaste ${parsed.menus.length}. Genera EXACTAMENTE ${config.totalMenus} menú(s).`;
            console.warn(`[RedoDiet] Menu count mismatch: expected=${config.totalMenus}, got=${parsed.menus.length}`);
            continue;
          }

          // Calorie check per menu (warning only - not blocking, macros are recalculated on save)
          const targetCalRedo = config.totalCalories;
          for (const menu of parsed.menus) {
            const menuCalories = (menu.meals || []).reduce((sum: number, meal: any) =>
              sum + (meal.foods || []).reduce((s: number, f: any) => s + (f.calories || 0), 0), 0);
            const diff = Math.abs(menuCalories - targetCalRedo);
            if (diff > targetCalRedo * 0.15) {
              console.warn(`[RedoDiet] Calorie warning menu ${menu.menuNumber}: target=${targetCalRedo}, actual=${menuCalories}, diff=${diff} (will be recalculated on save)`);
            }
          }

          // All validations passed
          generatedDiet = parsed;
          if (attempt > 1) {
            console.log(`[RedoDiet] Succeeded on attempt ${attempt}`);
          }
          break;
        }

        if (!generatedDiet) {
          throw new Error(`No se pudo regenerar la dieta correctamente después de ${maxAttemptsRedo} intentos. Último error: ${lastErrorRedo}. Inténtalo de nuevo.`);
        }

        // Delete old menus, meals and foods
        for (const menu of original.menus) {
          for (const meal of menu.meals) {
            for (const food of meal.foods) {
              await deleteFood(food.id);
            }
            await deleteMeal(meal.id);
          }
          // Delete menu
          const dbLocal = await getDb();
          if (dbLocal) {
            await dbLocal.delete(menusTable).where(eq(menusTable.id, menu.id));
          }
        }

        // Create new menus, meals and foods
        for (const menu of generatedDiet.menus) {
          const menuId = await createMenu({
            dietId: input.id,
            menuNumber: menu.menuNumber,
            totalCalories: menu.totalCalories,
            totalProtein: menu.totalProtein,
            totalCarbs: menu.totalCarbs,
            totalFats: menu.totalFats,
          });

          for (const meal of menu.meals) {
            // Calculate real totals from foods instead of trusting LLM meal-level values
            const realMealTotals = meal.foods.reduce(
              (acc, f) => ({
                calories: acc.calories + (f.calories || 0),
                protein: acc.protein + (f.protein || 0),
                carbs: acc.carbs + (f.carbs || 0),
                fats: acc.fats + (f.fats || 0),
              }),
              { calories: 0, protein: 0, carbs: 0, fats: 0 }
            );

            const mealId = await createMeal({
              menuId,
              mealNumber: meal.mealNumber,
              mealName: meal.mealName,
              calories: realMealTotals.calories,
              protein: realMealTotals.protein,
              carbs: realMealTotals.carbs,
              fats: realMealTotals.fats,
              description: meal.description || null,
            });

            for (const food of meal.foods) {
              await createFood({
                mealId,
                name: food.name,
                quantity: food.quantity,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fats: food.fats,
                alternativeName: food.alternativeName,
                alternativeQuantity: food.alternativeQuantity,
                alternativeCalories: food.alternativeCalories,
                alternativeProtein: food.alternativeProtein,
                alternativeCarbs: food.alternativeCarbs,
                alternativeFats: food.alternativeFats,
              });
            }
          }

          // Recalculate menu totals from actual meal values
          await updateMenuMacros(menuId);

          // Post-save calorie validation (warning only)
          const menuTotalsRedo = await getMenuById(menuId);
          if (menuTotalsRedo) {
            const calorieDiffRedo = Math.abs(menuTotalsRedo.totalCalories - config.totalCalories);
            const maxDiffWarnRedo = config.totalCalories * 0.15;
            if (calorieDiffRedo > maxDiffWarnRedo) {
              console.warn(
                `[RedoDiet] Menú ${menu.menuNumber}: objetivo ${config.totalCalories}kcal, generado ${menuTotalsRedo.totalCalories}kcal (diferencia: ${calorieDiffRedo}kcal)`
              );
            }
          }
        }

        return { success: true };
      }),
  }),

  // ── Recipe management ──
  recipe: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserRecipes(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const recipe = await getFullRecipe(input.id);
        if (!recipe) throw new Error("Receta no encontrada");
        // Allow access to system recipes (isSystem=1) or own recipes
        if (recipe.isSystem !== 1 && recipe.userId !== ctx.user.id) throw new Error("No tienes acceso a esta receta");
        return recipe;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        ingredients: z.array(z.object({
          name: z.string().min(1).max(255),
          quantity: z.string().min(1).max(100),
          calories: z.number().int().min(0),
          protein: z.number().int().min(0),
          carbs: z.number().int().min(0),
          fats: z.number().int().min(0),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const recipeId = await createRecipe({
          userId: ctx.user.id,
          name: input.name,
        });
        for (const ing of input.ingredients) {
          await addRecipeIngredient({ recipeId, ...ing });
        }
        await updateRecipeMacros(recipeId);
        return { recipeId };
      }),

    addIngredient: protectedProcedure
      .input(z.object({
        recipeId: z.number(),
        name: z.string().min(1).max(255),
        quantity: z.string().min(1).max(100),
        calories: z.number().int().min(0),
        protein: z.number().int().min(0),
        carbs: z.number().int().min(0),
        fats: z.number().int().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await getRecipeById(input.recipeId);
        if (!recipe || recipe.userId !== ctx.user.id) throw new Error("No tienes acceso");
        const id = await addRecipeIngredient(input);
        await updateRecipeMacros(input.recipeId);
        return { id };
      }),

    removeIngredient: protectedProcedure
      .input(z.object({ ingredientId: z.number(), recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await getRecipeById(input.recipeId);
        if (!recipe || recipe.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await deleteRecipeIngredient(input.ingredientId);
        await updateRecipeMacros(input.recipeId);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await getRecipeById(input.id);
        if (!recipe || recipe.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await deleteRecipe(input.id);
        return { success: true };
      }),
  }),

  // ── Adjust macros on existing diet ──
  dietAdjust: router({
    adjustMacros: protectedProcedure
      .input(z.object({
        dietId: z.number(),
        totalCalories: z.number().int().min(800).max(10000),
        proteinPercent: z.number().int().min(0).max(100),
        carbsPercent: z.number().int().min(0).max(100),
        fatsPercent: z.number().int().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const macroSum = input.proteinPercent + input.carbsPercent + input.fatsPercent;
        if (macroSum < 95 || macroSum > 105) {
          throw new Error("La suma de macronutrientes debe estar entre 95% y 105%");
        }

        const diet = await getDietById(input.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");

        const oldCalories = diet.totalCalories;
        const ratio = input.totalCalories / oldCalories;

        // Update diet-level macros
        await updateDietCalories(input.dietId, input.totalCalories, input.proteinPercent, input.carbsPercent, input.fatsPercent);

        // Recalculate all food quantities proportionally
        const dietMenus = await getMenusByDietId(input.dietId);
        for (const menu of dietMenus) {
          const menuMeals = await getMealsByMenuId(menu.id);
          for (const meal of menuMeals) {
            const mealFoods = await getFoodsByMealId(meal.id);
            for (const food of mealFoods) {
              const newCals = Math.round(food.calories * ratio);
              const newProtein = Math.round(food.protein * ratio);
              const newCarbs = Math.round(food.carbs * ratio);
              const newFats = Math.round(food.fats * ratio);
              // Adjust quantity string
              const qtyMatch = food.quantity.match(/(\d+\.?\d*)/);
              let newQty = food.quantity;
              if (qtyMatch) {
                const oldQtyNum = parseFloat(qtyMatch[1]);
                const newQtyNum = roundToNearestPractical(Math.round(oldQtyNum * ratio));
                newQty = food.quantity.replace(qtyMatch[1], String(newQtyNum));
              }
              await updateFood(food.id, {
                calories: newCals,
                protein: newProtein,
                carbs: newCarbs,
                fats: newFats,
                quantity: newQty,
                alternativeCalories: food.alternativeCalories ? Math.round(food.alternativeCalories * ratio) : null,
                alternativeProtein: food.alternativeProtein ? Math.round(food.alternativeProtein * ratio) : null,
                alternativeCarbs: food.alternativeCarbs ? Math.round(food.alternativeCarbs * ratio) : null,
                alternativeFats: food.alternativeFats ? Math.round(food.alternativeFats * ratio) : null,
                alternativeQuantity: food.alternativeQuantity ? (() => {
                  const aqm = food.alternativeQuantity!.match(/(\d+\.?\d*)/);
                  if (aqm) return food.alternativeQuantity!.replace(aqm[1], String(roundToNearestPractical(Math.round(parseFloat(aqm[1]) * ratio))));
                  return food.alternativeQuantity;
                })() : null,
              });
            }
            await updateMealMacros(meal.id);
          }
          await updateMenuMacros(menu.id);
        }

        return { success: true };
      }),

    // ── Copy meal to another menu ──
    copyMeal: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        targetMenuId: z.number(),
        replaceMealNumber: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");

        // Verify ownership of source
        const sourceMenu = await getMenuById(meal.menuId);
        if (!sourceMenu) throw new Error("Menú no encontrado");
        const sourceDiet = await getDietById(sourceMenu.dietId);
        if (!sourceDiet || sourceDiet.userId !== ctx.user.id) throw new Error("No tienes acceso");

        // Verify ownership of target
        const targetMenu = await getMenuById(input.targetMenuId);
        if (!targetMenu) throw new Error("Menú destino no encontrado");
        const targetDiet = await getDietById(targetMenu.dietId);
        if (!targetDiet || targetDiet.userId !== ctx.user.id) throw new Error("No tienes acceso al menú destino");

        // If replaceMealNumber, delete existing meal with that number
        if (input.replaceMealNumber) {
          const existingMeals = await getMealsByMenuId(input.targetMenuId);
          const toReplace = existingMeals.find(m => m.mealNumber === input.replaceMealNumber);
          if (toReplace) {
            await deleteMeal(toReplace.id);
          }
        }

        const mealNumber = input.replaceMealNumber || meal.mealNumber;
        const newMealId = await copyMealToMenu(input.mealId, input.targetMenuId, mealNumber);
        await updateMenuMacros(input.targetMenuId);

        return { newMealId };
      }),

    // ── Copy meal to multiple menus at once ──
    copyMealToMultiple: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        targetMenuIds: z.array(z.number()).min(1),
        replaceMealNumber: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");
        const sourceMenu = await getMenuById(meal.menuId);
        if (!sourceMenu) throw new Error("Menú no encontrado");
        const sourceDiet = await getDietById(sourceMenu.dietId);
        if (!sourceDiet || sourceDiet.userId !== ctx.user.id) throw new Error("No tienes acceso");

        const results: { menuId: number; newMealId: number }[] = [];
        for (const targetMenuId of input.targetMenuIds) {
          const targetMenu = await getMenuById(targetMenuId);
          if (!targetMenu) continue;
          const targetDiet = await getDietById(targetMenu.dietId);
          if (!targetDiet || targetDiet.userId !== ctx.user.id) continue;

          if (input.replaceMealNumber) {
            const existingMeals = await getMealsByMenuId(targetMenuId);
            const toReplace = existingMeals.find(m => m.mealNumber === input.replaceMealNumber);
            if (toReplace) await deleteMeal(toReplace.id);
          }

          const mealNumber = input.replaceMealNumber || meal.mealNumber;
          const newMealId = await copyMealToMenu(input.mealId, targetMenuId, mealNumber);
          await updateMenuMacros(targetMenuId);
          results.push({ menuId: targetMenuId, newMealId });
        }

        return { copied: results.length, results };
      }),

    // ── Copy full menu (all meals) to another menu ──
    copyMenu: protectedProcedure
      .input(z.object({
        sourceMenuId: z.number(),
        targetMenuId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const sourceMenu = await getMenuById(input.sourceMenuId);
        if (!sourceMenu) throw new Error("Menú origen no encontrado");
        const sourceDiet = await getDietById(sourceMenu.dietId);
        if (!sourceDiet || sourceDiet.userId !== ctx.user.id) throw new Error("No tienes acceso");

        const targetMenu = await getMenuById(input.targetMenuId);
        if (!targetMenu) throw new Error("Menú destino no encontrado");
        const targetDiet = await getDietById(targetMenu.dietId);
        if (!targetDiet || targetDiet.userId !== ctx.user.id) throw new Error("No tienes acceso al destino");

        // Delete existing meals in target
        const existingMeals = await getMealsByMenuId(input.targetMenuId);
        for (const m of existingMeals) {
          await deleteMeal(m.id);
        }

        // Copy all meals from source
        const sourceMeals = await getMealsByMenuId(input.sourceMenuId);
        for (const m of sourceMeals) {
          await copyMealToMenu(m.id, input.targetMenuId, m.mealNumber);
        }
        await updateMenuMacros(input.targetMenuId);

        return { success: true };
      }),

    // ── Generate nutritional guide PDF ──
    generateGuide: protectedProcedure
      .input(z.object({ dietId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const diet = await getFullDiet(input.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");

        const proteinGrams = Math.round((diet.totalCalories * diet.proteinPercent / 100) / 4);
        const carbsGrams = Math.round((diet.totalCalories * diet.carbsPercent / 100) / 4);
        const fatsGrams = Math.round((diet.totalCalories * diet.fatsPercent / 100) / 9);

        const guidePrompt = `Genera una guía nutricional personalizada en español para un usuario con el siguiente perfil:

- Nombre de la dieta: ${diet.name}
- Calorías diarias: ${diet.totalCalories} kcal
- Proteínas: ${proteinGrams}g (${diet.proteinPercent}%)
- Carbohidratos: ${carbsGrams}g (${diet.carbsPercent}%)
- Grasas: ${fatsGrams}g (${diet.fatsPercent}%)
- Tipo de dieta: ${(diet as any).dietType || 'equilibrada'}
- Comidas por día: ${diet.mealsPerDay}
- Alimentos excluidos: ${(diet.avoidFoods as string[] || []).join(', ') || 'Ninguno'}

La guía debe incluir estas secciones:
1. RESUMEN DEL PERFIL NUTRICIONAL: Breve descripción del perfil y objetivos.
2. DISTRIBUCIÓN DE MACRONUTRIENTES: Explicación de por qué estos porcentajes y qué alimentos priorizar para cada macro.
3. PAUTAS GENERALES DE ALIMENTACIÓN: Horarios recomendados, hidratación, preparación de alimentos.
4. CONSEJOS PRÁCTICOS PERSONALIZADOS: Tips específicos según el tipo de dieta y preferencias.
5. ALIMENTOS RECOMENDADOS: Lista de alimentos ideales para este perfil.
6. EJEMPLO DE DÍA TIPO: Un ejemplo de distribución de comidas.

Escribe en un tono profesional pero cercano. Usa formato Markdown con encabezados, listas y negritas.`;

        console.log('[GenerateGuide] Calling LLM');
        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista profesional. Genera guías nutricionales completas, personalizadas y bien estructuradas en español." },
            { role: "user", content: guidePrompt },
          ],
          maxTokens: 4096,
        });

        const guideContent = llmResponse.choices[0]?.message?.content;
        console.log(`[GenerateGuide] finish_reason=${llmResponse.choices[0]?.finish_reason}, content_length=${typeof guideContent === 'string' ? guideContent.length : 'N/A'}`);
        if (!guideContent || typeof guideContent !== "string") {
          throw new Error("No se pudo generar la guía nutricional. Inténtalo de nuevo.");
        }

        return { content: guideContent, dietName: diet.name };
      }),
  }),

  // ── Supplement router ──
  supplement: router({
    list: protectedProcedure
      .input(z.object({ dietId: z.number() }))
      .query(async ({ ctx, input }) => {
        const diet = await getDietById(input.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        return getSupplementsByDietId(input.dietId);
      }),

    create: protectedProcedure
      .input(z.object({
        dietId: z.number(),
        name: z.string().min(1).max(255),
        dose: z.string().max(100).optional(),
        timing: z.string().max(100).optional(),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const diet = await getDietById(input.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        const id = await createSupplement({
          dietId: input.dietId,
          name: input.name,
          dose: input.dose || null,
          timing: input.timing || null,
          notes: input.notes || null,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        dose: z.string().max(100).optional().nullable(),
        timing: z.string().max(100).optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const supp = await getSupplementById(input.id);
        if (!supp) throw new Error("Suplemento no encontrado");
        const diet = await getDietById(supp.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        const { id, ...data } = input;
        await updateSupplement(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const supp = await getSupplementById(input.id);
        if (!supp) throw new Error("Suplemento no encontrado");
        const diet = await getDietById(supp.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await deleteSupplement(input.id);
        return { success: true };
      }),
  }),

  // ── Folder router ──
  folder: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserFolders(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const id = await createFolder({ userId: ctx.user.id, name: input.name });
        return { id };
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const folder = await getFolderById(input.id);
        if (!folder || folder.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await renameFolder(input.id, input.name);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const folder = await getFolderById(input.id);
        if (!folder || folder.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await deleteFolder(input.id);
        return { success: true };
      }),

    moveDiet: protectedProcedure
      .input(z.object({ dietId: z.number(), folderId: z.number().nullable() }))
      .mutation(async ({ ctx, input }) => {
        const diet = await getDietById(input.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        if (input.folderId) {
          const folder = await getFolderById(input.folderId);
          if (!folder || folder.userId !== ctx.user.id) throw new Error("No tienes acceso a esta carpeta");
        }
        await moveDietToFolder(input.dietId, input.folderId);
        return { success: true };
      }),
  }),

  // ── Custom Food router ──
  customFood: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCustomFoods(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        caloriesPer100g: z.number().int().min(0),
        proteinPer100g: z.number().int().min(0),
        carbsPer100g: z.number().int().min(0),
        fatsPer100g: z.number().int().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createCustomFood({ userId: ctx.user.id, ...input });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCustomFood(input.id);
        return { success: true };
      }),
  }),

  // ── Diet Instructions router ──
  dietInstruction: router({
    get: protectedProcedure
      .input(z.object({ dietId: z.number() }))
      .query(async ({ ctx, input }) => {
        const diet = await getDietById(input.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        return getDietInstructions(input.dietId);
      }),

    upsert: protectedProcedure
      .input(z.object({
        dietId: z.number(),
        hungerManagement: z.string().max(2000).optional().nullable(),
        portionControl: z.string().max(2000).optional().nullable(),
        weighingFood: z.string().max(2000).optional().nullable(),
        weekendGuidelines: z.string().max(2000).optional().nullable(),
        healthIndications: z.string().max(2000).optional().nullable(),
        professionalNotes: z.string().max(2000).optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const diet = await getDietById(input.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        const { dietId, ...data } = input;
        await upsertDietInstructions(dietId, data);
        return { success: true };
      }),
  }),

  // ── Meal actions (save as recipe, reorder foods, toggle enabled) ──
  mealAction: router({
    saveAsRecipe: protectedProcedure
      .input(z.object({ mealId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");
        const menu = await getMenuById(meal.menuId);
        if (!menu) throw new Error("Menú no encontrado");
        const diet = await getDietById(menu.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        const recipeId = await saveMealAsRecipe(input.mealId, ctx.user.id);
        return { recipeId };
      }),

    addRecipeToMeal: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        recipeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");
        const menu = await getMenuById(meal.menuId);
        if (!menu) throw new Error("Menú no encontrado");
        const diet = await getDietById(menu.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");

        const recipe = await getFullRecipe(input.recipeId);
        if (!recipe) throw new Error("Receta no encontrada");
        // Allow system recipes or user's own recipes
        if (recipe.userId !== null && recipe.userId !== ctx.user.id) throw new Error("No tienes acceso a esta receta");

        // Get current max sortOrder
        const existingFoods = await getFoodsByMealId(input.mealId);
        let maxSort = existingFoods.reduce((max, f) => Math.max(max, f.sortOrder || 0), 0);

        // Insert each ingredient as a food in the meal
        for (const ing of recipe.ingredients) {
          maxSort++;
          await createFood({
            mealId: input.mealId,
            name: ing.name,
            quantity: ing.quantity,
            calories: ing.calories,
            protein: ing.protein,
            carbs: ing.carbs,
            fats: ing.fats,
            alternativeName: ing.name, // same as original (user can edit later)
            alternativeQuantity: ing.quantity,
            alternativeCalories: ing.calories,
            alternativeProtein: ing.protein,
            alternativeCarbs: ing.carbs,
            alternativeFats: ing.fats,
            sortOrder: maxSort,
          });
        }

        // Recalculate meal and menu macros
        await updateMealMacros(meal.id);
        await updateMenuMacros(menu.id);

        return { success: true, addedCount: recipe.ingredients.length };
      }),

    reorderFoods: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        foodIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");
        const menu = await getMenuById(meal.menuId);
        if (!menu) throw new Error("Menú no encontrado");
        const diet = await getDietById(menu.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await reorderFoods(input.mealId, input.foodIds);
        return { success: true };
      }),

    reorderMeals: protectedProcedure
      .input(z.object({
        menuId: z.number(),
        mealIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const menu = await getMenuById(input.menuId);
        if (!menu) throw new Error("Menú no encontrado");
        const diet = await getDietById(menu.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await reorderMeals(input.menuId, input.mealIds);
        return { success: true };
      }),

    toggleEnabled: protectedProcedure
      .input(z.object({
        mealId: z.number(),
        enabled: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");
        const menu = await getMenuById(meal.menuId);
        if (!menu) throw new Error("Menú no encontrado");
        const diet = await getDietById(menu.dietId);
        if (!diet || diet.userId !== ctx.user.id) throw new Error("No tienes acceso");
        await toggleMealEnabled(input.mealId, input.enabled);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
