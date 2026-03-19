import { describe, it, expect, vi } from "vitest";
import * as schema from "../drizzle/schema";

// Test schema definitions for new tables
describe("New feature schemas", () => {
  describe("Diet Templates", () => {
    it("should have dietTemplates table with required columns", () => {
      expect(schema.dietTemplates).toBeDefined();
      const cols = Object.keys(schema.dietTemplates);
      expect(cols).toContain("id");
      expect(cols).toContain("userId");
      expect(cols).toContain("name");
      expect(cols).toContain("dietId");
      expect(cols).toContain("tags");
    });
  });

  describe("Favorite Foods", () => {
    it("should have clientFavoriteFoods table with required columns", () => {
      expect(schema.clientFavoriteFoods).toBeDefined();
      const cols = Object.keys(schema.clientFavoriteFoods);
      expect(cols).toContain("id");
      expect(cols).toContain("clientId");
      expect(cols).toContain("foodName");
    });
  });

  describe("Client Tags", () => {
    it("should have clientTags table with required columns", () => {
      expect(schema.clientTags).toBeDefined();
      const cols = Object.keys(schema.clientTags);
      expect(cols).toContain("id");
      expect(cols).toContain("name");
      expect(cols).toContain("color");
    });

    it("should have clientTagAssignments table with required columns", () => {
      expect(schema.clientTagAssignments).toBeDefined();
      const cols = Object.keys(schema.clientTagAssignments);
      expect(cols).toContain("id");
      expect(cols).toContain("clientId");
      expect(cols).toContain("tagId");
    });
  });

  describe("Hydration Logs", () => {
    it("should have hydrationLogs table with required columns", () => {
      expect(schema.hydrationLogs).toBeDefined();
      const cols = Object.keys(schema.hydrationLogs);
      expect(cols).toContain("id");
      expect(cols).toContain("clientId");
      expect(cols).toContain("date");
      expect(cols).toContain("glasses");
      expect(cols).toContain("goalGlasses");
    });
  });

  describe("Sleep Logs", () => {
    it("should have sleepLogs table with required columns", () => {
      expect(schema.sleepLogs).toBeDefined();
      const cols = Object.keys(schema.sleepLogs);
      expect(cols).toContain("id");
      expect(cols).toContain("clientId");
      expect(cols).toContain("date");
      expect(cols).toContain("hoursSlept");
      expect(cols).toContain("quality");
    });
  });

  describe("Wellness Logs", () => {
    it("should have wellnessLogs table with required columns", () => {
      expect(schema.wellnessLogs).toBeDefined();
      const cols = Object.keys(schema.wellnessLogs);
      expect(cols).toContain("id");
      expect(cols).toContain("clientId");
      expect(cols).toContain("date");
      expect(cols).toContain("energy");
      expect(cols).toContain("mood");
      expect(cols).toContain("digestion");
      expect(cols).toContain("bloating");
    });
  });

  describe("Meal Reminders", () => {
    it("should have mealReminders table with required columns", () => {
      expect(schema.mealReminders).toBeDefined();
      const cols = Object.keys(schema.mealReminders);
      expect(cols).toContain("id");
      expect(cols).toContain("clientId");
      expect(cols).toContain("mealName");
      expect(cols).toContain("reminderTime");
      expect(cols).toContain("enabled");
    });
  });
});

