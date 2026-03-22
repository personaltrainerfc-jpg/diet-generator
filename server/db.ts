import { eq, desc, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertDiet, diets,
  InsertMenu, menus,
  InsertMeal, meals,
  InsertFood, foods,
  InsertRecipe, recipes,
  InsertRecipeIngredient, recipeIngredients,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Diet helpers ──

export async function createDiet(diet: InsertDiet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(diets).values(diet);
  return result[0].insertId;
}

export async function getUserDiets(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(diets).where(eq(diets.userId, userId)).orderBy(desc(diets.createdAt));
}

export async function getDietById(dietId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(diets).where(eq(diets.id, dietId)).limit(1);
  return result[0] ?? null;
}

export async function deleteDiet(dietId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get menus for this diet
  const dietMenus = await db.select().from(menus).where(eq(menus.dietId, dietId));
  for (const menu of dietMenus) {
    // Get meals for this menu
    const menuMeals = await db.select().from(meals).where(eq(meals.menuId, menu.id));
    for (const meal of menuMeals) {
      await db.delete(foods).where(eq(foods.mealId, meal.id));
    }
    await db.delete(meals).where(eq(meals.menuId, menu.id));
  }
  await db.delete(menus).where(eq(menus.dietId, dietId));
  await db.delete(diets).where(eq(diets.id, dietId));
}

// ── Menu helpers ──

export async function createMenu(menu: InsertMenu) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(menus).values(menu);
  return result[0].insertId;
}

export async function getMenusByDietId(dietId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menus).where(eq(menus.dietId, dietId));
}

// ── Meal helpers ──

export async function createMeal(meal: InsertMeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(meals).values(meal);
  return result[0].insertId;
}

export async function getMealsByMenuId(menuId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(meals).where(eq(meals.menuId, menuId));
}

// ── Food helpers ──

export async function createFood(food: InsertFood) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(foods).values(food);
  return result[0].insertId;
}

export async function getFoodsByMealId(mealId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(foods).where(eq(foods.mealId, mealId));
}

// ── Update helpers ──

export async function updateMealName(mealId: number, mealName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meals).set({ mealName }).where(eq(meals.id, mealId));
}

export async function updateMealNotes(mealId: number, notes: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meals).set({ notes }).where(eq(meals.id, mealId));
}

export async function updateMealDescription(mealId: number, description: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meals).set({ description }).where(eq(meals.id, mealId));
}

export async function updateFood(foodId: number, data: Partial<InsertFood>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(foods).set(data).where(eq(foods.id, foodId));
}

export async function getMealById(mealId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(meals).where(eq(meals.id, mealId)).limit(1);
  return result[0] ?? null;
}

export async function getFoodById(foodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(foods).where(eq(foods.id, foodId)).limit(1);
  return result[0] ?? null;
}

export async function updateMealMacros(mealId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const mealFoods = await getFoodsByMealId(mealId);
  const totals = mealFoods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fats: acc.fats + f.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
  await db.update(meals).set(totals).where(eq(meals.id, mealId));
  return totals;
}

export async function updateMenuMacros(menuId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const menuMeals = await getMealsByMenuId(menuId);
  const totals = menuMeals.reduce(
    (acc, m) => ({
      totalCalories: acc.totalCalories + m.calories,
      totalProtein: acc.totalProtein + m.protein,
      totalCarbs: acc.totalCarbs + m.carbs,
      totalFats: acc.totalFats + m.fats,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
  );
  await db.update(menus).set(totals).where(eq(menus.id, menuId));
  return totals;
}

// ── Delete meal and its foods ──

export async function deleteMeal(mealId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(foods).where(eq(foods.mealId, mealId));
  await db.delete(meals).where(eq(meals.id, mealId));
}

export async function deleteFood(foodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(foods).where(eq(foods.id, foodId));
}

export async function getMenuById(menuId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(menus).where(eq(menus.id, menuId)).limit(1);
  return result[0] ?? null;
}

// ── Full diet with all nested data ──

export async function getFullDiet(dietId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const diet = await getDietById(dietId);
  if (!diet) return null;

  const dietMenus = await getMenusByDietId(dietId);
  const fullMenus = await Promise.all(
    dietMenus.map(async (menu) => {
      const menuMeals = await getMealsByMenuId(menu.id);
      const fullMeals = await Promise.all(
        menuMeals.map(async (meal) => {
          const mealFoods = await getFoodsByMealId(meal.id);
          return { ...meal, foods: mealFoods };
        })
      );
      return { ...menu, meals: fullMeals };
    })
  );

  return { ...diet, menus: fullMenus };
}

// ── Recipe helpers ──

export async function createRecipe(recipe: InsertRecipe) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipes).values(recipe);
  return result[0].insertId;
}

export async function getUserRecipes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(recipes).where(
    or(eq(recipes.userId, userId), eq(recipes.isSystem, 1))
  ).orderBy(desc(recipes.createdAt));
}

export async function getRecipeById(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  return result[0] ?? null;
}

export async function deleteRecipe(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  await db.delete(recipes).where(eq(recipes.id, recipeId));
}

export async function addRecipeIngredient(ingredient: InsertRecipeIngredient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipeIngredients).values(ingredient);
  return result[0].insertId;
}

