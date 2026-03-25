import { drizzle } from "drizzle-orm/mysql2";
import { users, diets, clients, recipes } from "../drizzle/schema";
import { eq, sql, count, desc, and, gte } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[AdminDb] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/* ── Platform stats (overview) ── */
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalTrainers] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "trainer")));
  const [totalClients] = await db.select({ c: count() }).from(clients);
  const [totalDiets] = await db.select({ c: count() }).from(diets);
  const [totalRecipes] = await db.select({ c: count() }).from(recipes);

  const [activeToday] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "trainer"), gte(users.lastSignedIn, todayStart)));
  const [activeWeek] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "trainer"), gte(users.lastSignedIn, weekAgo)));
  const [activeMonth] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "trainer"), gte(users.lastSignedIn, monthAgo)));

  const [verifiedTrainers] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "trainer"), eq(users.emailVerified, 1)));
  const [activeTrainers] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "trainer"), eq(users.isActive, 1)));

  // Plan distribution
  const planDist = await db.select({ plan: users.plan, c: count() }).from(users).where(eq(users.role, "trainer")).groupBy(users.plan);

  // Recent registrations (last 30 days)
  const [recentRegistrations] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "trainer"), gte(users.createdAt, monthAgo)));

  return {
    totalTrainers: totalTrainers.c,
    totalClients: totalClients.c,
    totalDiets: totalDiets.c,
    totalRecipes: totalRecipes.c,
    activeToday: activeToday.c,
    activeWeek: activeWeek.c,
    activeMonth: activeMonth.c,
    verifiedTrainers: verifiedTrainers.c,
    activeTrainers: activeTrainers.c,
    planDistribution: planDist.map(p => ({ plan: p.plan, count: p.c })),
    recentRegistrations: recentRegistrations.c,
  };
}

/* ── List all trainers with their metrics ── */
export async function listTrainers(opts: { search?: string; plan?: string; status?: string; page: number; limit: number }) {
  const db = await getDb();
  if (!db) return { trainers: [], total: 0 };

  const conditions = [eq(users.role, "trainer")];

  if (opts.plan && opts.plan !== "all") {
    conditions.push(eq(users.plan, opts.plan as any));
  }
  if (opts.status === "active") {
    conditions.push(eq(users.isActive, 1));
  } else if (opts.status === "inactive") {
    conditions.push(eq(users.isActive, 0));
  }

  const where = and(...conditions);

  // Get total count
  const [totalResult] = await db.select({ c: count() }).from(users).where(where);
  const total = totalResult.c;

  // Get trainers with sub-counts via subqueries
  const trainersRaw = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      trainerName: users.trainerName,
      plan: users.plan,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      clientCount: sql<number>`(SELECT COUNT(*) FROM clients WHERE clients.trainerId = ${users.id})`,
      dietCount: sql<number>`(SELECT COUNT(*) FROM diets WHERE diets.userId = ${users.id})`,
      recipeCount: sql<number>`(SELECT COUNT(*) FROM recipes WHERE recipes.userId = ${users.id} AND recipes.isSystem = 0)`,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(opts.limit)
    .offset((opts.page - 1) * opts.limit);

  // Filter by search if provided (in-memory for simplicity)
  let filtered = trainersRaw;
  if (opts.search) {
    const s = opts.search.toLowerCase();
    filtered = trainersRaw.filter(t =>
      t.name.toLowerCase().includes(s) ||
      t.email.toLowerCase().includes(s) ||
      (t.trainerName && t.trainerName.toLowerCase().includes(s))
    );
  }

  return { trainers: filtered, total };
}

/* ── Get detailed info for a single trainer ── */
export async function getTrainerDetail(trainerId: number) {
  const db = await getDb();
  if (!db) return null;

  const [trainer] = await db.select().from(users).where(eq(users.id, trainerId));
  if (!trainer || trainer.role !== "trainer") return null;

  const trainerClients = await db.select({
    id: clients.id,
    name: clients.name,
    email: clients.email,
    status: clients.status,
    createdAt: clients.createdAt,
  }).from(clients).where(eq(clients.trainerId, trainerId)).orderBy(desc(clients.createdAt));

  const trainerDiets = await db.select({
    id: diets.id,
    name: diets.name,
    totalCalories: diets.totalCalories,
    createdAt: diets.createdAt,
  }).from(diets).where(eq(diets.userId, trainerId)).orderBy(desc(diets.createdAt)).limit(20);

  const [clientCount] = await db.select({ c: count() }).from(clients).where(eq(clients.trainerId, trainerId));
  const [dietCount] = await db.select({ c: count() }).from(diets).where(eq(diets.userId, trainerId));
  const [recipeCount] = await db.select({ c: count() }).from(recipes).where(and(eq(recipes.userId, trainerId), eq(recipes.isSystem, 0)));

  return {
    ...trainer,
    passwordHash: undefined, // Never expose
    emailVerificationToken: undefined,
    passwordResetToken: undefined,
    passwordResetExpiresAt: undefined,
    clients: trainerClients,
    recentDiets: trainerDiets,
    counts: {
      clients: clientCount.c,
      diets: dietCount.c,
      recipes: recipeCount.c,
    },
  };
}

/* ── Toggle active status ── */
export async function toggleTrainerActive(trainerId: number) {
  const db = await getDb();
  if (!db) return null;

  const [trainer] = await db.select({ isActive: users.isActive }).from(users).where(eq(users.id, trainerId));
  if (!trainer) return null;

  const newStatus = trainer.isActive === 1 ? 0 : 1;
  await db.update(users).set({ isActive: newStatus }).where(eq(users.id, trainerId));
  return { id: trainerId, isActive: newStatus };
}

/* ── Change trainer plan ── */
export async function changeTrainerPlan(trainerId: number, plan: "basic" | "pro" | "centers") {
  const db = await getDb();
  if (!db) return null;

  await db.update(users).set({ plan }).where(eq(users.id, trainerId));
  return { id: trainerId, plan };
}