// Test clientDb functions exist
describe("Client DB functions", () => {
  it("should export hydration functions", async () => {
    const clientDb = await import("./clientDb");
    expect(typeof clientDb.logHydration).toBe("function");
    expect(typeof clientDb.getHydrationLogs).toBe("function");
  });

  it("should export sleep functions", async () => {
    const clientDb = await import("./clientDb");
    expect(typeof clientDb.logSleep).toBe("function");
    expect(typeof clientDb.getSleepLogs).toBe("function");
  });

  it("should export wellness functions", async () => {
    const clientDb = await import("./clientDb");
    expect(typeof clientDb.logWellness).toBe("function");
    expect(typeof clientDb.getWellnessLogs).toBe("function");
  });

  it("should export template functions", async () => {
    const clientDb = await import("./clientDb");
    expect(typeof clientDb.createDietTemplate).toBe("function");
    expect(typeof clientDb.getDietTemplates).toBe("function");
    expect(typeof clientDb.deleteDietTemplate).toBe("function");
  });

  it("should export favorite foods functions", async () => {
    const clientDb = await import("./clientDb");
    expect(typeof clientDb.addClientFavoriteFood).toBe("function");
    expect(typeof clientDb.getClientFavoriteFoods).toBe("function");
    expect(typeof clientDb.deleteClientFavoriteFood).toBe("function");
  });

  it("should export tag functions", async () => {
    const clientDb = await import("./clientDb");
    expect(typeof clientDb.createClientTag).toBe("function");
    expect(typeof clientDb.getClientTags).toBe("function");
    expect(typeof clientDb.assignTagToClient).toBe("function");
    expect(typeof clientDb.removeTagFromClient).toBe("function");
    expect(typeof clientDb.getClientTagAssignments).toBe("function");
  });

  it("should export reminder functions", async () => {
    const clientDb = await import("./clientDb");
    expect(typeof clientDb.setMealReminder).toBe("function");
    expect(typeof clientDb.getMealReminders).toBe("function");
    expect(typeof clientDb.deleteMealReminder).toBe("function");
  });
});

// Test macro calculation logic
describe("Macro calculation", () => {
  it("should correctly sum food macros for a meal", () => {
    const foods = [
      { calories: 200, protein: 20, carbs: 25, fat: 5, grams: 150 },
      { calories: 150, protein: 10, carbs: 15, fat: 8, grams: 100 },
      { calories: 100, protein: 5, carbs: 10, fat: 3, grams: 50 },
    ];
    const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
    const totalProtein = foods.reduce((s, f) => s + f.protein, 0);
    const totalCarbs = foods.reduce((s, f) => s + f.carbs, 0);
    const totalFat = foods.reduce((s, f) => s + f.fat, 0);

    expect(totalCalories).toBe(450);
    expect(totalProtein).toBe(35);
    expect(totalCarbs).toBe(50);
    expect(totalFat).toBe(16);
  });

  it("should handle empty foods array", () => {
    const foods: any[] = [];
    const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
    expect(totalCalories).toBe(0);
  });
});

// Test fasting timer logic
describe("Fasting Timer", () => {
  const protocols: Record<string, { fast: number; eat: number }> = {
    "16/8": { fast: 16, eat: 8 },
    "18/6": { fast: 18, eat: 6 },
    "20/4": { fast: 20, eat: 4 },
  };

  it("should have correct fasting/eating windows", () => {
    expect(protocols["16/8"].fast + protocols["16/8"].eat).toBe(24);
    expect(protocols["18/6"].fast + protocols["18/6"].eat).toBe(24);
    expect(protocols["20/4"].fast + protocols["20/4"].eat).toBe(24);
  });

  it("should calculate progress correctly", () => {
    const startTime = Date.now() - 8 * 60 * 60 * 1000; // 8 hours ago
    const fastMs = 16 * 60 * 60 * 1000; // 16h fast
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / fastMs, 1);
    expect(progress).toBeCloseTo(0.5, 1);
  });

  it("should cap progress at 1.0", () => {
    const startTime = Date.now() - 20 * 60 * 60 * 1000; // 20 hours ago
    const fastMs = 16 * 60 * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / fastMs, 1);
    expect(progress).toBe(1);
  });

  it("should format time correctly", () => {
    const formatTime = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };
    expect(formatTime(3661000)).toBe("01:01:01");
    expect(formatTime(0)).toBe("00:00:00");
    expect(formatTime(86400000)).toBe("24:00:00");
  });
});
