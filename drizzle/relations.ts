import { relations } from "drizzle-orm";
import {
  users, diets, menus, meals, foods, recipes, recipeIngredients,
  supplements, folders, customFoods, dietInstructions,
  clients, clientDiets, adherenceLogs, progressPhotos, weeklyCheckIns,
  chatMessages, achievements, clientAchievements, bodyMeasurements,
  initialAssessments, dietTemplates, clientFavoriteFoods,
  clientTags, clientTagAssignments, hydrationLogs, sleepLogs,
  wellnessLogs, mealReminders, clientInvitations, motivationLogs,
  weekendMeals, weekendFeedback,
  aiConversations, aiAssistantConfig, aiEscalationAlerts,
  learnedPreferences, personalizationProfiles,
  activityLogs, wearableConnections,
  activityBadges, clientActivityBadges, activityStreaks,
} from "./schema";

// ── Users ──
export const usersRelations = relations(users, ({ many }) => ({
  diets: many(diets),
  recipes: many(recipes),
  customFoods: many(customFoods),
  folders: many(folders),
  dietTemplates: many(dietTemplates),
}));

// ── Diets ──
export const dietsRelations = relations(diets, ({ one, many }) => ({
  user: one(users, { fields: [diets.userId], references: [users.id] }),
  folder: one(folders, { fields: [diets.folderId], references: [folders.id] }),
  menus: many(menus),
  supplements: many(supplements),
  dietInstructions: many(dietInstructions),
}));

// ── Menus ──
export const menusRelations = relations(menus, ({ one, many }) => ({
  diet: one(diets, { fields: [menus.dietId], references: [diets.id] }),
  meals: many(meals),
}));

// ── Meals ──
export const mealsRelations = relations(meals, ({ one, many }) => ({
  menu: one(menus, { fields: [meals.menuId], references: [menus.id] }),
  foods: many(foods),
}));

// ── Foods ──
export const foodsRelations = relations(foods, ({ one }) => ({
  meal: one(meals, { fields: [foods.mealId], references: [meals.id] }),
}));

// ── Recipes ──
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, { fields: [recipes.userId], references: [users.id] }),
  ingredients: many(recipeIngredients),
}));

// ── Recipe Ingredients ──
export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
}));

// ── Supplements ──
export const supplementsRelations = relations(supplements, ({ one }) => ({
  diet: one(diets, { fields: [supplements.dietId], references: [diets.id] }),
}));

// ── Folders ──
export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  diets: many(diets),
}));

// ── Custom Foods ──
export const customFoodsRelations = relations(customFoods, ({ one }) => ({
  user: one(users, { fields: [customFoods.userId], references: [users.id] }),
}));

// ── Diet Instructions ──
export const dietInstructionsRelations = relations(dietInstructions, ({ one }) => ({
  diet: one(diets, { fields: [dietInstructions.dietId], references: [diets.id] }),
}));

// ── Clients ──
export const clientsRelations = relations(clients, ({ one, many }) => ({
  trainer: one(users, { fields: [clients.trainerId], references: [users.id] }),
  clientDiets: many(clientDiets),
  adherenceLogs: many(adherenceLogs),
  progressPhotos: many(progressPhotos),
  weeklyCheckIns: many(weeklyCheckIns),
  chatMessages: many(chatMessages),
  clientAchievements: many(clientAchievements),
  bodyMeasurements: many(bodyMeasurements),
  initialAssessments: many(initialAssessments),
  favoriteFoods: many(clientFavoriteFoods),
  tagAssignments: many(clientTagAssignments),
  hydrationLogs: many(hydrationLogs),
  sleepLogs: many(sleepLogs),
  wellnessLogs: many(wellnessLogs),
  mealReminders: many(mealReminders),
  motivationLogs: many(motivationLogs),
  weekendMeals: many(weekendMeals),
  weekendFeedback: many(weekendFeedback),
  aiConversations: many(aiConversations),
  aiEscalationAlerts: many(aiEscalationAlerts),
  learnedPreferences: many(learnedPreferences),
  personalizationProfiles: many(personalizationProfiles),
  activityLogs: many(activityLogs),
  wearableConnections: many(wearableConnections),
  activityBadges: many(clientActivityBadges),
  activityStreaks: many(activityStreaks),
}));

// ── Client Diets ──
export const clientDietsRelations = relations(clientDiets, ({ one }) => ({
  client: one(clients, { fields: [clientDiets.clientId], references: [clients.id] }),
  diet: one(diets, { fields: [clientDiets.dietId], references: [diets.id] }),
}));

// ── Adherence Logs ──
export const adherenceLogsRelations = relations(adherenceLogs, ({ one }) => ({
  client: one(clients, { fields: [adherenceLogs.clientId], references: [clients.id] }),
}));

// ── Progress Photos ──
export const progressPhotosRelations = relations(progressPhotos, ({ one }) => ({
  client: one(clients, { fields: [progressPhotos.clientId], references: [clients.id] }),
}));

// ── Weekly Check-Ins ──
export const weeklyCheckInsRelations = relations(weeklyCheckIns, ({ one }) => ({
  client: one(clients, { fields: [weeklyCheckIns.clientId], references: [clients.id] }),
}));

// ── Chat Messages ──
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  client: one(clients, { fields: [chatMessages.clientId], references: [clients.id] }),
}));

// ── Achievements ──
export const achievementsRelations = relations(achievements, ({ many }) => ({
  clientAchievements: many(clientAchievements),
}));

