import { describe, it, expect, vi } from "vitest";

// Test that SMTP env vars are configured
describe("SMTP Configuration", () => {
  it("should have SMTP_HOST configured", () => {
    const host = process.env.SMTP_HOST;
    expect(host).toBeDefined();
    expect(host).not.toBe("");
    expect(host).toContain(".");
  });

  it("should have SMTP_PORT configured", () => {
    const port = process.env.SMTP_PORT;
    expect(port).toBeDefined();
    expect(Number(port)).toBeGreaterThan(0);
  });

  it("should have SMTP_USER configured", () => {
    const user = process.env.SMTP_USER;
    expect(user).toBeDefined();
    expect(user).not.toBe("");
    expect(user).toContain("@");
  });

  it("should have SMTP_PASS configured", () => {
    const pass = process.env.SMTP_PASS;
    expect(pass).toBeDefined();
    expect(pass).not.toBe("");
  });

  it("should have SMTP_FROM configured", () => {
    const from = process.env.SMTP_FROM;
    expect(from).toBeDefined();
    expect(from).not.toBe("");
  });
});

// Test nodemailer transport creation
describe("Nodemailer Transport", () => {
  it("should create a transport without errors", async () => {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: Number(process.env.SMTP_PORT || "587") === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    expect(transporter).toBeDefined();
    expect(transporter.options).toBeDefined();
  });

  it("should verify SMTP connection", async () => {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: Number(process.env.SMTP_PORT || "587") === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // This will actually try to connect to the SMTP server
    try {
      const verified = await transporter.verify();
      expect(verified).toBe(true);
    } catch (err: any) {
      // If connection fails, the credentials are likely wrong
      throw new Error(`SMTP connection failed: ${err.message}. Please check your SMTP credentials.`);
    }
  });
});
