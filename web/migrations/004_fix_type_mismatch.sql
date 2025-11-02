-- Migration: Fix type mismatch between Better Auth (TEXT) and Guard tables (UUID)
-- This migration converts guard_api_keys and guard_scans to use TEXT for IDs

-- ============================================================================
-- PART 1: Update guard_api_keys table
-- ============================================================================

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS guard_api_keys_backup AS
SELECT * FROM guard_api_keys;

-- Step 2: Drop existing table (CASCADE removes dependent objects)
DROP TABLE IF EXISTS guard_api_keys CASCADE;

-- Step 3: Recreate with TEXT types
CREATE TABLE guard_api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Key data
  key TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_guard_api_keys_user_id ON guard_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_guard_api_keys_key ON guard_api_keys(key);
CREATE INDEX IF NOT EXISTS idx_guard_api_keys_prefix ON guard_api_keys(prefix);
CREATE INDEX IF NOT EXISTS idx_guard_api_keys_is_active ON guard_api_keys(is_active);

-- ============================================================================
-- PART 2: Update guard_scans table
-- ============================================================================

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS guard_scans_backup AS
SELECT * FROM guard_scans;

-- Step 2: Drop vulnerabilities first (foreign key dependency)
DROP TABLE IF EXISTS guard_vulnerabilities CASCADE;

-- Step 3: Drop scans table
DROP TABLE IF EXISTS guard_scans CASCADE;

-- Step 4: Recreate guard_scans with TEXT types
CREATE TABLE guard_scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Scan details
  file_name TEXT,
  language TEXT,
  code TEXT,
  policy TEXT DEFAULT 'moderate',

  -- Results
  status TEXT NOT NULL,
  vulnerability_count INTEGER DEFAULT 0,

  -- Metadata
  scan_duration_ms INTEGER,
  api_key_id TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 5: Create indexes for guard_scans
CREATE INDEX IF NOT EXISTS idx_guard_scans_user_id ON guard_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_guard_scans_created_at ON guard_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guard_scans_status ON guard_scans(status);

-- ============================================================================
-- PART 3: Recreate guard_vulnerabilities with TEXT foreign key
-- ============================================================================

CREATE TABLE guard_vulnerabilities (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES guard_scans(id) ON DELETE CASCADE,

  -- Vulnerability details
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Location in code
  line INTEGER,
  "column" INTEGER,
  end_line INTEGER,
  end_column INTEGER,

  -- Additional context
  code_snippet TEXT,
  suggestion TEXT,
  cwe TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 6: Create indexes for guard_vulnerabilities
CREATE INDEX IF NOT EXISTS idx_guard_vulnerabilities_scan_id ON guard_vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_guard_vulnerabilities_severity ON guard_vulnerabilities(severity);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table structures (run these manually to check)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'guard_api_keys' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'guard_scans' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'guard_vulnerabilities' ORDER BY ordinal_position;
