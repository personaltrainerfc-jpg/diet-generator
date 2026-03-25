import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import {
  createClient, getClientsByTrainer, getClientById, getClientByAccessCode,
  updateClient, deleteClient,
  assignDietToClient, getClientActiveDiet, getClientDietHistory,
  logAdherence, getAdherenceByDate, getAdherenceRange,
  addProgressPhoto, getProgressPhotos, deleteProgressPhoto,
  createCheckIn, getCheckIns, updateCheckInFeedback,
  sendMessage, getMessages, markMessagesRead, getUnreadCount,
  createAchievement, getAchievements, deleteAchievement, unlockAchievement, getClientAchievements,
  addMeasurement, getMeasurements, deleteMeasurement,
  createAssessment, getAssessment, updateAssessment,
  getTrainerDashboardStats,
  // Bloque C: Entrenador
  createDietTemplate, getDietTemplates, deleteDietTemplate,
  addClientFavoriteFood, getClientFavoriteFoods, deleteClientFavoriteFood,
  createClientTag, getClientTags, deleteClientTag,
  assignTagToClient, removeTagFromClient, getClientTagAssignments,
  // Bloque D: Cliente
  logHydration, getHydrationLogs,
  logSleep, getSleepLogs,
  logWellness, getWellnessLogs,
  setMealReminder, getMealReminders, deleteMealReminder,
  // Bloque E: Invitaciones, Motivación, Weekend
  createInvitation, getInvitationByCode, getClientInvitations, updateInvitationStatus, expireOldInvitations,
  logMotivationMessage, getRecentMotivationMessages, markMotivationSent,
  addWeekendMeal, getWeekendMeals, deleteWeekendMeal,
  addWeekendFeedback, getWeekendFeedbackList,
  // Bloque F: Asistente IA
  getOrCreateConversation, getConversationById, updateConversationMessages, getRecentConversations,
  getAssistantConfig, upsertAssistantConfig,
  createEscalationAlert, getEscalationAlerts, resolveEscalationAlert,
  // Bloque G: Personalización
  addLearnedPreference, getLearnedPreferences,
  getPersonalizationProfile, upsertPersonalizationProfile,
  // Bloque H: Wearables
  logActivity, getActivityLogs,
  getWearableConnection, upsertWearableConnection, disconnectWearable,
  // Bloque I: Gamificación
  getAllActivityBadges, getClientActivityBadges, updateStreak, evaluateBadges, getOrCreateStreak,
  // Bloque J: Informes de progreso y alertas
  createProgressReport, getProgressReportsByClient, getProgressReportById, updateProgressReport, sendProgressReport,
  createAdherenceAlert, getAlertsByTrainer, resolveAlert, getClientAdherenceByDayOfWeek,
  getActiveClientsByTrainer,
} from "./clientDb";
import { storagePut } from "./storage";
import { getFullDiet } from "./db";
import { runAdherenceAnalysis } from "./adherenceEngine";

