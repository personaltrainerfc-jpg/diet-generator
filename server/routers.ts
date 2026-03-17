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
} from "./db";
import type { GeneratedDiet } from "@shared/types";

const dietConfigSchema = z.object({
  name: z.string().min(1).max(255),
  totalCalories: z.number().int().min(800).max(10000),
  proteinPercent: z.number().int().min(0).max(100),
  carbsPercent: z.number().int().min(0).max(100),
  fatsPercent: z.number().int().min(0).max(100),
  mealsPerDay: z.number().int().min(1).max(10),
  totalMenus: z.number().int().min(1).max(7),
  avoidFoods: z.array(z.string()).default([]),
});

function buildDietPrompt(config: z.infer<typeof dietConfigSchema>): string {
  const proteinGrams = Math.round((config.totalCalories * config.proteinPercent / 100) / 4);
  const carbsGrams = Math.round((config.totalCalories * config.carbsPercent / 100) / 4);
  const fatsGrams = Math.round((config.totalCalories * config.fatsPercent / 100) / 9);

  const avoidText = config.avoidFoods.length > 0
    ? `\nALIMENTOS A EVITAR (NO incluir bajo ningún concepto): ${config.avoidFoods.join(", ")}`
    : "";

  return `Eres un nutricionista profesional. Genera exactamente ${config.totalMenus} menú(s) diario(s) completo(s) con las siguientes especificaciones:

OBJETIVOS NUTRICIONALES DIARIOS:
- Calorías totales: ${config.totalCalories} kcal
- Proteínas: ${proteinGrams}g (${config.proteinPercent}%)
- Carbohidratos: ${carbsGrams}g (${config.carbsPercent}%)
- Grasas: ${fatsGrams}g (${config.fatsPercent}%)

ESTRUCTURA:
- Número de comidas por día: ${config.mealsPerDay}
- Número de menús a generar: ${config.totalMenus}
${avoidText}

REGLAS IMPORTANTES:
1. Cada comida debe tener entre 2 y 6 alimentos.
2. Para CADA alimento, proporciona UNA alternativa equivalente con macros similares.
3. Las alternativas deben ser intercambiables sin alterar significativamente los macros totales.
4. Usa alimentos reales, comunes y accesibles.
5. Indica cantidades precisas (en gramos o unidades).
6. Los nombres de las comidas deben ser descriptivos (ej: "Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena").
7. Asegúrate de que la suma de macros de todas las comidas se aproxime a los objetivos diarios.
8. Todos los valores numéricos deben ser enteros (sin decimales).

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
                required: ["mealNumber", "mealName", "calories", "protein", "carbs", "fats", "foods"],
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

  diet: router({
    generate: protectedProcedure
      .input(dietConfigSchema)
      .mutation(async ({ ctx, input }) => {
        // Validate macros sum to ~100%
        const macroSum = input.proteinPercent + input.carbsPercent + input.fatsPercent;
        if (macroSum < 95 || macroSum > 105) {
          throw new Error(`La suma de macronutrientes debe ser aproximadamente 100%. Actual: ${macroSum}%`);
        }

        const prompt = buildDietPrompt(input);

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un nutricionista profesional experto en planificación de dietas. Responde siempre en español. Genera dietas realistas, equilibradas y con alimentos variados." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: dietJsonSchema,
          },
        });

        const content = llmResponse.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("No se pudo generar la dieta. Inténtalo de nuevo.");
        }

        let generatedDiet: GeneratedDiet;
        try {
          generatedDiet = JSON.parse(content);
        } catch {
          throw new Error("Error al procesar la respuesta del generador de dietas.");
        }

        // Save to database
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

        // Send notification to owner
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
  }),
});

export type AppRouter = typeof appRouter;
