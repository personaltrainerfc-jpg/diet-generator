import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  createDiet: vi.fn(),
  getUserDiets: vi.fn().mockResolvedValue([]),
  getFullDiet: vi.fn(),
  deleteDiet: vi.fn(),
  updateDietName: vi.fn(),
  duplicateDiet: vi.fn(),
  getUserRecipes: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Tostada integral", totalCalories: 267, totalProtein: 18, totalCarbs: 29, totalFats: 9, category: "desayuno", isSystem: 0 },
    { id: 100, userId: 0, name: "Lentejas estofadas", totalCalories: 473, totalProtein: 23, totalCarbs: 67, totalFats: 11, category: "comida", isSystem: 1 },
    { id: 101, userId: 0, name: "Merluza al horno", totalCalories: 303, totalProtein: 36, totalCarbs: 13, totalFats: 12, category: "cena", isSystem: 1 },
  ]),
  createRecipe: vi.fn().mockResolvedValue(2),
  getRecipeWithIngredients: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "Test Recipe",
    totalCalories: 300,
    totalProtein: 20,
    totalCarbs: 30,
    totalFats: 10,
    category: "desayuno",
    isSystem: 0,
    ingredients: [],
  }),
  deleteRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  saveMealAsRecipe: vi.fn().mockResolvedValue(3),
  getUserCustomFoods: vi.fn().mockResolvedValue([]),
  createCustomFood: vi.fn().mockResolvedValue(1),
  updateCustomFood: vi.fn(),
  deleteCustomFood: vi.fn(),
  getUserTemplates: vi.fn().mockResolvedValue([]),
  createTemplate: vi.fn().mockResolvedValue(1),
  deleteTemplate: vi.fn(),
  getTemplateById: vi.fn(),
  updateDiet: vi.fn(),
  updateMealName: vi.fn(),
  updateMealDescription: vi.fn(),
  updateFoodInMeal: vi.fn(),
  addFoodToMeal: vi.fn().mockResolvedValue(1),
  removeFoodFromMeal: vi.fn(),
  addMealToMenu: vi.fn().mockResolvedValue(1),
  removeMealFromMenu: vi.fn(),
  updateFoodGrams: vi.fn(),
  updateMealSortOrders: vi.fn(),
  copyMealToDay: vi.fn().mockResolvedValue(1),
  addSupplementToDiet: vi.fn().mockResolvedValue(1),
  removeSupplementFromDiet: vi.fn(),
  updateSupplement: vi.fn(),
  getDietSupplements: vi.fn().mockResolvedValue([]),
  updateDietInstructions: vi.fn(),
  getDietInstructions: vi.fn().mockResolvedValue(null),
  getUserFavorites: vi.fn().mockResolvedValue([]),
  addFavoriteFood: vi.fn().mockResolvedValue(1),
  removeFavoriteFood: vi.fn(),
}));

vi.mock("./server/_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./server/_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const createCaller = (user: { id: number; name: string; role: string } | null) => {
  const ctx: TrpcContext = {
    user: user as any,
  };
  return appRouter.createCaller(ctx);
};

describe("System Recipes (isSystem)", () => {
  it("should return both user and system recipes", async () => {
    const caller = createCaller({ id: 1, name: "Test User", role: "admin" });
    const recipes = await caller.recipe.list();
    expect(recipes).toHaveLength(3);
    // System recipes included
    const systemRecipes = recipes.filter((r: any) => r.isSystem === 1);
    expect(systemRecipes.length).toBeGreaterThanOrEqual(2);
  });

  it("should include category field in recipes", async () => {
    const caller = createCaller({ id: 1, name: "Test User", role: "admin" });
    const recipes = await caller.recipe.list();
    const withCategory = recipes.filter((r: any) => r.category);
    expect(withCategory.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Typography and Legibility", () => {
  it("should have Plus Jakarta Sans configured", async () => {
    const fs = await import("fs");
    const indexHtml = fs.readFileSync("/home/ubuntu/diet-generator/client/index.html", "utf-8");
    expect(indexHtml).toContain("Plus+Jakarta+Sans");
    expect(indexHtml).toContain("800"); // ExtraBold weight
  });

  it("should have WCAG AA minimum font size rules in CSS", async () => {
    const fs = await import("fs");
    const css = fs.readFileSync("/home/ubuntu/diet-generator/client/src/index.css", "utf-8");
    // Minimum font size enforcement
    expect(css).toContain("13px");
    // Line height for readability
    expect(css).toContain("line-height");
  });

  it("should have dark theme as default", async () => {
    const fs = await import("fs");
    const appTsx = fs.readFileSync("/home/ubuntu/diet-generator/client/src/App.tsx", "utf-8");
    expect(appTsx).toContain('defaultTheme="dark"');
  });
});

describe("Spelling and Localization", () => {
  it("should have correct Spanish accents in Home.tsx", async () => {
    const fs = await import("fs");
    const constants = fs.readFileSync("/home/ubuntu/diet-generator/shared/constants.ts", "utf-8");
    // Check for correct accents in template names
    expect(constants).toContain("Definición");
    // Check subtitle has accent
    const homeTsx = fs.readFileSync("/home/ubuntu/diet-generator/client/src/pages/Home.tsx", "utf-8");
    expect(homeTsx).toContain("PARÁMETROS");
  });

  it("should have sidebar in Spanish", async () => {
    const fs = await import("fs");
    const layout = fs.readFileSync("/home/ubuntu/diet-generator/client/src/components/DashboardLayout.tsx", "utf-8");
    expect(layout).toContain("Panel");
    expect(layout).not.toMatch(/label:\s*["']Dashboard["']/);
  });
});

describe("Diet Prompt Quality", () => {
  it("should include realistic quantity rules in prompt", async () => {
    const fs = await import("fs");
    const routers = fs.readFileSync("/home/ubuntu/diet-generator/server/routers.ts", "utf-8");
    // Check for realistic quantity rules
    expect(routers).toContain("CANTIDADES REALISTAS");
    expect(routers).toContain("PLATOS RECONOCIBLES");
    expect(routers).toContain("COMBINACIONES CULINARIAS");
  });

  it("should include Mediterranean cuisine reference", async () => {
    const fs = await import("fs");
    const routers = fs.readFileSync("/home/ubuntu/diet-generator/server/routers.ts", "utf-8");
    expect(routers).toContain("mediterránea");
  });
});
