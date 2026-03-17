CREATE TABLE `diets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`totalCalories` int NOT NULL,
	`proteinPercent` int NOT NULL,
	`carbsPercent` int NOT NULL,
	`fatsPercent` int NOT NULL,
	`mealsPerDay` int NOT NULL,
	`totalMenus` int NOT NULL,
	`avoidFoods` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mealId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` varchar(100) NOT NULL,
	`calories` int NOT NULL,
	`protein` int NOT NULL,
	`carbs` int NOT NULL,
	`fats` int NOT NULL,
	`alternativeName` varchar(255),
	`alternativeQuantity` varchar(100),
	`alternativeCalories` int,
	`alternativeProtein` int,
	`alternativeCarbs` int,
	`alternativeFats` int,
	CONSTRAINT `foods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuId` int NOT NULL,
	`mealNumber` int NOT NULL,
	`mealName` varchar(255) NOT NULL,
	`calories` int NOT NULL,
	`protein` int NOT NULL,
	`carbs` int NOT NULL,
	`fats` int NOT NULL,
	CONSTRAINT `meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dietId` int NOT NULL,
	`menuNumber` int NOT NULL,
	`totalCalories` int NOT NULL,
	`totalProtein` int NOT NULL,
	`totalCarbs` int NOT NULL,
	`totalFats` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
