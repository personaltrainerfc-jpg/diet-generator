import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock clientDb with all functions
vi.mock("./clientDb", () => ({
  createClient: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", accessCode: "ABC123", trainerId: 1, status: "active" }),
  getClientsByTrainer: vi.fn().mockResolvedValue([
    { id: 1, name: "Test Client", email: "test@test.com", status: "active", trainerId: 1, archetype: "agil" },
  ]),
  getClientById: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", trainerId: 1, status: "active", weight: 75000, height: 175, age: 30, goal: "Perder peso", archetype: "agil" }),
  getClientByAccessCode: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", trainerId: 1, status: "active", archetype: "agil", email: "test@test.com", phone: null, age: 30, weight: 75000, height: 175, goal: "Perder peso" }),
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
  // New: AI, Personalization, Wearables
  getOrCreateConversation: vi.fn().mockResolvedValue({ id: 1, clientId: 1, messages: [], createdAt: new Date(), updatedAt: new Date() }),
  getConversationById: vi.fn().mockResolvedValue({ id: 1, clientId: 1, messages: [] }),
  updateConversationMessages: vi.fn().mockResolvedValue(undefined),
  getRecentConversations: vi.fn().mockResolvedValue([]),
  getAssistantConfig: vi.fn().mockResolvedValue(null),
  upsertAssistantConfig: vi.fn().mockResolvedValue(1),
  createEscalationAlert: vi.fn().mockResolvedValue(1),
  getEscalationAlerts: vi.fn().mockResolvedValue([]),
  resolveEscalationAlert: vi.fn().mockResolvedValue(undefined),
  addLearnedPreference: vi.fn().mockResolvedValue(1),
  getLearnedPreferences: vi.fn().mockResolvedValue([]),
  getPersonalizationProfile: vi.fn().mockResolvedValue(null),
  upsertPersonalizationProfile: vi.fn().mockResolvedValue(1),
  logActivity: vi.fn().mockResolvedValue(1),
  getActivityLogs: vi.fn().mockResolvedValue([]),
  getWearableConnection: vi.fn().mockResolvedValue([]),
  upsertWearableConnection: vi.fn().mockResolvedValue(1),
  disconnectWearable: vi.fn().mockResolvedValue(undefined),
  // Gamification
  getAllActivityBadges: vi.fn().mockResolvedValue([
    { id: 1, code: "steps_5k", name: "Caminante", description: "5K pasos", icon: "\uD83D\uDEB6", category: "steps", threshold: 5000, tier: "bronze" },
    { id: 2, code: "steps_10k", name: "Explorador", description: "10K pasos", icon: "\uD83C\uDFC3", category: "steps", threshold: 10000, tier: "silver" },
    { id: 3, code: "streak_3", name: "Constante", description: "3 d\u00edas", icon: "\uD83D\uDCC5", category: "streak", threshold: 3, tier: "bronze" },
  ]),
  getClientActivityBadges: vi.fn().mockResolvedValue([
    { id: 1, badgeId: 1, unlockedAt: new Date(), value: 6000, code: "steps_5k", name: "Caminante", description: "5K pasos", icon: "\uD83D\uDEB6", category: "steps", threshold: 5000, tier: "bronze" },
  ]),
  unlockActivityBadge: vi.fn().mockResolvedValue(1),
  getOrCreateStreak: vi.fn().mockResolvedValue({ id: 1, clientId: 1, currentStreak: 5, longestStreak: 12, lastActiveDate: "2026-03-21" }),
  updateStreak: vi.fn().mockResolvedValue({ currentStreak: 6, longestStreak: 12 }),
  evaluateBadges: vi.fn().mockResolvedValue([{ badgeId: 2, name: "Explorador", icon: "\uD83C\uDFC3", tier: "silver", description: "10K pasos" }]),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test AI response" } }],
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

describe("AI Assistant", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("Client Portal - AI Chat", () => {
    it("should send a message and get AI reply", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.aiChat({
        clientId: 1,
        accessCode: "ABC123",
        message: "¿Qué puedo comer como snack?",
      });
      expect(result).toHaveProperty("reply");
      expect(result).toHaveProperty("conversationId");
      expect(result.reply).toBe("Test AI response");
    });

    it("should reject invalid access code", async () => {
      const { getClientByAccessCode } = await import("./clientDb");
      (getClientByAccessCode as any).mockResolvedValueOnce(null);
      const caller = createCaller();
      await expect(
        caller.clientPortal.aiChat({ clientId: 1, accessCode: "WRONG", message: "test" })
      ).rejects.toThrow("Acceso denegado");
    });

    it("should trigger escalation for keywords", async () => {
      const caller = createCaller();
      await caller.clientPortal.aiChat({
        clientId: 1,
        accessCode: "ABC123",
        message: "Tengo mucho dolor de estómago",
      });
      const { createEscalationAlert } = await import("./clientDb");
      expect(createEscalationAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 1,
          trainerId: 1,
          reason: expect.stringContaining("dolor"),
        })
      );
    });

    it("should not trigger escalation for normal messages", async () => {
      const caller = createCaller();
      await caller.clientPortal.aiChat({
        clientId: 1,
        accessCode: "ABC123",
        message: "¿Qué puedo comer hoy?",
      });
      const { createEscalationAlert } = await import("./clientDb");
      expect(createEscalationAlert).not.toHaveBeenCalled();
    });
  });

  describe("Client Portal - Chat History", () => {
    it("should return chat history", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.aiChatHistory({
        clientId: 1,
        accessCode: "ABC123",
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("Trainer AI Config", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should get AI config", async () => {
    const caller = createCaller();
    const result = await caller.clientMgmt.getAiConfig();
    expect(result).toBeNull(); // No config yet
  });

  it("should update AI config", async () => {
    const caller = createCaller();
    const result = await caller.clientMgmt.updateAiConfig({
      assistantName: "NutriHelper",
      tone: "profesional",
      customRules: "No recomendar suplementos",
      escalationKeywords: ["dolor", "mareo"],
      enabled: 1,
    });
    expect(result).toHaveProperty("id");
    const { upsertAssistantConfig } = await import("./clientDb");
    expect(upsertAssistantConfig).toHaveBeenCalledWith(1, expect.objectContaining({
      assistantName: "NutriHelper",
      tone: "profesional",
    }));
  });

  it("should get escalation alerts", async () => {
    const caller = createCaller();
    const result = await caller.clientMgmt.getEscalationAlerts({ resolved: false });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should resolve an alert", async () => {
    const caller = createCaller();
    const result = await caller.clientMgmt.resolveAlert({ id: 1 });
    expect(result.success).toBe(true);
    const { resolveEscalationAlert } = await import("./clientDb");
    expect(resolveEscalationAlert).toHaveBeenCalledWith(1);
  });
});

describe("Activity / Wearables", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("Client Portal - Activity", () => {
    it("should log activity", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.logActivity({
        clientId: 1,
        accessCode: "ABC123",
        date: "2026-03-22",
        steps: 8500,
        activeMinutes: 45,
        caloriesBurned: 350,
        source: "manual",
      });
      expect(result).toHaveProperty("id");
      const { logActivity } = await import("./clientDb");
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 1,
        date: "2026-03-22",
        steps: 8500,
      }));
    });

    it("should get activity logs", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.getActivityLogs({
        clientId: 1,
        accessCode: "ABC123",
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get wearable connections", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.getWearableConnections({
        clientId: 1,
        accessCode: "ABC123",
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Trainer - Client Activity", () => {
    it("should get client activity", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getClientActivity({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject unauthorized access", async () => {
      const { getClientById } = await import("./clientDb");
      (getClientById as any).mockResolvedValueOnce({ id: 1, trainerId: 999 });
      const caller = createCaller();
      await expect(
        caller.clientMgmt.getClientActivity({ clientId: 1 })
      ).rejects.toThrow("No tienes acceso");
    });
  });
});

describe("Gamification", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("Client Portal - Badges", () => {
    it("should get all badges with unlock status", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.getAllBadges({
        clientId: 1,
        accessCode: "ABC123",
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty("unlocked");
    });

    it("should get my unlocked badges", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.getMyBadges({
        clientId: 1,
        accessCode: "ABC123",
      });
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].code).toBe("steps_5k");
    });

    it("should get my streak", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.getMyStreak({
        clientId: 1,
        accessCode: "ABC123",
      });
      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(12);
    });

    it("should evaluate and return new badges on logActivity", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.logActivity({
        clientId: 1,
        accessCode: "ABC123",
        date: "2026-03-22",
        steps: 12000,
        activeMinutes: 60,
        source: "manual",
      });
      expect(result).toHaveProperty("newBadges");
      expect(result.newBadges.length).toBe(1);
      expect(result.newBadges[0].name).toBe("Explorador");
      expect(result).toHaveProperty("streak");
      expect(result.streak.currentStreak).toBe(6);
    });
  });

  describe("Trainer - Client Badges", () => {
    it("should get client badges with streak", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getClientBadges({ clientId: 1 });
      expect(result).toHaveProperty("badges");
      expect(result).toHaveProperty("unlockedCount");
      expect(result).toHaveProperty("totalCount");
      expect(result).toHaveProperty("streak");
      expect(result.unlockedCount).toBe(1);
      expect(result.totalCount).toBe(3);
      expect(result.streak.currentStreak).toBe(5);
    });
  });
});

