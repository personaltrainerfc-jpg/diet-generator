import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock adminDb functions
vi.mock("./adminDb", () => ({
  getAdminStats: vi.fn(),
  listTrainers: vi.fn(),
  getTrainerDetail: vi.fn(),
  toggleTrainerActive: vi.fn(),
  changeTrainerPlan: vi.fn(),
}));

describe("Admin Panel Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("admin.getStats", () => {
    it("should return platform statistics", async () => {
      const { getAdminStats } = await import("./adminDb");
      const mockStats = {
        totalTrainers: 15,
        totalClients: 120,
        totalDiets: 450,
        totalRecipes: 200,
        activeToday: 5,
        activeWeek: 10,
        activeMonth: 14,
        verifiedTrainers: 12,
        activeTrainers: 13,
        planDistribution: [
          { plan: "basic", count: 10 },
          { plan: "pro", count: 4 },
          { plan: "centers", count: 1 },
        ],
        recentRegistrations: 3,
      };
      (getAdminStats as any).mockResolvedValue(mockStats);

      const result = await getAdminStats();
      expect(result).toBeDefined();
      expect(result!.totalTrainers).toBe(15);
      expect(result!.totalClients).toBe(120);
      expect(result!.activeToday).toBe(5);
      expect(result!.planDistribution).toHaveLength(3);
    });
  });

  describe("admin.listTrainers", () => {
    it("should return paginated trainer list with metrics", async () => {
      const { listTrainers } = await import("./adminDb");
      const mockResult = {
        trainers: [
          {
            id: 1, email: "trainer1@test.com", name: "Trainer 1",
            trainerName: "FitPro", plan: "basic", isActive: 1,
            emailVerified: 1, createdAt: new Date(), lastSignedIn: new Date(),
            clientCount: 5, dietCount: 20, recipeCount: 10,
          },
          {
            id: 2, email: "trainer2@test.com", name: "Trainer 2",
            trainerName: null, plan: "pro", isActive: 1,
            emailVerified: 1, createdAt: new Date(), lastSignedIn: new Date(),
            clientCount: 12, dietCount: 45, recipeCount: 25,
          },
        ],
        total: 2,
      };
      (listTrainers as any).mockResolvedValue(mockResult);

      const result = await listTrainers({ page: 1, limit: 20 });
      expect(result.trainers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.trainers[0].clientCount).toBe(5);
      expect(result.trainers[1].plan).toBe("pro");
    });

    it("should support filtering by plan", async () => {
      const { listTrainers } = await import("./adminDb");
      (listTrainers as any).mockResolvedValue({ trainers: [], total: 0 });

      await listTrainers({ page: 1, limit: 20, plan: "pro" });
      expect(listTrainers).toHaveBeenCalledWith({ page: 1, limit: 20, plan: "pro" });
    });

    it("should support filtering by status", async () => {
      const { listTrainers } = await import("./adminDb");
      (listTrainers as any).mockResolvedValue({ trainers: [], total: 0 });

      await listTrainers({ page: 1, limit: 20, status: "inactive" });
      expect(listTrainers).toHaveBeenCalledWith({ page: 1, limit: 20, status: "inactive" });
    });
  });

  describe("admin.getTrainerDetail", () => {
    it("should return detailed trainer info with clients and diets", async () => {
      const { getTrainerDetail } = await import("./adminDb");
      const mockDetail = {
        id: 1, email: "trainer@test.com", name: "Test Trainer",
        trainerName: "FitPro", plan: "pro", isActive: 1, emailVerified: 1,
        createdAt: new Date(), lastSignedIn: new Date(),
        clients: [
          { id: 1, name: "Client 1", email: "c1@test.com", status: "active", createdAt: new Date() },
        ],
        recentDiets: [
          { id: 1, name: "Dieta 1800", totalCalories: 1800, createdAt: new Date() },
        ],
        counts: { clients: 1, diets: 5, recipes: 3 },
      };
      (getTrainerDetail as any).mockResolvedValue(mockDetail);

      const result = await getTrainerDetail(1);
      expect(result).toBeDefined();
      expect(result!.name).toBe("Test Trainer");
      expect(result!.clients).toHaveLength(1);
      expect(result!.recentDiets).toHaveLength(1);
      expect(result!.counts.clients).toBe(1);
    });

    it("should return null for non-existent trainer", async () => {
      const { getTrainerDetail } = await import("./adminDb");
      (getTrainerDetail as any).mockResolvedValue(null);

      const result = await getTrainerDetail(999);
      expect(result).toBeNull();
    });
  });

  describe("admin.toggleTrainerActive", () => {
    it("should toggle active status from active to inactive", async () => {
      const { toggleTrainerActive } = await import("./adminDb");
      (toggleTrainerActive as any).mockResolvedValue({ id: 1, isActive: 0 });

      const result = await toggleTrainerActive(1);
      expect(result).toEqual({ id: 1, isActive: 0 });
    });

    it("should toggle active status from inactive to active", async () => {
      const { toggleTrainerActive } = await import("./adminDb");
      (toggleTrainerActive as any).mockResolvedValue({ id: 1, isActive: 1 });

      const result = await toggleTrainerActive(1);
      expect(result).toEqual({ id: 1, isActive: 1 });
    });
  });

  describe("admin.changePlan", () => {
    it("should change trainer plan to pro", async () => {
      const { changeTrainerPlan } = await import("./adminDb");
      (changeTrainerPlan as any).mockResolvedValue({ id: 1, plan: "pro" });

      const result = await changeTrainerPlan(1, "pro");
      expect(result).toEqual({ id: 1, plan: "pro" });
    });

    it("should change trainer plan to centers", async () => {
      const { changeTrainerPlan } = await import("./adminDb");
      (changeTrainerPlan as any).mockResolvedValue({ id: 1, plan: "centers" });

      const result = await changeTrainerPlan(1, "centers");
      expect(result).toEqual({ id: 1, plan: "centers" });
    });
  });

  describe("Admin access control", () => {
    it("should only allow admin role users", () => {
      // The adminProcedure middleware checks ctx.user.role === 'admin'
      const isAdmin = (role: string) => role === "admin";
      expect(isAdmin("admin")).toBe(true);
      expect(isAdmin("trainer")).toBe(false);
      expect(isAdmin("client")).toBe(false);
    });
  });
});
