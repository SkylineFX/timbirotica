import { sqliteTable, text, integer, type AnySQLiteColumn, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

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
  slug: text().notNull().unique(),
  description: text(),
  image: text()
})

export const products = sqliteTable('products', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  sku: text(),
  description: text(),
  price: real().notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  brandId: integer('brand_id').references(() => brands.id),
  image: text(),
  stock: integer().notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categories_parent',
  }),
  children: many(categories, {
    relationName: 'categories_parent',
  }),
}))

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}))

export const carts = sqliteTable('carts', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).unique(), // Intentionally unique for 1:1 user-cart
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const cartItems = sqliteTable('cart_items', {
  id: integer().primaryKey({ autoIncrement: true }),
  cartId: integer('cart_id').references(() => carts.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer().notNull().default(1),
})

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}))

export const favorites = sqliteTable('favorites', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}))
