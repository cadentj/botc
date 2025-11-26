CREATE TABLE `lobbies` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`script` text DEFAULT 'trouble_brewing' NOT NULL,
	`phase` text DEFAULT 'waiting' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lobbies_code_unique` ON `lobbies` (`code`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`lobby_id` text NOT NULL,
	`name` text NOT NULL,
	`session_token` text NOT NULL,
	`is_storyteller` integer DEFAULT false NOT NULL,
	`connected` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`lobby_id`) REFERENCES `lobbies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_session_token_unique` ON `players` (`session_token`);