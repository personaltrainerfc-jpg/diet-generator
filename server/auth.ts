import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { notifyOwner } from "./_core/notification";

const SALT_ROUNDS = 12;

// ── Password hashing ──

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Token generation ──

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex"); // 64 chars
}

// ── Password validation ──

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "La contraseña debe contener al menos una mayúscula." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "La contraseña debe contener al menos un número." };
  }
  return { valid: true, message: "" };
}

// ── Email validation ──

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── JWT Session for email/password users ──
// Uses a different payload shape (userId instead of openId) to distinguish from OAuth sessions

type EmailSessionPayload = {
  userId: number;
  email: string;
  type: "email"; // distinguishes from OAuth sessions
};

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createEmailSessionToken(userId: number, email: string): Promise<string> {
  const secretKey = getSessionSecret();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({
    userId,
    email,
    type: "email",
    appId: ENV.appId,
    name: email, // required by existing verifySession
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifyEmailSession(
  cookieValue: string | undefined | null
): Promise<EmailSessionPayload | null> {
  if (!cookieValue) return null;

  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });

    if (payload.type === "email" && typeof payload.userId === "number") {
      return {
        userId: payload.userId,
        email: payload.email as string,
        type: "email",
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Email sending (uses notifyOwner as fallback, logs for dev) ──

export async function sendVerificationEmail(email: string, token: string, origin: string): Promise<void> {
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  const subject = "NutriFlow — Verifica tu email";
  const body = `
Hola,

Gracias por registrarte en NutriFlow. Para activar tu cuenta, haz clic en el siguiente enlace:

${verifyUrl}

Este enlace es válido durante 48 horas.

Si no has creado esta cuenta, puedes ignorar este email.

— El equipo de NutriFlow
  `.trim();

  console.log(`[Auth] Verification email for ${email}: ${verifyUrl}`);

  // Use the notification system to alert the owner about new registrations
  try {
    await notifyOwner({
      title: `Nuevo registro: ${email}`,
      content: `Un nuevo entrenador se ha registrado con el email ${email}.\n\nEnlace de verificación: ${verifyUrl}`,
    });
  } catch (err) {
    console.warn("[Auth] Failed to notify owner about new registration:", err);
  }
}

export async function sendPasswordResetEmail(email: string, token: string, origin: string): Promise<void> {
  const resetUrl = `${origin}/reset-password?token=${token}`;
  const subject = "NutriFlow — Restablecer contraseña";
  const body = `
Hola,

Has solicitado restablecer tu contraseña en NutriFlow. Haz clic en el siguiente enlace:

${resetUrl}

Este enlace es válido durante 1 hora.

Si no has solicitado este cambio, puedes ignorar este email.

— El equipo de NutriFlow
  `.trim();

  console.log(`[Auth] Password reset email for ${email}: ${resetUrl}`);

  try {
    await notifyOwner({
      title: `Reset de contraseña: ${email}`,
      content: `El entrenador ${email} ha solicitado restablecer su contraseña.\n\nEnlace de reset: ${resetUrl}`,
    });
  } catch (err) {
    console.warn("[Auth] Failed to notify owner about password reset:", err);
  }
}
