CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`cover_image` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_slug_unique` ON `albums` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `albums_legacy_id_unique` ON `albums` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_kind` text NOT NULL,
	`target_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`body_html` text NOT NULL,
	`legacy_bbcode` text,
	`is_hidden` integer DEFAULT false NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comments_legacy_id_unique` ON `comments` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `comments_target_idx` ON `comments` (`target_kind`,`target_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `comments_recent_idx` ON `comments` (`created_at`);--> statement-breakpoint
CREATE TABLE `downloads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`file` text NOT NULL,
	`file_size` integer NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `downloads_legacy_id_unique` ON `downloads` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `external_images` (
	`url` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'unchecked' NOT NULL,
	`local_image` text,
	`checked_at` integer
);
--> statement-breakpoint
CREATE TABLE `forum_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forum_categories_legacy_id_unique` ON `forum_categories` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `forums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_staff_only` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`thread_count` integer DEFAULT 0 NOT NULL,
	`post_count` integer DEFAULT 0 NOT NULL,
	`last_post_at` integer,
	`legacy_id` integer,
	FOREIGN KEY (`category_id`) REFERENCES `forum_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forums_slug_unique` ON `forums` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `forums_legacy_id_unique` ON `forums` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `forums_category_idx` ON `forums` (`category_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `link_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_categories_legacy_id_unique` ON `link_categories` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `link_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_legacy_id_unique` ON `links` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `links_category_idx` ON `links` (`category_id`);--> statement-breakpoint
CREATE TABLE `map_areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`map_id` integer NOT NULL,
	`label` text NOT NULL,
	`left_percent` real NOT NULL,
	`top_percent` real NOT NULL,
	`width_percent` real NOT NULL,
	`height_percent` real NOT NULL,
	`target_kind` text NOT NULL,
	`page_id` integer,
	`url` text,
	`content_html` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `map_areas_map_idx` ON `map_areas` (`map_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `maps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image` text NOT NULL,
	`image_width` integer NOT NULL,
	`image_height` integer NOT NULL,
	`teaser_image` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `maps_slug_unique` ON `maps` (`slug`);--> statement-breakpoint
CREATE TABLE `media_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`uploaded_by_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_images_image_unique` ON `media_images` (`image`);--> statement-breakpoint
CREATE TABLE `navigation_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`group_title` text,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `navigation_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `navigation_links_section_idx` ON `navigation_links` (`section_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `navigation_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt_html` text DEFAULT '' NOT NULL,
	`body_html` text DEFAULT '' NOT NULL,
	`category_id` integer,
	`author_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`comments_enabled` integer DEFAULT true NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `news_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_unique` ON `news` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `news_legacy_id_unique` ON `news` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `news_published_idx` ON `news` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `news_category_idx` ON `news` (`category_id`);--> statement-breakpoint
CREATE TABLE `news_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`legacy_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_categories_slug_unique` ON `news_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `news_categories_legacy_id_unique` ON `news_categories` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `news_tags` (
	`news_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`news_id`, `tag_id`),
	FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `news_tags_tag_idx` ON `news_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `page_tags` (
	`page_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`page_id`, `tag_id`),
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `page_tags_tag_idx` ON `page_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`slug` text NOT NULL,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`kind` text DEFAULT 'article' NOT NULL,
	`body_html` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`comments_enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`legacy_title` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_path_unique` ON `pages` (`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `pages_legacy_id_unique` ON `pages` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `pages_parent_idx` ON `pages` (`parent_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`album_id` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image` text NOT NULL,
	`thumbnail` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`author_id` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_legacy_id_unique` ON `photos` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `photos_album_idx` ON `photos` (`album_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `poll_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`poll_id` integer NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_vote_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `poll_options_poll_idx` ON `poll_options` (`poll_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`poll_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`option_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`poll_id`, `user_id`),
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `poll_options`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `polls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`legacy_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `polls_legacy_id_unique` ON `polls` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`body_html` text NOT NULL,
	`legacy_bbcode` text,
	`edited_at` integer,
	`edited_by_id` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edited_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_legacy_id_unique` ON `posts` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `posts_thread_idx` ON `posts` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `posts_author_idx` ON `posts` (`author_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_id` integer NOT NULL,
	`body_html` text NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shouts_legacy_id_unique` ON `shouts` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `shouts_recent_idx` ON `shouts` (`created_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`forum_id` integer NOT NULL,
	`title` text NOT NULL,
	`author_id` integer NOT NULL,
	`is_sticky` integer DEFAULT false NOT NULL,
	`is_locked` integer DEFAULT false NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`post_count` integer DEFAULT 0 NOT NULL,
	`last_post_at` integer NOT NULL,
	`last_post_author_id` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`forum_id`) REFERENCES `forums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_post_author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `threads_legacy_id_unique` ON `threads` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `threads_forum_idx` ON `threads` (`forum_id`,`is_sticky`,`last_post_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`google_id` text,
	`email` text,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`avatar_url` text,
	`role` text DEFAULT 'user' NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`is_ghost` integer DEFAULT false NOT NULL,
	`banned_at` integer,
	`last_seen_at` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_key_unique` ON `users` (`name_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_legacy_id_unique` ON `users` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `video_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `video_categories_slug_unique` ON `video_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `video_categories_legacy_id_unique` ON `video_categories` (`legacy_id`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`youtube_id` text NOT NULL,
	`author_id` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `video_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_legacy_id_unique` ON `videos` (`legacy_id`);--> statement-breakpoint
CREATE INDEX `videos_category_idx` ON `videos` (`category_id`,`created_at`);