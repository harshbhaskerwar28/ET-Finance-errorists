-- ============================================================
-- ET AI Platform — Supabase Schema for Feature 1
-- Run this in Supabase SQL Editor (once)
-- ============================================================

-- Enable pgvector (needed for later features too)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── user_profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id               TEXT UNIQUE NOT NULL,
  first_name                  TEXT,
  persona                     TEXT CHECK (persona IN (
    'curious_beginner', 'active_trader', 'sip_investor',
    'hni', 'retiree', 'nri'
  )),
  risk_score                  INTEGER CHECK (risk_score BETWEEN 1 AND 10),
  income_range                TEXT,
  monthly_investment_capacity INTEGER,
  primary_goal                TEXT,
  goal_horizon_years          INTEGER,
  has_existing_portfolio      BOOLEAN DEFAULT false,
  preferred_language          TEXT DEFAULT 'en',
  onboarding_completed        BOOLEAN DEFAULT false,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── onboarding_conversations ─────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_conversations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  TEXT UNIQUE NOT NULL,
  messages       JSONB NOT NULL DEFAULT '[]',
  extracted_profile JSONB,
  completed      BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Service role (used by Next.js server) bypasses RLS automatically.
-- This policy lets the anon key read its own row if needed in future.
CREATE POLICY "Users can read their own profile"
  ON user_profiles FOR SELECT
  USING (clerk_user_id = current_setting('request.headers', true)::json->>'x-user-id');

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (clerk_user_id = current_setting('request.headers', true)::json->>'x-user-id');

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_conv_clerk_id ON onboarding_conversations(clerk_user_id);
