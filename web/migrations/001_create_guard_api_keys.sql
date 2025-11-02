-- Migration: Create guard_api_keys table
-- This table stores CLI API keys for authenticating with the KlyntosGuard API

CREATE TABLE IF NOT EXISTS guard_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to Better Auth users table
    -- You may need to adjust this depending on your Better Auth setup
    user_id UUID NOT NULL,
    -- FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,

    -- Hashed API key (SHA-256)
    key VARCHAR(255) NOT NULL,

    -- Visible prefix for identification (e.g., "kg_abc123...")
    prefix VARCHAR(20) NOT NULL,

    -- User-provided name for the key
    name VARCHAR(100) NOT NULL,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,

    -- Optional: IP restrictions (array of allowed IPs)
    allowed_ips TEXT[]
);

-- Indexes for faster lookups
CREATE INDEX idx_guard_api_keys_user_id ON guard_api_keys(user_id);
CREATE INDEX idx_guard_api_keys_key ON guard_api_keys(key);
CREATE INDEX idx_guard_api_keys_prefix ON guard_api_keys(prefix);
CREATE INDEX idx_guard_api_keys_is_active ON guard_api_keys(is_active);

-- Optional: Usage tracking table
CREATE TABLE IF NOT EXISTS guard_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code VARCHAR(10),
    processing_time_ms VARCHAR(20),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guard_usage_user_id ON guard_usage(user_id);
CREATE INDEX idx_guard_usage_timestamp ON guard_usage(timestamp);
