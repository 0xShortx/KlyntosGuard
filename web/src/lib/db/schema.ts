/**
 * Database Schema for KlyntosGuard Web App
 *
 * Note: This is a standalone schema for the web app.
 * If you're using a shared database with Better Auth,
 * you may need to import schemas from @klyntos/db instead.
 */

import { pgTable, uuid, varchar, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core'

/**
 * API Keys for CLI authentication
 * Bridges Better Auth (web) with JWT (CLI)
 *
 * NOTE: This matches the existing database schema
 */
export const guardApiKeys = pgTable('guard_api_keys', {
  id: text('id').primaryKey(),

  // Foreign key to Better Auth users table
  userId: text('user_id').notNull(),

  // Hashed API key (SHA-256)
  key: text('key').notNull(),

  // Visible prefix (e.g., "kg_abc123...")
  prefix: text('prefix').notNull(),

  // User-provided name
  name: text('name').notNull(),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
})

/**
 * Usage tracking (optional - for analytics)
 */
export const guardUsage = pgTable('guard_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: varchar('status_code', { length: 10 }),
  processingTimeMs: varchar('processing_time_ms', { length: 20 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

/**
 * Subscriptions - Track user subscription status
 */
export const guardSubscriptions = pgTable('guard_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),

  // Stripe data
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),

  // Subscription details
  planTier: varchar('plan_tier', { length: 50 }).notNull(), // 'basic', 'pro'
  status: varchar('status', { length: 50 }).notNull(), // 'active', 'canceled', 'past_due', 'trialing'

  // Billing cycle
  billingCycle: varchar('billing_cycle', { length: 20 }), // 'monthly', 'yearly'

  // Dates
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Token Usage - For future token-based billing (OPTIONAL)
 * This table structure is prepared but not actively used yet
 */
export const guardTokenUsage = pgTable('guard_token_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),

  // Token tracking
  tokensTotal: integer('tokens_total').notNull().default(0),
  tokensUsed: integer('tokens_used').notNull().default(0),
  tokensRemaining: integer('tokens_remaining').notNull().default(0),

  // Usage tracking
  scansThisMonth: integer('scans_this_month').notNull().default(0),
  lastResetAt: timestamp('last_reset_at').defaultNow().notNull(),

  // Linked subscription
  subscriptionId: uuid('subscription_id').references(() => guardSubscriptions.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Scan History - Track individual scans (OPTIONAL)
 * This table structure is prepared but not actively used yet
 */
export const guardScans = pgTable('guard_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),

  // Scan details
  fileName: varchar('file_name', { length: 500 }),
  fileSize: integer('file_size'),
  tokensConsumed: integer('tokens_consumed').default(0),

  // Results
  issuesFound: integer('issues_found').default(0),
  severity: varchar('severity', { length: 50 }), // 'low', 'medium', 'high', 'critical'

  // Metadata
  scanDurationMs: integer('scan_duration_ms'),
  apiKeyUsed: varchar('api_key_used', { length: 100 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Export types
export type GuardApiKey = typeof guardApiKeys.$inferSelect
export type NewGuardApiKey = typeof guardApiKeys.$inferInsert
export type GuardUsage = typeof guardUsage.$inferSelect
export type NewGuardUsage = typeof guardUsage.$inferInsert
export type GuardSubscription = typeof guardSubscriptions.$inferSelect
export type NewGuardSubscription = typeof guardSubscriptions.$inferInsert
export type GuardTokenUsage = typeof guardTokenUsage.$inferSelect
export type NewGuardTokenUsage = typeof guardTokenUsage.$inferInsert
export type GuardScan = typeof guardScans.$inferSelect
export type NewGuardScan = typeof guardScans.$inferInsert
