import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock clientDb
vi.mock("./clientDb", () => ({
  createClient: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", accessCode: "ABC123", trainerId: 1, status: "active" }),
  getClientsByTrainer: vi.fn().mockResolvedValue([
    { id: 1, name: "Test Client", email: "test@test.com", status: "active", trainerId: 1 },
  ]),
  getClientById: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", trainerId: 1, status: "active", weight: 75000, height: 175, age: 30, goal: "Perder peso" }),
  getClientByAccessCode: vi.fn().mockResolvedValue({ id: 1, name: "Test Client", trainerId: 1 }),
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
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Recomendación de prueba" } }],
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.test.com/photo.jpg", key: "photo.jpg" }),
}));

const createCaller = (userId = 1) => {
  const ctx: TrpcContext = {
    user: { id: userId, openId: "test-open-id", name: "Trainer", role: "admin" },
  };
  return appRouter.createCaller(ctx);
};

describe("Client Management Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Client CRUD", () => {
    it("should create a client", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.create({
        name: "Test Client",
        email: "test@test.com",
        goal: "Perder peso",
      });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("accessCode");
    });

    it("should list clients", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should get client by id", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getById({ id: 1 });
      expect(result.name).toBe("Test Client");
    });

    it("should update a client", async () => {
      const caller = createCaller();
      await caller.clientMgmt.update({ id: 1, name: "Updated Client", status: "paused" });
      const { updateClient } = await import("./clientDb");
      expect(updateClient).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Updated Client", status: "paused" }));
    });

    it("should delete a client", async () => {
      const caller = createCaller();
      await caller.clientMgmt.delete({ id: 1 });
      const { deleteClient } = await import("./clientDb");
      expect(deleteClient).toHaveBeenCalledWith(1);
    });
  });

  describe("Chat", () => {
    it("should send a message", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.sendMessage({ clientId: 1, message: "Hello!" });
      expect(result).toHaveProperty("id");
    });

    it("should get messages", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getMessages({ clientId: 1, limit: 50 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Check-ins", () => {
    it("should create a check-in", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.createCheckIn({
        clientId: 1,
        weekStart: "2026-03-15",
        energyLevel: 4,
        hungerLevel: 3,
        sleepQuality: 4,
        adherenceRating: 5,
      });
      expect(result).toHaveProperty("id");
    });

    it("should get check-ins", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getCheckIns({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should add feedback to check-in", async () => {
      const caller = createCaller();
      await caller.clientMgmt.addCheckInFeedback({ id: 1, clientId: 1, feedback: "Great progress!" });
      const { updateCheckInFeedback } = await import("./clientDb");
      expect(updateCheckInFeedback).toHaveBeenCalledWith(1, "Great progress!");
    });
  });

  describe("Measurements", () => {
    it("should add a measurement", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.addMeasurement({
        clientId: 1,
        date: "2026-03-15",
        weight: 75000,
        bodyFat: 180,
      });
      expect(result).toHaveProperty("id");
    });

    it("should get measurements", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getMeasurements({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Achievements", () => {
    it("should get client achievements", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getClientAchievements({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Assessment", () => {
    it("should create an assessment", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.createAssessment({
        clientId: 1,
        currentDiet: "Standard diet",
        exerciseFrequency: "3 days/week",
        goals: "Lose weight",
        stressLevel: 3,
      });
      expect(result).toHaveProperty("id");
    });

    it("should get assessment", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getAssessment({ clientId: 1 });
      // Can be null if no assessment
      expect(result).toBeDefined();
    });
  });

  describe("Dashboard", () => {
    it("should get trainer dashboard stats", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.dashboard();
      expect(result).toHaveProperty("totalClients");
      expect(result).toHaveProperty("activeClients");
      expect(result).toHaveProperty("unreadMessages");
    });
  });

  describe("AI Features", () => {
    it("should generate recommendations", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getRecommendations({ clientId: 1 });
      expect(result).toBeDefined();
    });

    it("should handle quick consult", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.quickConsult({
        clientId: 1,
        question: "Should I reduce carbs?",
      });
      expect(result).toBeDefined();
    });

    it("should send motivation message", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.sendMotivation({ clientId: 1 });
      expect(result).toHaveProperty("message");
    });
  });

  describe("Photos", () => {
    it("should get photos", async () => {
      const caller = createCaller();
      const result = await caller.clientMgmt.getPhotos({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
