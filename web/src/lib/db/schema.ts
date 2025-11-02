/**
 * Database Schema for KlyntosGuard Web App
 *
 * Includes Better Auth tables for user authentication
 * and Guard-specific tables for subscriptions, API keys, etc.
 */

import { pgTable, uuid, varchar, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core'

/**
 * Better Auth Tables
 * These tables are required for Better Auth to function
 */

// Users table
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Sessions table
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// Accounts table (for OAuth providers)
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Verification tokens table
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

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
 * Scan History - Track individual scans
 * NOTE: Uses TEXT for IDs to match Better Auth standard
 */
export const guardScans = pgTable('guard_scans', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Scan details
  fileName: text('file_name'),
  language: text('language'),
  code: text('code'),
  policy: text('policy').default('moderate'),

  // Results
  status: text('status').notNull(), // 'passed' | 'failed'
  vulnerabilityCount: integer('vulnerability_count').default(0),

  // Metadata
  scanDurationMs: integer('scan_duration_ms'),
  apiKeyId: text('api_key_id'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Vulnerabilities - Individual security issues found in scans
 */
export const guardVulnerabilities = pgTable('guard_vulnerabilities', {
  id: text('id').primaryKey(),
  scanId: text('scan_id')
    .notNull()
    .references(() => guardScans.id, { onDelete: 'cascade' }),

  // Vulnerability details
  severity: text('severity').notNull(), // 'critical' | 'high' | 'medium' | 'low'
  category: text('category').notNull(), // 'sql_injection' | 'xss' | 'hardcoded_secret' etc.
  message: text('message').notNull(),

  // Location in code
  line: integer('line'),
  column: integer('column'),
  endLine: integer('end_line'),
  endColumn: integer('end_column'),

  // Additional context
  codeSnippet: text('code_snippet'),
  suggestion: text('suggestion'),
  cwe: text('cwe'), // CWE-89, CWE-79, etc.

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Export types
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
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
export type GuardVulnerability = typeof guardVulnerabilities.$inferSelect
export type NewGuardVulnerability = typeof guardVulnerabilities.$inferInsert
