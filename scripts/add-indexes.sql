-- Secondary indexes declared in server/db/schema.ts.
-- Safe to re-run (IF NOT EXISTS). Does not modify any row data.
-- Rollback: DROP INDEX IF EXISTS <name>;
CREATE INDEX IF NOT EXISTS `categories_parent_id_idx` ON `categories` (`parent_id`);
CREATE INDEX IF NOT EXISTS `categories_slug_idx` ON `categories` (`slug`);
CREATE INDEX IF NOT EXISTS `products_category_id_idx` ON `products` (`category_id`);
CREATE INDEX IF NOT EXISTS `products_brand_id_idx` ON `products` (`brand_id`);
CREATE INDEX IF NOT EXISTS `products_is_recommended_idx` ON `products` (`isRecommended`);
CREATE INDEX IF NOT EXISTS `cities_county_id_idx` ON `cities` (`county_id`);
CREATE INDEX IF NOT EXISTS `cart_items_cart_id_idx` ON `cart_items` (`cart_id`);
CREATE INDEX IF NOT EXISTS `favorites_user_id_idx` ON `favorites` (`user_id`);
CREATE INDEX IF NOT EXISTS `addresses_user_id_idx` ON `addresses` (`user_id`);
CREATE INDEX IF NOT EXISTS `orders_user_id_idx` ON `orders` (`user_id`);
CREATE INDEX IF NOT EXISTS `order_items_order_id_idx` ON `order_items` (`order_id`);
CREATE INDEX IF NOT EXISTS `billing_addresses_user_id_idx` ON `billing_addresses` (`user_id`);
PRAGMA optimize;