// ── Client Router (Trainer side) ──
export const clientRouter = router({
  // Client CRUD
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().optional(),
      phone: z.string().max(50).optional(),
      age: z.number().int().min(1).max(120).optional(),
      weight: z.number().int().min(20000).max(300000).optional(), // gramos
      height: z.number().int().min(50).max(250).optional(), // cm
      goal: z.string().max(100).optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createClient({ ...input, trainerId: ctx.user.id });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getClientsByTrainer(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.id);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("Cliente no encontrado");
      return client;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(50).optional(),
      age: z.number().int().min(1).max(120).optional(),
      weight: z.number().int().min(20000).max(300000).optional(),
      height: z.number().int().min(50).max(250).optional(),
      goal: z.string().max(100).optional(),
      notes: z.string().max(2000).optional(),
      status: z.enum(["active", "inactive", "paused"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.id);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const { id, ...data } = input;
      await updateClient(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.id);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      await deleteClient(input.id);
      return { success: true };
    }),

  // Assign diet
  assignDiet: protectedProcedure
    .input(z.object({ clientId: z.number(), dietId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const id = await assignDietToClient(input.clientId, input.dietId);
      return { id };
    }),

  getActiveDiet: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getClientActiveDiet(input.clientId);
    }),

  getDietHistory: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getClientDietHistory(input.clientId);
    }),

  // Adherence
  logAdherence: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      dietId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      mealNumber: z.number().int().min(1),
      completed: z.number().int().min(0).max(1),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const id = await logAdherence(input);
      return { id };
    }),

  getAdherence: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getAdherenceByDate(input.clientId, input.date);
    }),

  getAdherenceRange: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getAdherenceRange(input.clientId, input.startDate, input.endDate);
    }),

  // Progress Photos
  uploadPhoto: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      photoBase64: z.string(),
      photoType: z.enum(["front", "side", "back", "other"]),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const buffer = Buffer.from(input.photoBase64, "base64");
      const key = `progress-photos/${input.clientId}/${Date.now()}.jpg`;
      const { url } = await storagePut(key, buffer, "image/jpeg");
      const id = await addProgressPhoto({
        clientId: input.clientId,
        photoUrl: url,
        photoType: input.photoType,
        date: input.date,
        notes: input.notes,
      });
      return { id, url };
    }),

  getPhotos: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getProgressPhotos(input.clientId);
    }),

  deletePhoto: protectedProcedure
    .input(z.object({ id: z.number(), clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      await deleteProgressPhoto(input.id);
      return { success: true };
    }),

  // Check-Ins
  createCheckIn: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      currentWeight: z.number().int().optional(),
      energyLevel: z.number().int().min(1).max(5).optional(),
      hungerLevel: z.number().int().min(1).max(5).optional(),
      sleepQuality: z.number().int().min(1).max(5).optional(),
      adherenceRating: z.number().int().min(1).max(5).optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const id = await createCheckIn(input);
      return { id };
    }),

  getCheckIns: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getCheckIns(input.clientId);
    }),

  addCheckInFeedback: protectedProcedure
    .input(z.object({ id: z.number(), clientId: z.number(), feedback: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      await updateCheckInFeedback(input.id, input.feedback);
      return { success: true };
    }),

  // Chat
  sendMessage: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      message: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const id = await sendMessage({
        clientId: input.clientId,
        senderType: "trainer",
        message: input.message,
      });
      return { id };
    }),

  getMessages: protectedProcedure
    .input(z.object({ clientId: z.number(), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      await markMessagesRead(input.clientId, "client");
      return getMessages(input.clientId, input.limit);
    }),

  getUnreadCount: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getUnreadCount(input.clientId, "client");
    }),

  // Achievements
  createAchievement: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(500).optional(),
      icon: z.string().max(50).optional(),
      condition: z.string().max(100),
      threshold: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await createAchievement({ ...input, trainerId: ctx.user.id });
      return { id };
    }),

  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    return getAchievements(ctx.user.id);
  }),

  deleteAchievement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteAchievement(input.id);
      return { success: true };
    }),

  unlockAchievement: protectedProcedure
    .input(z.object({ clientId: z.number(), achievementId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const id = await unlockAchievement(input.clientId, input.achievementId);
      return { id };
    }),

  getClientAchievements: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getClientAchievements(input.clientId);
    }),

  // Body Measurements
  addMeasurement: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weight: z.number().int().optional(),
      bodyFat: z.number().int().optional(),
      chest: z.number().int().optional(),
      waist: z.number().int().optional(),
      hips: z.number().int().optional(),
      arms: z.number().int().optional(),
      thighs: z.number().int().optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const id = await addMeasurement(input);
      return { id };
    }),

  getMeasurements: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getMeasurements(input.clientId);
    }),

  deleteMeasurement: protectedProcedure
    .input(z.object({ id: z.number(), clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      await deleteMeasurement(input.id);
      return { success: true };
    }),

  // Initial Assessment
  createAssessment: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      currentDiet: z.string().max(2000).optional(),
      exerciseFrequency: z.string().max(50).optional(),
      exerciseType: z.string().max(500).optional(),
      medicalConditions: z.string().max(1000).optional(),
      medications: z.string().max(500).optional(),
      allergiesIntolerances: z.string().max(500).optional(),
      sleepHours: z.number().int().min(0).max(24).optional(),
      stressLevel: z.number().int().min(1).max(5).optional(),
      waterIntake: z.number().int().min(0).max(10000).optional(),
      alcoholFrequency: z.string().max(50).optional(),
      smokingStatus: z.string().max(50).optional(),
      goals: z.string().max(2000).optional(),
      trainerNotes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const id = await createAssessment(input);
      return { id };
    }),

  getAssessment: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getAssessment(input.clientId);
    }),

  updateAssessment: protectedProcedure
    .input(z.object({
      id: z.number(),
      clientId: z.number(),
      currentDiet: z.string().max(2000).optional(),
      exerciseFrequency: z.string().max(50).optional(),
      exerciseType: z.string().max(500).optional(),
      medicalConditions: z.string().max(1000).optional(),
      medications: z.string().max(500).optional(),
      allergiesIntolerances: z.string().max(500).optional(),
      sleepHours: z.number().int().min(0).max(24).optional(),
      stressLevel: z.number().int().min(1).max(5).optional(),
      waterIntake: z.number().int().min(0).max(10000).optional(),
      alcoholFrequency: z.string().max(50).optional(),
      smokingStatus: z.string().max(50).optional(),
      goals: z.string().max(2000).optional(),
      trainerNotes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const { id, clientId, ...data } = input;
      await updateAssessment(id, data);
      return { success: true };
    }),

  // Dashboard
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    return getTrainerDashboardStats(ctx.user.id);
  }),

  // Motivational message via LLM (genera sugerencia, NO envía automáticamente)
  generateMotivation: protectedProcedure
    .input(z.object({ clientId: z.number(), context: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      
      // Obtener últimos 10 mensajes para evitar repeticiones
      const recentMessages = await getRecentMotivationMessages(input.clientId, 10);
      const recentTexts = recentMessages.map(m => m.message).join("\n---\n");
      
      // Obtener datos del cliente para personalizar
      const adherence = await getAdherenceRange(input.clientId, new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), new Date().toISOString().slice(0, 10));
      const measurements = await getMeasurements(input.clientId);
      const latestWeight = measurements.length > 0 ? measurements[0] : null;
      const dayOfWeek = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date().getDay()];
      
      const adherenceRate = adherence.length > 0 ? Math.round(adherence.filter(a => a.completed).length / adherence.length * 100) : null;
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un entrenador personal motivador experto. Genera UN mensaje motivacional único (máximo 2-3 frases) para ${client.name}.

REGLAS ESTRICTAS:
- NUNCA repitas frases, estructuras ni expresiones de los mensajes anteriores
- Cada mensaje debe ser COMPLETAMENTE diferente en tono, estructura y contenido
- Varía entre: humor, datos concretos, metáforas, preguntas retóricas, retos, celebraciones, reflexiones
- Adaptáte al momento: hoy es ${dayOfWeek}${adherenceRate !== null ? `, adherencia semanal: ${adherenceRate}%` : ""}${latestWeight ? `, último peso: ${(latestWeight.weight! / 1000).toFixed(1)}kg` : ""}${input.context ? `, contexto: ${input.context}` : ""}
- Objetivo del cliente: ${client.goal || "mejorar su salud"}

MENSAJES ANTERIORES (NO repitas nada similar):
${recentTexts || "(ninguno aún)"}

Responde SOLO con el mensaje, sin comillas ni formato extra.`
          },
          { role: "user", content: "Genera un mensaje motivacional único y diferente a todos los anteriores" }
        ],
      });

      const message = (response.choices[0]?.message?.content as string) || "¡Sigue así, vas genial! 💪";
      // Guardar en log como sugerencia (NO enviado aún)
      const logId = await logMotivationMessage({ clientId: input.clientId, message, sentByTrainer: 0 });
      return { logId, message };
    }),

  // Enviar mensaje motivacional (el entrenador decide enviar o editar)
  sendMotivation: protectedProcedure
    .input(z.object({ clientId: z.number(), logId: z.number().optional(), message: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      // Marcar como enviado si viene de una sugerencia
      if (input.logId) await markMotivationSent(input.logId);
      // Enviar como mensaje del chat
      const id = await sendMessage({ clientId: input.clientId, senderType: "trainer", message: input.message });
      return { id, message: input.message };
    }),

  // Historial de mensajes motivacionales
  getMotivationHistory: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getRecentMotivationMessages(input.clientId, 20);
    }),

  // ── Invitaciones por Email ──
  sendInvitation: protectedProcedure
    .input(z.object({ clientId: z.number(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      // Expirar invitaciones antiguas
      await expireOldInvitations();
      // Crear nueva invitación
      const invitation = await createInvitation({ clientId: input.clientId, trainerId: ctx.user.id, email: input.email });
      // Enviar notificación (simula email)
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({ title: `Invitación enviada a ${input.email}`, content: `Código de acceso: ${client.accessCode}\nEnlace de invitación generado para ${client.name}` });
      } catch {}
      return { ...invitation, accessCode: client.accessCode };
    }),

  getInvitations: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      await expireOldInvitations();
      return getClientInvitations(input.clientId);
    }),

  resendInvitation: protectedProcedure
    .input(z.object({ clientId: z.number(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      await expireOldInvitations();
      const invitation = await createInvitation({ clientId: input.clientId, trainerId: ctx.user.id, email: input.email });
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({ title: `Invitación reenviada a ${input.email}`, content: `Código: ${client.accessCode} para ${client.name}` });
      } catch {}
      return { ...invitation, accessCode: client.accessCode };
    }),

  // ── Weekend Meals (trainer view) ──
  getClientWeekendMeals: protectedProcedure
    .input(z.object({ clientId: z.number(), date: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getWeekendMeals(input.clientId, input.date);
    }),

  getClientWeekendFeedback: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getWeekendFeedbackList(input.clientId);
    }),

  // AI Recommendations
  getRecommendations: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      
      const checkIns = await getCheckIns(input.clientId);
      const measurements = await getMeasurements(input.clientId);
      const assessment = await getAssessment(input.clientId);

      const context = `
Cliente: ${client.name}, ${client.age || "?"} años, ${client.weight ? (client.weight / 1000).toFixed(1) + "kg" : "peso desconocido"}, ${client.height ? client.height + "cm" : ""}
Objetivo: ${client.goal || "no especificado"}
${assessment ? `Valoración inicial: Ejercicio ${assessment.exerciseFrequency || "?"}, Estrés ${assessment.stressLevel || "?"}/5, Sueño ${assessment.sleepHours || "?"}h` : ""}
${checkIns.length > 0 ? `Último check-in: Energía ${checkIns[0].energyLevel}/5, Hambre ${checkIns[0].hungerLevel}/5, Sueño ${checkIns[0].sleepQuality}/5, Adherencia ${checkIns[0].adherenceRating}/5` : "Sin check-ins"}
${measurements.length > 0 ? `Última medición: ${measurements[0].weight ? (measurements[0].weight / 1000).toFixed(1) + "kg" : ""} ${measurements[0].bodyFat ? "Grasa " + (measurements[0].bodyFat / 10).toFixed(1) + "%" : ""}` : "Sin mediciones"}
      `.trim();

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un nutricionista deportivo experto. Basándote en los datos del cliente, genera 3-5 recomendaciones concretas y accionables. Formato: lista numerada. Sé específico y práctico.`
          },
          { role: "user", content: context }
        ],
      });

      return response.choices[0]?.message?.content || "No se pudieron generar recomendaciones en este momento.";
    }),

  // Quick consult (consulta express)
  quickConsult: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      question: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");

      const assessment = await getAssessment(input.clientId);
      const context = `
Cliente: ${client.name}, ${client.age || "?"} años, Objetivo: ${client.goal || "no especificado"}
${assessment ? `Condiciones médicas: ${assessment.medicalConditions || "ninguna"}, Alergias: ${assessment.allergiesIntolerances || "ninguna"}` : ""}
      `.trim();

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un nutricionista deportivo experto ayudando a un entrenador personal. Responde de forma concisa y profesional a la consulta sobre su cliente. Contexto del cliente: ${context}`
          },
          { role: "user", content: input.question }
        ],
      });

      return (response.choices[0]?.message?.content as string) || "No se pudo procesar la consulta.";
    }),

  // ── Diet Templates ──
  createTemplate: protectedProcedure
    .input(z.object({ dietId: z.number(), name: z.string().min(1).max(255), tags: z.array(z.string()).optional(), description: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      return createDietTemplate({ userId: ctx.user.id, ...input });
    }),

  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    return getDietTemplates(ctx.user.id);
  }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteDietTemplate(input.id);
      return { success: true };
    }),

  // ── Client Favorite Foods ──
  addFavoriteFood: protectedProcedure
    .input(z.object({ clientId: z.number(), foodName: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return addClientFavoriteFood({ clientId: input.clientId, trainerId: ctx.user.id, foodName: input.foodName });
    }),

  getFavoriteFoods: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getClientFavoriteFoods(input.clientId);
    }),

  deleteFavoriteFood: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteClientFavoriteFood(input.id);
      return { success: true };
    }),

  // ── Client Tags ──
  createTag: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100), color: z.string().max(20).optional() }))
    .mutation(async ({ ctx, input }) => {
      return createClientTag({ trainerId: ctx.user.id, ...input });
    }),

  getTags: protectedProcedure.query(async ({ ctx }) => {
    return getClientTags(ctx.user.id);
  }),

  deleteTag: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteClientTag(input.id);
      return { success: true };
    }),

  assignTag: protectedProcedure
    .input(z.object({ clientId: z.number(), tagId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return assignTagToClient(input.clientId, input.tagId);
    }),

  removeTag: protectedProcedure
    .input(z.object({ clientId: z.number(), tagId: z.number() }))
    .mutation(async ({ input }) => {
      await removeTagFromClient(input.clientId, input.tagId);
      return { success: true };
    }),

  getClientTags: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getClientTagAssignments(input.clientId);
    }),

  // ── Clone Diet to Another Client ──
  cloneDietToClient: protectedProcedure
    .input(z.object({ sourceDietId: z.number(), targetClientId: z.number(), newName: z.string().min(1).max(255).optional() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.targetClientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const original = await getFullDiet(input.sourceDietId);
      if (!original) throw new Error("Dieta no encontrada");
      const { createDiet, createMenu, createMeal, createFood } = await import("./db");
      const newDietId = await createDiet({
        userId: ctx.user.id,
        name: input.newName || `Dieta ${client.name}`,
        totalCalories: original.totalCalories,
        proteinPercent: original.proteinPercent,
        carbsPercent: original.carbsPercent,
        fatsPercent: original.fatsPercent,
        mealsPerDay: original.mealsPerDay,
        totalMenus: original.totalMenus,
        avoidFoods: (original.avoidFoods as string[]) || [],
        dietType: (original as any).dietType || 'equilibrada',
        cookingLevel: (original as any).cookingLevel || 'moderate',
      });
      for (const menu of original.menus) {
        const newMenuId = await createMenu({ dietId: newDietId, menuNumber: menu.menuNumber, totalCalories: menu.totalCalories, totalProtein: menu.totalProtein, totalCarbs: menu.totalCarbs, totalFats: menu.totalFats });
        for (const meal of menu.meals) {
          const newMealId = await createMeal({ menuId: newMenuId, mealNumber: meal.mealNumber, mealName: meal.mealName, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats });
          for (const food of meal.foods) {
            await createFood({ mealId: newMealId, name: food.name, quantity: food.quantity, calories: food.calories, protein: food.protein, carbs: food.carbs, fats: food.fats, alternativeName: food.alternativeName, alternativeQuantity: food.alternativeQuantity, alternativeCalories: food.alternativeCalories, alternativeProtein: food.alternativeProtein, alternativeCarbs: food.alternativeCarbs, alternativeFats: food.alternativeFats });
          }
        }
      }
      await assignDietToClient(input.targetClientId, newDietId);
      return { newDietId };
    }),

  // ── Client Hydration/Sleep/Wellness (trainer view) ──
  getClientHydration: protectedProcedure
    .input(z.object({ clientId: z.number(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getHydrationLogs(input.clientId, input.startDate, input.endDate);
    }),

  getClientSleep: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getSleepLogs(input.clientId);
    }),

  getClientWellness: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getWellnessLogs(input.clientId);
    }),

  // ═══ AI Assistant Config (Trainer) ═══
  getAiConfig: protectedProcedure.query(async ({ ctx }) => {
    return getAssistantConfig(ctx.user.id);
  }),

  updateAiConfig: protectedProcedure
    .input(z.object({
      assistantName: z.string().max(100).optional(),
      tone: z.string().max(50).optional(),
      customRules: z.string().max(2000).optional(),
      escalationKeywords: z.array(z.string()).optional(),
      enabled: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await upsertAssistantConfig(ctx.user.id, input);
      return { id };
    }),

  getEscalationAlerts: protectedProcedure
    .input(z.object({ resolved: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      return getEscalationAlerts(ctx.user.id, input.resolved);
    }),

  resolveAlert: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await resolveEscalationAlert(input.id);
      return { success: true };
    }),

  // ═══ Client Activity (Trainer view) ═══
  getClientActivity: protectedProcedure
    .input(z.object({ clientId: z.number(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      return getActivityLogs(input.clientId, input.startDate, input.endDate);
    }),

  // ═══ Client Activity Badges (Trainer view) ═══
  getClientBadges: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const all = await getAllActivityBadges();
      const unlocked = await getClientActivityBadges(input.clientId);
      const streak = await getOrCreateStreak(input.clientId);
      const unlockedIds = new Set(unlocked.map(b => b.badgeId));
      return {
        badges: all.map(b => ({ ...b, unlocked: unlockedIds.has(b.id) })),
        unlockedCount: unlocked.length,
        totalCount: all.length,
        streak,
      };
    }),

  // ═══ Client Personalization Profile (Trainer view) ═══
  getClientPersonalization: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const profile = await getPersonalizationProfile(input.clientId);
      const preferences = await getLearnedPreferences(input.clientId);
      return { profile: profile?.profileData || null, preferences };
    }),

  analyzeClientProfile: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      
      // Gather all data
      const preferences = await getLearnedPreferences(input.clientId);
      const wellness = await getWellnessLogs(input.clientId, 30);
      const sleep = await getSleepLogs(input.clientId, 30);
      const activity = await getActivityLogs(input.clientId);
      const checkIns = await getCheckIns(input.clientId);
      const assessment = await getAssessment(input.clientId);
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Analiza todos los datos del cliente y genera un perfil de personalización completo en JSON. El perfil debe incluir:
- foodLikes: alimentos que le gustan (array de strings)
- foodDislikes: alimentos que no le gustan (array de strings)
- preferredMealTimes: horarios preferidos de comida (array de strings)
- cookingSkill: nivel de cocina ("bajo", "medio", "alto")
- shoppingPreferences: preferencias de compra (array de strings)
- activityPattern: patrón de actividad (string descriptivo)
- sleepPattern: patrón de sueño (string descriptivo)
- stressFactors: factores de estrés identificados (array de strings)
- motivationTriggers: qué le motiva (array de strings)

Basa tu análisis SOLO en los datos proporcionados. Si no hay datos suficientes para un campo, usa un array vacío o "desconocido".`,
          },
          {
            role: "user",
            content: JSON.stringify({
              clientName: client.name,
              goal: client.goal,
              preferences: preferences.map(p => ({ category: p.category, key: p.key, value: p.value, confidence: p.confidence })),
              recentWellness: wellness.slice(0, 10),
              recentSleep: sleep.slice(0, 10),
              recentActivity: activity.slice(0, 10),
              checkIns: checkIns.slice(0, 5),
              assessment,
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "personalization_profile",
            strict: true,
            schema: {
              type: "object",
              properties: {
                foodLikes: { type: "array", items: { type: "string" } },
                foodDislikes: { type: "array", items: { type: "string" } },
                preferredMealTimes: { type: "array", items: { type: "string" } },
                cookingSkill: { type: "string" },
                shoppingPreferences: { type: "array", items: { type: "string" } },
                activityPattern: { type: "string" },
                sleepPattern: { type: "string" },
                stressFactors: { type: "array", items: { type: "string" } },
                motivationTriggers: { type: "array", items: { type: "string" } },
              },
              required: ["foodLikes", "foodDislikes", "preferredMealTimes", "cookingSkill", "shoppingPreferences", "activityPattern", "sleepPattern", "stressFactors", "motivationTriggers"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content as string;
      const profileData = JSON.parse(content);
      await upsertPersonalizationProfile(input.clientId, profileData);
      return { profileData };
    }),

  // ── Historial de Conversaciones IA (Trainer view) ──
  getClientConversations: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const conversations = await getRecentConversations(input.clientId, 20);
      return conversations.map((c: any) => {
        const msgs = (typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages) || [];
        const userMsgs = msgs.filter((m: any) => m.role === 'user');
        const lastMsg = userMsgs[userMsgs.length - 1]?.content || '';
        return {
          id: c.id,
          messageCount: msgs.length,
          lastMessage: lastMsg.slice(0, 120),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messages: msgs,
        };
      });
    }),

  summarizeConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const conv = await getConversationById(input.conversationId);
      if (!conv) throw new Error("Conversación no encontrada");
      const client = await getClientById(conv.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      const msgs = (typeof conv.messages === 'string' ? JSON.parse(conv.messages) : conv.messages) || [];
      if (msgs.length === 0) return { summary: "Sin mensajes" };
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Resume esta conversación entre un cliente y un asistente nutricional en 2-3 frases. Destaca los temas principales, preocupaciones del cliente y recomendaciones dadas. Responde en español." },
          { role: "user", content: msgs.map((m: any) => `${m.role}: ${m.content}`).join('\n') },
        ],
      });
      return { summary: response.choices[0]?.message?.content || "No se pudo generar resumen" };
    }),

  // ── Progress Reports (Trainer) ──
  generateProgressReport: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      periodStart: z.string(), // YYYY-MM-DD
      periodEnd: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("Cliente no encontrado");

      // Calculate adherence for the period
      const logs = await getAdherenceRange(input.clientId, input.periodStart, input.periodEnd);
      const mealsTotal = logs.length;
      const mealsCompleted = logs.filter((l: any) => l.completed).length;
      const adherencePercent = mealsTotal > 0 ? Math.round((mealsCompleted / mealsTotal) * 100) : 0;

      // Get weight data
      const measurements = await getMeasurements(input.clientId);
      const periodMeasurements = measurements.filter((m: any) => m.date >= input.periodStart && m.date <= input.periodEnd);
      const weightStart = periodMeasurements.length > 0 ? periodMeasurements[periodMeasurements.length - 1].weight : client.weight;
      const weightEnd = periodMeasurements.length > 0 ? periodMeasurements[0].weight : client.weight;

      // Generate motivational message with AI
      const weightChange = weightStart && weightEnd ? ((weightEnd - weightStart) / 1000).toFixed(1) : null;
      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: "Eres un entrenador nutricional motivador. Genera un mensaje breve (2-3 frases) y positivo para el cliente basado en sus resultados. Siempre encuentra algo positivo que destacar. Responde en espa\u00f1ol." },
          { role: "user", content: `Resultados del periodo ${input.periodStart} a ${input.periodEnd}:\n- Adherencia: ${adherencePercent}%\n- Comidas completadas: ${mealsCompleted}/${mealsTotal}\n${weightChange ? `- Cambio de peso: ${weightChange}kg` : ''}\n- Nombre del cliente: ${client.name}` },
        ],
      });
      const motivationalMessage = aiResponse.choices?.[0]?.message?.content as string || "\u00a1Sigue as\u00ed! Cada d\u00eda cuenta.";

      // Generate highlights
      const highlights: string[] = [];
      if (adherencePercent >= 80) highlights.push("Adherencia excelente");
      else if (adherencePercent >= 60) highlights.push("Buena adherencia");
      if (weightChange && parseFloat(weightChange) < 0) highlights.push(`${Math.abs(parseFloat(weightChange))}kg perdidos`);
      if (mealsCompleted > 0) highlights.push(`${mealsCompleted} comidas completadas`);

      const report = await createProgressReport({
        clientId: input.clientId,
        trainerId: ctx.user.id,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        adherencePercent,
        mealsCompleted,
        mealsTotal,
        weightStart: weightStart ?? null,
        weightEnd: weightEnd ?? null,
        motivationalMessage,
        highlights,
      });

      return { ...report, adherencePercent, mealsCompleted, mealsTotal, weightStart, weightEnd, motivationalMessage, highlights };
    }),

  getClientReports: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("Cliente no encontrado");
      return getProgressReportsByClient(input.clientId);
    }),

  updateReport: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      motivationalMessage: z.string().optional(),
      trainerNotes: z.string().optional(),
      highlights: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const report = await getProgressReportById(input.reportId);
      if (!report || report.trainerId !== ctx.user.id) throw new Error("Informe no encontrado");
      if (report.status === "sent") throw new Error("No se puede editar un informe ya enviado");
      return updateProgressReport(input.reportId, {
        motivationalMessage: input.motivationalMessage,
        trainerNotes: input.trainerNotes,
        highlights: input.highlights,
      });
    }),

  sendReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const report = await getProgressReportById(input.reportId);
      if (!report || report.trainerId !== ctx.user.id) throw new Error("Informe no encontrado");
      if (report.status === "sent") throw new Error("Este informe ya fue enviado");
      return sendProgressReport(input.reportId);
    }),

  // ── Adherence Alerts (Trainer) ──
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    return getAlertsByTrainer(ctx.user.id);
  }),

  resolveAdherenceAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return resolveAlert(input.alertId, ctx.user.id);
    }),

  getClientAdherencePattern: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("Cliente no encontrado");
      return getClientAdherenceByDayOfWeek(input.clientId);
    }),

  runAdherenceAnalysis: protectedProcedure.mutation(async ({ ctx }) => {
    const alertsCreated = await runAdherenceAnalysis(ctx.user.id);
    return { alertsCreated };
  }),

  // ── Wellness data visible to trainer ──
  getClientWellnessData: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("Cliente no encontrado");
      const [hydration, sleep, wellness] = await Promise.all([
        getHydrationLogs(input.clientId, undefined, undefined),
        getSleepLogs(input.clientId, 30),
        getWellnessLogs(input.clientId, 30),
      ]);
      return { hydration, sleep, wellness };
    }),
});

