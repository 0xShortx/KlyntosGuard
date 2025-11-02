-- Migration: Add GitHub integration tables and update scans table
-- Adds support for GitHub webhooks, auto-scan, and PR comment bot

-- Create guard_github_repositories table
CREATE TABLE IF NOT EXISTS guard_github_repositories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Repository details
    full_name TEXT NOT NULL, -- e.g., "owner/repo"
    default_branch TEXT NOT NULL DEFAULT 'main',

    -- Auto-scan configuration
    auto_scan_enabled BOOLEAN DEFAULT false,
    autoscan_branches TEXT[], -- Array of branch names to auto-scan
    pr_scan_enabled BOOLEAN DEFAULT false,
    policy TEXT DEFAULT 'moderate',

    -- Webhook configuration
    webhook_id TEXT, -- GitHub webhook ID
    webhook_secret TEXT, -- Secret for verifying webhook signatures

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for guard_github_repositories
CREATE INDEX idx_github_repos_user_id ON guard_github_repositories(user_id);
CREATE INDEX idx_github_repos_full_name ON guard_github_repositories(full_name);
CREATE INDEX idx_github_repos_auto_scan ON guard_github_repositories(auto_scan_enabled);
CREATE INDEX idx_github_repos_pr_scan ON guard_github_repositories(pr_scan_enabled);

-- Update guard_scans table with new GitHub-related fields
-- Add columns if they don't exist
ALTER TABLE guard_scans
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS branch TEXT,
  ADD COLUMN IF NOT EXISTS commit_sha TEXT,
  ADD COLUMN IF NOT EXISTS pr_number INTEGER,
  ADD COLUMN IF NOT EXISTS triggered_by TEXT,
  ADD COLUMN IF NOT EXISTS webhook_delivery_id TEXT,
  ADD COLUMN IF NOT EXISTS results TEXT, -- JSON string of full results
  ADD COLUMN IF NOT EXISTS error TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Rename filename to file_name if it exists (to match schema)
ALTER TABLE guard_scans
  RENAME COLUMN filename TO file_name;

-- Update existing scans to have type='local' if null
UPDATE guard_scans SET type = 'local' WHERE type IS NULL;

-- Make type NOT NULL after backfilling
ALTER TABLE guard_scans ALTER COLUMN type SET NOT NULL;

-- Update status values to include new states
-- Old: 'passed' | 'failed' | 'pending'
-- New: 'pending' | 'scanning' | 'completed' | 'failed'
UPDATE guard_scans SET status = 'completed' WHERE status = 'passed';

-- Add indexes for new GitHub columns
CREATE INDEX IF NOT EXISTS idx_guard_scans_type ON guard_scans(type);
CREATE INDEX IF NOT EXISTS idx_guard_scans_github_url ON guard_scans(github_url);
CREATE INDEX IF NOT EXISTS idx_guard_scans_branch ON guard_scans(branch);
CREATE INDEX IF NOT EXISTS idx_guard_scans_pr_number ON guard_scans(pr_number);
CREATE INDEX IF NOT EXISTS idx_guard_scans_triggered_by ON guard_scans(triggered_by);
CREATE INDEX IF NOT EXISTS idx_guard_scans_webhook_delivery_id ON guard_scans(webhook_delivery_id);

-- Create a composite index for finding scans by repository and branch
CREATE INDEX IF NOT EXISTS idx_guard_scans_repo_branch ON guard_scans(github_url, branch);
