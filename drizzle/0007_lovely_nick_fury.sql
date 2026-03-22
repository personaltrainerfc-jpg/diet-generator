ALTER TABLE `recipes` ADD `category` varchar(50) DEFAULT 'otro';--> statement-breakpoint
ALTER TABLE `recipes` ADD `isSystem` tinyint DEFAULT 0 NOT NULL;