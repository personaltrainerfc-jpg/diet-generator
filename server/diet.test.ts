import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  createDiet: vi.fn().mockResolvedValue(1),
  getUserDiets: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "Test Diet",
      totalCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      mealsPerDay: 4,
      totalMenus: 1,
      avoidFoods: [],
      createdAt: new Date(),
    },
  ]),
  getFullDiet: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "Test Diet",
    totalCalories: 2000,
    proteinPercent: 30,
    carbsPercent: 45,
    fatsPercent: 25,
    mealsPerDay: 4,
    totalMenus: 1,
    avoidFoods: [],
    createdAt: new Date(),
    menus: [
      {
        id: 1,
        dietId: 1,
        menuNumber: 1,
        totalCalories: 2000,
        totalProtein: 150,
        totalCarbs: 225,
        totalFats: 56,
        createdAt: new Date(),
        meals: [
          {
            id: 1,
            menuId: 1,
            mealNumber: 1,
            mealName: "Desayuno",
            calories: 500,
            protein: 38,
            carbs: 56,
            fats: 14,
            foods: [
              {
                id: 1,
                mealId: 1,
                name: "Avena",
                quantity: "80g",
                calories: 300,
                protein: 10,
                carbs: 50,
                fats: 6,
                alternativeName: "Arroz inflado",
                alternativeQuantity: "60g",
                alternativeCalories: 290,
                alternativeProtein: 8,
                alternativeCarbs: 52,
                alternativeFats: 5,
              },
            ],
          },
        ],
      },
    ],
  }),
  deleteDiet: vi.fn().mockResolvedValue(undefined),
  createMenu: vi.fn().mockResolvedValue(1),
  createMeal: vi.fn().mockResolvedValue(1),
  createFood: vi.fn().mockResolvedValue(1),
  updateMealName: vi.fn().mockResolvedValue(undefined),
  updateFood: vi.fn().mockResolvedValue(undefined),
  getMealById: vi.fn().mockResolvedValue({
    id: 1,
    menuId: 1,
    mealNumber: 1,
    mealName: "Desayuno",
    calories: 500,
    protein: 38,
    carbs: 56,
    fats: 14,
  }),
  getFoodById: vi.fn().mockResolvedValue({
    id: 1,
    mealId: 1,
    name: "Avena",
    quantity: "80g",
    calories: 300,
    protein: 10,
    carbs: 50,
    fats: 6,
    alternativeName: "Arroz inflado",
    alternativeQuantity: "60g",
    alternativeCalories: 290,
    alternativeProtein: 8,
    alternativeCarbs: 52,
    alternativeFats: 5,
  }),
  updateMealMacros: vi.fn().mockResolvedValue({ calories: 500, protein: 38, carbs: 56, fats: 14 }),
  updateMenuMacros: vi.fn().mockResolvedValue({ totalCalories: 2000, totalProtein: 150, totalCarbs: 225, totalFats: 56 }),
  getMealsByMenuId: vi.fn().mockResolvedValue([]),
  getMenusByDietId: vi.fn().mockResolvedValue([]),
  getDietById: vi.fn().mockResolvedValue({ id: 1, userId: 1 }),
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 1, menuId: 1, dietId: 1, userId: 1 }]),
  }),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test",
    created: Date.now(),
    model: "test",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            menus: [
              {
                menuNumber: 1,
                totalCalories: 2000,
                totalProtein: 150,
                totalCarbs: 225,
                totalFats: 56,
                meals: [
                  {
                    mealNumber: 1,
                    mealName: "Desayuno",
                    calories: 500,
                    protein: 38,
                    carbs: 56,
                    fats: 14,
                    foods: [
                      {
                        name: "Avena",
                        quantity: "80g",
                        calories: 300,
                        protein: 10,
                        carbs: 50,
                        fats: 6,
                        alternativeName: "Arroz inflado",
                        alternativeQuantity: "60g",
                        alternativeCalories: 290,
                        alternativeProtein: 8,
                        alternativeCarbs: 52,
                        alternativeFats: 5,
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("diet.list", () => {
  it("returns user diets when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Diet");
    expect(result[0].totalCalories).toBe(2000);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.list()).rejects.toThrow();
  });
});

describe("diet.getById", () => {
  it("returns full diet with menus, meals and foods", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.getById({ id: 1 });
    expect(result.name).toBe("Test Diet");
    expect(result.menus).toHaveLength(1);
    expect(result.menus[0].meals).toHaveLength(1);
    expect(result.menus[0].meals[0].foods).toHaveLength(1);
    expect(result.menus[0].meals[0].foods[0].alternativeName).toBe("Arroz inflado");
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.getById({ id: 1 })).rejects.toThrow();
  });
});

describe("diet.generate", () => {
  it("generates a diet and returns dietId", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.generate({
      name: "Test Diet",
      totalCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      mealsPerDay: 4,
      totalMenus: 1,
      avoidFoods: [],
    });
    expect(result.dietId).toBe(1);
  });

  it("rejects invalid macro percentages", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.generate({
        name: "Bad Diet",
        totalCalories: 2000,
        proteinPercent: 50,
        carbsPercent: 50,
        fatsPercent: 50,
        mealsPerDay: 4,
        totalMenus: 1,
        avoidFoods: [],
      })
    ).rejects.toThrow(/macronutrientes/);
  });

  it("rejects calories below minimum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.generate({
        name: "Low Cal",
        totalCalories: 100,
        proteinPercent: 30,
        carbsPercent: 45,
        fatsPercent: 25,
        mealsPerDay: 4,
        totalMenus: 1,
        avoidFoods: [],
      })
    ).rejects.toThrow();
  });
});

describe("diet.delete", () => {
  it("deletes a diet successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("foodDb.search", () => {
  it("returns food results for a valid query", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.foodDb.search({ query: "pollo" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    // Each result should have nutritional info
    for (const food of result) {
      expect(food).toHaveProperty("name");
      expect(food).toHaveProperty("calories");
      expect(food).toHaveProperty("protein");
      expect(food).toHaveProperty("carbs");
      expect(food).toHaveProperty("fats");
    }
  });

  it("returns results for arroz", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.foodDb.search({ query: "arroz" });
    expect(result.length).toBeGreaterThan(0);
    const names = result.map((f) => f.name.toLowerCase());
    expect(names.some((n) => n.includes("arroz"))).toBe(true);
  });

  it("returns empty array for nonsense query", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.foodDb.search({ query: "xyznonexistent" });
    expect(result).toHaveLength(0);
  });

  it("rejects query shorter than 2 characters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.foodDb.search({ query: "a" })).rejects.toThrow();
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.foodDb.search({ query: "pollo" })).rejects.toThrow();
  });
});
