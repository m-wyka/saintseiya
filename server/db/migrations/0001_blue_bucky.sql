CREATE TABLE `translations` (
	`entity` text NOT NULL,
	`entity_id` integer NOT NULL,
	`field` text NOT NULL,
	`locale` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`entity`, `entity_id`, `field`, `locale`)
);
