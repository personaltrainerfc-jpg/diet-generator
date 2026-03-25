import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  validatePassword,
  validateEmail,
  createEmailSessionToken,
  verifyEmailSession,
} from "./auth";

// Mock env for JWT
vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "test-secret-key-for-jwt-signing-32chars!",
    appId: "test-app-id",
    ownerOpenId: "test-owner",
  },
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Password hashing", () => {
  it("hashes and verifies a password correctly", async () => {
    const password = "TestPass123";
    const hash = await hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("CorrectPass1");
    const isValid = await verifyPassword("WrongPass1", hash);
    expect(isValid).toBe(false);
  });
});

describe("Token generation", () => {
  it("generates a 64-char hex token", () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates unique tokens", () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();
    expect(token1).not.toBe(token2);
  });
});

describe("Password validation", () => {
  it("rejects passwords shorter than 8 chars", () => {
    const result = validatePassword("Ab1");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("8 caracteres");
  });

  it("rejects passwords without uppercase", () => {
    const result = validatePassword("password123");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("mayúscula");
  });

  it("rejects passwords without numbers", () => {
    const result = validatePassword("PasswordABC");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("número");
  });

  it("accepts valid passwords", () => {
    const result = validatePassword("ValidPass1");
    expect(result.valid).toBe(true);
    expect(result.message).toBe("");
  });
});

describe("Email validation", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("Email JWT sessions", () => {
  it("creates and verifies a session token", async () => {
    const token = await createEmailSessionToken(42, "trainer@example.com");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT format

    const payload = await verifyEmailSession(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe(42);
    expect(payload!.email).toBe("trainer@example.com");
    expect(payload!.type).toBe("email");
  });

  it("returns null for invalid token", async () => {
    const payload = await verifyEmailSession("invalid.jwt.token");
    expect(payload).toBeNull();
  });

  it("returns null for null/undefined", async () => {
    expect(await verifyEmailSession(null)).toBeNull();
    expect(await verifyEmailSession(undefined)).toBeNull();
  });
});
