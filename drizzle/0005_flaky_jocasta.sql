CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`steps` int,
	`activeMinutes` int,
	`caloriesBurned` int,
	`heartRateAvg` int,
	`heartRateMax` int,
	`source` varchar(50) NOT NULL DEFAULT 'manual',
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_assistant_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainerId` int NOT NULL,
	`assistantName` varchar(100) NOT NULL DEFAULT 'NutriBot',
	`tone` varchar(50) NOT NULL DEFAULT 'amigable',
	`customRules` text,
	`escalationKeywords` json,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_assistant_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`messages` json NOT NULL,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_escalation_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`reason` text NOT NULL,
	`conversationId` int,
	`resolved` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_escalation_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learned_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`key_name` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`confidence` int NOT NULL DEFAULT 50,
	`source` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learned_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalization_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`profileData` json NOT NULL,
	`lastAnalyzedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personalization_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wearable_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`provider` varchar(50) NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`expiresAt` timestamp,
	`lastSyncAt` timestamp,
	`wearableStatus` enum('connected','disconnected','expired') NOT NULL DEFAULT 'connected',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wearable_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `archetype` varchar(20);