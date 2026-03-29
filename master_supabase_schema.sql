-- ================================================================================
-- ET FINANCE INVESTMENT INTELLIGENCE PLATFORM - MASTER SCHEMA
-- ================================================================================
-- This script initializes all required tables for the ET Finance platform.
-- It includes extensions, tables, indexes, and Row Level Security (RLS).
-- ================================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. USER PROFILES & ONBOARDING
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  persona TEXT CHECK (persona IN ('curious_beginner', 'active_trader', 'sip_investor', 'hni', 'retiree', 'nri')),
  risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 10),
  income_range TEXT,
  monthly_investment_capacity DECIMAL(15, 2),
  primary_goal TEXT,
  goal_horizon_years INTEGER,
  has_existing_portfolio BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT false,
  whatsapp_number TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  extracted_profile JSONB,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MARKET DATA & WATCHLIST
CREATE TABLE IF NOT EXISTS market_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  company_name TEXT,
  sector TEXT,
  notes TEXT,
  custom_label TEXT,
  alert_threshold_low DECIMAL(15, 2),
  alert_threshold_high DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, symbol)
);

CREATE TABLE IF NOT EXISTS market_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{
    "favorite_indices": [
      {"symbol": "^NSEI", "name": "Nifty 50"},
      {"symbol": "^BSESN", "name": "Sensex"},
      {"symbol": "USDINR=X", "name": "USD/INR"},
      {"symbol": "CL=F", "name": "Crude Oil"}
    ],
    "custom_titles": {},
    "news_topics": ["Markets", "Economy", "Personal Finance"]
  }',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  company_name TEXT,
  signal_type TEXT CHECK (signal_type IN (
    'earnings_beat', 'earnings_miss', 'insider_buy', 'insider_sell',
    'bulk_deal_buy', 'bulk_deal_sell', 'technical_breakout',
    'technical_breakdown', 'rating_upgrade', 'rating_downgrade',
    'dividend_announced', 'corporate_announcement'
  )),
  raw_data JSONB,
  summary TEXT,
  signal_strength FLOAT,
  bullish_bearish TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  signal_id UUID REFERENCES market_signals(id) ON DELETE CASCADE,
  portfolio_relevance FLOAT,
  final_score FLOAT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, signal_id)
);

-- 3. PORTFOLIO MANAGEMENT
CREATE TABLE IF NOT EXISTS portfolio_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('equity', 'mutual_fund', 'gold', 'fd', 'ppf', 'real_estate', 'other')),
  asset_name TEXT NOT NULL,
  quantity DECIMAL(15, 4) DEFAULT 0,
  purchase_price DECIMAL(15, 4) DEFAULT 0,
  purchase_date DATE,
  current_value DECIMAL(15, 4) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mf_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  scheme_code TEXT NOT NULL,
  scheme_name TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL')),
  units DECIMAL(15, 4),
  nav DECIMAL(15, 4),
  amount DECIMAL(15, 2),
  transaction_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mf_current_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  scheme_code TEXT NOT NULL,
  scheme_name TEXT NOT NULL,
  category TEXT,
  total_units DECIMAL(15, 4),
  avg_nav DECIMAL(15, 4),
  current_nav DECIMAL(15, 4),
  invested_amount DECIMAL(15, 2),
  current_value DECIMAL(15, 2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, scheme_code)
);

CREATE TABLE IF NOT EXISTS net_worth_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  total_net_worth DECIMAL(15, 2),
  equity_value DECIMAL(15, 2),
  mf_value DECIMAL(15, 2),
  cash_value DECIMAL(15, 2),
  debt_value DECIMAL(15, 2),
  other_value DECIMAL(15, 2),
  UNIQUE(clerk_user_id, date)
);

