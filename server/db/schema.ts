import { sqliteTable, text, integer, type AnySQLiteColumn, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull().default(''),
  email: text().notNull().unique(),
  password: text().notNull(),
  role: text().notNull().default('user'),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
})

export const categories = sqliteTable('categories', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull(),
  parentId: integer('parent_id').references((): AnySQLiteColumn => categories.id),
  image: text()
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
  images: text('images', { mode: 'json' }).$type<string[]>(),
  stock: integer().notNull().default(1),
  isRecommended: integer({ mode: 'boolean' }).default(false),
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

export const addresses = sqliteTable('addresses', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull().default(''),
  phone: text().notNull(),
  street: text().notNull(),
  city: text().notNull(),
  county: text().notNull(),
  postalCode: text(),
  isDefaultShipping: integer({ mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}))

export const orders = sqliteTable('orders', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  orderNumber: text('order_number').notNull().unique(),
  total: real().notNull(),
  status: text().notNull().default('processing'),
  shippingMethod: text('shipping_method').notNull().default('courier'),
  paymentMethod: text('payment_method').notNull().default('transfer'),
  shippingCost: real('shipping_cost').notNull().default(0),
  shippingAddressSnapshot: text('shipping_address_snapshot'),
  billingAddressSnapshot: text('billing_address_snapshot'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const orderItems = sqliteTable('order_items', {
  id: integer().primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer().notNull(),
  priceAtBuy: real('price_at_buy').notNull(),
})

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const billingAddresses = sqliteTable('billing_addresses', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  companyName: text('company_name').notNull(),
  cui: text('cui').notNull(),
  hasRo: integer('has_ro', { mode: 'boolean' }).default(false),
  onrc: text('onrc').notNull(),
  bankName: text('bank_name'),
  iban: text('iban'),
  street: text('street').notNull(),
  city: text('city').notNull(),
  county: text('county').notNull(),
  isDefaultBilling: integer('is_default_billing', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const billingAddressesRelations = relations(billingAddresses, ({ one }) => ({
  user: one(users, {
    fields: [billingAddresses.userId],
    references: [users.id],
  }),
}))

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const counties = sqliteTable('counties', {
  id: integer().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
})

export const cities = sqliteTable('cities', {
  id: integer().primaryKey(),
  countyId: integer('county_id').references(() => counties.id).notNull(),
  name: text('name').notNull(),
})

export const countiesRelations = relations(counties, ({ many }) => ({
  cities: many(cities),
}))

export const citiesRelations = relations(cities, ({ one }) => ({
  county: one(counties, {
    fields: [cities.countyId],
    references: [counties.id],
  }),
}))
