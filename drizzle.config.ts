import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  // _hub_migrations is NuxtHub's internal table (not in schema.ts); without this
  // filter `drizzle-kit push` tries to DROP it.
  tablesFilter: ['!_hub_migrations'],
  dbCredentials: {
    url: 'file:.data/db/sqlite.db'
  }
})
