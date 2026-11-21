-- Full-text index for product search (server/utils/productSearch.ts).
--
-- products_fts indexes products.name and products.sku with SQLite's FTS5, and
-- three triggers keep it in step with every write to products: the catalog
-- scripts, sync.sql and the admin. The text itself stays in products
-- (content='products'); the index stores only words and positions.
--
-- Safe to re-run: it creates what is missing, then rebuilds the index from
-- products. Re-run it after any change that recreates the products table
-- (drizzle-kit push does that for some column changes), because dropping the
-- table also drops its triggers.
--
-- Apply:
--   local:      npm run db:fts
--   staging D1: npx wrangler@4.164.0 d1 execute timbirotica-staging --remote --file=scripts/search-fts.sql
--   prod D1:    npx wrangler@4.164.0 d1 execute timbirotica-prod --remote --file=scripts/search-fts.sql
-- Rollback (search then fails until the code is reverted):
--   DROP TRIGGER IF EXISTS products_fts_insert;
--   DROP TRIGGER IF EXISTS products_fts_delete;
--   DROP TRIGGER IF EXISTS products_fts_update;
--   DROP TABLE IF EXISTS products_fts;

-- unicode61 splits text into words of letters and digits, folds case and, with
-- remove_diacritics 2, matches "hârtie" and "hartie" alike.
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  name,
  sku,
  content='products',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS products_fts_insert AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, name, sku) VALUES (new.id, new.name, new.sku);
END;

-- An index over an external table removes a row by being given the old values.
CREATE TRIGGER IF NOT EXISTS products_fts_delete AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, name, sku) VALUES ('delete', old.id, old.name, old.sku);
END;

-- sync.sql sets sku on every product it touches, so re-index only rows whose
-- name or sku actually changed. Price and stock updates never fire this.
CREATE TRIGGER IF NOT EXISTS products_fts_update AFTER UPDATE OF name, sku ON products
WHEN old.name IS NOT new.name OR old.sku IS NOT new.sku BEGIN
  INSERT INTO products_fts(products_fts, rowid, name, sku) VALUES ('delete', old.id, old.name, old.sku);
  INSERT INTO products_fts(rowid, name, sku) VALUES (new.id, new.name, new.sku);
END;

INSERT INTO products_fts(products_fts) VALUES ('rebuild');
