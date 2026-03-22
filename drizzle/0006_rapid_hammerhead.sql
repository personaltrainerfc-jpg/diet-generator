CREATE TABLE `activity_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(255) NOT NULL,
	`icon` varchar(50) NOT NULL,
	`category` varchar(30) NOT NULL,
	`threshold` int NOT NULL,
	`tier` enum('bronze','silver','gold','diamond') NOT NULL DEFAULT 'bronze',
	CONSTRAINT `activity_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `activity_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_streaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_activity_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`badgeId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`value` int,
	CONSTRAINT `client_activity_badges_id` PRIMARY KEY(`id`)
);
