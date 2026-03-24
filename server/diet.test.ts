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
  createRecipe: vi.fn().mockResolvedValue(1),
  getUserRecipes: vi.fn().mockResolvedValue([]),
  getRecipeWithIngredients: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Pollo al curry", createdAt: new Date(), ingredients: [{ id: 1, recipeId: 1, name: "Pollo", quantity: "200g", calories: 330, protein: 62, carbs: 0, fats: 8 }] }),
  deleteRecipe: vi.fn().mockResolvedValue(undefined),
  updateDietMacros: vi.fn().mockResolvedValue(undefined),
  copyMealToMenu: vi.fn().mockResolvedValue(5),
  getRecipeById: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Pollo al curry", createdAt: new Date() }),
  updateDietCalories: vi.fn().mockResolvedValue(undefined),
  addRecipeIngredient: vi.fn().mockResolvedValue(1),
  deleteRecipeIngredient: vi.fn().mockResolvedValue(undefined),
  updateRecipeMacros: vi.fn().mockResolvedValue(undefined),
  getFullRecipe: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Pollo al curry", createdAt: new Date(), ingredients: [{ id: 1, recipeId: 1, name: "Pollo", quantity: "200g", calories: 330, protein: 62, carbs: 0, fats: 8 }] }),
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

// Dynamic mock that generates the correct number of menus with realistic calories
function buildDietResponse(totalMenus: number, targetCalories: number) {
  const menus = [];
  for (let i = 1; i <= totalMenus; i++) {
    const halfCal = Math.round(targetCalories / 2);
    const otherHalf = targetCalories - halfCal;
    menus.push({
      menuNumber: i,
      totalCalories: targetCalories,
      totalProtein: 150,
      totalCarbs: 225,
      totalFats: 56,
      meals: [
        {
          mealNumber: 1,
          mealName: "Desayuno",
          description: "Porridge de avena con plátano y canela",
          calories: halfCal,
          protein: 38,
          carbs: 56,
          fats: 14,
          foods: [
            {
              name: `Avena menú ${i}`,
              quantity: "80g",
              calories: halfCal,
              protein: 20,
              carbs: 50,
              fats: 6,
              alternativeName: "Arroz inflado",
              alternativeQuantity: "60g",
              alternativeCalories: halfCal,
              alternativeProtein: 18,
              alternativeCarbs: 52,
              alternativeFats: 5,
            },
          ],
        },
        {
          mealNumber: 2,
          mealName: "Comida",
          description: "Pollo a la plancha con arroz",
          calories: otherHalf,
          protein: 40,
          carbs: 60,
          fats: 15,
          foods: [
            {
              name: `Pollo menú ${i}`,
              quantity: "150g",
              calories: otherHalf,
              protein: 40,
              carbs: 60,
              fats: 15,
              alternativeName: "Pavo a la plancha",
              alternativeQuantity: "150g",
              alternativeCalories: otherHalf,
              alternativeProtein: 38,
              alternativeCarbs: 58,
              alternativeFats: 12,
            },
          ],
        },
      ],
    });
  }
  return JSON.stringify({ menus });
}

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

    // Parse totalMenus and totalCalories from the prompt
    let totalMenus = 1;
    let targetCalories = 2000;
    const menusMatch = userMsg.match(/EXACTAMENTE (\d+) menú/);
    if (menusMatch) totalMenus = parseInt(menusMatch[1], 10);
    const calMatch = userMsg.match(/Calorías totales: (\d+) kcal/);
    if (calMatch) targetCalories = parseInt(calMatch[1], 10);

    const content = isSingleMeal
      ? singleMealResponse
      : buildDietResponse(totalMenus, targetCalories);

    return Promise.resolve({
      id: "test",
      created: Date.now(),
      model: "test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
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

// Mock clientDb
vi.mock("./clientDb", () => ({
  getClientById: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", trainerId: 1, status: "active" }),
  assignDietToClient: vi.fn().mockResolvedValue({ id: 1 }),
  getClientsByTrainer: vi.fn().mockResolvedValue([]),
  getClientByAccessCode: vi.fn().mockResolvedValue(null),
  updateClient: vi.fn().mockResolvedValue(undefined),
  deleteClient: vi.fn().mockResolvedValue(undefined),
  createClient: vi.fn().mockResolvedValue({ id: 1 }),
  getClientActiveDiet: vi.fn().mockResolvedValue(null),
  getClientDietHistory: vi.fn().mockResolvedValue([]),
  logAdherence: vi.fn().mockResolvedValue({ id: 1 }),
  getAdherenceByDate: vi.fn().mockResolvedValue(null),
  getAdherenceRange: vi.fn().mockResolvedValue([]),
  addProgressPhoto: vi.fn().mockResolvedValue({ id: 1 }),
  getProgressPhotos: vi.fn().mockResolvedValue([]),
  deleteProgressPhoto: vi.fn().mockResolvedValue(undefined),
  createCheckIn: vi.fn().mockResolvedValue({ id: 1 }),
  getCheckIns: vi.fn().mockResolvedValue([]),
  updateCheckInFeedback: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue({ id: 1 }),
  getMessages: vi.fn().mockResolvedValue([]),
  markMessagesRead: vi.fn().mockResolvedValue(undefined),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  createAchievement: vi.fn().mockResolvedValue({ id: 1 }),
  getAchievements: vi.fn().mockResolvedValue([]),
  deleteAchievement: vi.fn().mockResolvedValue(undefined),
  unlockAchievement: vi.fn().mockResolvedValue({ id: 1 }),
  getClientAchievements: vi.fn().mockResolvedValue([]),
  addMeasurement: vi.fn().mockResolvedValue({ id: 1 }),
  getMeasurements: vi.fn().mockResolvedValue([]),
  deleteMeasurement: vi.fn().mockResolvedValue(undefined),
  createAssessment: vi.fn().mockResolvedValue({ id: 1 }),
  getAssessment: vi.fn().mockResolvedValue(null),
  updateAssessment: vi.fn().mockResolvedValue(undefined),
  getTrainerDashboardStats: vi.fn().mockResolvedValue({ totalClients: 0, activeClients: 0, totalDiets: 0, pendingCheckIns: 0 }),
  createDietTemplate: vi.fn().mockResolvedValue({ id: 1 }),
  getDietTemplates: vi.fn().mockResolvedValue([]),
  deleteDietTemplate: vi.fn().mockResolvedValue(undefined),
  getClientFavoriteFoods: vi.fn().mockResolvedValue([]),
  addClientFavoriteFood: vi.fn().mockResolvedValue({ id: 1 }),
  deleteClientFavoriteFood: vi.fn().mockResolvedValue(undefined),
  createClientTag: vi.fn().mockResolvedValue({ id: 1 }),
  getClientTags: vi.fn().mockResolvedValue([]),
  deleteClientTag: vi.fn().mockResolvedValue(undefined),
  assignClientTag: vi.fn().mockResolvedValue(undefined),
  removeClientTag: vi.fn().mockResolvedValue(undefined),
  getClientTagAssignments: vi.fn().mockResolvedValue([]),
  createClientInvitation: vi.fn().mockResolvedValue({ id: 1 }),
  getClientInvitations: vi.fn().mockResolvedValue([]),
  getClientInvitationByToken: vi.fn().mockResolvedValue(null),
  acceptClientInvitation: vi.fn().mockResolvedValue(undefined),
  deleteClientInvitation: vi.fn().mockResolvedValue(undefined),
  getHydrationLogs: vi.fn().mockResolvedValue([]),
  logHydration: vi.fn().mockResolvedValue({ id: 1 }),
  getSleepLogs: vi.fn().mockResolvedValue([]),
  logSleep: vi.fn().mockResolvedValue({ id: 1 }),
  getWellnessLogs: vi.fn().mockResolvedValue([]),
  logWellness: vi.fn().mockResolvedValue({ id: 1 }),
  getWeekendFeedback: vi.fn().mockResolvedValue([]),
  logWeekendFeedback: vi.fn().mockResolvedValue({ id: 1 }),
  getWeekendMeals: vi.fn().mockResolvedValue([]),
  logWeekendMeal: vi.fn().mockResolvedValue({ id: 1 }),
  getMealReminders: vi.fn().mockResolvedValue([]),
  setMealReminder: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMealReminder: vi.fn().mockResolvedValue(undefined),
  getMotivationLogs: vi.fn().mockResolvedValue([]),
  logMotivation: vi.fn().mockResolvedValue({ id: 1 }),
  getActivityLogs: vi.fn().mockResolvedValue([]),
  logActivity: vi.fn().mockResolvedValue({ id: 1 }),
  getActivityStreaks: vi.fn().mockResolvedValue(null),
  getActivityBadges: vi.fn().mockResolvedValue([]),
  getClientActivityBadges: vi.fn().mockResolvedValue([]),
  awardActivityBadge: vi.fn().mockResolvedValue({ id: 1 }),
  getWearableConnections: vi.fn().mockResolvedValue([]),
  connectWearable: vi.fn().mockResolvedValue({ id: 1 }),
  disconnectWearable: vi.fn().mockResolvedValue(undefined),
  getAiEscalationAlerts: vi.fn().mockResolvedValue([]),
  createAiEscalationAlert: vi.fn().mockResolvedValue({ id: 1 }),
  resolveAiEscalationAlert: vi.fn().mockResolvedValue(undefined),
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

describe("recipe.create", () => {
  it("creates a recipe with ingredients", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.create({
      name: "Pollo al curry",
      ingredients: [
        { name: "Pollo", quantity: "200g", calories: 330, protein: 62, carbs: 0, fats: 8 },
        { name: "Arroz basmati", quantity: "100g", calories: 350, protein: 7, carbs: 78, fats: 1 },
      ],
    });
    expect(result.recipeId).toBe(1);
  });

  it("rejects empty recipe name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.recipe.create({
        name: "",
        ingredients: [{ name: "Pollo", quantity: "200g", calories: 330, protein: 62, carbs: 0, fats: 8 }],
      })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.recipe.create({
        name: "Test",
        ingredients: [{ name: "Pollo", quantity: "200g", calories: 330, protein: 62, carbs: 0, fats: 8 }],
      })
    ).rejects.toThrow();
  });
});