// ── Client Achievements ──
export const clientAchievementsRelations = relations(clientAchievements, ({ one }) => ({
  client: one(clients, { fields: [clientAchievements.clientId], references: [clients.id] }),
  achievement: one(achievements, { fields: [clientAchievements.achievementId], references: [achievements.id] }),
}));

// ── Body Measurements ──
export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one }) => ({
  client: one(clients, { fields: [bodyMeasurements.clientId], references: [clients.id] }),
}));

// ── Initial Assessments ──
export const initialAssessmentsRelations = relations(initialAssessments, ({ one }) => ({
  client: one(clients, { fields: [initialAssessments.clientId], references: [clients.id] }),
}));

// ── Diet Templates ──
export const dietTemplatesRelations = relations(dietTemplates, ({ one }) => ({
  user: one(users, { fields: [dietTemplates.userId], references: [users.id] }),
}));

// ── Client Favorite Foods ──
export const clientFavoriteFoodsRelations = relations(clientFavoriteFoods, ({ one }) => ({
  client: one(clients, { fields: [clientFavoriteFoods.clientId], references: [clients.id] }),
}));

// ── Client Tags ──
export const clientTagsRelations = relations(clientTags, ({ one, many }) => ({
  trainer: one(users, { fields: [clientTags.trainerId], references: [users.id] }),
  assignments: many(clientTagAssignments),
}));

// ── Client Tag Assignments ──
export const clientTagAssignmentsRelations = relations(clientTagAssignments, ({ one }) => ({
  client: one(clients, { fields: [clientTagAssignments.clientId], references: [clients.id] }),
  tag: one(clientTags, { fields: [clientTagAssignments.tagId], references: [clientTags.id] }),
}));

// ── Hydration Logs ──
export const hydrationLogsRelations = relations(hydrationLogs, ({ one }) => ({
  client: one(clients, { fields: [hydrationLogs.clientId], references: [clients.id] }),
}));

// ── Sleep Logs ──
export const sleepLogsRelations = relations(sleepLogs, ({ one }) => ({
  client: one(clients, { fields: [sleepLogs.clientId], references: [clients.id] }),
}));

// ── Wellness Logs ──
export const wellnessLogsRelations = relations(wellnessLogs, ({ one }) => ({
  client: one(clients, { fields: [wellnessLogs.clientId], references: [clients.id] }),
}));

// ── Meal Reminders ──
export const mealRemindersRelations = relations(mealReminders, ({ one }) => ({
  client: one(clients, { fields: [mealReminders.clientId], references: [clients.id] }),
}));

// ── Client Invitations ──
export const clientInvitationsRelations = relations(clientInvitations, ({ one }) => ({
  trainer: one(users, { fields: [clientInvitations.trainerId], references: [users.id] }),
}));

// ── Motivation Logs ──
export const motivationLogsRelations = relations(motivationLogs, ({ one }) => ({
  client: one(clients, { fields: [motivationLogs.clientId], references: [clients.id] }),
}));

// ── Weekend Meals ──
export const weekendMealsRelations = relations(weekendMeals, ({ one }) => ({
  client: one(clients, { fields: [weekendMeals.clientId], references: [clients.id] }),
}));

// ── Weekend Feedback ──
export const weekendFeedbackRelations = relations(weekendFeedback, ({ one }) => ({
  client: one(clients, { fields: [weekendFeedback.clientId], references: [clients.id] }),
}));

// ── AI Conversations ──
export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  client: one(clients, { fields: [aiConversations.clientId], references: [clients.id] }),
}));

// ── AI Assistant Config ──
export const aiAssistantConfigRelations = relations(aiAssistantConfig, ({ one }) => ({
  trainer: one(users, { fields: [aiAssistantConfig.trainerId], references: [users.id] }),
}));

// ── AI Escalation Alerts ──
export const aiEscalationAlertsRelations = relations(aiEscalationAlerts, ({ one }) => ({
  client: one(clients, { fields: [aiEscalationAlerts.clientId], references: [clients.id] }),
}));

// ── Learned Preferences ──
export const learnedPreferencesRelations = relations(learnedPreferences, ({ one }) => ({
  client: one(clients, { fields: [learnedPreferences.clientId], references: [clients.id] }),
}));

// ── Personalization Profiles ──
export const personalizationProfilesRelations = relations(personalizationProfiles, ({ one }) => ({
  client: one(clients, { fields: [personalizationProfiles.clientId], references: [clients.id] }),
}));

// ── Activity Logs ──
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  client: one(clients, { fields: [activityLogs.clientId], references: [clients.id] }),
}));

// ── Wearable Connections ──
export const wearableConnectionsRelations = relations(wearableConnections, ({ one }) => ({
  client: one(clients, { fields: [wearableConnections.clientId], references: [clients.id] }),
}));

// ── Activity Badges ──
export const activityBadgesRelations = relations(activityBadges, ({ many }) => ({
  clientBadges: many(clientActivityBadges),
}));

// ── Client Activity Badges ──
export const clientActivityBadgesRelations = relations(clientActivityBadges, ({ one }) => ({
  client: one(clients, { fields: [clientActivityBadges.clientId], references: [clients.id] }),
  badge: one(activityBadges, { fields: [clientActivityBadges.badgeId], references: [activityBadges.id] }),
}));

// ── Activity Streaks ──
export const activityStreaksRelations = relations(activityStreaks, ({ one }) => ({
  client: one(clients, { fields: [activityStreaks.clientId], references: [clients.id] }),
}));
