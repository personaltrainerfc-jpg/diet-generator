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
  deleteMeal: vi.fn().mockResolvedValue(undefined),
  deleteFood: vi.fn().mockResolvedValue(undefined),
  getMenuById: vi.fn().mockResolvedValue({ id: 1, dietId: 1, menuNumber: 1, totalCalories: 2000, totalProtein: 150, totalCarbs: 225, totalFats: 56, createdAt: new Date() }),
  createMenu: vi.fn().mockResolvedValue(1),
  createMeal: vi.fn().mockResolvedValue(1),
  createFood: vi.fn().mockResolvedValue(1),
  updateMealName: vi.fn().mockResolvedValue(undefined),
  updateMealNotes: vi.fn().mockResolvedValue(undefined),
  updateMealDescription: vi.fn().mockResolvedValue(undefined),
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
  getMealsByMenuId: vi.fn().mockResolvedValue([
    { id: 1, menuId: 1, mealNumber: 1, mealName: "Desayuno", calories: 500, protein: 38, carbs: 56, fats: 14 },
    { id: 2, menuId: 1, mealNumber: 2, mealName: "Almuerzo", calories: 700, protein: 50, carbs: 80, fats: 20 },
  ]),
  getMenusByDietId: vi.fn().mockResolvedValue([]),
  getDietById: vi.fn().mockResolvedValue({ id: 1, userId: 1 }),
  getFoodsByMealId: vi.fn().mockResolvedValue([
    { id: 1, mealId: 1, name: "Avena", quantity: "80g", calories: 300, protein: 10, carbs: 50, fats: 6, alternativeName: "Arroz inflado", alternativeQuantity: "60g", alternativeCalories: 290, alternativeProtein: 8, alternativeCarbs: 52, alternativeFats: 5 },
  ]),
  getDb: vi.fn().mockImplementation(async () => {
    const defaultRow = { id: 1, menuId: 1, dietId: 1, userId: 1, totalCalories: 2000, proteinPercent: 30, carbsPercent: 45, fatsPercent: 25, mealsPerDay: 4 };
    const foodRows = [
      { id: 1, mealId: 1, name: "Avena", quantity: "80g", calories: 300, protein: 10, carbs: 50, fats: 6 },
    ];
    function makeWhereChain() {
      const obj: any = Object.assign(
        Promise.resolve(foodRows),
        { limit: vi.fn().mockResolvedValue([defaultRow]) }
      );
      return obj;
    }
    function makeFromChain() {
      const obj: any = Object.assign(
        Promise.resolve(foodRows),
        {
          where: vi.fn().mockImplementation(() => makeWhereChain()),
          limit: vi.fn().mockResolvedValue([defaultRow]),
        }
      );
      return obj;
    }
    const db: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => makeFromChain()),
      })),
      delete: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    };
    return db;
  }),
}));

// Mock the LLM module - returns different structures based on the prompt
const dietResponse = JSON.stringify({
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
          description: "Porridge de avena con plátano y canela",
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
});

const singleMealResponse = JSON.stringify({
  mealName: "Merienda",
  calories: 400,
  protein: 30,
  carbs: 45,
  fats: 12,
  foods: [
    {
      name: "Yogur griego",
      quantity: "200g",
      calories: 200,
      protein: 20,
      carbs: 10,
      fats: 8,
      alternativeName: "Queso fresco batido",
      alternativeQuantity: "200g",
      alternativeCalories: 180,
      alternativeProtein: 18,
      alternativeCarbs: 12,
      alternativeFats: 6,
    },
    {
      name: "Pl\u00e1tano",
      quantity: "120g",
      calories: 200,
      protein: 10,
      carbs: 35,
      fats: 4,
      alternativeName: "Manzana",
      alternativeQuantity: "150g",
      alternativeCalories: 190,
      alternativeProtein: 8,
      alternativeCarbs: 38,
      alternativeFats: 3,
    },
  ],
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockImplementation(({ messages }: any) => {
    const userMsg = messages.find((m: any) => m.role === "user")?.content || "";
    const isSingleMeal = userMsg.includes("UNA comida");
    return Promise.resolve({
      id: "test",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: isSingleMeal ? singleMealResponse : dietResponse,
          },
          finish_reason: "stop",
        },
      ],
    });
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
      dietType: "equilibrada",
      cookingLevel: "moderate",
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
        dietType: "equilibrada",
        cookingLevel: "moderate",
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
        dietType: "equilibrada",
        cookingLevel: "moderate",
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

describe("diet.addMeal", () => {
  it("adds a meal to a menu and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.addMeal({ menuId: 1, mealName: "Merienda" });
    expect(result.success).toBe(true);
    expect(result.mealId).toBeDefined();
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.addMeal({ menuId: 1, mealName: "Merienda" })).rejects.toThrow();
  });
});