export async function getRecipeIngredients(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
}

export async function deleteRecipeIngredient(ingredientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(recipeIngredients).where(eq(recipeIngredients.id, ingredientId));
}

export async function updateRecipeMacros(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ingredients = await getRecipeIngredients(recipeId);
  const totals = ingredients.reduce(
    (acc, i) => ({
      totalCalories: acc.totalCalories + i.calories,
      totalProtein: acc.totalProtein + i.protein,
      totalCarbs: acc.totalCarbs + i.carbs,
      totalFats: acc.totalFats + i.fats,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
  );
  await db.update(recipes).set(totals).where(eq(recipes.id, recipeId));
  return totals;
}

export async function getFullRecipe(recipeId: number) {
  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;
  const ingredients = await getRecipeIngredients(recipeId);
  return { ...recipe, ingredients };
}

// ── Update diet macros (recalculate after adjustments) ──

export async function updateDietCalories(dietId: number, totalCalories: number, proteinPercent: number, carbsPercent: number, fatsPercent: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(diets).set({ totalCalories, proteinPercent, carbsPercent, fatsPercent }).where(eq(diets.id, dietId));
}

// ── Copy meal to another menu ──

export async function copyMealToMenu(mealId: number, targetMenuId: number, mealNumber: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const meal = await getMealById(mealId);
  if (!meal) throw new Error("Comida no encontrada");
  const mealFoods = await getFoodsByMealId(mealId);

  const newMealId = await createMeal({
    menuId: targetMenuId,
    mealNumber,
    mealName: meal.mealName,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats,
    notes: meal.notes,
    description: meal.description,
  });

  for (const food of mealFoods) {
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

  return newMealId;
}

// ── Supplement helpers ──

import { supplements, InsertSupplement, folders, InsertFolder, customFoods, InsertCustomFood, dietInstructions, InsertDietInstruction } from "../drizzle/schema";

export async function getSupplementsByDietId(dietId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(supplements).where(eq(supplements.dietId, dietId));
}

export async function createSupplement(supp: InsertSupplement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplements).values(supp);
  return result[0].insertId;
}

export async function updateSupplement(id: number, data: Partial<InsertSupplement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(supplements).set(data).where(eq(supplements.id, id));
}

export async function deleteSupplement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplements).where(eq(supplements.id, id));
}

// ── Folder helpers ──

export async function getUserFolders(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(folders).where(eq(folders.userId, userId)).orderBy(desc(folders.createdAt));
}

export async function createFolder(folder: InsertFolder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(folders).values(folder);
  return result[0].insertId;
}

export async function deleteFolder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Unassign diets from this folder
  await db.update(diets).set({ folderId: null }).where(eq(diets.folderId, id));
  await db.delete(folders).where(eq(folders.id, id));
}

export async function renameFolder(id: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(folders).set({ name }).where(eq(folders.id, id));
}

export async function moveDietToFolder(dietId: number, folderId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(diets).set({ folderId }).where(eq(diets.id, dietId));
}

// ── Custom Food helpers ──

export async function getUserCustomFoods(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customFoods).where(eq(customFoods.userId, userId)).orderBy(desc(customFoods.createdAt));
}

export async function createCustomFood(food: InsertCustomFood) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customFoods).values(food);
  return result[0].insertId;
}

export async function deleteCustomFood(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customFoods).where(eq(customFoods.id, id));
}

// ── Diet Instructions helpers ──

export async function getDietInstructions(dietId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(dietInstructions).where(eq(dietInstructions.dietId, dietId)).limit(1);
  return result[0] ?? null;
}

export async function upsertDietInstructions(dietId: number, data: Partial<InsertDietInstruction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getDietInstructions(dietId);
  if (existing) {
    await db.update(dietInstructions).set(data).where(eq(dietInstructions.dietId, dietId));
  } else {
    await db.insert(dietInstructions).values({ dietId, ...data });
  }
}

// ── Reorder foods within a meal ──

export async function reorderFoods(mealId: number, foodIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < foodIds.length; i++) {
    await db.update(foods).set({ sortOrder: i }).where(eq(foods.id, foodIds[i]));
  }
}

// ── Toggle meal enabled/disabled ──

export async function toggleMealEnabled(mealId: number, enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(meals).set({ enabled: enabled ? 1 : 0 }).where(eq(meals.id, mealId));
}

// ── Save meal as recipe ──

export async function saveMealAsRecipe(mealId: number, userId: number) {
  const meal = await getMealById(mealId);
  if (!meal) throw new Error("Comida no encontrada");
  const mealFoods = await getFoodsByMealId(mealId);

  const recipeId = await createRecipe({
    userId,
    name: meal.description || meal.mealName,
    totalCalories: meal.calories,
    totalProtein: meal.protein,
    totalCarbs: meal.carbs,
    totalFats: meal.fats,
  });

  for (const food of mealFoods) {
    await addRecipeIngredient({
      recipeId,
      name: food.name,
      quantity: food.quantity,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    });
  }

  return recipeId;
}

// ── Get folder by ID ──

export async function getFolderById(folderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
  return result[0] ?? null;
}

// ── Get supplement by ID ──

export async function getSupplementById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(supplements).where(eq(supplements.id, id)).limit(1);
  return result[0] ?? null;
}
