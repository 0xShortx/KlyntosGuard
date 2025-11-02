-- Migration: Create guard_scans and guard_vulnerabilities tables
-- These tables store scan history and detected vulnerabilities

-- Drop existing guard_scans table if it exists (to recreate with new schema)
DROP TABLE IF EXISTS guard_scans CASCADE;

-- Create guard_scans table
CREATE TABLE guard_scans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Scan details
    filename TEXT,
    language TEXT,
    code TEXT, -- Original code that was scanned
    policy TEXT DEFAULT 'moderate', -- 'strict' | 'moderate' | 'lax'

    -- Results
    status TEXT NOT NULL, -- 'passed' | 'failed' | 'pending'
    vulnerability_count INTEGER DEFAULT 0,

    -- Metadata
    scan_duration_ms INTEGER,
    api_key_id TEXT, -- Which API key was used

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create guard_vulnerabilities table
CREATE TABLE guard_vulnerabilities (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES guard_scans(id) ON DELETE CASCADE,

    -- Vulnerability details
    severity TEXT NOT NULL, -- 'critical' | 'high' | 'medium' | 'low'
    category TEXT NOT NULL, -- 'sql_injection' | 'xss' | 'hardcoded_secret' etc.
    message TEXT NOT NULL,

    -- Location in code
    line INTEGER,
    "column" INTEGER,
    end_line INTEGER,
    end_column INTEGER,

    -- Additional context
    code_snippet TEXT,
    suggestion TEXT,
    cwe TEXT, -- CWE-89, CWE-79, etc.

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_guard_scans_user_id ON guard_scans(user_id);
CREATE INDEX idx_guard_scans_created_at ON guard_scans(created_at DESC);
CREATE INDEX idx_guard_scans_status ON guard_scans(status);

CREATE INDEX idx_guard_vulnerabilities_scan_id ON guard_vulnerabilities(scan_id);
CREATE INDEX idx_guard_vulnerabilities_severity ON guard_vulnerabilities(severity);

-- Update existing guard_api_keys table to use TEXT for id and user_id
-- This ensures compatibility with Better Auth

-- First, backup existing data if any
CREATE TABLE IF NOT EXISTS guard_api_keys_backup AS SELECT * FROM guard_api_keys;

-- Drop and recreate guard_api_keys with correct types
DROP TABLE IF EXISTS guard_api_keys CASCADE;

CREATE TABLE guard_api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Hashed API key (SHA-256)
    key TEXT NOT NULL UNIQUE,

    -- Visible prefix for identification (e.g., "kg_abc123...")
    prefix TEXT NOT NULL,

    -- User-provided name for the key
    name TEXT NOT NULL,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes for guard_api_keys
CREATE INDEX idx_guard_api_keys_user_id ON guard_api_keys(user_id);
CREATE INDEX idx_guard_api_keys_key ON guard_api_keys(key);
CREATE INDEX idx_guard_api_keys_prefix ON guard_api_keys(prefix);
CREATE INDEX idx_guard_api_keys_is_active ON guard_api_keys(is_active);
