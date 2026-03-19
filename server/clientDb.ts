import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  clients, clientDiets, adherenceLogs, progressPhotos,
  weeklyCheckIns, chatMessages, achievements, clientAchievements,
  bodyMeasurements, initialAssessments, diets
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
