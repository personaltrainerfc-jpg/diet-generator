import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  clients, clientDiets, adherenceLogs, progressPhotos,
  weeklyCheckIns, chatMessages, achievements, clientAchievements,
  bodyMeasurements, initialAssessments, diets,
  activityBadges, clientActivityBadges, activityStreaks
} from "../drizzle/schema";
import { getFullDiet } from "./db";

function assertDb<T>(db: T | null | undefined): asserts db is NonNullable<T> {
  if (!db) throw new Error("Database not available");
}

// ── Clients ──
export async function createClient(data: {
  trainerId: number; name: string; email?: string; phone?: string;
  age?: number; weight?: number; height?: number; goal?: string; notes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString(36).toUpperCase();
  const [result] = await db.insert(clients).values({ ...data, accessCode });
  return { id: result.insertId, accessCode };
}

export async function getClientsByTrainer(trainerId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(clients).where(eq(clients.trainerId, trainerId)).orderBy(desc(clients.updatedAt));
}

export async function getClientById(id: number) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return rows[0] || null;
}

export async function getClientByAccessCode(code: string) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(clients).where(eq(clients.accessCode, code)).limit(1);
  return rows[0] || null;
}

export async function updateClient(id: number, data: Partial<{
  name: string; email: string; phone: string; age: number;
  weight: number; height: number; goal: string; notes: string; status: "active" | "inactive" | "paused";
  archetype: string;
}>) {
  const db = await getDb(); assertDb(db);
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(clients).where(eq(clients.id, id));
}

// ── Client Diets ──
export async function assignDietToClient(clientId: number, dietId: number) {
  const db = await getDb(); assertDb(db);
  await db.update(clientDiets).set({ active: 0 }).where(and(eq(clientDiets.clientId, clientId), eq(clientDiets.active, 1)));
  const [result] = await db.insert(clientDiets).values({ clientId, dietId });
  return result.insertId;
}

export async function getClientActiveDiet(clientId: number) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(clientDiets)
    .where(and(eq(clientDiets.clientId, clientId), eq(clientDiets.active, 1)))
    .limit(1);
  if (!rows[0]) return null;
  // Return the full diet data (with menus, meals, foods) along with assignment info
  const fullDiet = await getFullDiet(rows[0].dietId);
  if (!fullDiet) return null;
  return { ...fullDiet, assignedAt: rows[0].assignedAt, clientDietId: rows[0].id };
}

export async function getClientDietHistory(clientId: number) {
  const db = await getDb(); assertDb(db);
  const assignments = await db.select({
    id: clientDiets.id,
    clientId: clientDiets.clientId,
    dietId: clientDiets.dietId,
    assignedAt: clientDiets.assignedAt,
    active: clientDiets.active,
    dietName: diets.name,
    totalCalories: diets.totalCalories,
    mealsPerDay: diets.mealsPerDay,
    dietType: diets.dietType,
  }).from(clientDiets)
    .innerJoin(diets, eq(clientDiets.dietId, diets.id))
    .where(eq(clientDiets.clientId, clientId))
    .orderBy(desc(clientDiets.assignedAt));
  return assignments;
}

