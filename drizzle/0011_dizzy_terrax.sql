CREATE TABLE `adherence_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`alertType` varchar(50) NOT NULL,
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`description` text,
	`suggestion` text,
	`resolved` int NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adherence_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`periodStart` varchar(10) NOT NULL,
	`periodEnd` varchar(10) NOT NULL,
	`adherencePercent` int NOT NULL,
	`mealsCompleted` int NOT NULL,
	`mealsTotal` int NOT NULL,
	`weightStart` int,
	`weightEnd` int,
	`motivationalMessage` text,
	`highlights` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_reports_id` PRIMARY KEY(`id`)
);
