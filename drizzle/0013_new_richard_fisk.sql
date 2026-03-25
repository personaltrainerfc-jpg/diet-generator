ALTER TABLE `progress_reports` ADD `trainerNotes` text;--> statement-breakpoint
ALTER TABLE `progress_reports` ADD `status` varchar(20) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `progress_reports` ADD `sentAt` timestamp;