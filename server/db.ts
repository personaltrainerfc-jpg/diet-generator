import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertDiet, diets,
  InsertMenu, menus,
  InsertMeal, meals,
  InsertFood, foods,
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