describe("diet.deleteMeal", () => {
  it("deletes a meal successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.deleteMeal({ mealId: 1 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.deleteMeal({ mealId: 1 })).rejects.toThrow();
  });
});

describe("diet.deleteFood", () => {
  it("deletes a food successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.deleteFood({ foodId: 1 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.deleteFood({ foodId: 1 })).rejects.toThrow();
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

describe("diet.addFood", () => {
  it("adds a food to a meal and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.addFood({
      mealId: 1,
      name: "Pechuga de pollo",
      quantity: "150g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fats: 4,
    });
    expect(result.success).toBe(true);
    expect(result.foodId).toBeDefined();
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.addFood({
        mealId: 1,
        name: "Pechuga de pollo",
        quantity: "150g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 4,
      })
    ).rejects.toThrow();
  });

  it("rejects empty food name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.addFood({
        mealId: 1,
        name: "",
        quantity: "150g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 4,
      })
    ).rejects.toThrow();
  });
});

describe("diet.duplicate", () => {
  it("duplicates a diet and returns new dietId", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.duplicate({ id: 1 });
    expect(result.dietId).toBeDefined();
    expect(typeof result.dietId).toBe("number");
  });

  it("duplicates a diet with a custom name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.duplicate({ id: 1, name: "Dieta Juan P\u00e9rez" });
    expect(result.dietId).toBeDefined();
    expect(typeof result.dietId).toBe("number");
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.duplicate({ id: 1 })).rejects.toThrow();
  });
});

describe("diet.updateFood", () => {
  it("updates food quantity with recalcFromDb", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.updateFood({
      foodId: 1,
      quantity: "120g",
      recalcFromDb: true,
    });
    expect(result.success).toBe(true);
  });

  it("updates food name directly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.updateFood({
      foodId: 1,
      name: "Arroz integral",
      calories: 350,
      protein: 8,
      carbs: 70,
      fats: 3,
    });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.updateFood({ foodId: 1, quantity: "120g" })
    ).rejects.toThrow();
  });
});

describe("diet.shoppingList", () => {
  it("returns shopping list items for a diet", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.shoppingList({ id: 1 });
    expect(result).toHaveProperty("dietName");
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.shoppingList({ id: 1 })).rejects.toThrow();
  });
});

describe("diet.updateMealName", () => {
  it("updates meal name successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.updateMealName({
      mealId: 1,
      mealName: "Pre-entreno",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty meal name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.updateMealName({ mealId: 1, mealName: "" })
    ).rejects.toThrow();
  });
});

describe("diet.updateMealNotes", () => {
  it("updates meal notes successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.updateMealNotes({
      mealId: 1,
      notes: "Preparar la noche anterior",
    });
    expect(result.success).toBe(true);
  });

  it("clears meal notes when null", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.updateMealNotes({
      mealId: 1,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes longer than 1000 characters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.updateMealNotes({
        mealId: 1,
        notes: "x".repeat(1001),
      })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.updateMealNotes({ mealId: 1, notes: "test" })
    ).rejects.toThrow();
  });
});

describe("diet.generate with preferences", () => {
  it("generates a diet with preferences parameter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.generate({
      name: "Dieta con Preferencias",
      totalCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      mealsPerDay: 4,
      totalMenus: 1,
      avoidFoods: [],
      dietType: "equilibrada",
      cookingLevel: "moderate",
      preferences: "Para comer me gustaría arroz con pollo",
    });
    expect(result.dietId).toBe(1);
  });

  it("generates a diet without preferences (optional)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.generate({
      name: "Dieta sin Preferencias",
      totalCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      mealsPerDay: 4,
      totalMenus: 1,
      avoidFoods: [],
      dietType: "equilibrada",
      cookingLevel: "moderate",
    });
    expect(result.dietId).toBe(1);
  });
});

describe("diet.redoDiet", () => {
  it("rehacer dieta returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.redoDiet({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.redoDiet({ id: 1 })).rejects.toThrow();
  });
});

describe("diet.regenerateMeal", () => {
  it("regenerates a meal and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.regenerateMeal({ mealId: 1 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.regenerateMeal({ mealId: 1 })
    ).rejects.toThrow();
  });
});

describe("diet.updateMealDescription", () => {
  it("updates meal description successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.updateMealDescription({
      mealId: 1,
      description: "Pechuga de pollo a la plancha con arroz basmati",
    });
    expect(result.success).toBe(true);
  });

  it("clears meal description when null", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.updateMealDescription({
      mealId: 1,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.diet.updateMealDescription({ mealId: 1, description: "Test" })
    ).rejects.toThrow();
  });
});
