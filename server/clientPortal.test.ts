import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "trainer-user",
    email: "trainer@example.com",
    name: "Trainer User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("clientMgmt.assignDiet", () => {
  it("should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientMgmt.assignDiet({ clientId: 1, dietId: 1 })
    ).rejects.toThrow();
  });

  it("should require clientId and dietId parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Missing dietId should fail validation
    await expect(
      (caller.clientMgmt.assignDiet as any)({ clientId: 1 })
    ).rejects.toThrow();
  });
});

describe("clientPortal.loginByCode", () => {
  it("should reject empty access code", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.loginByCode({ accessCode: "" })
    ).rejects.toThrow();
  });

  it("should reject invalid access code", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.loginByCode({ accessCode: "INVALID_CODE_12345" })
    ).rejects.toThrow();
  });
});

describe("clientPortal.getActiveDiet", () => {
  it("should reject without valid access code", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.getActiveDiet({ clientId: 999, accessCode: "WRONG" })
    ).rejects.toThrow("Acceso denegado");
  });
});

describe("clientPortal.addMeasurement", () => {
  it("should reject without valid access code", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.addMeasurement({
        clientId: 999,
        accessCode: "WRONG",
        date: "2026-03-19",
        weight: 75000,
      })
    ).rejects.toThrow("Acceso denegado");
  });

  it("should validate date format", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.addMeasurement({
        clientId: 1,
        accessCode: "TEST",
        date: "invalid-date",
        weight: 75000,
      })
    ).rejects.toThrow();
  });
});

describe("clientPortal.uploadPhoto", () => {
  it("should reject without valid access code", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.uploadPhoto({
        clientId: 999,
        accessCode: "WRONG",
        photoBase64: "dGVzdA==",
        photoType: "front",
        date: "2026-03-19",
      })
    ).rejects.toThrow("Acceso denegado");
  });

  it("should validate photoType enum", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.uploadPhoto({
        clientId: 1,
        accessCode: "TEST",
        photoBase64: "dGVzdA==",
        photoType: "invalid" as any,
        date: "2026-03-19",
      })
    ).rejects.toThrow();
  });
});

describe("clientPortal.getMeasurements", () => {
  it("should reject without valid access code", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.getMeasurements({ clientId: 999, accessCode: "WRONG" })
    ).rejects.toThrow("Acceso denegado");
  });
});

describe("clientPortal.getPhotos", () => {
  it("should reject without valid access code", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clientPortal.getPhotos({ clientId: 999, accessCode: "WRONG" })
    ).rejects.toThrow("Acceso denegado");
  });
});

describe("diet.list", () => {
  it("should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.diet.list()).rejects.toThrow();
  });

  it("should return array for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.diet.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
