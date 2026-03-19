CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50) NOT NULL DEFAULT 'trophy',
	`condition` varchar(100) NOT NULL,
	`threshold` int NOT NULL DEFAULT 1,
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `adherence_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`dietId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`mealNumber` int NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adherence_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `body_measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` int,
	`bodyFat` int,
	`chest` int,
	`waist` int,
	`hips` int,
	`arms` int,
	`thighs` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `body_measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`senderType` enum('trainer','client') NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_diets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`dietId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `client_diets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_favorite_foods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`foodName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_favorite_foods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_tag_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `client_tag_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#6BCB77',
	CONSTRAINT `client_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`age` int,
	`weight` int,
	`height` int,
	`goal` varchar(100),
	`notes` text,
	`status` enum('active','inactive','paused') NOT NULL DEFAULT 'active',
	`accessCode` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_accessCode_unique` UNIQUE(`accessCode`)
);
--> statement-breakpoint
CREATE TABLE `custom_foods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`caloriesPer100g` int NOT NULL,
	`proteinPer100g` int NOT NULL,
	`carbsPer100g` int NOT NULL,
	`fatsPer100g` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_foods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diet_instructions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dietId` int NOT NULL,
	`hungerManagement` text,
	`portionControl` text,
	`weighingFood` text,
	`weekendGuidelines` text,
	`healthIndications` text,
	`professionalNotes` text,
	CONSTRAINT `diet_instructions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diet_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dietId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`tags` json,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diet_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hydration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`glasses` int NOT NULL DEFAULT 0,
	`goalGlasses` int NOT NULL DEFAULT 8,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hydration_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `initial_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`currentDiet` text,
	`exerciseFrequency` varchar(50),
	`exerciseType` text,
	`medicalConditions` text,
	`medications` text,
	`allergiesIntolerances` text,
	`sleepHours` int,
	`stressLevel` int,
	`waterIntake` int,
	`alcoholFrequency` varchar(50),
	`smokingStatus` varchar(50),
	`goals` text,
	`trainerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `initial_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`mealName` varchar(100) NOT NULL,
	`reminderTime` varchar(5) NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	CONSTRAINT `meal_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`photoType` enum('front','side','back','other') NOT NULL DEFAULT 'front',
	`date` varchar(10) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` varchar(100) NOT NULL,
	`calories` int NOT NULL DEFAULT 0,
	`protein` int NOT NULL DEFAULT 0,
	`carbs` int NOT NULL DEFAULT 0,
	`fats` int NOT NULL DEFAULT 0,
	CONSTRAINT `recipe_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`totalCalories` int NOT NULL DEFAULT 0,
	`totalProtein` int NOT NULL DEFAULT 0,
	`totalCarbs` int NOT NULL DEFAULT 0,
	`totalFats` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sleep_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`hoursSlept` int NOT NULL,
	`quality` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sleep_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dietId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`dose` varchar(100),
	`timing` varchar(100),
	`notes` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `supplements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`currentWeight` int,
	`energyLevel` int,
	`hungerLevel` int,
	`sleepQuality` int,
	`adherenceRating` int,
	`notes` text,
	`trainerFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wellness_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`energy` int NOT NULL,
	`mood` int NOT NULL,
	`digestion` int NOT NULL,
	`bloating` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wellness_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `diets` ADD `dietType` varchar(50) DEFAULT 'equilibrada' NOT NULL;--> statement-breakpoint
ALTER TABLE `diets` ADD `cookingLevel` varchar(50) DEFAULT 'moderate' NOT NULL;--> statement-breakpoint
ALTER TABLE `diets` ADD `preferences` text;--> statement-breakpoint
ALTER TABLE `diets` ADD `useHomeMeasures` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `diets` ADD `supermarket` varchar(50);--> statement-breakpoint
ALTER TABLE `diets` ADD `dailyTargets` json;--> statement-breakpoint
ALTER TABLE `diets` ADD `selectedRecipeIds` json;--> statement-breakpoint
ALTER TABLE `diets` ADD `preferredFoods` json;--> statement-breakpoint
ALTER TABLE `diets` ADD `allergies` json;--> statement-breakpoint
ALTER TABLE `diets` ADD `fastingProtocol` varchar(20);--> statement-breakpoint
ALTER TABLE `diets` ADD `folderId` int;--> statement-breakpoint
ALTER TABLE `foods` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `meals` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `meals` ADD `description` text;--> statement-breakpoint
ALTER TABLE `meals` ADD `enabled` int DEFAULT 1 NOT NULL;