describe("Trainer Conversations", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should get client conversations", async () => {
    const caller = createCaller();
    const result = await caller.clientMgmt.getClientConversations({ clientId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should summarize a conversation", async () => {
    const { getConversationById } = await import("./clientDb");
    (getConversationById as any).mockResolvedValueOnce({
      id: 1, clientId: 1,
      messages: [
        { role: "user", content: "Hola", timestamp: Date.now() },
        { role: "assistant", content: "Hola, \u00bfc\u00f3mo te puedo ayudar?", timestamp: Date.now() },
      ],
    });
    const caller = createCaller();
    const result = await caller.clientMgmt.summarizeConversation({ conversationId: 1 });
    expect(result).toHaveProperty("summary");
  });
});

describe("Personalization", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("Client Portal - Profile", () => {
    it("should get personalization profile", async () => {
      const caller = createCaller();
      const result = await caller.clientPortal.getPersonalizationProfile({
        clientId: 1,
        accessCode: "ABC123",
      });
      expect(result).toHaveProperty("profile");
      expect(result).toHaveProperty("preferences");
    });
  });

  describe("Trainer - Personalization", () => {
    it("should get client personalization", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getClientPersonalization({ clientId: 1 });
      expect(result).toHaveProperty("profile");
      expect(result).toHaveProperty("preferences");
    });

    it("should analyze client profile", async () => {
      const { invokeLLM } = await import("./_core/llm");
      (invokeLLM as any).mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              foodLikes: ["pollo", "arroz"],
              foodDislikes: ["brócoli"],
              preferredMealTimes: ["8:00", "13:00", "20:00"],
              cookingSkill: "medio",
              shoppingPreferences: ["supermercado"],
              activityPattern: "sedentario",
              sleepPattern: "7-8 horas",
              stressFactors: ["trabajo"],
              motivationTriggers: ["resultados visibles"],
            }),
          },
        }],
      });
      const caller = createCaller();
      const result = await caller.clientMgmt.analyzeClientProfile({ clientId: 1 });
      expect(result).toHaveProperty("profileData");
      expect(result.profileData.foodLikes).toContain("pollo");
      const { upsertPersonalizationProfile } = await import("./clientDb");
      expect(upsertPersonalizationProfile).toHaveBeenCalledWith(1, expect.objectContaining({
        foodLikes: expect.arrayContaining(["pollo"]),
      }));
    });
  });
});
