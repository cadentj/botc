CREATE TABLE `grimoire_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`lobby_id` text NOT NULL,
	`character_id` text NOT NULL,
	`player_id` text,
	`position_x` integer DEFAULT 0 NOT NULL,
	`position_y` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`lobby_id`) REFERENCES `lobbies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `lobbies` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`script` text DEFAULT 'trouble_brewing' NOT NULL,
	`phase` text DEFAULT 'setup' NOT NULL,
	`player_count` integer NOT NULL,
	`selected_characters` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lobbies_code_unique` ON `lobbies` (`code`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`lobby_id` text NOT NULL,
	`name` text NOT NULL,
	`is_storyteller` integer DEFAULT false NOT NULL,
	`character_id` text,
	FOREIGN KEY (`lobby_id`) REFERENCES `lobbies`(`id`) ON UPDATE no action ON DELETE cascade
);
