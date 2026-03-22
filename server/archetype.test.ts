import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock clientDb with archetype support
vi.mock("./clientDb", () => ({
  createClient: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", accessCode: "ABC123", trainerId: 1, status: "active" }),
  getClientsByTrainer: vi.fn().mockResolvedValue([
    { id: 1, name: "Test Client", email: "test@test.com", status: "active", trainerId: 1, archetype: "agil" },
  ]),
  getClientById: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", trainerId: 1, status: "active", weight: 75000, height: 175, age: 30, goal: "Perder peso", archetype: null }),
  getClientByAccessCode: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", trainerId: 1, status: "active", archetype: null, email: "test@test.com", phone: null, age: 30, weight: 75000, height: 175, goal: "Perder peso" }),
  updateClient: vi.fn().mockResolvedValue(undefined),
  deleteClient: vi.fn().mockResolvedValue(undefined),
  assignDietToClient: vi.fn().mockResolvedValue({ id: 1 }),
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
  getTrainerDashboardStats: vi.fn().mockResolvedValue({ totalClients: 5, activeClients: 3, unreadMessages: 2, todayAdherence: 85 }),
  getRecentMotivationMessages: vi.fn().mockResolvedValue([]),
  logMotivation: vi.fn().mockResolvedValue(1),
  logMotivationMessage: vi.fn().mockResolvedValue(1),
  updateMotivationLog: vi.fn().mockResolvedValue(undefined),
  markMotivationSent: vi.fn().mockResolvedValue(undefined),
  createInvitation: vi.fn().mockResolvedValue({ id: 1, token: "test-token" }),
  getInvitationsByClient: vi.fn().mockResolvedValue([]),
  getInvitationByToken: vi.fn().mockResolvedValue(null),
  updateInvitationStatus: vi.fn().mockResolvedValue(undefined),
  addWeekendMeal: vi.fn().mockResolvedValue(1),
  getWeekendMeals: vi.fn().mockResolvedValue([]),
  deleteWeekendMeal: vi.fn().mockResolvedValue(undefined),
  addWeekendFeedback: vi.fn().mockResolvedValue(1),
  getWeekendFeedbackList: vi.fn().mockResolvedValue([]),
  addFavoriteFood: vi.fn().mockResolvedValue(1),
  getFavoriteFoods: vi.fn().mockResolvedValue([]),
  deleteFavoriteFood: vi.fn().mockResolvedValue(undefined),
  setClientTags: vi.fn().mockResolvedValue(undefined),
  createTemplate: vi.fn().mockResolvedValue(1),
  getTemplates: vi.fn().mockResolvedValue([]),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
  addHydration: vi.fn().mockResolvedValue(1),
  getHydrationLogs: vi.fn().mockResolvedValue([]),
  addSleepLog: vi.fn().mockResolvedValue(1),
  getSleepLogs: vi.fn().mockResolvedValue([]),
  addWellnessLog: vi.fn().mockResolvedValue(1),
  getWellnessLogs: vi.fn().mockResolvedValue([]),
  addMealReminder: vi.fn().mockResolvedValue(1),
  getMealReminders: vi.fn().mockResolvedValue([]),
  deleteMealReminder: vi.fn().mockResolvedValue(undefined),
  addProgressMetric: vi.fn().mockResolvedValue(1),
  getProgressMetrics: vi.fn().mockResolvedValue([]),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test recommendation" } }],
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.test.com/photo.jpg", key: "photo.jpg" }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const createCaller = (userId = 1) => {
  const ctx: TrpcContext = {
    user: { id: userId, openId: "test-open-id", name: "Trainer", role: "admin" },
  };
  return appRouter.createCaller(ctx);
};

describe("Archetype System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Client Portal - Login returns archetype", () => {
    it("should return archetype field on login", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.loginByCode({ accessCode: "ABC123" });
      expect(result).toHaveProperty("clientId");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("archetype");
    });

    it("should return null archetype for new client", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.loginByCode({ accessCode: "ABC123" });
      expect(result.archetype).toBeNull();
    });
  });

  describe("Client Portal - getProfile returns archetype", () => {
    it("should include archetype in profile", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.getProfile({ clientId: 1, accessCode: "ABC123" });
      expect(result).toHaveProperty("archetype");
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("goal");
    });
  });

  describe("Client Portal - setArchetype", () => {
    it("should set archetype to agil", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.setArchetype({
        clientId: 1,
        accessCode: "ABC123",
        archetype: "agil",
      });
      expect(result.success).toBe(true);
      expect(result.archetype).toBe("agil");
      const { updateClient } = await import("./clientDb");
      expect(updateClient).toHaveBeenCalledWith(1, { archetype: "agil" });
    });

    it("should set archetype to flora", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.setArchetype({
        clientId: 1,
        accessCode: "ABC123",
        archetype: "flora",
      });
      expect(result.success).toBe(true);
      expect(result.archetype).toBe("flora");
    });

    it("should set archetype to bruto", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.setArchetype({
        clientId: 1,
        accessCode: "ABC123",
        archetype: "bruto",
      });
      expect(result.success).toBe(true);
      expect(result.archetype).toBe("bruto");
    });

    it("should set archetype to roca", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.setArchetype({
        clientId: 1,
        accessCode: "ABC123",
        archetype: "roca",
      });
      expect(result.success).toBe(true);
      expect(result.archetype).toBe("roca");
    });

    it("should reject invalid archetype", async () => {
      const caller = createCaller();
      await expect(
        caller.clientPortal.setArchetype({
          clientId: 1,
          accessCode: "ABC123",
          archetype: "invalid" as any,
        })
      ).rejects.toThrow();
    });

    it("should reject invalid access code", async () => {
      const { getClientByAccessCode } = await import("./clientDb");
      (getClientByAccessCode as any).mockResolvedValueOnce(null);
      const caller = createCaller();
      await expect(
        caller.clientPortal.setArchetype({
          clientId: 1,
          accessCode: "WRONG",
          archetype: "agil",
        })
      ).rejects.toThrow("Acceso denegado");
    });

    it("should reject mismatched clientId", async () => {
      const caller = createCaller();
      await expect(
        caller.clientPortal.setArchetype({
          clientId: 999,
          accessCode: "ABC123",
          archetype: "agil",
        })
      ).rejects.toThrow("Acceso denegado");
    });
  });

  describe("Trainer Panel - list includes archetype", () => {
    it("should return archetype in client list", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.list();
      expect(result[0]).toHaveProperty("archetype");
      expect(result[0].archetype).toBe("agil");
    });
  });
});
