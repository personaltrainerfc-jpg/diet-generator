CREATE TABLE `client_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`trainerId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`inviteCode` varchar(64) NOT NULL,
	`inviteStatus` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `client_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_invitations_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `motivation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`message` text NOT NULL,
	`sentByTrainer` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `motivation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekend_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`weekendDate` varchar(10) NOT NULL,
	`feedback` text NOT NULL,
	`score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekend_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekend_meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`mealType` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`photoUrl` text,
	`calories` int,
	`isHealthy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekend_meals_id` PRIMARY KEY(`id`)
);
