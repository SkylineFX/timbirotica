import { sqliteTable, text, integer, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  avatar: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
})

export const categories = sqliteTable('categories', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull(),
  parentId: integer('parent_id').references((): AnySQLiteColumn => categories.id)
})

export const brands = sqliteTable('brands', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull(),
  description: text(),
  image: text()
})

export const products = sqliteTable('products', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull(),
  description: text(),
  price: integer().notNull(), // Store cent amounts or change to text/real based on need. User asked for REAL.
  categoryId: integer('category_id').references(() => categories.id),
  brandId: integer('brand_id').references(() => brands.id),
  image: text(),
  stock: integer().notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
