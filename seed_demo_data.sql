-- ================================================================================
-- ET FINANCE DEMO SEED DATA
-- ================================================================================
-- IMPORTANT: Replace 'user_2demo_investor_001' with your actual Clerk User ID 
-- found in the 'user_profiles' table or in the 'x-user-id' header of your browser.
-- ================================================================================

-- 1. USER PROFILE
INSERT INTO user_profiles (clerk_user_id, first_name, last_name, email, persona, risk_score, income_range, monthly_investment_capacity, primary_goal, goal_horizon_years, onboarding_completed)
VALUES 
('user_2demo_investor_001', 'Aditya', 'Sharma', 'aditya@example.com', 'sip_investor', 7, '15L - 25L', 50000.00, 'Retirement & Child Education', 20, true)
ON CONFLICT (clerk_user_id) DO NOTHING;

-- 2. MARKET WATCHLIST
INSERT INTO market_watchlist (clerk_user_id, symbol, company_name, sector, notes)
VALUES 
('user_2demo_investor_001', 'RELIANCE', 'Reliance Industries', 'Energy', 'Watching for technical breakout above 3000'),
('user_2demo_investor_001', 'TCS', 'Tata Consultancy Services', 'IT', 'Dividend play - hold for long term'),
('user_2demo_investor_001', 'HDFCBANK', 'HDFC Bank', 'Banking', 'Crucial support at 1400')
ON CONFLICT (clerk_user_id, symbol) DO NOTHING;

-- 3. MARKET SIGNALS (GLOBAL POOL)
-- We use static UUIDs here to reference them in user_signals later
INSERT INTO market_signals (id, symbol, company_name, signal_type, summary, signal_strength, bullish_bearish, published_at)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RELIANCE', 'Reliance Industries', 'earnings_beat', 'Q3 results exceed expectations with 12% growth in retail segment.', 8.5, 'bullish', NOW() - INTERVAL '2 hours'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'TCS', 'TATA Consultancy Services', 'dividend_announced', 'Board declares special dividend of ₹28 per share.', 7.0, 'bullish', NOW() - INTERVAL '5 hours'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'INFY', 'Infosys', 'insider_buy', 'Promoter group acquires 2.5L shares from open market.', 9.0, 'bullish', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 4. USER SIGNALS (SCORING)
INSERT INTO user_signals (clerk_user_id, signal_id, portfolio_relevance, final_score, is_read)
VALUES 
('user_2demo_investor_001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0.9, 9.2, false),
('user_2demo_investor_001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 0.6, 7.5, false)
ON CONFLICT (clerk_user_id, signal_id) DO NOTHING;

-- 5. PORTFOLIO ASSETS (EQUITY & OTHERS)
INSERT INTO portfolio_assets (clerk_user_id, asset_type, asset_name, quantity, purchase_price, current_value, metadata)
VALUES 
('user_2demo_investor_001', 'equity', 'Reliance Industries', 25, 2450.00, 2980.50, '{"symbol": "RELIANCE", "sector": "Energy"}'),
('user_2demo_investor_001', 'equity', 'HDFC Bank', 100, 1550.25, 1420.10, '{"symbol": "HDFCBANK", "sector": "Banking"}'),
('user_2demo_investor_001', 'gold', 'Sovereign Gold Bond 2023', 50, 5800.00, 6250.00, '{"type": "SGB", "units": "grams"}'),
('user_2demo_investor_001', 'fd', 'HDFC Fixed Deposit', 1, 500000, 525300, '{"bank": "HDFC", "maturity_date": "2026-12-31"}');

-- 6. MUTUAL FUND HOLDINGS
INSERT INTO mf_current_holdings (clerk_user_id, scheme_code, scheme_name, category, total_units, avg_nav, current_nav, invested_amount, current_value)
VALUES 
('user_2demo_investor_001', '120503', 'Parag Parikh Flexi Cap Fund', 'Flexi Cap', 1250.45, 45.20, 62.15, 56515.00, 77715.00),
('user_2demo_investor_001', '118989', 'HDFC Top 100 Fund', 'Large Cap', 850.12, 110.50, 125.80, 93938.00, 106945.00)
ON CONFLICT (clerk_user_id, scheme_code) DO NOTHING;

-- 7. MONEY HEALTH ASSESSMENT
INSERT INTO money_health_assessments (clerk_user_id, overall_score, grade, score_emergency, score_insurance, score_diversification, score_debt, score_tax, score_retirement, top_actions)
VALUES 
('user_2demo_investor_001', 68.5, 'B', 8.0, 4.0, 7.5, 9.0, 6.0, 5.5, '[
  {"action": "Increase Life Insurance", "impact": "+12 points", "priority": "high"},
  {"action": "Start NPS for extra tax benefit", "impact": "+5 points", "priority": "medium"}
]')
ON CONFLICT (clerk_user_id) DO NOTHING;

-- 8. FIRE PLAN
INSERT INTO fire_plans (clerk_user_id, current_age, retirement_age, monthly_expenses, current_savings, monthly_investment, target_corpus, fire_year)
VALUES 
('user_2demo_investor_001', 32, 50, 65000.00, 1200000.00, 45000.00, 45000000.00, 2042)
ON CONFLICT (clerk_user_id) DO NOTHING;

-- 9. NOTIFICATIONS
INSERT INTO notifications (clerk_user_id, title, body, urgency, is_read)
VALUES 
('user_2demo_investor_001', 'Portfolio Rebalancing Alert', 'Your equity exposure has exceeded 70%. Consider moving ₹1.5L to debt.', 'high', false),
('user_2demo_investor_001', 'Market Pulse: Nifty All-time High', 'Nifty 50 touched 22,500. Check how your portfolio is tracking.', 'low', true);

-- 10. MORNING BRIEF
INSERT INTO morning_briefs (clerk_user_id, brief_date, content, portfolio_movers)
VALUES 
('user_2demo_investor_001', CURRENT_DATE, 'Good morning Aditya! Global markets are flat. RBI policy is expected today at 10 AM. Your portfolio is up 0.2% in early pre-market trade.', '[
  {"symbol": "RELIANCE", "change": "+1.2%"},
  {"symbol": "HDFCBANK", "change": "-0.5%"}
]')
ON CONFLICT (clerk_user_id, brief_date) DO NOTHING;
