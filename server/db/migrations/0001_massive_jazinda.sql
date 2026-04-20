ALTER TABLE `orders` ADD `shipping_method` text DEFAULT 'courier' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_method` text DEFAULT 'transfer' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_cost` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_address_snapshot` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_address_snapshot` text;