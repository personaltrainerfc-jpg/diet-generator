import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

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

type EmailSessionPayload = {
  userId: number;
  email: string;
  type: "email";
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

// ── SMTP Email Transport ──

function createTransporter() {
  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
    console.warn("[Email] SMTP not configured. Emails will be logged only.");
    return null;
  }

  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: ENV.smtpUser,
      pass: ENV.smtpPass,
    },
  });
}

// ── Send Verification Email ──

export async function sendVerificationEmail(
  email: string,
  token: string,
  origin: string,
  name?: string
): Promise<{ sent: boolean; error?: string }> {
  const verificationUrl = `${origin}/verify-email?token=${token}`;
  const displayName = name || email.split("@")[0];

  console.log(`[Email] Verification email for ${email}: ${verificationUrl}`);

  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[Email] No SMTP configured, skipping email send");
    return { sent: false, error: "SMTP no configurado" };
  }

  try {
    await transporter.sendMail({
      from: ENV.smtpFrom || `NutriFlow <${ENV.smtpUser}>`,
      to: email,
      subject: "Activa tu cuenta en NutriFlow",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">NutriFlow</h1>
          </div>
          <h2 style="color: #1a1a1a;">Bienvenido, ${displayName}</h2>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
            Gracias por registrarte en NutriFlow. Para activar tu cuenta, haz clic en el siguiente boton:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #16a34a; color: white; padding: 14px 28px; 
                      border-radius: 8px; text-decoration: none; display: inline-block;
                      font-size: 16px; font-weight: 600;">
              Activar mi cuenta
            </a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            Si no has creado una cuenta en NutriFlow, ignora este email.<br>
            El enlace caduca en 48 horas.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            NutriFlow — Nutricion inteligente para profesionales
          </p>
        </div>
      `,
    });

    console.log(`[Email] Verification email sent successfully to ${email}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email] Failed to send verification email to ${email}:`, err);
    return { sent: false, error: String(err) };
  }
}

// ── Send Password Reset Email ──

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  origin: string
): Promise<{ sent: boolean; error?: string }> {
  const resetUrl = `${origin}/reset-password?token=${token}`;

  console.log(`[Email] Password reset email for ${email}: ${resetUrl}`);

  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[Email] No SMTP configured, skipping email send");
    return { sent: false, error: "SMTP no configurado" };
  }

  try {
    await transporter.sendMail({
      from: ENV.smtpFrom || `NutriFlow <${ENV.smtpUser}>`,
      to: email,
      subject: "Restablecer contrasena — NutriFlow",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">NutriFlow</h1>
          </div>
          <h2 style="color: #1a1a1a;">Restablecer contrasena</h2>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
            Has solicitado restablecer tu contrasena en NutriFlow. Haz clic en el siguiente boton:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #16a34a; color: white; padding: 14px 28px; 
                      border-radius: 8px; text-decoration: none; display: inline-block;
                      font-size: 16px; font-weight: 600;">
              Restablecer contrasena
            </a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            Si no has solicitado este cambio, puedes ignorar este email.<br>
            El enlace es valido durante 1 hora.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            NutriFlow — Nutricion inteligente para profesionales
          </p>
        </div>
      `,
    });

    console.log(`[Email] Password reset email sent successfully to ${email}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email] Failed to send password reset email to ${email}:`, err);
    return { sent: false, error: String(err) };
  }
}
