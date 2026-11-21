import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  // Tables that are not in schema.ts, which `drizzle-kit push` would otherwise
  // DROP: NuxtHub's _hub_migrations, and the product search index from
  // scripts/search-fts.sql (products_fts and its products_fts_* tables).
  tablesFilter: ['!_hub_migrations', '!products_fts*'],
  dbCredentials: {
    url: 'file:.data/db/sqlite.db'
  }
})
