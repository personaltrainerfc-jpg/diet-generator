import { protectedProcedure, router } from "./_core/trpc";
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
} from "./clientDb";
import { storagePut } from "./storage";

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

  // Motivational message via LLM
  sendMotivation: protectedProcedure
    .input(z.object({ clientId: z.number(), context: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const client = await getClientById(input.clientId);
      if (!client || client.trainerId !== ctx.user.id) throw new Error("No tienes acceso");
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un entrenador personal motivador. Genera un mensaje corto y motivacional (máximo 2 frases) para un cliente llamado ${client.name}. ${input.context ? `Contexto: ${input.context}` : ""} El mensaje debe ser cálido, personal y motivador. Responde SOLO con el mensaje, sin comillas ni formato extra.`
          },
          { role: "user", content: "Genera un mensaje motivacional" }
        ],
      });

      const message = (response.choices[0]?.message?.content as string) || "¡Sigue así, vas genial! 💪";
      const id = await sendMessage({
        clientId: input.clientId,
        senderType: "trainer",
        message,
      });
      return { id, message };
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
});