describe("recipe.list", () => {
  it("returns user recipes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.recipe.list()).rejects.toThrow();
  });
});

describe("recipe.delete", () => {
  it("deletes a recipe", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.recipe.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("dietAdjust.adjustMacros", () => {
  it("adjusts macros for a diet", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dietAdjust.adjustMacros({
      dietId: 1,
      totalCalories: 2500,
      proteinPercent: 35,
      carbsPercent: 40,
      fatsPercent: 25,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid macro percentages", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dietAdjust.adjustMacros({
        dietId: 1,
        totalCalories: 2500,
        proteinPercent: 50,
        carbsPercent: 50,
        fatsPercent: 50,
      })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dietAdjust.adjustMacros({
        dietId: 1,
        totalCalories: 2500,
        proteinPercent: 35,
        carbsPercent: 40,
        fatsPercent: 25,
      })
    ).rejects.toThrow();
  });
});

describe("dietAdjust.copyMeal", () => {
  it("copies a meal to another menu", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dietAdjust.copyMeal({
      mealId: 1,
      targetMenuId: 1,
    });
    expect(result.newMealId).toBeDefined();
    expect(typeof result.newMealId).toBe("number");
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dietAdjust.copyMeal({ mealId: 1, targetMenuId: 1 })
    ).rejects.toThrow();
  });
});

