import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import {
  createDiet, getUserDiets, getFullDiet, deleteDiet,
  createMenu, createMeal, createFood,
  updateMealName, updateMealNotes, updateFood, getMealById, getFoodById,
  updateMealMacros, updateMenuMacros,
  getMealsByMenuId, getMenusByDietId, getDietById,
  deleteMeal, deleteFood, getMenuById,
} from "./db";
import type { GeneratedDiet } from "@shared/types";
import { searchFoods, getFoodDatabaseSummary, foodDatabase } from "@shared/foodDb";
import { MEAL_PHILOSOPHY } from "@shared/mealPhilosophy";

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

  return `Eres un nutricionista profesional. Genera exactamente ${config.totalMenus} menú(s) diario(s) completo(s) con las siguientes especificaciones:

OBJETIVOS NUTRICIONALES DIARIOS:
- Calorías totales: ${config.totalCalories} kcal
- Proteínas: ${proteinGrams}g (${config.proteinPercent}%)
- Carbohidratos: ${carbsGrams}g (${config.carbsPercent}%)
- Grasas: ${fatsGrams}g (${config.fatsPercent}%)

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

${config.preferences ? `PREFERENCIAS DEL USUARIO (RESPETAR EN LA MEDIDA DE LO POSIBLE):\n${config.preferences}\n` : ""}
${previousDietFoods && previousDietFoods.length > 0 ? `VARIEDAD GARANTIZADA - PLATOS A EVITAR (ya usados en dietas anteriores, NO repetir):\n${previousDietFoods.join(", ")}\nDEBES usar combinaciones y platos COMPLETAMENTE DIFERENTES a los listados arriba. Rota las fuentes de proteína, carbohidratos y verduras.\n` : ""}
REGLAS IMPORTANTES:
1. Cada comida debe tener entre 2 y 6 alimentos.
2. Para CADA alimento, proporciona SIEMPRE UNA alternativa equivalente con macros similares Y coherente con el momento del día. NUNCA dejes un alimento sin alternativa.
3. Las alternativas deben ser intercambiables sin alterar significativamente los macros totales.
4. Usa alimentos reales, comunes y accesibles. Prioriza los alimentos de la referencia nutricional.
5. Indica cantidades precisas (en gramos o unidades).
6. Usa EXACTAMENTE los nombres de comida indicados en la estructura de comidas.
7. Asegúrate de que la suma de macros de todas las comidas se aproxime a los objetivos diarios.
8. Todos los valores numéricos deben ser enteros (sin decimales).
9. Los macros de cada alimento deben ser proporcionales a la cantidad indicada (no por 100g).
10. MENÚS DIFERENTES: Si se generan varios menús, CADA MENÚ DEBE SER COMPLETAMENTE DIFERENTE. Varía las fuentes de proteína, carbohidratos y verduras en cada menú.
11. DESCRIPCIÓN DE CADA COMIDA (OBLIGATORIO): Para cada comida, genera un campo "description" con una línea legible que describa el plato de forma natural, como un nombre de receta. Ejemplo: "Judías verdes salteadas con jamón serrano y cebolla pochada + pechuga de pollo a la plancha". NO es un listado de ingredientes, es un nombre de plato cocinado.

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

        const prompt = buildDietPrompt(input, previousDietFoods);

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista profesional experto en planificaci\u00f3n de dietas. Responde siempre en espa\u00f1ol. Genera dietas realistas, equilibradas y con alimentos variados. Construye platos culinariamente l\u00f3gicos que representen recetas reales de la gastronom\u00eda cotidiana espa\u00f1ola/mediterr\u00e1nea. Usa los valores nutricionales de referencia proporcionados para calcular macros precisos seg\u00fan las cantidades." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: dietJsonSchema,
          },
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("No se pudo generar la dieta. Int\u00e9ntalo de nuevo.");
        }

        let generatedDiet: GeneratedDiet;
        try {
          generatedDiet = JSON.parse(content);
        } catch {
          throw new Error("Error al procesar la respuesta del generador de dietas.");
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
            const mealId = await createMeal({
              menuId,
              mealNumber: meal.mealNumber,
              mealName: meal.mealName,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fats: meal.fats,
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
        }

        try {
          await notifyOwner({
            title: "Nueva dieta generada",
            content: `El usuario ${ctx.user.name || ctx.user.email || "An\u00f3nimo"} ha generado una nueva dieta "${input.name}" con ${input.totalCalories} kcal, ${input.totalMenus} men\u00fa(s) y ${input.mealsPerDay} comida(s)/d\u00eda.`,
          });
        } catch (e) {
          console.warn("Failed to notify owner:", e);
        }

        return { dietId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserDiets(ctx.user.id);
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
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { menus, diets } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const menuResult = await db.select().from(menus).where(eq(menus.id, meal.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(diets).where(eq(diets.id, menuResult[0].dietId)).limit(1);
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
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { menus: menusTable, diets: dietsTable, meals: mealsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
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

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista profesional. Genera comidas equilibradas con alimentos reales y cantidades precisas en gramos. Todos los valores numéricos deben ser enteros." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_schema", json_schema: singleMealSchema },
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") throw new Error("No se pudo generar la comida");

        let generated: any;
        try { generated = JSON.parse(content); } catch { throw new Error("Error al procesar la comida generada"); }

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
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { menus: menusTable, diets: dietsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
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
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { meals: mealsTable, menus: menusTable, diets: dietsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
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
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { meals: mealsTable, menus: menusTable, diets: dietsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
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
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { meals: mealsTable, menus: menusTable, diets: dietsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
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
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { menus: menusTable, diets: dietsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, meal.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        await updateMealNotes(input.mealId, input.notes);
        return { success: true };
      }),

    // ── Regenerate a meal (replace all foods with different ones) ──
    regenerateMeal: protectedProcedure
      .input(z.object({
        mealId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await getMealById(input.mealId);
        if (!meal) throw new Error("Comida no encontrada");

        // Verify ownership
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { menus: menusTable, diets: dietsTable, foods: foodsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const menuResult = await db.select().from(menusTable).where(eq(menusTable.id, meal.menuId)).limit(1);
        if (!menuResult[0]) throw new Error("Menú no encontrado");
        const dietResult = await db.select().from(dietsTable).where(eq(dietsTable.id, menuResult[0].dietId)).limit(1);
        if (!dietResult[0] || dietResult[0].userId !== ctx.user.id) throw new Error("No tienes acceso");

        // Get current foods to know what to avoid
        const currentFoods = await db.select().from(foodsTable).where(eq(foodsTable.mealId, input.mealId));
        const currentFoodNames = currentFoods.map(f => f.name).join(", ");

        const prompt = `Genera UNA comida llamada "${meal.mealName}" con aproximadamente ${meal.calories} kcal, ${meal.protein}g proteína, ${meal.carbs}g carbohidratos, ${meal.fats}g grasa.