// ── Client Portal Router (Client-facing, public with code auth) ──
export const clientPortalRouter = router({
  loginByCode: publicProcedure
    .input(z.object({ accessCode: z.string().min(1).max(32) }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client) throw new Error("Código de acceso inválido");
      if (client.status === "inactive") throw new Error("Tu cuenta está desactivada. Contacta con tu entrenador.");
      return { clientId: client.id, name: client.name, status: client.status, archetype: client.archetype };
    }),

  getProfile: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return { id: client.id, name: client.name, email: client.email, phone: client.phone, age: client.age, weight: client.weight, height: client.height, goal: client.goal, status: client.status, archetype: client.archetype };
    }),

  getActiveDiet: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getClientActiveDiet(input.clientId);
    }),

  logAdherence: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      dietId: z.number(), date: z.string(), mealNumber: z.number(),
      completed: z.number().min(0).max(1),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return logAdherence({ clientId: input.clientId, dietId: input.dietId, date: input.date, mealNumber: input.mealNumber, completed: input.completed, notes: input.notes });
    }),

  sendMessage: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return sendMessage({ clientId: input.clientId, senderType: "client", message: input.message });
    }),

  getMessages: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getMessages(input.clientId, input.limit || 50);
    }),

  getAchievements: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getClientAchievements(input.clientId);
    }),

  getCheckIns: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getCheckIns(input.clientId);
    }),

  // ── Client Progress: Measurements ──
  addMeasurement: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weight: z.number().int().optional(),
      bodyFat: z.number().int().optional(),
      chest: z.number().int().optional(),
      waist: z.number().int().optional(),
      hips: z.number().int().optional(),
      arms: z.number().int().optional(),
      thighs: z.number().int().optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const { accessCode, ...data } = input;
      const id = await addMeasurement(data);
      // Notify trainer
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({ title: `${client.name} registró nuevas métricas`, content: `Peso: ${input.weight ? (input.weight / 1000).toFixed(1) + "kg" : "--"}, Cintura: ${input.waist ? (input.waist / 10).toFixed(1) + "cm" : "--"}` });
      } catch {}
      return { id };
    }),

  getMeasurements: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getMeasurements(input.clientId);
    }),

  // ── Client Progress: Photos ──
  uploadPhoto: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      photoBase64: z.string(),
      photoType: z.enum(["front", "side", "back", "other"]),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const buffer = Buffer.from(input.photoBase64, "base64");
      const key = `progress-photos/${input.clientId}/${Date.now()}-${input.photoType}.jpg`;
      const { url } = await storagePut(key, buffer, "image/jpeg");
      const id = await addProgressPhoto({
        clientId: input.clientId,
        photoUrl: url,
        photoType: input.photoType,
        date: input.date,
        notes: input.notes,
      });
      // Notify trainer
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({ title: `${client.name} subió una foto de progreso`, content: `Tipo: ${input.photoType}, Fecha: ${input.date}` });
      } catch {}
      return { id, url };
    }),

  getPhotos: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getProgressPhotos(input.clientId);
    }),

  // ── Hydration ──
  logHydration: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      glasses: z.number().int().min(0).max(30),
      goalGlasses: z.number().int().min(1).max(30).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return logHydration({ clientId: input.clientId, date: input.date, glasses: input.glasses, goalGlasses: input.goalGlasses });
    }),

  getHydration: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getHydrationLogs(input.clientId, input.startDate, input.endDate);
    }),

  // ── Sleep ──
  logSleep: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      hoursSlept: z.number().int().min(0).max(1440),
      quality: z.number().int().min(1).max(5),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return logSleep({ clientId: input.clientId, date: input.date, hoursSlept: input.hoursSlept, quality: input.quality, notes: input.notes });
    }),

  getSleep: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getSleepLogs(input.clientId);
    }),

  // ── Wellness ──
  logWellness: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      energy: z.number().int().min(1).max(5),
      mood: z.number().int().min(1).max(5),
      digestion: z.number().int().min(1).max(5),
      bloating: z.number().int().min(1).max(5),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return logWellness({ clientId: input.clientId, date: input.date, energy: input.energy, mood: input.mood, digestion: input.digestion, bloating: input.bloating, notes: input.notes });
    }),

  getWellness: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getWellnessLogs(input.clientId);
    }),

  // ── Meal Reminders ──
  setReminder: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      mealName: z.string().min(1).max(100),
      reminderTime: z.string().regex(/^\d{2}:\d{2}$/),
      enabled: z.number().int().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return setMealReminder({ clientId: input.clientId, mealName: input.mealName, reminderTime: input.reminderTime, enabled: input.enabled });
    }),

  getReminders: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getMealReminders(input.clientId);
    }),

  deleteReminder: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string(), id: z.number() }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      await deleteMealReminder(input.id);
      return { success: true };
    }),

  // ── Generate Recipe Steps (AI) ──
  getRecipeSteps: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      mealName: z.string(), foods: z.array(z.object({ name: z.string(), quantity: z.string() })),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const foodList = input.foods.map(f => `${f.name} (${f.quantity})`).join(", ");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Eres un chef nutricionista. Genera instrucciones de preparación paso a paso, sencillas y claras, para la siguiente comida. Máximo 6 pasos. Responde en español. Formato: número) instrucción." },
          { role: "user", content: `Comida: ${input.mealName}\nIngredientes: ${foodList}\n\nGenera los pasos de preparación:` },
        ],
      });
      return (response.choices[0]?.message?.content as string) || "No se pudieron generar las instrucciones.";
    }),

  // ── Generate Shopping List ──
  getShoppingList: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const activeDiet = await getClientActiveDiet(input.clientId);
      if (!activeDiet) return { sections: [] };
      // Collect all foods from all menus
      const foodMap = new Map<string, { name: string; quantities: string[] }>();
      for (const menu of (activeDiet as any).menus || []) {
        for (const meal of menu.meals || []) {
          for (const food of meal.foods || []) {
            const key = food.name.toLowerCase().trim();
            if (foodMap.has(key)) {
              foodMap.get(key)!.quantities.push(food.quantity);
            } else {
              foodMap.set(key, { name: food.name, quantities: [food.quantity] });
            }
          }
        }
      }
      // Categorize foods
      const categories: Record<string, string[]> = {
        "Proteínas": [], "Lácteos": [], "Frutas y Verduras": [],
        "Cereales y Legumbres": [], "Grasas y Aceites": [], "Otros": [],
      };
      const proteinWords = ["pollo", "pavo", "ternera", "cerdo", "salmón", "atún", "merluza", "bacalao", "gambas", "huevo", "jamón", "lomo", "pechuga", "carne", "pescado", "marisco", "tofu", "seitan", "tempeh"];
      const dairyWords = ["leche", "yogur", "queso", "requesón", "kefir", "nata", "mantequilla"];
      const fruitVegWords = ["manzana", "plátano", "naranja", "fresa", "arándano", "tomate", "lechuga", "espinaca", "brócoli", "zanahoria", "pepino", "cebolla", "ajo", "pimiento", "calabacín", "berenjena", "aguacate", "fruta", "verdura", "ensalada", "champiñón", "seta"];
      const grainWords = ["arroz", "pasta", "pan", "avena", "quinoa", "lenteja", "garbanzo", "judía", "cereal", "tortita", "patata", "boniato", "maíz"];
      const fatWords = ["aceite", "oliva", "almendra", "nuez", "cacahuete", "crema", "mantequilla cacahuete", "semilla", "lino", "chía"];

      for (const [, item] of Array.from(foodMap)) {
        const lower = item.name.toLowerCase();
        const qtyStr = item.quantities.length > 1 ? `(${item.quantities.length} menús)` : item.quantities[0];
        const entry = `${item.name} — ${qtyStr}`;
        if (proteinWords.some(w => lower.includes(w))) categories["Proteínas"].push(entry);
        else if (dairyWords.some(w => lower.includes(w))) categories["Lácteos"].push(entry);
        else if (fruitVegWords.some(w => lower.includes(w))) categories["Frutas y Verduras"].push(entry);
        else if (grainWords.some(w => lower.includes(w))) categories["Cereales y Legumbres"].push(entry);
        else if (fatWords.some(w => lower.includes(w))) categories["Grasas y Aceites"].push(entry);
        else categories["Otros"].push(entry);
      }
      const sections = Object.entries(categories)
        .filter(([, items]) => items.length > 0)
        .map(([name, items]) => ({ name, items: items.map(i => ({ text: i, checked: false })) }));
      return { sections };
    }),

  // ── Weekend Meals ──
  addWeekendMeal: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      mealType: z.string().min(1).max(50),
      description: z.string().min(1).max(2000),
      photoBase64: z.string().optional(),
      calories: z.number().int().optional(),
      isHealthy: z.number().int().min(0).max(1).optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      let photoUrl: string | undefined;
      if (input.photoBase64) {
        const buffer = Buffer.from(input.photoBase64, "base64");
        const key = `weekend-meals/${input.clientId}/${Date.now()}.jpg`;
        const result = await storagePut(key, buffer, "image/jpeg");
        photoUrl = result.url;
      }
      const id = await addWeekendMeal({
        clientId: input.clientId, date: input.date, mealType: input.mealType,
        description: input.description, photoUrl, calories: input.calories,
        isHealthy: input.isHealthy, notes: input.notes,
      });
      // Notificar al entrenador
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({ title: `${client.name} registró comida de fin de semana`, content: `${input.mealType}: ${input.description.slice(0, 100)}` });
      } catch {}
      return { id, photoUrl };
    }),

  getWeekendMeals: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string(), date: z.string().optional() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getWeekendMeals(input.clientId, input.date);
    }),

  deleteWeekendMeal: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string(), id: z.number() }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      await deleteWeekendMeal(input.id);
      return { success: true };
    }),

  // ── Weekend AI Feedback with automatic assessment and weekly adjustments ──
  getWeekendFeedback: publicProcedure
    .input(z.object({
      clientId: z.number(), accessCode: z.string(),
      weekendDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      clientNotes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const meals = await getWeekendMeals(input.clientId, input.weekendDate);
      if (meals.length === 0) throw new Error("No hay comidas registradas para este fin de semana");
      const activeDiet = await getClientActiveDiet(input.clientId);
      
      // Get recent adherence for context
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentAdherence = await getAdherenceRange(input.clientId, weekAgo.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10));
      const avgAdherence = recentAdherence.length > 0 ? Math.round(recentAdherence.reduce((sum, a) => sum + (a.completed ?? 0), 0) / recentAdherence.length) : null;
      
      // Get previous weekend feedback for variety
      const prevFeedbacks = await getWeekendFeedbackList(input.clientId);
      const lastFeedback = prevFeedbacks.length > 0 ? prevFeedbacks[0]?.feedback?.slice(0, 200) : null;
      
      const mealsList = meals.map(m => `${m.mealType}: ${m.description}${m.calories ? ` (~${m.calories} kcal)` : ""}${m.isHealthy === 1 ? " [saludable]" : m.isHealthy === 0 ? " [menos saludable]" : ""}`).join("\n");
      
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `Eres un nutricionista deportivo experto. Tu tarea es analizar las comidas del fin de semana de ${client.name} y generar:

1. **VALORACIÓN** (puntuación del 1 al 10 con justificación breve)
2. **ANÁLISIS** del fin de semana (qué ha hecho bien, qué podría mejorar)
3. **AJUSTES PARA LOS PRÓXIMOS DÍAS** (recomendaciones concretas y prácticas para compensar o mantener, SIN modificar la dieta base, solo consejos de comportamiento alimentario)

Contexto del cliente:
- Objetivo: ${client.goal || "mejorar su salud"}
- Peso: ${client.weight ? (client.weight / 1000).toFixed(1) + " kg" : "desconocido"}
${activeDiet ? `- Dieta activa: ${(activeDiet as any).totalCalories} kcal/día, tipo ${(activeDiet as any).dietType}` : "- Sin dieta activa"}
${avgAdherence !== null ? `- Adherencia media última semana: ${avgAdherence}%` : ""}
${input.clientNotes ? `- Notas del cliente sobre su fin de semana: "${input.clientNotes}"` : ""}
${lastFeedback ? `- Último feedback dado (NO repitas la misma estructura ni frases): "${lastFeedback}..."` : ""}

Formato de respuesta OBLIGATORIO:
PUNTUACIÓN: X/10

VALORACIÓN:
(2-3 líneas analizando el fin de semana)

AJUSTES PARA LOS PRÓXIMOS DÍAS:
- (3-5 recomendaciones concretas y prácticas para lunes-viernes, sin cambiar la dieta base)

Sé directo, motivador y personalizado. Usa un tono cercano pero profesional. Cada respuesta debe ser única y diferente a las anteriores.` },
          { role: "user", content: `Comidas del fin de semana (${input.weekendDate}):\n${mealsList}` },
        ],
      });
      const text = (response.choices[0]?.message?.content as string) || "No se pudo generar feedback.";
      const scoreMatch = text.match(/(\d+)\/10/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
      const id = await addWeekendFeedback({ clientId: input.clientId, weekendDate: input.weekendDate, feedback: text, score: score ?? undefined });
      
      // Notify trainer about weekend feedback
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({ title: `🌟 Feedback fin de semana - ${client.name}`, content: `${client.name} ha registrado su fin de semana (${input.weekendDate}). Puntuación: ${score ?? "?"}/10. ${meals.length} comidas registradas.` });
      } catch (e) { /* non-critical */ }
      
      return { id, feedback: text, score };
    }),

  getWeekendFeedbackHistory: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getWeekendFeedbackList(input.clientId);
    }),

  // ── Set Archetype ──
  setArchetype: publicProcedure
    .input(z.object({
      clientId: z.number(),
      accessCode: z.string(),
      archetype: z.enum(["agil", "flora", "bruto", "roca"]),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      await updateClient(input.clientId, { archetype: input.archetype });
      return { success: true, archetype: input.archetype };
    }),

  // ═══════════════════════════════════════════════════════
  // BLOQUE F: Asistente IA Conversacional
  // ═══════════════════════════════════════════════════════

  aiChat: publicProcedure
    .input(z.object({
      clientId: z.number(),
      accessCode: z.string(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");

      // Get or create today's conversation
      const conversation = await getOrCreateConversation(input.clientId);
      const messages = (conversation.messages as any[]) || [];

      // Add user message
      messages.push({ role: "user", content: input.message, timestamp: Date.now() });

      // Get assistant config from trainer
      const config = await getAssistantConfig(client.trainerId);
      const assistantName = config?.assistantName || "NutriBot";
      const tone = config?.tone || "amigable";
      const customRules = config?.customRules || "";
      const escalationKeywords = (config?.escalationKeywords as string[]) || ["dolor", "mareo", "vomit", "desmay", "urgen", "médico", "hospital", "alergia"];

      // Check for escalation keywords
      const lowerMsg = input.message.toLowerCase();
      const needsEscalation = escalationKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()));

      // Build context: active diet, recent adherence, wellness, preferences
      const activeDiet = await getClientActiveDiet(input.clientId);
      const recentWellness = await getWellnessLogs(input.clientId, 3);
      const recentAdherence = await getAdherenceRange(
        input.clientId,
        new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        new Date().toISOString().slice(0, 10)
      );
      const preferences = await getLearnedPreferences(input.clientId);
      const profile = await getPersonalizationProfile(input.clientId);

      // Build system prompt
      let systemPrompt = `Eres ${assistantName}, el asistente nutricional IA de NutriFlow. Tu tono es ${tone}.
Estas ayudando a ${client.name}${client.goal ? ` cuyo objetivo es: ${client.goal}` : ""}.
${client.archetype ? `Su personaje NutriFlow es: ${client.archetype.toUpperCase()}. Adapta tu estilo a este personaje.` : ""}
`;

      if (activeDiet) {
        const d = activeDiet as any;
        systemPrompt += `\nDieta activa: "${d.name}" - ${d.totalCalories} kcal/día, ${d.mealsPerDay} comidas, tipo ${d.dietType}.`;
        if (d.menus && d.menus.length > 0) {
          const menu = d.menus[0];
          if (menu.meals) {
            systemPrompt += `\nComidas del menú actual: ${menu.meals.map((m: any) => m.mealName).join(", ")}.`;
          }
        }
      }

      if (recentWellness.length > 0) {
        const last = recentWellness[0];
        systemPrompt += `\nÚltimo bienestar (${last.date}): energía ${last.energy}/5, ánimo ${last.mood}/5, digestión ${last.digestion}/5.`;
      }

      if (recentAdherence.length > 0) {
        const completed = recentAdherence.filter((a: any) => a.completed === 1).length;
        const total = recentAdherence.length;
        systemPrompt += `\nAdherencia última semana: ${Math.round(completed / total * 100)}% (${completed}/${total} comidas).`;
      }

      if (profile?.profileData) {
        const p = profile.profileData as any;
        if (p.foodLikes?.length) systemPrompt += `\nAlimentos favoritos: ${p.foodLikes.join(", ")}.`;
        if (p.foodDislikes?.length) systemPrompt += `\nAlimentos que no le gustan: ${p.foodDislikes.join(", ")}.`;
      }

      if (customRules) {
        systemPrompt += `\n\nReglas del entrenador: ${customRules}`;
      }

      systemPrompt += `\n\nIMPORTANTE:
- Responde SIEMPRE en español.
- Sé conciso (máximo 3-4 párrafos).
- Si el cliente pregunta algo fuera de nutrición/salud, redirige amablemente.
- NUNCA cambies la dieta del cliente. Solo puedes dar consejos, resolver dudas y motivar.
- Si detectas algo urgente (dolor, mareo, síntomas), recomienda contactar al entrenador o un profesional médico.`;

      // Build LLM messages (keep last 10 for context)
      const contextMessages = messages.slice(-10);
      const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...contextMessages.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const response = await invokeLLM({ messages: llmMessages });
      const reply = (response.choices[0]?.message?.content as string) || "Lo siento, no pude procesar tu mensaje. Inténtalo de nuevo.";

      // Add assistant reply
      messages.push({ role: "assistant", content: reply, timestamp: Date.now() });

      // Update conversation
      await updateConversationMessages(conversation.id, messages);

      // Create escalation alert if needed
      if (needsEscalation) {
        await createEscalationAlert({
          clientId: input.clientId,
          trainerId: client.trainerId,
          reason: `Palabra clave detectada en chat IA: "${input.message.slice(0, 100)}"`,
          conversationId: conversation.id,
        });
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: `⚠️ Alerta IA - ${client.name}`,
            content: `El asistente IA detectó una posible urgencia: "${input.message.slice(0, 150)}"`,
          });
        } catch {}
      }

      // Extract preferences from conversation (async, non-blocking)
      extractPreferencesFromChat(input.clientId, input.message, reply).catch(() => {});

      return { reply, conversationId: conversation.id };
    }),

  aiChatHistory: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const conversations = await getRecentConversations(input.clientId, 5);
      return conversations;
    }),

  // ═══════════════════════════════════════════════════════
  // BLOQUE G: Wearables / Actividad
  // ═══════════════════════════════════════════════════════

  logActivity: publicProcedure
    .input(z.object({
      clientId: z.number(),
      accessCode: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      steps: z.number().int().min(0).optional(),
      activeMinutes: z.number().int().min(0).optional(),
      caloriesBurned: z.number().int().min(0).optional(),
      heartRateAvg: z.number().int().min(30).max(220).optional(),
      heartRateMax: z.number().int().min(30).max(250).optional(),
      source: z.string().max(50).optional(),
    }))
    .mutation(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const { accessCode, ...data } = input;
      const id = await logActivity(data);
      
      // Update streak and evaluate badges
      const streakData = await updateStreak(input.clientId, input.date);
      const newBadges = await evaluateBadges(
        input.clientId,
        { steps: input.steps, activeMinutes: input.activeMinutes, caloriesBurned: input.caloriesBurned },
        streakData
      );
      
      return { id, newBadges, streak: streakData };
    }),

  getActivityLogs: publicProcedure
    .input(z.object({
      clientId: z.number(),
      accessCode: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getActivityLogs(input.clientId, input.startDate, input.endDate);
    }),

  getWearableConnections: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const connections = await getWearableConnection(input.clientId);
      // Don't expose tokens
      return (Array.isArray(connections) ? connections : [connections].filter(Boolean)).map((c: any) => ({
        id: c.id, provider: c.provider, status: c.status, lastSyncAt: c.lastSyncAt,
      }));
    }),

  // ═══════════════════════════════════════════════════════
  // BLOQUE I: Gamificación de Actividad
  // ═══════════════════════════════════════════════════════

  getMyBadges: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getClientActivityBadges(input.clientId);
    }),

  getAllBadges: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const all = await getAllActivityBadges();
      const unlocked = await getClientActivityBadges(input.clientId);
      const unlockedIds = new Set(unlocked.map(b => b.badgeId));
      return all.map(b => ({ ...b, unlocked: unlockedIds.has(b.id) }));
    }),

  getMyStreak: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      return getOrCreateStreak(input.clientId);
    }),

  // ═══════════════════════════════════════════════════════
  // BLOQUE H: Perfil de Personalización
  // ═══════════════════════════════════════════════════════

  getPersonalizationProfile: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const profile = await getPersonalizationProfile(input.clientId);
      const preferences = await getLearnedPreferences(input.clientId);
      return { profile: profile?.profileData || null, preferences };
    }),

  // ── Progress Reports (Client-facing) ──
  getMyReports: publicProcedure
    .input(z.object({ clientId: z.number(), accessCode: z.string() }))
    .query(async ({ input }) => {
      const client = await getClientByAccessCode(input.accessCode);
      if (!client || client.id !== input.clientId) throw new Error("Acceso denegado");
      const all = await getProgressReportsByClient(input.clientId);
      // Only show sent reports to the client
      return all.filter((r: any) => r.status === "sent");
    }),
});

// ── Helper: Extract preferences from AI chat ──
async function extractPreferencesFromChat(clientId: number, userMessage: string, assistantReply: string) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Analiza esta conversación y extrae preferencias alimentarias del usuario. Devuelve un JSON con el formato:
{"preferences": [{"category": "food_likes"|"food_dislikes"|"schedule"|"habits", "key": "nombre_corto", "value": "descripción", "confidence": 50-100}]}
Si no hay preferencias claras, devuelve {"preferences": []}. Solo extrae información explícita, no suposiciones.`,
        },
        { role: "user", content: `Usuario: "${userMessage}"\nAsistente: "${assistantReply}"` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "preferences_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              preferences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    key: { type: "string" },
                    value: { type: "string" },
                    confidence: { type: "integer" },
                  },
                  required: ["category", "key", "value", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["preferences"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content as string;
    if (content) {
      const parsed = JSON.parse(content);
      for (const pref of parsed.preferences || []) {
        await addLearnedPreference({
          clientId,
          category: pref.category,
          key: pref.key,
          value: pref.value,
          confidence: pref.confidence,
          source: "ai_chat",
        });
      }
    }
  } catch {
    // Non-critical, silently fail
  }
}