describe("dietAdjust.generateGuide", () => {
  it("generates a nutritional guide", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dietAdjust.generateGuide({ dietId: 1 });
    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dietAdjust.generateGuide({ dietId: 1 })
    ).rejects.toThrow();
  });
});

describe("diet.generate with new options", () => {
  it("generates a diet with medidas caseras and supermercado options", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.generate({
      name: "Dieta con opciones",
      totalCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      mealsPerDay: 4,
      totalMenus: 1,
      avoidFoods: [],
      dietType: "equilibrada",
      cookingLevel: "moderate",
      useHomeMeasures: true,
      useSupermarketProducts: true,
      caloriesPerDay: "same",
    });
    expect(result.dietId).toBe(1);
  });

  it("generates a diet with variable calories per day", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.diet.generate({
      name: "Dieta variable",
      totalCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      mealsPerDay: 4,
      totalMenus: 3,
      avoidFoods: [],
      dietType: "equilibrada",
      cookingLevel: "moderate",
      caloriesPerDay: "variable",
    });
    expect(result.dietId).toBe(1);
  });
});

describe("diet.createManual", () => {
  it("creates an empty diet with specified menus and meals", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createDiet, createMenu, createMeal } = await import("./db");

    // Reset mocks
    vi.mocked(createDiet).mockClear();
    vi.mocked(createMenu).mockClear();
    vi.mocked(createMeal).mockClear();

    const result = await caller.diet.createManual({
      name: "Dieta Manual Test",
      totalCalories: 2500,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      totalMenus: 2,
      mealNames: ["Desayuno", "Comida", "Cena"],
    });

    expect(result.dietId).toBe(1);
    // Should create 1 diet
    expect(createDiet).toHaveBeenCalledTimes(1);
    expect(createDiet).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      name: "Dieta Manual Test",
      totalCalories: 2500,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      totalMenus: 2,
      mealsPerDay: 3,
      dietType: "personalizada",
    }));
    // Should create 2 menus
    expect(createMenu).toHaveBeenCalledTimes(2);
    // Should create 3 meals per menu = 6 total
    expect(createMeal).toHaveBeenCalledTimes(6);
    // Verify meal names
    const mealCalls = vi.mocked(createMeal).mock.calls;
    expect(mealCalls[0][0]).toMatchObject({ mealName: "Desayuno", mealNumber: 1, calories: 0 });
    expect(mealCalls[1][0]).toMatchObject({ mealName: "Comida", mealNumber: 2, calories: 0 });
    expect(mealCalls[2][0]).toMatchObject({ mealName: "Cena", mealNumber: 3, calories: 0 });
  });

  it("creates single menu with single meal", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createDiet, createMenu, createMeal } = await import("./db");

    vi.mocked(createDiet).mockClear();
    vi.mocked(createMenu).mockClear();
    vi.mocked(createMeal).mockClear();

    const result = await caller.diet.createManual({
      name: "Mini Dieta",
      totalCalories: 1500,
      totalMenus: 1,
      mealNames: ["Desayuno"],
    });

    expect(result.dietId).toBe(1);
    expect(createDiet).toHaveBeenCalledTimes(1);
    expect(createMenu).toHaveBeenCalledTimes(1);
    expect(createMeal).toHaveBeenCalledTimes(1);
  });

  it("uses default macro percentages when not specified", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createDiet } = await import("./db");

    vi.mocked(createDiet).mockClear();

    await caller.diet.createManual({
      name: "Default Macros",
      totalCalories: 2000,
      totalMenus: 1,
      mealNames: ["Desayuno"],
    });

    expect(createDiet).toHaveBeenCalledWith(expect.objectContaining({
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
    }));
  });

  it("throws UNAUTHORIZED when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.createManual({
      name: "Unauthorized",
      totalCalories: 2000,
      totalMenus: 1,
      mealNames: ["Desayuno"],
    })).rejects.toThrow();
  });

  it("rejects invalid input (empty meal names)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.diet.createManual({
      name: "Bad Input",
      totalCalories: 2000,
      totalMenus: 1,
      mealNames: [],
    })).rejects.toThrow();
  });

  it("calculates correct menu macros from percentages", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createMenu } = await import("./db");

    vi.mocked(createMenu).mockClear();

    await caller.diet.createManual({
      name: "Macro Check",
      totalCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 45,
      fatsPercent: 25,
      totalMenus: 1,
      mealNames: ["Desayuno"],
    });

    // protein: 2000 * 30/100 / 4 = 150g
    // carbs: 2000 * 45/100 / 4 = 225g
    // fats: 2000 * 25/100 / 9 = 56g
    expect(createMenu).toHaveBeenCalledWith(expect.objectContaining({
      totalCalories: 2000,
      totalProtein: 150,
      totalCarbs: 225,
      totalFats: 56,
    }));
  });
});