// ── Adherence Logs ──
export async function logAdherence(data: {
  clientId: number; dietId: number; date: string; mealNumber: number; completed: number; notes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(adherenceLogs).where(
    and(
      eq(adherenceLogs.clientId, data.clientId),
      eq(adherenceLogs.date, data.date),
      eq(adherenceLogs.mealNumber, data.mealNumber)
    )
  ).limit(1);
  if (existing.length > 0) {
    await db.update(adherenceLogs).set({ completed: data.completed, notes: data.notes || null })
      .where(eq(adherenceLogs.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(adherenceLogs).values(data);
  return result.insertId;
}

export async function getAdherenceByDate(clientId: number, date: string) {
  const db = await getDb(); assertDb(db);
  return db.select().from(adherenceLogs)
    .where(and(eq(adherenceLogs.clientId, clientId), eq(adherenceLogs.date, date)));
}

export async function getAdherenceRange(clientId: number, startDate: string, endDate: string) {
  const db = await getDb(); assertDb(db);
  return db.select().from(adherenceLogs)
    .where(and(
      eq(adherenceLogs.clientId, clientId),
      gte(adherenceLogs.date, startDate),
      lte(adherenceLogs.date, endDate)
    ))
    .orderBy(asc(adherenceLogs.date));
}

// ── Progress Photos ──
export async function addProgressPhoto(data: {
  clientId: number; photoUrl: string; photoType: "front" | "side" | "back" | "other"; date: string; notes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(progressPhotos).values(data);
  return result.insertId;
}

export async function getProgressPhotos(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(progressPhotos)
    .where(eq(progressPhotos.clientId, clientId))
    .orderBy(desc(progressPhotos.date));
}

export async function deleteProgressPhoto(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(progressPhotos).where(eq(progressPhotos.id, id));
}

// ── Weekly Check-Ins ──
export async function createCheckIn(data: {
  clientId: number; weekStart: string; currentWeight?: number;
  energyLevel?: number; hungerLevel?: number; sleepQuality?: number;
  adherenceRating?: number; notes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(weeklyCheckIns).values(data);
  return result.insertId;
}

export async function getCheckIns(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(weeklyCheckIns)
    .where(eq(weeklyCheckIns.clientId, clientId))
    .orderBy(desc(weeklyCheckIns.weekStart));
}

export async function updateCheckInFeedback(id: number, feedback: string) {
  const db = await getDb(); assertDb(db);
  await db.update(weeklyCheckIns).set({ trainerFeedback: feedback }).where(eq(weeklyCheckIns.id, id));
}

// ── Chat Messages ──
export async function sendMessage(data: {
  clientId: number; senderType: "trainer" | "client"; message: string;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(chatMessages).values(data);
  return result.insertId;
}

export async function getMessages(clientId: number, limit = 50) {
  const db = await getDb(); assertDb(db);
  return db.select().from(chatMessages)
    .where(eq(chatMessages.clientId, clientId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function markMessagesRead(clientId: number, senderType: "trainer" | "client") {
  const db = await getDb(); assertDb(db);
  await db.update(chatMessages).set({ isRead: 1 })
    .where(and(eq(chatMessages.clientId, clientId), eq(chatMessages.senderType, senderType)));
}

export async function getUnreadCount(clientId: number, senderType: "trainer" | "client") {
  const db = await getDb(); assertDb(db);
  const rows = await db.select({ count: sql<number>`count(*)` }).from(chatMessages)
    .where(and(
      eq(chatMessages.clientId, clientId),
      eq(chatMessages.senderType, senderType),
      eq(chatMessages.isRead, 0)
    ));
  return rows[0]?.count || 0;
}

// ── Achievements ──
export async function createAchievement(data: {
  trainerId: number; name: string; description?: string; icon?: string; condition: string; threshold?: number;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(achievements).values(data);
  return result.insertId;
}

export async function getAchievements(trainerId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(achievements).where(eq(achievements.trainerId, trainerId));
}

export async function deleteAchievement(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(achievements).where(eq(achievements.id, id));
}

export async function unlockAchievement(clientId: number, achievementId: number) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(clientAchievements)
    .where(and(eq(clientAchievements.clientId, clientId), eq(clientAchievements.achievementId, achievementId)))
    .limit(1);
  if (existing.length > 0) return existing[0].id;
  const [result] = await db.insert(clientAchievements).values({ clientId, achievementId });
  return result.insertId;
}

export async function getClientAchievements(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select({
    id: clientAchievements.id,
    achievementId: clientAchievements.achievementId,
    unlockedAt: clientAchievements.unlockedAt,
    name: achievements.name,
    description: achievements.description,
    icon: achievements.icon,
  }).from(clientAchievements)
    .innerJoin(achievements, eq(clientAchievements.achievementId, achievements.id))
    .where(eq(clientAchievements.clientId, clientId))
    .orderBy(desc(clientAchievements.unlockedAt));
}

// ── Body Measurements ──
export async function addMeasurement(data: {
  clientId: number; date: string; weight?: number; bodyFat?: number;
  chest?: number; waist?: number; hips?: number; arms?: number; thighs?: number; notes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(bodyMeasurements).values(data);
  return result.insertId;
}

export async function getMeasurements(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(bodyMeasurements)
    .where(eq(bodyMeasurements.clientId, clientId))
    .orderBy(desc(bodyMeasurements.date));
}

export async function deleteMeasurement(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(bodyMeasurements).where(eq(bodyMeasurements.id, id));
}

// ── Initial Assessments ──
export async function createAssessment(data: {
  clientId: number; currentDiet?: string; exerciseFrequency?: string;
  exerciseType?: string; medicalConditions?: string; medications?: string;
  allergiesIntolerances?: string; sleepHours?: number; stressLevel?: number;
  waterIntake?: number; alcoholFrequency?: string; smokingStatus?: string;
  goals?: string; trainerNotes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(initialAssessments).values(data);
  return result.insertId;
}

export async function getAssessment(clientId: number) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(initialAssessments)
    .where(eq(initialAssessments.clientId, clientId))
    .orderBy(desc(initialAssessments.createdAt))
    .limit(1);
  return rows[0] || null;
}

export async function updateAssessment(id: number, data: Partial<{
  currentDiet: string; exerciseFrequency: string; exerciseType: string;
  medicalConditions: string; medications: string; allergiesIntolerances: string;
  sleepHours: number; stressLevel: number; waterIntake: number;
  alcoholFrequency: string; smokingStatus: string; goals: string; trainerNotes: string;
}>) {
  const db = await getDb(); assertDb(db);
  await db.update(initialAssessments).set(data).where(eq(initialAssessments.id, id));
}

// ── Dashboard Stats ──
export async function getTrainerDashboardStats(trainerId: number) {
  const db = await getDb(); assertDb(db);
  const allClients = await db.select().from(clients).where(eq(clients.trainerId, trainerId));
  const activeClients = allClients.filter((c: any) => c.status === "active");
  
  let totalUnread = 0;
  for (const client of activeClients) {
    const count = await getUnreadCount(client.id, "client");
    totalUnread += count;
  }

  const today = new Date().toISOString().split("T")[0];
  let totalMeals = 0;
  let completedMeals = 0;
  for (const client of activeClients) {
    const logs = await getAdherenceByDate(client.id, today);
    totalMeals += logs.length;
    completedMeals += logs.filter((l: any) => l.completed === 1).length;
  }

  return {
    totalClients: allClients.length,
    activeClients: activeClients.length,
    unreadMessages: totalUnread,
    todayAdherence: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : null,
  };
}

// ═══════════════════════════════════════════════════════
// BLOQUE C: Funciones App Entrenador
// ═══════════════════════════════════════════════════════

import {
  dietTemplates, clientFavoriteFoods, clientTags, clientTagAssignments,
  hydrationLogs, sleepLogs, wellnessLogs, mealReminders
} from "../drizzle/schema";

// ── Diet Templates ──
export async function createDietTemplate(data: {
  userId: number; dietId: number; name: string; tags?: string[]; description?: string;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(dietTemplates).values(data);
  return result.insertId;
}

export async function getDietTemplates(userId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(dietTemplates).where(eq(dietTemplates.userId, userId)).orderBy(desc(dietTemplates.createdAt));
}

export async function deleteDietTemplate(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(dietTemplates).where(eq(dietTemplates.id, id));
}

// ── Client Favorite Foods ──
export async function addClientFavoriteFood(data: { clientId: number; trainerId: number; foodName: string }) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(clientFavoriteFoods).values(data);
  return result.insertId;
}

export async function getClientFavoriteFoods(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(clientFavoriteFoods).where(eq(clientFavoriteFoods.clientId, clientId)).orderBy(desc(clientFavoriteFoods.createdAt));
}

export async function deleteClientFavoriteFood(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(clientFavoriteFoods).where(eq(clientFavoriteFoods.id, id));
}

// ── Client Tags ──
export async function createClientTag(data: { trainerId: number; name: string; color?: string }) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(clientTags).values(data);
  return result.insertId;
}

export async function getClientTags(trainerId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(clientTags).where(eq(clientTags.trainerId, trainerId));
}

export async function deleteClientTag(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(clientTagAssignments).where(eq(clientTagAssignments.tagId, id));
  await db.delete(clientTags).where(eq(clientTags.id, id));
}

export async function assignTagToClient(clientId: number, tagId: number) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(clientTagAssignments)
    .where(and(eq(clientTagAssignments.clientId, clientId), eq(clientTagAssignments.tagId, tagId)))
    .limit(1);
  if (existing.length > 0) return existing[0].id;
  const [result] = await db.insert(clientTagAssignments).values({ clientId, tagId });
  return result.insertId;
}

export async function removeTagFromClient(clientId: number, tagId: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(clientTagAssignments)
    .where(and(eq(clientTagAssignments.clientId, clientId), eq(clientTagAssignments.tagId, tagId)));
}

export async function getClientTagAssignments(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select({
    id: clientTagAssignments.id,
    tagId: clientTagAssignments.tagId,
    name: clientTags.name,
    color: clientTags.color,
  }).from(clientTagAssignments)
    .innerJoin(clientTags, eq(clientTagAssignments.tagId, clientTags.id))
    .where(eq(clientTagAssignments.clientId, clientId));
}

// ═══════════════════════════════════════════════════════
// BLOQUE D: Funciones App Cliente
// ═══════════════════════════════════════════════════════

// ── Hydration Logs ──
export async function logHydration(data: { clientId: number; date: string; glasses: number; goalGlasses?: number }) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(hydrationLogs)
    .where(and(eq(hydrationLogs.clientId, data.clientId), eq(hydrationLogs.date, data.date)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(hydrationLogs).set({ glasses: data.glasses, goalGlasses: data.goalGlasses ?? existing[0].goalGlasses })
      .where(eq(hydrationLogs.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(hydrationLogs).values(data);
  return result.insertId;
}

export async function getHydrationLogs(clientId: number, startDate?: string, endDate?: string) {
  const db = await getDb(); assertDb(db);
  if (startDate && endDate) {
    return db.select().from(hydrationLogs)
      .where(and(eq(hydrationLogs.clientId, clientId), gte(hydrationLogs.date, startDate), lte(hydrationLogs.date, endDate)))
      .orderBy(desc(hydrationLogs.date));
  }
  return db.select().from(hydrationLogs)
    .where(eq(hydrationLogs.clientId, clientId))
    .orderBy(desc(hydrationLogs.date))
    .limit(30);
}

// ── Sleep Logs ──
export async function logSleep(data: { clientId: number; date: string; hoursSlept: number; quality: number; notes?: string }) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(sleepLogs)
    .where(and(eq(sleepLogs.clientId, data.clientId), eq(sleepLogs.date, data.date)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(sleepLogs).set({ hoursSlept: data.hoursSlept, quality: data.quality, notes: data.notes || null })
      .where(eq(sleepLogs.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(sleepLogs).values(data);
  return result.insertId;
}

export async function getSleepLogs(clientId: number, limit = 30) {
  const db = await getDb(); assertDb(db);
  return db.select().from(sleepLogs)
    .where(eq(sleepLogs.clientId, clientId))
    .orderBy(desc(sleepLogs.date))
    .limit(limit);
}

// ── Wellness Logs ──
export async function logWellness(data: {
  clientId: number; date: string; energy: number; mood: number; digestion: number; bloating: number; notes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(wellnessLogs)
    .where(and(eq(wellnessLogs.clientId, data.clientId), eq(wellnessLogs.date, data.date)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(wellnessLogs).set({ energy: data.energy, mood: data.mood, digestion: data.digestion, bloating: data.bloating, notes: data.notes || null })
      .where(eq(wellnessLogs.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(wellnessLogs).values(data);
  return result.insertId;
}

export async function getWellnessLogs(clientId: number, limit = 30) {
  const db = await getDb(); assertDb(db);
  return db.select().from(wellnessLogs)
    .where(eq(wellnessLogs.clientId, clientId))
    .orderBy(desc(wellnessLogs.date))
    .limit(limit);
}

// ── Meal Reminders ──
export async function setMealReminder(data: { clientId: number; mealName: string; reminderTime: string; enabled?: number }) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(mealReminders)
    .where(and(eq(mealReminders.clientId, data.clientId), eq(mealReminders.mealName, data.mealName)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(mealReminders).set({ reminderTime: data.reminderTime, enabled: data.enabled ?? 1 })
      .where(eq(mealReminders.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(mealReminders).values(data);
  return result.insertId;
}

export async function getMealReminders(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(mealReminders).where(eq(mealReminders.clientId, clientId));
}

export async function deleteMealReminder(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(mealReminders).where(eq(mealReminders.id, id));
}

// ═══════════════════════════════════════════════════════
// BLOQUE E: Invitaciones, Motivation Logs, Weekend
// ═══════════════════════════════════════════════════════

import { clientInvitations, motivationLogs, weekendMeals, weekendFeedback } from "../drizzle/schema";
import crypto from "crypto";
import { lt } from "drizzle-orm";

// ── Client Invitations ──
export async function createInvitation(data: { clientId: number; trainerId: number; email: string }) {
  const db = await getDb(); assertDb(db);
  const inviteCode = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h
  const [result] = await db.insert(clientInvitations).values({
    clientId: data.clientId,
    trainerId: data.trainerId,
    email: data.email,
    inviteCode,
    expiresAt,
  }).$returningId();
  return { id: result.id, inviteCode, expiresAt };
}

export async function getInvitationByCode(code: string) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(clientInvitations).where(eq(clientInvitations.inviteCode, code)).limit(1);
  return rows[0] || null;
}

export async function getClientInvitations(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(clientInvitations).where(eq(clientInvitations.clientId, clientId)).orderBy(desc(clientInvitations.createdAt));
}

export async function updateInvitationStatus(id: number, status: "pending" | "accepted" | "expired", acceptedAt?: Date) {
  const db = await getDb(); assertDb(db);
  await db.update(clientInvitations).set({ 
    status: status as any, // inviteStatus enum
    ...(acceptedAt ? { acceptedAt } : {}),
  }).where(eq(clientInvitations.id, id));
}

export async function expireOldInvitations() {
  const db = await getDb(); assertDb(db);
  await db.update(clientInvitations)
    .set({ status: "expired" as any })
    .where(and(
      eq(clientInvitations.status, "pending" as any),
      lt(clientInvitations.expiresAt, new Date())
    ));
}

// ── Motivation Logs ──
export async function logMotivationMessage(data: { clientId: number; message: string; sentByTrainer?: number }) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(motivationLogs).values({
    clientId: data.clientId,
    message: data.message,
    sentByTrainer: data.sentByTrainer || 0,
  }).$returningId();
  return result.id;
}

export async function getRecentMotivationMessages(clientId: number, limit = 10) {
  const db = await getDb(); assertDb(db);
  return db.select().from(motivationLogs).where(eq(motivationLogs.clientId, clientId)).orderBy(desc(motivationLogs.createdAt)).limit(limit);
}

export async function markMotivationSent(id: number) {
  const db = await getDb(); assertDb(db);
  await db.update(motivationLogs).set({ sentByTrainer: 1 }).where(eq(motivationLogs.id, id));
}

// ── Weekend Meals ──
export async function addWeekendMeal(data: {
  clientId: number; date: string; mealType: string; description: string;
  photoUrl?: string; calories?: number; isHealthy?: number; notes?: string;
}) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(weekendMeals).values(data).$returningId();
  return result.id;
}

export async function getWeekendMeals(clientId: number, date?: string) {
  const db = await getDb(); assertDb(db);
  if (date) {
    return db.select().from(weekendMeals).where(and(eq(weekendMeals.clientId, clientId), eq(weekendMeals.date, date))).orderBy(weekendMeals.createdAt);
  }
  return db.select().from(weekendMeals).where(eq(weekendMeals.clientId, clientId)).orderBy(desc(weekendMeals.createdAt)).limit(50);
}

export async function deleteWeekendMeal(id: number) {
  const db = await getDb(); assertDb(db);
  await db.delete(weekendMeals).where(eq(weekendMeals.id, id));
}

// ── Weekend Feedback ──
export async function addWeekendFeedback(data: { clientId: number; weekendDate: string; feedback: string; score?: number }) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(weekendFeedback).values(data).$returningId();
  return result.id;
}

export async function getWeekendFeedbackList(clientId: number) {
  const db = await getDb(); assertDb(db);
  return db.select().from(weekendFeedback).where(eq(weekendFeedback.clientId, clientId)).orderBy(desc(weekendFeedback.createdAt)).limit(20);
}

// ═══════════════════════════════════════════════════════
// BLOQUE F: Asistente IA Conversacional
// ═══════════════════════════════════════════════════════

import {
  aiConversations, aiAssistantConfig, aiEscalationAlerts,
  learnedPreferences, personalizationProfiles,
  activityLogs, wearableConnections
} from "../drizzle/schema";

// ── AI Conversations ──
export async function getOrCreateConversation(clientId: number) {
  const db = await getDb(); assertDb(db);
  // Get today's conversation or create new one
  const today = new Date().toISOString().split("T")[0];
  const rows = await db.select().from(aiConversations)
    .where(eq(aiConversations.clientId, clientId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(1);
  
  if (rows[0]) {
    const lastUpdate = new Date(rows[0].updatedAt).toISOString().split("T")[0];
    if (lastUpdate === today) return rows[0];
  }
  
  // Create new conversation
  const [result] = await db.insert(aiConversations).values({
    clientId,
    messages: [],
  }).$returningId();
  
  const newRows = await db.select().from(aiConversations).where(eq(aiConversations.id, result.id)).limit(1);
  return newRows[0];
}

export async function getConversationById(id: number) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(aiConversations).where(eq(aiConversations.id, id)).limit(1);
  return rows[0] || null;
}

export async function updateConversationMessages(id: number, messages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }>, summary?: string) {
  const db = await getDb(); assertDb(db);
  await db.update(aiConversations).set({ messages, ...(summary ? { summary } : {}) }).where(eq(aiConversations.id, id));
}

export async function getRecentConversations(clientId: number, limit = 5) {
  const db = await getDb(); assertDb(db);
  return db.select().from(aiConversations)
    .where(eq(aiConversations.clientId, clientId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(limit);
}

// ── AI Assistant Config ──
export async function getAssistantConfig(trainerId: number) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(aiAssistantConfig)
    .where(eq(aiAssistantConfig.trainerId, trainerId))
    .limit(1);
  return rows[0] || null;
}

export async function upsertAssistantConfig(trainerId: number, data: Partial<{
  assistantName: string; tone: string; customRules: string;
  escalationKeywords: string[]; enabled: number;
}>) {
  const db = await getDb(); assertDb(db);
  const existing = await getAssistantConfig(trainerId);
  if (existing) {
    await db.update(aiAssistantConfig).set(data).where(eq(aiAssistantConfig.id, existing.id));
    return existing.id;
  }
  const [result] = await db.insert(aiAssistantConfig).values({ trainerId, ...data }).$returningId();
  return result.id;
}

// ── AI Escalation Alerts ──
export async function createEscalationAlert(data: { clientId: number; trainerId: number; reason: string; conversationId?: number }) {
  const db = await getDb(); assertDb(db);
  const [result] = await db.insert(aiEscalationAlerts).values(data).$returningId();
  return result.id;
}

export async function getEscalationAlerts(trainerId: number, resolved = false) {
  const db = await getDb(); assertDb(db);
  return db.select().from(aiEscalationAlerts)
    .where(and(eq(aiEscalationAlerts.trainerId, trainerId), eq(aiEscalationAlerts.resolved, resolved ? 1 : 0)))
    .orderBy(desc(aiEscalationAlerts.createdAt));
}

export async function resolveEscalationAlert(id: number) {
  const db = await getDb(); assertDb(db);
  await db.update(aiEscalationAlerts).set({ resolved: 1 }).where(eq(aiEscalationAlerts.id, id));
}

// ═══════════════════════════════════════════════════════
// BLOQUE G: Motor de Personalización Progresiva
// ═══════════════════════════════════════════════════════

export async function addLearnedPreference(data: {
  clientId: number; category: string; key: string; value: string; confidence?: number; source: string;
}) {
  const db = await getDb(); assertDb(db);
  // Upsert: if same category+key exists, update
  const existing = await db.select().from(learnedPreferences)
    .where(and(
      eq(learnedPreferences.clientId, data.clientId),
      eq(learnedPreferences.category, data.category),
      eq(learnedPreferences.key, data.key)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(learnedPreferences).set({
      value: data.value,
      confidence: data.confidence ?? existing[0].confidence,
      source: data.source,
    }).where(eq(learnedPreferences.id, existing[0].id));
    return existing[0].id;
  }
  
  const [result] = await db.insert(learnedPreferences).values(data).$returningId();
  return result.id;
}

export async function getLearnedPreferences(clientId: number, category?: string) {
  const db = await getDb(); assertDb(db);
  if (category) {
    return db.select().from(learnedPreferences)
      .where(and(eq(learnedPreferences.clientId, clientId), eq(learnedPreferences.category, category)))
      .orderBy(desc(learnedPreferences.confidence));
  }
  return db.select().from(learnedPreferences)
    .where(eq(learnedPreferences.clientId, clientId))
    .orderBy(desc(learnedPreferences.confidence));
}

export async function getPersonalizationProfile(clientId: number) {
  const db = await getDb(); assertDb(db);
  const rows = await db.select().from(personalizationProfiles)
    .where(eq(personalizationProfiles.clientId, clientId))
    .limit(1);
  return rows[0] || null;
}

export async function upsertPersonalizationProfile(clientId: number, profileData: any) {
  const db = await getDb(); assertDb(db);
  const existing = await getPersonalizationProfile(clientId);
  if (existing) {
    await db.update(personalizationProfiles).set({ profileData, lastAnalyzedAt: new Date() })
      .where(eq(personalizationProfiles.id, existing.id));
    return existing.id;
  }
  const [result] = await db.insert(personalizationProfiles).values({ clientId, profileData }).$returningId();
  return result.id;
}

// ═══════════════════════════════════════════════════════
// BLOQUE H: Integración Wearables
// ═══════════════════════════════════════════════════════

export async function logActivity(data: {
  clientId: number; date: string; steps?: number; activeMinutes?: number;
  caloriesBurned?: number; heartRateAvg?: number; heartRateMax?: number;
  source?: string; rawData?: Record<string, any>;
}) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(activityLogs)
    .where(and(eq(activityLogs.clientId, data.clientId), eq(activityLogs.date, data.date)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(activityLogs).set(data).where(eq(activityLogs.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(activityLogs).values(data).$returningId();
  return result.id;
}

export async function getActivityLogs(clientId: number, startDate?: string, endDate?: string) {
  const db = await getDb(); assertDb(db);
  if (startDate && endDate) {
    return db.select().from(activityLogs)
      .where(and(eq(activityLogs.clientId, clientId), gte(activityLogs.date, startDate), lte(activityLogs.date, endDate)))
      .orderBy(desc(activityLogs.date));
  }
  return db.select().from(activityLogs)
    .where(eq(activityLogs.clientId, clientId))
    .orderBy(desc(activityLogs.date))
    .limit(30);
}

export async function getWearableConnection(clientId: number, provider?: string) {
  const db = await getDb(); assertDb(db);
  if (provider) {
    const rows = await db.select().from(wearableConnections)
      .where(and(eq(wearableConnections.clientId, clientId), eq(wearableConnections.provider, provider)))
      .limit(1);
    return rows[0] || null;
  }
  return db.select().from(wearableConnections)
    .where(eq(wearableConnections.clientId, clientId));
}

export async function upsertWearableConnection(clientId: number, data: {
  provider: string; accessToken?: string; refreshToken?: string; expiresAt?: Date;
}) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(wearableConnections)
    .where(and(eq(wearableConnections.clientId, clientId), eq(wearableConnections.provider, data.provider)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(wearableConnections).set({
      ...data,
      lastSyncAt: new Date(),
      status: "connected" as any,
    }).where(eq(wearableConnections.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(wearableConnections).values({
    clientId,
    ...data,
    lastSyncAt: new Date(),
  }).$returningId();
  return result.id;
}

export async function disconnectWearable(id: number) {
  const db = await getDb(); assertDb(db);
  await db.update(wearableConnections).set({ status: "disconnected" as any }).where(eq(wearableConnections.id, id));
}

// ═══════════════════════════════════════════════════════
// BLOQUE I: Gamificación de Actividad
// ═══════════════════════════════════════════════════════

export async function getAllActivityBadges() {
  const db = await getDb(); assertDb(db);
  return db.select().from(activityBadges).orderBy(asc(activityBadges.category), asc(activityBadges.threshold));
}

export async function getClientActivityBadges(clientId: number) {
  const db = await getDb(); assertDb(db);
  const badges = await db.select({
    id: clientActivityBadges.id,
    badgeId: clientActivityBadges.badgeId,
    unlockedAt: clientActivityBadges.unlockedAt,
    value: clientActivityBadges.value,
    code: activityBadges.code,
    name: activityBadges.name,
    description: activityBadges.description,
    icon: activityBadges.icon,
    category: activityBadges.category,
    threshold: activityBadges.threshold,
    tier: activityBadges.tier,
  })
    .from(clientActivityBadges)
    .innerJoin(activityBadges, eq(clientActivityBadges.badgeId, activityBadges.id))
    .where(eq(clientActivityBadges.clientId, clientId))
    .orderBy(desc(clientActivityBadges.unlockedAt));
  return badges;
}

export async function unlockActivityBadge(clientId: number, badgeId: number, value?: number) {
  const db = await getDb(); assertDb(db);
  // Check if already unlocked
  const existing = await db.select().from(clientActivityBadges)
    .where(and(eq(clientActivityBadges.clientId, clientId), eq(clientActivityBadges.badgeId, badgeId)));
  if (existing.length > 0) return null;
  const [result] = await db.insert(clientActivityBadges).values({ clientId, badgeId, value });
  return result.insertId;
}

export async function getOrCreateStreak(clientId: number) {
  const db = await getDb(); assertDb(db);
  const existing = await db.select().from(activityStreaks).where(eq(activityStreaks.clientId, clientId));
  if (existing.length > 0) return existing[0];
  await db.insert(activityStreaks).values({ clientId });
  const created = await db.select().from(activityStreaks).where(eq(activityStreaks.clientId, clientId));
  return created[0];
}

export async function updateStreak(clientId: number, date: string) {
  const db = await getDb(); assertDb(db);
  const streak = await getOrCreateStreak(clientId);
  
  // Calculate if this is a consecutive day
  const lastDate = streak.lastActiveDate;
  let newStreak = 1;
  
  if (lastDate) {
    const last = new Date(lastDate);
    const current = new Date(date);
    const diffDays = Math.round((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      newStreak = streak.currentStreak + 1;
    } else if (diffDays === 0) {
      // Same day, no change
      newStreak = streak.currentStreak;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }
  
  const longestStreak = Math.max(streak.longestStreak, newStreak);
  
  await db.update(activityStreaks)
    .set({ currentStreak: newStreak, longestStreak, lastActiveDate: date })
    .where(eq(activityStreaks.clientId, clientId));
  
  return { currentStreak: newStreak, longestStreak };
}

export async function evaluateBadges(clientId: number, activityData: { steps?: number; activeMinutes?: number; caloriesBurned?: number }, streakData: { currentStreak: number }) {
  const db = await getDb(); assertDb(db);
  const allBadges = await getAllActivityBadges();
  const unlockedBadges = await getClientActivityBadges(clientId);
  const unlockedIds = new Set(unlockedBadges.map(b => b.badgeId));
  
  const newlyUnlocked: Array<{ badgeId: number; name: string; icon: string; tier: string; description: string }> = [];
  
  for (const badge of allBadges) {
    if (unlockedIds.has(badge.id)) continue;
    
    let qualifies = false;
    let value = 0;
    
    switch (badge.category) {
      case "steps":
        if (activityData.steps && activityData.steps >= badge.threshold) {
          qualifies = true;
          value = activityData.steps;
        }
        break;
      case "active_minutes":
        if (activityData.activeMinutes && activityData.activeMinutes >= badge.threshold) {
          qualifies = true;
          value = activityData.activeMinutes;
        }
        break;
      case "calories":
        if (activityData.caloriesBurned && activityData.caloriesBurned >= badge.threshold) {
          qualifies = true;
          value = activityData.caloriesBurned;
        }
        break;
      case "streak":
        if (streakData.currentStreak >= badge.threshold) {
          qualifies = true;
          value = streakData.currentStreak;
        }
        break;
    }
    
    if (qualifies) {
      await unlockActivityBadge(clientId, badge.id, value);
      newlyUnlocked.push({ badgeId: badge.id, name: badge.name, icon: badge.icon, tier: badge.tier, description: badge.description });
    }
  }
  
  return newlyUnlocked;
}
