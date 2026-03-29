-- RUN THESE COMMANDS IN YOUR SUPABASE SQL EDITOR

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the market_watchlist table
-- This stores the user's personalized stock watchlist
CREATE TABLE IF NOT EXISTS market_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  company_name TEXT,
  sector TEXT,
  notes TEXT,
  custom_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate symbols for the same user
  UNIQUE(clerk_user_id, symbol)
);

-- 3. Create the market_preferences table
-- This stores the customized titles across the dashboard
CREATE TABLE IF NOT EXISTS market_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One title value per key, per user
  UNIQUE(clerk_user_id, key)
);

-- 4. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_watchlist_user_id ON market_watchlist(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_market_preferences_user_id ON market_preferences(clerk_user_id);

-- 5. Enable RLS (Optional but recommended)
ALTER TABLE market_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_preferences ENABLE ROW LEVEL SECURITY;

-- Note: Since you are using the SERVICE_ROLE_KEY in your API routes, 
-- they will bypass RLS. If you want to use the public key from the frontend later,
-- you would need to add RLS policies.
