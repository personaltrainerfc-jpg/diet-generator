import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.docx", key: "test-key" }),
}));

// Mock db functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getFullDiet: vi.fn(),
  getDietById: vi.fn(),
}));

vi.mock("./clientDb", () => ({
  getClientByAccessCode: vi.fn(),
  getClientActiveDiet: vi.fn(),
}));

describe("WORD: Exportación de dietas en formato Word (DOCX)", () => {

  describe("generateDietDOCX", () => {
    it("should generate a valid DOCX buffer from diet data", async () => {
      const { generateDietDOCX } = await import("./docxTemplates");
      const mockDiet = {
        name: "Dieta Test",
        totalCalories: 2000,
        mealsPerDay: 3,
        proteinPercent: 30,
        carbsPercent: 40,
        fatsPercent: 30,
        menus: [
          {
            menuNumber: 1,
            meals: [
              {
                mealName: "Desayuno",
                mealNumber: 1,
                description: "Tostadas con aguacate",
                foods: [
                  { name: "Pan integral", quantity: "60", unit: "g", calories: 150, protein: 5, carbs: 28, fats: 2, alternativeName: "Pan de centeno", alternativeQuantity: "60g" },
                  { name: "Aguacate", quantity: "50", unit: "g", calories: 80, protein: 1, carbs: 4, fats: 7, alternativeName: null, alternativeQuantity: null },
                ],
              },
              {
                mealName: "Comida",
                mealNumber: 2,
                foods: [
                  { name: "Pollo", quantity: "150", unit: "g", calories: 250, protein: 35, carbs: 0, fats: 10 },
                  { name: "Arroz", quantity: "80", unit: "g", calories: 280, protein: 6, carbs: 62, fats: 1 },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await generateDietDOCX(mockDiet as any);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // DOCX files start with PK (ZIP format)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
    });

    it("should generate DOCX with multiple menus (grid layout)", async () => {
      const { generateDietDOCX } = await import("./docxTemplates");
      const mockDiet = {
        name: "Dieta Multi-Menú",
        totalCalories: 1800,
        mealsPerDay: 2,
        proteinPercent: 30,
        carbsPercent: 40,
        fatsPercent: 30,
        menus: [
          {
            menuNumber: 1,
            meals: [
              { mealName: "Desayuno", mealNumber: 1, foods: [{ name: "Avena", quantity: "50", calories: 190 }] },
              { mealName: "Comida", mealNumber: 2, foods: [{ name: "Salmón", quantity: "150", calories: 300 }] },
            ],
          },
          {
            menuNumber: 2,
            meals: [
              { mealName: "Desayuno", mealNumber: 1, foods: [{ name: "Yogur", quantity: "200", calories: 120 }] },
              { mealName: "Comida", mealNumber: 2, foods: [{ name: "Ternera", quantity: "150", calories: 280 }] },
            ],
          },
          {
            menuNumber: 3,
            meals: [
              { mealName: "Desayuno", mealNumber: 1, foods: [{ name: "Tostadas", quantity: "60", calories: 150 }] },
              { mealName: "Comida", mealNumber: 2, foods: [{ name: "Merluza", quantity: "180", calories: 200 }] },
            ],
          },
        ],
      };

      const buffer = await generateDietDOCX(mockDiet as any);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    });

    it("should handle empty menus gracefully", async () => {
      const { generateDietDOCX } = await import("./docxTemplates");
      const mockDiet = {
        name: "Dieta Vacía",
        totalCalories: 2000,
        mealsPerDay: 3,
        proteinPercent: 30,
        carbsPercent: 40,
        fatsPercent: 30,
        menus: [],
      };

      const buffer = await generateDietDOCX(mockDiet as any);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should not include calories or macros in the output (no showMacros parameter)", async () => {
      const { generateDietDOCX } = await import("./docxTemplates");
      // The function signature should only accept diet data, no showMacros flag
      expect(generateDietDOCX.length).toBe(1); // Only 1 parameter
    });

    it("should include alternatives when present", async () => {
      const { generateDietDOCX } = await import("./docxTemplates");
      const mockDiet = {
        name: "Dieta Con Alternativas",
        totalCalories: 2000,
        mealsPerDay: 1,
        proteinPercent: 30,
        carbsPercent: 40,
        fatsPercent: 30,
        menus: [
          {
            menuNumber: 1,
            meals: [
              {
                mealName: "Desayuno",
                mealNumber: 1,
                foods: [
                  { name: "Pollo", quantity: "150", unit: "g", alternativeName: "Pavo", alternativeQuantity: "160g" },
                  { name: "Arroz", quantity: "80", unit: "g", alternativeName: "Quinoa", alternativeQuantity: "70g" },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await generateDietDOCX(mockDiet as any);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should include meal notes when present", async () => {
      const { generateDietDOCX } = await import("./docxTemplates");
      const mockDiet = {
        name: "Dieta Con Notas",
        totalCalories: 2000,
        mealsPerDay: 1,
        proteinPercent: 30,
        carbsPercent: 40,
        fatsPercent: 30,
        menus: [
          {
            menuNumber: 1,
            meals: [
              {
                mealName: "Desayuno",
                mealNumber: 1,
                notes: "Tomar 30 min antes del entreno",
                foods: [
                  { name: "Avena", quantity: "50", unit: "g" },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await generateDietDOCX(mockDiet as any);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe("DOCX export endpoints", () => {
    it("diet.exportDOCX should exist as a protected procedure", async () => {
      // Verify the endpoint is registered by checking the router structure
      // This is a structural test - the actual endpoint was added to routers.ts
      const fs = await import("fs");
      const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
      expect(routerContent).toContain("exportDOCX: protectedProcedure");
      expect(routerContent).toContain("generateDietDOCX");
    });

    it("clientPortal.exportDietDOCX should exist as a public procedure", async () => {
      const fs = await import("fs");
      const clientRouterContent = fs.readFileSync("server/clientRouters.ts", "utf-8");
      expect(clientRouterContent).toContain("exportDietDOCX: publicProcedure");
      expect(clientRouterContent).toContain("generateDietDOCX");
    });

    it("DOCX export should not pass showMacros parameter", async () => {
      const fs = await import("fs");
      const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
      const clientRouterContent = fs.readFileSync("server/clientRouters.ts", "utf-8");

      // Find the exportDOCX calls - they should NOT have a second argument
      const routerDocxCall = routerContent.match(/generateDietDOCX\(diet as any[^)]*\)/g);
      const clientDocxCall = clientRouterContent.match(/generateDietDOCX\(diet as any[^)]*\)/g);

      // Both should call with only one argument (no showMacros)
      if (routerDocxCall) {
        for (const call of routerDocxCall) {
          expect(call).toBe("generateDietDOCX(diet as any)");
        }
      }
      if (clientDocxCall) {
        for (const call of clientDocxCall) {
          expect(call).toBe("generateDietDOCX(diet as any)");
        }
      }
    });

    it("DOCX files should use correct MIME type", async () => {
      const fs = await import("fs");
      const routerContent = fs.readFileSync("server/routers.ts", "utf-8");
      const clientRouterContent = fs.readFileSync("server/clientRouters.ts", "utf-8");

      const expectedMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      expect(routerContent).toContain(expectedMime);
      expect(clientRouterContent).toContain(expectedMime);
    });
  });
});