describe("diet.createManual - creationMethod and clientId", () => {
  it("sets creationMethod to 'manual' on createDiet call", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { createDiet } = await import("./db");

    vi.mocked(createDiet).mockClear();

    await caller.diet.createManual({
      name: "Manual Method Test",
      totalCalories: 2000,
      totalMenus: 1,
      mealNames: ["Desayuno"],
    });

    expect(createDiet).toHaveBeenCalledWith(expect.objectContaining({
      creationMethod: "manual",
    }));
  });

  it("assigns diet to client when clientId is provided", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { assignDietToClient, getClientById } = await import("./clientDb");

    vi.mocked(assignDietToClient).mockClear();
    vi.mocked(getClientById).mockClear();

    await caller.diet.createManual({
      name: "Client Diet",
      totalCalories: 2000,
      totalMenus: 1,
      mealNames: ["Desayuno"],
      clientId: 1,
    });

    expect(getClientById).toHaveBeenCalledWith(1);
    expect(assignDietToClient).toHaveBeenCalledWith(1, 1); // clientId, dietId
  });

  it("does not assign diet when clientId is not provided", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { assignDietToClient } = await import("./clientDb");

    vi.mocked(assignDietToClient).mockClear();

    await caller.diet.createManual({
      name: "No Client Diet",
      totalCalories: 2000,
      totalMenus: 1,
      mealNames: ["Desayuno"],
    });

    expect(assignDietToClient).not.toHaveBeenCalled();
  });

  it("throws error when clientId belongs to another trainer", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { getClientById } = await import("./clientDb");

    vi.mocked(getClientById).mockResolvedValueOnce({ id: 2, name: "Other Client", trainerId: 999, status: "active" } as any);

    await expect(caller.diet.createManual({
      name: "Wrong Trainer",
      totalCalories: 2000,
      totalMenus: 1,
      mealNames: ["Desayuno"],
      clientId: 2,
    })).rejects.toThrow("No tienes acceso a este cliente");
  });
});