-- 4. FINANCIAL PLANNING (MONEY HEALTH, FIRE, TAX)
CREATE TABLE IF NOT EXISTS money_health_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  score_emergency DECIMAL(4, 1),
  score_insurance DECIMAL(4, 1),
  score_diversification DECIMAL(4, 1),
  score_debt DECIMAL(4, 1),
  score_tax DECIMAL(4, 1),
  score_retirement DECIMAL(4, 1),
  overall_score DECIMAL(4, 1),
  grade TEXT,
  top_actions JSONB,
  monthly_income DECIMAL(15, 2),
  monthly_expenses DECIMAL(15, 2),
  liquid_savings DECIMAL(15, 2),
  life_cover_amount DECIMAL(15, 2),
  health_cover_amount DECIMAL(15, 2),
  total_emi DECIMAL(15, 2),
  tax_investments_80c DECIMAL(15, 2),
  uses_nps BOOLEAN,
  retirement_savings DECIMAL(15, 2),
  age INTEGER,
  retirement_age INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fire_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  current_age INTEGER,
  retirement_age INTEGER,
  monthly_expenses DECIMAL(15, 2),
  current_savings DECIMAL(15, 2),
  monthly_investment DECIMAL(15, 2),
  expected_return_pre FLOAT,
  expected_return_post FLOAT,
  inflation_rate FLOAT,
  target_corpus DECIMAL(15, 2),
  fire_year INTEGER,
  projections JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS what_if_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  parent_plan_id UUID REFERENCES fire_plans(id) ON DELETE CASCADE,
  scenario_name TEXT,
  modifications JSONB,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  financial_year TEXT,
  old_regime_tax DECIMAL(15, 2),
  new_regime_tax DECIMAL(15, 2),
  recommended_regime TEXT,
  deductions_used JSONB,
  optimization_tips JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capital_gains_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  financial_year TEXT,
  stcg_equity DECIMAL(15, 2),
  ltcg_equity DECIMAL(15, 2),
  ltcg_exempt DECIMAL(15, 2),
  tax_liability DECIMAL(15, 2),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LIFE EVENT ADVISER
CREATE TABLE IF NOT EXISTS life_event_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('home_purchase', 'wedding', 'education', 'child_birth', 'job_loss')),
  event_date DATE,
  target_amount DECIMAL(15, 2),
  current_progress DECIMAL(15, 2),
  plan_details JSONB,
  to_do_list JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couples_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_1_id TEXT UNIQUE NOT NULL,
  user_2_email TEXT NOT NULL,
  user_2_id TEXT UNIQUE, -- Linked once user 2 joins
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived')),
  shared_assets JSONB DEFAULT '[]',
  shared_goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONTENT & ALERTS
CREATE TABLE IF NOT EXISTS morning_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  brief_date DATE DEFAULT CURRENT_DATE,
  content TEXT,
  global_data JSONB,
  portfolio_movers JSONB,
  key_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, brief_date)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  urgency TEXT DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  criteria_type TEXT CHECK (criteria_type IN ('price_above', 'price_below', 'percent_change', 'unusual_volume')),
  target_value DECIMAL(15, 2),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ANALYTICS & REPORTS
CREATE TABLE IF NOT EXISTS portfolio_xray_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  report_type TEXT DEFAULT 'full_xray',
  asset_allocation JSONB,
  sector_exposure JSONB,
  risk_metrics JSONB,
  overlap_analysis JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON market_watchlist(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user ON portfolio_assets(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON market_signals(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_signals_user ON user_signals(clerk_user_id, final_score DESC);

-- 9. ROW LEVEL SECURITY (RLS)
-- Note: Replace 'app.user_id' with your actual claim/setting if using a custom provider.
-- For standard Supabase + Clerk, clerk_user_id is the primary identifier.

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_current_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_event_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Simple Policy Pattern (Apply to all tables where clerk_user_id exists)
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'clerk_user_id' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can only access their own data" ON %I', tbl.table_name);
        EXECUTE format('CREATE POLICY "Users can only access their own data" ON %I FOR ALL USING (clerk_user_id = (current_setting(''request.headers'')::json->>''x-user-id''))', tbl.table_name);
    END LOOP;
END $$;