IMPORTANTE: Esta comida reemplaza una versión anterior que tenía estos alimentos: ${currentFoodNames}. DEBES usar alimentos COMPLETAMENTE DIFERENTES a los anteriores. No repitas ninguno.

${MEAL_PHILOSOPHY}

La comida debe ser coherente con su nombre ("${meal.mealName}"). Si es desayuno, usa alimentos de desayuno. Si es comida/cena, usa platos principales. Si es snack, usa snacks ligeros.

Incluye entre 2 y 6 alimentos con una alternativa para cada uno. Responde SOLO con JSON.`;

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

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista profesional de NoLimitPerformance. Genera comidas equilibradas con alimentos reales y cantidades precisas en gramos. Sigue la filosofía de menús proporcionada. Todos los valores numéricos deben ser enteros." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_schema", json_schema: singleMealSchema },
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") throw new Error("No se pudo regenerar la comida");

        let generated: any;
        try { generated = JSON.parse(content); } catch { throw new Error("Error al procesar la comida regenerada"); }

        // Delete old foods
        for (const f of currentFoods) {
          await deleteFood(f.id);
        }

        // Update meal macros
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
        };

        const prompt = buildDietPrompt(config, allPreviousFoods);

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista profesional experto en planificaci\u00f3n de dietas. Responde siempre en espa\u00f1ol. Genera dietas realistas, equilibradas y con alimentos variados. Construye platos culinariamente l\u00f3gicos que representen recetas reales de la gastronom\u00eda cotidiana espa\u00f1ola/mediterr\u00e1nea. Usa los valores nutricionales de referencia proporcionados para calcular macros precisos seg\u00fan las cantidades." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: dietJsonSchema,
          },
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("No se pudo regenerar la dieta. Int\u00e9ntalo de nuevo.");
        }

        let generatedDiet: GeneratedDiet;
        try {
          generatedDiet = JSON.parse(content);
        } catch {
          throw new Error("Error al procesar la respuesta del generador de dietas.");
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
          const { getDb: getDbLocal } = await import("./db");
          const dbLocal = await getDbLocal();
          if (dbLocal) {
            const { menus: menusTable } = await import("../drizzle/schema");
            const { eq: eqLocal } = await import("drizzle-orm");
            await dbLocal.delete(menusTable).where(eqLocal(menusTable.id, menu.id));
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
            const mealId = await createMeal({
              menuId,
              mealNumber: meal.mealNumber,
              mealName: meal.mealName,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fats: meal.fats,
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
        }

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
