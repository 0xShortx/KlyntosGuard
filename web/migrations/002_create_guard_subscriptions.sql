-- Migration: Create guard_subscriptions and token tables
-- This adds subscription tracking for Stripe integration

-- ============================================
-- Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS guard_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User reference
    user_id UUID NOT NULL,

    -- Stripe data
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),

    -- Subscription details
    plan_tier VARCHAR(50) NOT NULL,  -- 'basic', 'pro'
    status VARCHAR(50) NOT NULL,      -- 'active', 'canceled', 'past_due', 'trialing'

    -- Billing cycle
    billing_cycle VARCHAR(20),        -- 'monthly', 'yearly'

    -- Dates
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_guard_subscriptions_user_id ON guard_subscriptions(user_id);
CREATE INDEX idx_guard_subscriptions_stripe_customer_id ON guard_subscriptions(stripe_customer_id);
CREATE INDEX idx_guard_subscriptions_stripe_subscription_id ON guard_subscriptions(stripe_subscription_id);
CREATE INDEX idx_guard_subscriptions_status ON guard_subscriptions(status);
CREATE INDEX idx_guard_subscriptions_plan_tier ON guard_subscriptions(plan_tier);

-- ============================================
-- Token Usage Table (OPTIONAL - for future use)
-- ============================================
CREATE TABLE IF NOT EXISTS guard_token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Token tracking
    tokens_total INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    tokens_remaining INTEGER NOT NULL DEFAULT 0,

    -- Usage tracking
    scans_this_month INTEGER NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Linked subscription
    subscription_id UUID REFERENCES guard_subscriptions(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guard_token_usage_user_id ON guard_token_usage(user_id);
CREATE INDEX idx_guard_token_usage_subscription_id ON guard_token_usage(subscription_id);

-- ============================================
-- Scan History Table (OPTIONAL - for future use)
-- ============================================
CREATE TABLE IF NOT EXISTS guard_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- Scan details
    file_name VARCHAR(500),
    file_size INTEGER,
    tokens_consumed INTEGER DEFAULT 0,

    -- Results
    issues_found INTEGER DEFAULT 0,
    severity VARCHAR(50),  -- 'low', 'medium', 'high', 'critical'

    -- Metadata
    scan_duration_ms INTEGER,
    api_key_used VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guard_scans_user_id ON guard_scans(user_id);
CREATE INDEX idx_guard_scans_created_at ON guard_scans(created_at);
CREATE INDEX idx_guard_scans_severity ON guard_scans(severity);

-- ============================================
-- Helper function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to subscriptions table
CREATE TRIGGER update_guard_subscriptions_updated_at
    BEFORE UPDATE ON guard_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to token usage table
CREATE TRIGGER update_guard_token_usage_updated_at
    BEFORE UPDATE ON guard_token_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE guard_subscriptions IS 'Tracks user subscription status with Stripe';
COMMENT ON TABLE guard_token_usage IS 'Tracks token usage for future token-based billing (optional)';
COMMENT ON TABLE guard_scans IS 'Historical record of all scans performed (optional)';

COMMENT ON COLUMN guard_subscriptions.plan_tier IS 'Subscription tier: basic or pro';
COMMENT ON COLUMN guard_subscriptions.status IS 'Stripe subscription status: active, canceled, past_due, trialing';
COMMENT ON COLUMN guard_subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
