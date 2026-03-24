/**
 * Adherence Engine — Predictive adherence analysis
 * Analyzes patterns in adherence logs and generates alerts for trainers
 */
import {
  getActiveClientsByTrainer,
  getAdherenceRange,
  createAdherenceAlert,
  getAlertsByTrainer,
  getClientAdherenceByDayOfWeek,
} from "./clientDb";

export type AdherencePattern = {
  clientId: number;
  trainerId: number;
  alerts: AlertCandidate[];
};

export type AlertCandidate = {
  alertType: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  suggestion: string;
};

/**
 * Analyze a single client's adherence and return alert candidates
 */
export async function analyzeClientAdherence(
  clientId: number,
  trainerId: number,
  clientName: string
): Promise<AlertCandidate[]> {
  const alerts: AlertCandidate[] = [];

  // Get last 14 days of adherence
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const endDate = now.toISOString().split("T")[0];
  const startDate = twoWeeksAgo.toISOString().split("T")[0];

  const logs = await getAdherenceRange(clientId, startDate, endDate);
  if (logs.length === 0) return alerts;

  const completed = logs.filter((l: any) => l.completed).length;
  const total = logs.length;
  const overallPercent = Math.round((completed / total) * 100);

  // Rule 1: Overall low adherence (< 50% in last 14 days)
  if (overallPercent < 50 && total >= 5) {
    alerts.push({
      alertType: "overall_low",
      severity: "high",
      title: `${clientName}: Adherencia muy baja (${overallPercent}%)`,
      description: `En los últimos 14 días, ${clientName} solo ha completado ${completed} de ${total} comidas registradas (${overallPercent}%).`,
      suggestion: "Contacta al cliente para entender las barreras. Considera simplificar el plan o ajustar las comidas a opciones más prácticas.",
    });
  }

  // Rule 2: 3+ consecutive days without completing any meal
  const logsByDate: Record<string, { completed: number; total: number }> = {};
  for (const log of logs) {
    const d = typeof log.date === "string" ? log.date : new Date(log.date).toISOString().split("T")[0];
    if (!logsByDate[d]) logsByDate[d] = { completed: 0, total: 0 };
    logsByDate[d].total++;
    if ((log as any).completed) logsByDate[d].completed++;
  }

  const sortedDates = Object.keys(logsByDate).sort();
  let consecutiveZero = 0;
  let maxConsecutiveZero = 0;
  for (const date of sortedDates) {
    if (logsByDate[date].completed === 0) {
      consecutiveZero++;
      maxConsecutiveZero = Math.max(maxConsecutiveZero, consecutiveZero);
    } else {
      consecutiveZero = 0;
    }
  }

  if (maxConsecutiveZero >= 3) {
    alerts.push({
      alertType: "drop_3days",
      severity: "high",
      title: `${clientName}: ${maxConsecutiveZero} días sin completar comidas`,
      description: `${clientName} ha tenido ${maxConsecutiveZero} días consecutivos sin completar ninguna comida en las últimas 2 semanas.`,
      suggestion: "Esto puede indicar desmotivación o problemas externos. Un mensaje de apoyo o una llamada rápida puede marcar la diferencia.",
    });
  }

  // Rule 3: Weekend drop pattern
  const dayPattern = await getClientAdherenceByDayOfWeek(clientId);
  const weekdayAvg = dayPattern.slice(0, 5).reduce((sum: number, d: any) => sum + d.adherencePercent, 0) / 5;
  const weekendAvg = dayPattern.slice(5, 7).reduce((sum: number, d: any) => sum + d.adherencePercent, 0) / 2;

  if (weekdayAvg > 60 && weekendAvg < weekdayAvg * 0.6 && dayPattern.some((d: any) => d.total >= 3)) {
    alerts.push({
      alertType: "weekend_drop",
      severity: "medium",
      title: `${clientName}: Caída de adherencia los fines de semana`,
      description: `${clientName} tiene ${Math.round(weekdayAvg)}% de adherencia entre semana pero solo ${Math.round(weekendAvg)}% los fines de semana.`,
      suggestion: "Considera crear un plan de fin de semana más flexible con opciones sociales. Las comidas de fin de semana pueden ser más permisivas.",
    });
  }

  // Rule 4: Specific meal skipping pattern
  const mealSkips: Record<number, { skipped: number; total: number }> = {};
  for (const log of logs) {
    const mn = (log as any).mealNumber;
    if (!mealSkips[mn]) mealSkips[mn] = { skipped: 0, total: 0 };
    mealSkips[mn].total++;
    if (!(log as any).completed) mealSkips[mn].skipped++;
  }

  for (const [mealNum, stats] of Object.entries(mealSkips)) {
    if (stats.total >= 5) {
      const skipRate = Math.round((stats.skipped / stats.total) * 100);
      if (skipRate >= 70) {
        const mealNames: Record<string, string> = { "1": "Desayuno", "2": "Snack mañana", "3": "Comida", "4": "Snack tarde", "5": "Cena" };
        const mealName = mealNames[mealNum] || `Comida ${mealNum}`;
        alerts.push({
          alertType: "skip_meal_pattern",
          severity: "medium",
          title: `${clientName}: Salta ${mealName} frecuentemente (${skipRate}%)`,
          description: `${clientName} no completa ${mealName} el ${skipRate}% de las veces (${stats.skipped}/${stats.total}).`,
          suggestion: `Revisa si ${mealName.toLowerCase()} es práctico para el horario del cliente. Quizás necesita opciones más rápidas o un cambio de horario.`,
        });
      }
    }
  }

  return alerts;
}

/**
 * Run adherence analysis for all active clients of a trainer
 * and create alerts for new issues detected
 */
export async function runAdherenceAnalysis(trainerId: number): Promise<number> {
  const clients = await getActiveClientsByTrainer(trainerId);
  let alertsCreated = 0;

  // Get existing unresolved alerts to avoid duplicates
  const existingAlerts = await getAlertsByTrainer(trainerId);
  const existingKeys = new Set(
    existingAlerts.map((a: any) => `${a.alert.clientId}-${a.alert.alertType}`)
  );

  for (const client of clients) {
    const candidates = await analyzeClientAdherence(client.id, trainerId, client.name);

    for (const candidate of candidates) {
      const key = `${client.id}-${candidate.alertType}`;
      if (!existingKeys.has(key)) {
        await createAdherenceAlert({
          clientId: client.id,
          trainerId,
          alertType: candidate.alertType,
          severity: candidate.severity,
          title: candidate.title,
          description: candidate.description,
          suggestion: candidate.suggestion,
        });
        alertsCreated++;
        existingKeys.add(key); // Prevent duplicates within same run
      }
    }
  }

  return alertsCreated;
}
