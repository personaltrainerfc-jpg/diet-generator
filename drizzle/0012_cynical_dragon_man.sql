ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('trainer','client','admin') NOT NULL DEFAULT 'trainer';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `plan` enum('basic','pro','centers') DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trainerName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `logoUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `primaryColor` varchar(7) DEFAULT '#16a34a';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `trainerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `invitationToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `invitationExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);