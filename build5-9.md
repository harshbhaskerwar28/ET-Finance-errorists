# ET AI Investment Intelligence Platform
## Technical Implementation Guide — Features 5 to 9
### Stack: Next.js 14 · TypeScript · OpenAI · Clerk · Supabase
### Continuation of Features 1–4 document — same patterns, same architecture

---

> **Read this first:** Every API route lives under `app/api/`. Every page lives under `app/`.
> Auth is always `const { userId } = await auth()` from Clerk at the top of every route.
> DB is always `createServerClient()` from your Supabase lib.
> OpenAI calls use `gpt-4o-mini` for bulk/background tasks, `gpt-4o` for user-facing chat.
> This document gives you the full structure, logic, and DB schema. Code patterns are the same as Features 1–4.

---

---

# FEATURE 5 — Personal Finance Advisory

### Sub-features
- 5A: Money Health Score
- 5B: FIRE Path Planner
- 5C: Life Event Financial Advisor
- 5D: Couple's Money Planner

---

## 5A. Money Health Score

### UX Research & Design

**The Problem:** Indian investors have no single view of their financial health. They know their SIP amount but not their insurance gap. They track stocks but ignore emergency funds. The Money Health Score is the first thing a returning user sees after the dashboard — a single number that tells them where they stand across 6 dimensions.

**Research insight:** The credit score analogy works exceptionally well with Indian users. CIBIL score has 100% brand recognition. "Your financial health score is 67/100 — here's what's pulling it down" triggers the same psychological response as a CIBIL report. Build on that mental model intentionally.

**UX Principles:**
- One number, prominently displayed. Letter grade alongside (A / B / C / D). Do not bury it.
- Six dimension cards arranged in a grid below the main score — each with its own mini score and one-line action
- The score must feel dynamic — if a user adds an emergency fund today, the score should update
- Colour coding: Green above 70, Amber 40–70, Red below 40
- Never show all 6 action items at once — surface only the top 2 ("Your biggest opportunities right now")
- Allow "recalculate" — users should be able to update inputs and watch the score move in real time

**The 6 Dimensions and How They Score:**

| Dimension | What Is Measured | Max Score | Key Signal |
|---|---|---|---|
| Emergency Preparedness | Liquid savings ÷ monthly expenses (target: 6 months) | 10 | Under 3 months = red flag |
| Insurance Coverage | Life cover (10x income) + health cover (min ₹10L) | 10 | No term plan = major gap |
| Investment Diversification | Number of distinct asset classes held | 10 | All in FD = under-diversified |
| Debt Health | EMI as % of monthly income (target: under 40%) | 10 | EMI over 60% = critical |
| Tax Efficiency | % of ₹1.5L 80C limit used + NPS + HRA claimed | 10 | Money left on table = score drops |
| Retirement Readiness | Current retirement corpus ÷ target corpus at retirement | 10 | Nothing saved = near-zero |

**Screen Design:**
```
[Large Score: 67]  [Grade: B]  "You're on track — 3 areas need attention"

[Grid of 6 dimension cards — each shows sub-score + icon + one-liner]

[CTA: "Top 2 Actions Right Now"]
  → "Start a ₹5,000/month SIP to close your retirement gap"
  → "A ₹1Cr term plan costs only ₹8,000/year — you have zero coverage"

[Recalculate button — opens input form]
```

### Database Schema

```sql
CREATE TABLE money_health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- Inputs (user-provided)
  monthly_income INTEGER,
  monthly_expenses INTEGER,
  liquid_savings INTEGER,        -- Emergency fund
  life_cover_amount INTEGER,
  health_cover_amount INTEGER,
  total_emi INTEGER,
  tax_investments_80c INTEGER,   -- How much invested under 80C
  uses_nps BOOLEAN DEFAULT false,
  retirement_savings INTEGER,
  age INTEGER,
  retirement_age INTEGER DEFAULT 60,

  -- Computed scores (0-10 each)
  score_emergency FLOAT,
  score_insurance FLOAT,
  score_diversification FLOAT,
  score_debt FLOAT,
  score_tax FLOAT,
  score_retirement FLOAT,
  overall_score FLOAT,
  grade TEXT,                    -- A, B, C, D

  -- AI-generated action plan
  top_actions JSONB,             -- Array of {action, priority, estimated_impact}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON money_health_assessments(clerk_user_id, updated_at DESC);
```

### API Routes

**POST `/api/money-health/calculate`**

Logic flow:
1. Accept all 6 dimension inputs in request body
2. Run all 6 scoring functions synchronously (pure math, no LLM needed)
3. Compute overall score as weighted average
4. Call GPT-4o-mini once to generate the top 2 prioritised action items (give it the scores + inputs, ask for specific actionable recommendations in Indian context)
5. Save full assessment to `money_health_assessments` table
6. Return scores + grade + actions

Scoring logic (pure TypeScript math, no AI):
- Emergency: `(liquid_savings / monthly_expenses / 6) * 10` capped at 10
- Insurance life: `(life_cover_amount / (monthly_income * 12 * 10)) * 10` capped at 10
- Insurance health: `(health_cover_amount / 1_000_000) * 10` capped at 10
- Insurance combined: average of life and health
- Debt: `Math.max(0, 10 - (total_emi / monthly_income * 25))` — EMI over 40% income = 0
- Tax: `(tax_investments_80c / 150_000) * 7 + (uses_nps ? 3 : 0)` capped at 10
- Retirement: `(retirement_savings / target_corpus) * 10` where target = expenses × 12 × 25

**GET `/api/money-health/latest`**

Returns the most recent assessment for the authenticated user. Used by dashboard to show the score widget.

### Frontend Approach

Page: `app/advisory/health-score/page.tsx`

Two states:
1. **No assessment yet** → Show a 2-minute input form. Wizard-style, one section at a time (income, savings, insurance, debt, tax, retirement). Progress bar at top.
2. **Assessment exists** → Show the score dashboard with 6 dimension cards.

Key UI element — the score ring: Use a circular SVG progress ring with the score number in the center. Animate it counting up from 0 when the page loads (framer-motion). This is your demo wow moment for this feature.

Dimension cards: Grid of 6. Each card has a coloured background based on sub-score (green/amber/red), the dimension name, sub-score, and one-line explanation. On click, expand to show the specific action needed.

Recalculate flow: Clicking "Update Inputs" opens a slide-over panel with the input form pre-filled with current values.

### Hackathon Creative Edge

**On stage:** Update one input live — e.g., change life cover from 0 to ₹1Cr — and watch the insurance score jump and the overall score move in real time. The visual feedback of a score changing is powerful.

*"This is the first time any Indian app has told you, in one number, whether your financial life is in order. Not your portfolio returns — your actual financial health. Most people have a great SIP and zero life insurance. We catch that."*

---

## 5B. FIRE Path Planner

### UX Research & Design

**The Problem:** "How much do I need to retire?" is the most Googled personal finance question in India. The answers people find are generic calculators — flat inputs, flat outputs, no personalisation, no Indian context (no NPS, no PPF, no ELSS).

**The FIRE Planner is not a calculator. It is a roadmap with months.**

**UX Principles:**
- The output is not a single number — it is a month-by-month visual timeline
- Show the "crossover point" — the month when passive income exceeds expenses — as a milestone on a chart
- The plan must react to changes: if the user increases their monthly SIP by ₹2,000, show the retirement date moving earlier in real time
- Use Indian product names: PPF, NPS Tier 1, ELSS, index funds — not "stocks and bonds"
- Include an "Early Retirement Scenario" toggle — show what happens if they stop working at 50 vs 60

**Screen Design:**
```
[Input panel — age, income, expenses, current savings, target retirement age]

[Timeline chart — horizontal, shows corpus growth year by year]
  → Green zone: FIRE achieved
  → Milestones: "₹25L at 35", "₹1Cr at 42", "FIRE at 51"

[Monthly SIP breakdown — how to split across ELSS, index fund, NPS, PPF]

[Toggle: Aggressive / Moderate / Conservative]

[What-if slider: "What if I invest ₹5,000 more per month?"]
  → Timeline updates instantly (client-side math, no API call)
```

### Database Schema

```sql
CREATE TABLE fire_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- Inputs
  current_age INTEGER,
  target_retirement_age INTEGER,
  monthly_income INTEGER,
  monthly_expenses INTEGER,
  current_investments INTEGER,
  risk_profile TEXT,              -- 'aggressive', 'moderate', 'conservative'

  -- Computed outputs
  monthly_sip_required INTEGER,
  target_corpus BIGINT,
  projected_fire_age INTEGER,     -- When they'll actually hit FIRE
  corpus_at_retirement BIGINT,
  allocation_plan JSONB,          -- {elss: 30, nifty50: 40, nps: 20, ppf: 10}
  yearly_milestones JSONB,        -- [{year: 2026, corpus: 500000}, ...]
  ai_narrative TEXT,              -- GPT-4o-mini written personalised plan summary

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes

**POST `/api/fire-planner/calculate`**

Logic flow:
1. Accept inputs — age, income, expenses, savings, retirement age, risk profile
2. Run compound interest math to compute `target_corpus` (expenses × 12 × 25 for 4% SWR rule)
3. Compute `monthly_sip_required` using future value formula: FV = P × [((1+r)^n - 1)/r]
4. Generate `yearly_milestones` array by simulating corpus year by year
5. Build `allocation_plan` based on risk profile:
   - Aggressive: 50% Nifty 50 index, 30% ELSS, 15% NPS, 5% PPF
   - Moderate: 35% Nifty 50, 25% ELSS, 25% NPS, 15% PPF
   - Conservative: 20% balanced fund, 20% NPS, 40% PPF, 20% liquid fund
6. Call GPT-4o-mini with all computed numbers to generate a 100-word personalised narrative ("Rahul, at your current savings rate you'll hit ₹2.1Cr by 50 — enough for FIRE if you cut expenses by 15%...")
7. Save to `fire_plans` and return full plan

**GET `/api/fire-planner/latest`** — returns most recent plan

**POST `/api/fire-planner/what-if`** — lightweight endpoint that only runs the math (no LLM) for real-time slider updates. Returns just `monthly_sip_required`, `projected_fire_age`, `corpus_at_retirement`.

### Frontend Approach

Page: `app/advisory/fire-planner/page.tsx`

The chart is the hero. Use Recharts `AreaChart` showing corpus growth year by year. Mark the FIRE crossover point with a vertical line and emoji marker. Animate the chart line drawing from left to right when it first loads.

Below the chart: three metric cards — "SIP Needed / Month", "FIRE Age", "Target Corpus".

Sliders on the right panel (or below on mobile): monthly SIP amount, retirement age. Every slider change calls `/api/fire-planner/what-if` (debounced 300ms) and updates the chart in real time without a full page reload.

Allocation breakdown: A donut chart (Recharts PieChart) showing how the monthly SIP splits across product types.

### Hackathon Creative Edge

Move the "Monthly SIP" slider from ₹5,000 to ₹15,000 on stage and watch the FIRE age move from 62 to 53 in real time. Say: *"That's 9 years of freedom for ₹10,000 more per month. No other app shows you that trade-off visually."*

---

## 5C. Life Event Financial Advisor

### UX Research & Design

**The Problem:** When an Indian gets a salary hike, marries, has a child, or buys a home — they have no idea what financial actions to take first. They Google generic advice. No app has ever detected a life event and given them a one-page action plan specific to their situation.

**6 Life Events to Support:**

| Event | Key Financial Actions |
|---|---|
| Salary Hike | Increase SIP, check 80C headroom, review HRA claim |
| Job Loss | Activate emergency fund, pause or reduce SIPs, COBRA/health gap |
| Marriage | Joint NPS, HRA optimisation, combined insurance review |
| New Baby | Education SIP, increase health cover, write a will |
| Home Purchase | 80C deduction on principal, 24(b) on interest, check LTV ratio |
| Inheritance | Tax implications (no inheritance tax but capital gains applies), deploy into equity slowly |

**UX Flow:**
```
[Event Selection Screen — 6 illustrated event cards]
  → User selects "New Baby"

[Context form — 3 quick questions]
  → "Roughly when? (Month and year)"
  → "Current health cover amount?"
  → "Do you have a will?"

[Action Plan Screen]
  → Header: "Your New Baby Action Plan"
  → Section 1: "Do This Week" (2–3 immediate actions)
  → Section 2: "Do This Month" (portfolio + insurance changes)
  → Section 3: "Do This Year" (SIP for education goal)
  → Each action has an estimated effort + impact rating
```

### Database Schema

```sql
CREATE TABLE life_event_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'salary_hike', 'job_loss', 'marriage', 'new_baby',
    'home_purchase', 'inheritance', 'divorce', 'parent_health'
  )),
  event_context JSONB,           -- User's answers to the 3 context questions
  action_plan JSONB,             -- {this_week: [...], this_month: [...], this_year: [...]}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes

**POST `/api/life-events/generate-plan`**

Logic flow:
1. Accept `event_type` and `event_context` from the form
2. Fetch user's profile + portfolio from Supabase
3. Call GPT-4o with a detailed system prompt that includes:
   - The user's persona, income, portfolio, existing insurance
   - The event type and their context answers
   - Instruction to return structured JSON with `this_week`, `this_month`, `this_year` arrays
   - Each action must include: title, description, specific_amount (in INR), tax_implication, effort (low/medium/high)
4. Parse and validate the JSON response
5. Save to `life_event_plans`
6. Return the plan

Use `response_format: { type: 'json_object' }` to guarantee structured output. This is safe because the schema is simple.

**GET `/api/life-events/history`** — list all past life event plans for the user

### Frontend Approach

Page: `app/advisory/life-events/page.tsx`

Event selection: 6 large illustrated cards in a 2×3 grid. Each has a soft gradient background and an emoji. On hover, slight scale-up. This is a deliberate visual contrast to the dense financial data elsewhere — it should feel approachable.

Context form: Modal or bottom drawer with 3 questions maximum. Keep it short — users drop off on long forms.

Action plan output: Three sections with timeline icons (This Week → This Month → This Year). Each action card has a checkbox — users can mark actions as done (saved in Supabase). The plan should feel like a to-do list, not an essay.

**Add a share button** — let users share the action plan as an image card. This is a hackathon virality feature.

---

## 5D. Couple's Money Planner

### UX Research & Design

**The Problem:** When both partners work, Indian households leave significant money on the table — duplicate insurance, wrong HRA claimant, suboptimal SIP allocation for LTCG. No app in India has ever optimised across two incomes.

**Key Optimisations to Surface:**

| Area | What To Optimise |
|---|---|
| HRA | Which partner should claim HRA? The one in higher tax bracket |
| NPS | Both can claim extra ₹50,000 deduction under 80CCD(1B) |
| Home loan | Split principal (80C) and interest (24b) deduction for max benefit |
| SIP allocation | Route more equity through lower-income partner (LTCG at lower bracket) |
| Insurance | Joint health policy vs individual? (depends on sum insured and age) |
| Net worth | Combined view — one partner's FD offsets the other's loan |

**UX Flow:**
- Both partners enter their financial data on the same screen (two columns)
- AI analyses and generates "Optimisation Opportunities" — ranked by annual tax saving
- Each opportunity has a specific action: "Move HRA claim to Partner 2 — saves ₹18,400/year"

### Database Schema

```sql
CREATE TABLE couples_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,         -- Primary user's Clerk ID

  partner1_data JSONB,                 -- {income, tax_bracket, hra_claimed, tax_investments}
  partner2_data JSONB,
  combined_net_worth BIGINT,

  optimisations JSONB,                 -- Array of {area, action, annual_saving, effort}
  total_annual_saving INTEGER,
  ai_summary TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes

**POST `/api/couples/analyse`**

Logic flow:
1. Accept both partners' financial data
2. Compute current combined tax liability (old regime for both)
3. Run optimisation logic:
   - Identify which partner benefits more from HRA claim (higher bracket wins)
   - Check if both have used NPS 80CCD(1B) — if not, flag the missed deduction
   - If home loan exists, check if deduction is split or all on one person
   - Compare SIP allocation vs tax brackets — equity gains are better in lower bracket
4. Call GPT-4o-mini to generate specific actionable language for each optimisation
5. Save and return

No complex agentic loop needed here — the logic is deterministic math followed by one LLM call to format the output.

---

---

# FEATURE 6 — Tax & Compliance Tools

### Sub-features
- 6A: Tax Wizard (Form 16 upload + regime comparison)
- 6B: Capital Gains Tracker (CAMS statement parser)

---

## 6A. Tax Wizard

### UX Research & Design

**The Problem:** Every March, 14 crore Indian taxpayers scramble to compare old vs new tax regime. Most make the choice blindly. The ones who try to calculate are stopped by the complexity of HRA exemption, LTA, standard deduction stacking, and 80C sub-limits. CAs charge ₹2,000–5,000 for this analysis. We do it in 30 seconds.

**Research insight:** Form 16 is the document every salaried Indian has. If we can parse it in under 10 seconds, we instantly demonstrate value. The upload → analysis flow is your hero demo moment for this feature.

**UX Flow:**
```
Step 1: Upload Form 16 PDF
  → Show upload progress
  → "Extracting your tax data..." (animated)

Step 2: Verification screen
  → Show extracted numbers side by side with original
  → Allow user to correct any misread field
  → "Confirm and Analyse" button

Step 3: Results screen (your showstopper)
  → Side-by-side cards: Old Regime vs New Regime
  → Each shows: Taxable income, Tax payable, Take-home
  → Winner highlighted with green border + "RECOMMENDED"
  → "You save ₹23,400 by choosing Old Regime"

Step 4: Missing deductions panel
  → "We found 3 deductions you haven't claimed"
  → 80D health insurance premium (if not filed)
  → NPS 80CCD(1B) (if not claimed)
  → HRA (if renting but not claimed)

Step 5: Deadline alerts
  → "Advance tax Q3 due in 14 days"
  → "80C window closes March 31 — you have ₹47,000 headroom"
```

**Creative angle:** The side-by-side comparison with a clear winner is psychologically satisfying. Users will screenshot this and share it. Build for shareability.

### Database Schema

```sql
CREATE TABLE tax_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  financial_year TEXT NOT NULL,         -- '2024-25'

  -- Extracted from Form 16 (raw)
  gross_salary INTEGER,
  basic_salary INTEGER,
  hra_received INTEGER,
  lta_received INTEGER,
  special_allowance INTEGER,
  standard_deduction INTEGER DEFAULT 50000,
  professional_tax INTEGER,
  tds_deducted INTEGER,

  -- Deductions claimed
  deduction_80c INTEGER DEFAULT 0,
  deduction_80d INTEGER DEFAULT 0,
  deduction_80ccd_nps INTEGER DEFAULT 0,
  hra_exempt INTEGER DEFAULT 0,         -- Computed based on rent + city
  home_loan_interest INTEGER DEFAULT 0, -- Section 24(b)

  -- Computed outputs
  old_regime_taxable INTEGER,
  old_regime_tax INTEGER,
  new_regime_taxable INTEGER,
  new_regime_tax INTEGER,
  recommended_regime TEXT,
  annual_saving INTEGER,

  -- AI analysis
  missing_deductions JSONB,             -- [{deduction, estimated_saving, how_to_claim}]
  action_summary TEXT,

  form16_raw_text TEXT,                 -- Stored for audit/re-analysis
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes

**POST `/api/tax/parse-form16`**

Logic flow:
1. Accept PDF upload (use `FormData` + Next.js route handler)
2. Convert PDF to text using `pdf-parse` npm package — no external API needed
3. Call GPT-4o with the raw text and a structured extraction prompt asking for all salary components as JSON. Use `response_format: json_object`.
4. Return the extracted values to the frontend for user verification

The extraction prompt should explicitly ask for: gross_salary, basic, HRA, LTA, all allowances, TDS, 80C investments declared, professional tax. Include few-shot examples of what Form 16 text looks like.

**POST `/api/tax/calculate`**

Logic flow:
1. Accept the verified tax data (from user-confirmed Step 2 screen)
2. Compute old regime tax:
   - Net taxable = gross - standard_deduction - 80c (max 150k) - 80d (max 25k) - hra_exempt - 80ccd_nps (max 50k) - home_loan_interest (max 200k)
   - Apply old slab: 0% up to 3L, 5% 3–6L, 20% 6–9L, 30% above 9L (FY25 slabs)
   - Add 4% cess
3. Compute new regime tax:
   - Net taxable = gross - 50k standard deduction only
   - Apply new slab: 0% up to 3L, 5% 3–7L, 10% 7–10L, 15% 10–12L, 20% 12–15L, 30% above 15L
   - Add 4% cess
4. Find missing deductions by comparing what was claimed vs what's legally possible
5. Call GPT-4o-mini to write action items for each missing deduction in plain Hindi-English mix
6. Save to `tax_assessments` and return full comparison

**GET `/api/tax/deadlines`**

Returns upcoming tax deadlines relevant to the user based on their income level. These are static dates with dynamic remaining-day calculations — no LLM needed.

### Frontend Approach

Page: `app/tax/wizard/page.tsx`

Multi-step wizard with 5 clearly numbered steps at the top. Each step is a full page — no scrolling.

The results screen (Step 3) is your primary visual. Two cards side by side: Old Regime and New Regime. The winning card has a green outline and a "SAVE ₹XX,XXX/YEAR" badge. Use `framer-motion` to animate the cards sliding in from left and right.

Missing deductions section: Accordion list. Each deduction collapsed by default — clicking expands to show "How to claim this" with specific instructions.

PDF upload: Use the browser's native file input styled as a drop zone. Show a progress indicator while parsing.

---

## 6B. Capital Gains Tracker

### UX Research & Design

**The Problem:** Every Indian mutual fund investor has a CAMS or KFintech statement but has no idea how to compute their capital gains for ITR. CAs charge for this. The ones who try to DIY make errors and miss tax harvesting opportunities worth thousands.

**Tax Harvesting opportunity (your creative angle):** LTCG up to ₹1,25,000 per year is exempt from tax (as of FY25 budget). Most investors unknowingly have unrealised LTCG building up that could be booked tax-free. We identify this automatically and alert them before March 31.

**UX Flow:**
```
Step 1: Upload CAMS / KFintech consolidated statement PDF
  → "Parsing your mutual fund transactions..."

Step 2: Transaction review
  → List of all buy/sell transactions identified
  → Option to add any missing transactions manually

Step 3: Capital Gains Report
  → STCG total (taxed at 20%)
  → LTCG total (taxed at 12.5% after ₹1.25L exemption)
  → Estimated tax liability

Step 4: Tax Harvesting Alerts
  → "You have ₹87,000 of unrealised LTCG in XYZ Fund. Book it before March 31 — it's exempt."
  → "Re-buy immediately after (next day) — no 30-day wash sale rule in India for MFs"

Step 5: Download ITR-ready statement
  → Pre-formatted as per Schedule CG in ITR-2
```

### Database Schema

```sql
CREATE TABLE mf_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  scheme_name TEXT,
  scheme_code TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL', 'DIVIDEND', 'SWITCH_IN', 'SWITCH_OUT')),
  transaction_date DATE,
  units FLOAT,
  nav FLOAT,
  amount FLOAT,
  folio_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE capital_gains_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  financial_year TEXT,           -- '2024-25'
  stcg_total FLOAT,
  ltcg_total FLOAT,
  ltcg_exempt FLOAT DEFAULT 125000,
  ltcg_taxable FLOAT,
  stcg_tax_estimate FLOAT,
  ltcg_tax_estimate FLOAT,
  harvesting_opportunities JSONB, -- [{scheme, unrealised_ltcg, units_to_sell, action}]
  itr_statement_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON mf_transactions(clerk_user_id, transaction_date);
```

### API Routes

**POST `/api/capital-gains/parse-statement`**

Logic flow:
1. Accept CAMS/KFintech PDF upload
2. Use `pdf-parse` to extract text
3. Call GPT-4o with the text and a prompt to extract all transactions as a JSON array: [{scheme_name, date, type, units, nav, amount}]
4. Deduplicate and validate the extracted transactions
5. Bulk-insert into `mf_transactions`
6. Return the transaction list for user review

Tip: CAMS statements have a consistent format. Include a few examples of CAMS transaction line format in the system prompt. GPT-4o handles this reliably.

**POST `/api/capital-gains/compute`**

Logic flow:
1. Fetch all transactions for the user for the selected financial year
2. For each SELL transaction, find matching BUY using FIFO (first in, first out):
   - Sort BUY transactions for the same scheme by date ascending
   - Match units sold against oldest BUY units first
3. Compute holding period (days between BUY date and SELL date)
4. Classify: less than 365 days = STCG, 365 or more = LTCG
5. Compute gain = (sell NAV - buy NAV) × units
6. Aggregate STCG and LTCG totals
7. Apply ₹1,25,000 LTCG exemption
8. Scan for tax harvesting: look at current unrealised holdings where LTCG < ₹1.25L and holding > 365 days
9. Generate ITR-ready text statement
10. Save report and return

**GET `/api/capital-gains/report`** — returns the latest report for dashboard display

---

---

# FEATURE 7 — Portfolio Management

### Sub-features
- 7A: Mutual Fund Portfolio X-Ray
- 7B: Unified Portfolio Dashboard
- 7C: SIP Intelligence

---

## 7A. Mutual Fund Portfolio X-Ray

### UX Research & Design

**The Problem:** Most Indians have 8–12 SIPs running across 4–5 apps and AMCs. They have no single view. They do not know their actual XIRR (which is very different from the shown "returns"). They don't know that 3 of their 8 funds invest in the same 50 stocks — they are paying 3 expense ratios for one position.

**The X-Ray is your most technically impressive feature.** Upload one PDF → get a full portfolio analysis in 10 seconds. This is your CAMS demo on stage.

**What the X-Ray outputs:**

| Output | What It Means |
|---|---|
| True XIRR | The actual IRR across all SIP instalments — different from simple return % |
| Scheme Overlap | Which funds share the same top holdings — indicates redundancy |
| Expense Ratio Drag | How much extra you pay vs direct plans (₹ per year lost to expense ratio) |
| Category Benchmarking | How each fund performed vs its category average over 1Y / 3Y |
| AI Rebalancing Plan | Which schemes to switch, which to continue, which to stop |

**UX Flow:**
```
Step 1: Upload CAMS Consolidated Account Statement PDF
  → 10-second progress animation
  → "We're reading 47 transactions across 8 funds..."

Step 2: Portfolio Summary screen
  → Total invested, current value, XIRR
  → Pie chart by AMC and by category

Step 3: X-Ray Results
  → Scheme overlap matrix — heatmap of top-10 stock overlap between all fund pairs
  → Expense ratio comparison — bar chart vs direct plan equivalent
  → Category performance — are your funds beating their benchmark?

Step 4: AI Rebalancing Suggestion
  → "HDFC Flexicap and Parag Parikh Flexicap have 68% overlap — consider exiting one"
  → "Your mid-cap allocation is 45% — overweight vs your risk profile (target: 25%)"
  → Specific switch recommendation: "Switch HDFC Flexicap → Nippon India Index Fund"
```

### Database Schema

```sql
-- Reuse mf_transactions from Feature 6B

CREATE TABLE mf_current_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  scheme_name TEXT,
  scheme_code TEXT,               -- For MFAPI.in lookup
  amfi_code TEXT,
  category TEXT,                  -- Large Cap, Mid Cap, Flexi Cap, etc.
  current_units FLOAT,
  avg_nav FLOAT,                  -- Cost NAV
  current_nav FLOAT,              -- Fetched from MFAPI.in
  invested_amount FLOAT,
  current_value FLOAT,
  absolute_return_pct FLOAT,
  expense_ratio FLOAT,            -- Fetched from AMFI free data
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, scheme_code)
);

CREATE TABLE portfolio_xray_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  total_invested FLOAT,
  current_value FLOAT,
  xirr FLOAT,
  overlap_matrix JSONB,           -- {scheme1_scheme2: overlap_pct, ...}
  expense_drag_annual FLOAT,      -- ₹ lost to expense ratio vs direct
  ai_rebalancing_plan TEXT,
  switch_recommendations JSONB,   -- [{from_scheme, to_scheme, reason, urgency}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes

**POST `/api/portfolio/xray/parse`**

Logic:
1. Accept CAMS PDF
2. Use `pdf-parse` to extract text
3. Call GPT-4o to extract all transactions and current holdings into structured JSON (same approach as capital gains)
4. For each holding, call MFAPI.in (`https://api.mfapi.in/mf/{schemeCode}`) to get current NAV
5. Compute current values and basic returns
6. Save to `mf_transactions` and `mf_current_holdings`
7. Return summary for the review screen

MFAPI.in is completely free, no API key, returns full NAV history. Use the scheme code to look up NAV.

**POST `/api/portfolio/xray/analyse`**

Logic:
1. Compute XIRR using Newton's method on all transactions (buy = negative cashflow, current value = positive cashflow at today's date)
2. For scheme overlap: fetch each scheme's top 10 holdings from AMFI's monthly portfolio disclosure (free download from amfiindia.com). Compare overlapping stock names across all pairs.
3. Compute expense drag: (expense_ratio_regular - expense_ratio_direct) × current_value for each scheme
4. Compare performance vs category: use MFAPI.in NAV history to compute 1Y and 3Y CAGR, compare against category average (you store category benchmarks as a static lookup table)
5. Call GPT-4o with the full analysis to generate natural-language rebalancing recommendations
6. Save `portfolio_xray_reports` and return

**GET `/api/portfolio/xray/latest`** — latest report for dashboard widget

### Frontend Approach

Page: `app/portfolio/xray/page.tsx`

The overlap matrix is your most visually impressive element. Render it as a heatmap grid — rows and columns are fund names, cells show overlap percentage (red = high overlap, green = low). You can build this with plain CSS grid + background-color interpolation — no charting library needed.

Expense drag: Simple bar chart per scheme showing what they're paying vs what the direct plan equivalent would cost.

The rebalancing plan renders as action cards — each card has a "FROM" fund, "TO" fund, reason, and urgency level (critical / medium / fine to hold).

---

## 7B. Unified Portfolio Dashboard

### UX Research & Design

**The Problem:** An Indian's wealth is split across: equity (Zerodha), MF (Groww), FD (HDFC Bank), PPF (SBI), gold (somewhere), real estate (physical). No single view exists. No one knows their true net worth.

**This feature aggregates everything into one number: Your Net Worth.**

**Asset classes to include and how to get current values:**

| Asset Class | Value Source | Update Frequency |
|---|---|---|
| Equity stocks | Yahoo Finance / NSE API (via your existing client) | Real-time |
| Mutual funds | MFAPI.in NAV × units | Daily |
| Fixed deposits | User-entered maturity value + date | Computed daily |
| PPF | User-entered balance + annual interest (currently 7.1%) | Computed daily |
| Gold | MCX gold price via `GC=F` ticker in Yahoo Finance | Real-time |
| Real estate | User-entered estimated current value | Manual update |

**UX Design:**
- One number at the top: "Your Net Worth: ₹47,83,200" — animated counter
- Donut chart showing allocation by asset class
- Month-over-month change: "+₹1,23,000 (2.6%) this month"
- Risk assessment: "Your portfolio is 72% in equities — above your target of 60%"
- Rebalancing alert: "Consider moving ₹4,20,000 from equity to debt to hit your target allocation"

### Database Schema

```sql
CREATE TABLE portfolio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('equity','mutual_fund','fd','ppf','gold','real_estate','crypto','other')),
  asset_name TEXT,
  quantity FLOAT,                -- Units for stocks/MF, grams for gold, 1 for property
  purchase_price FLOAT,
  purchase_date DATE,
  current_value FLOAT,           -- Updated by background job
  metadata JSONB,                -- {maturity_date, interest_rate} for FD, {symbol} for equity, etc.
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  total_net_worth FLOAT,
  equity_value FLOAT,
  debt_value FLOAT,
  gold_value FLOAT,
  real_estate_value FLOAT,
  other_value FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON portfolio_assets(clerk_user_id, asset_type);
CREATE INDEX ON net_worth_history(clerk_user_id, recorded_at DESC);
```

### API Routes

**POST `/api/portfolio/assets`** — add a new asset (manual entry form)

**GET `/api/portfolio/dashboard`**

Logic:
1. Fetch all assets for the user
2. For each equity holding, fetch live price from Yahoo Finance (use your existing `getStockQuote`)
3. For each MF holding, fetch latest NAV from MFAPI.in
4. For gold, fetch MCX price (Yahoo Finance ticker `GC=F`, convert troy oz to grams)
5. For FD, compute current value as `principal × (1 + rate/100)^(days/365)`
6. Sum all to get net worth
7. Compute allocation percentages
8. Compare to user's target allocation from profile
9. Return everything — the frontend handles display

**POST `/api/cron/update-portfolio-values`** (Vercel Cron, daily at 6pm)

Logic: Batch-update current values for all equity and MF holdings for all active users. Store daily snapshot in `net_worth_history` to power the month-over-month trend.

---

## 7C. SIP Intelligence

### UX Research & Design

**The Problem:** People start SIPs and forget them. They don't know if their SIP is building toward their goal or quietly underperforming. They don't know when to stop a fund, when to step up, or whether their projection still makes sense given market changes.

**SIP Intelligence turns passive SIPs into active, goal-linked investments.**

**What It Shows:**

| Insight | How Computed |
|---|---|
| Projected corpus at goal date | Compound interest on remaining SIP duration |
| Is goal achievable? | Projected corpus vs target corpus |
| Fund performance vs category | 1Y / 3Y rolling return vs category average |
| Switch alert | Fund underperforms category by >2% for 3Y = switch recommended |
| Step-up recommendation | "Increase SIP by 10%/year → retire 4 years earlier" |

**UX Design:**
- Cards per SIP: Each SIP has its own card showing the fund name, monthly amount, goal linked, current return, and a "Health" badge (Healthy / Watch / Switch)
- Projection chart per SIP: Small sparkline showing projected corpus vs goal target over time
- Alert banner: If any SIP needs attention, a red banner appears at top: "2 SIPs need your attention"

### Database Schema

```sql
CREATE TABLE user_sips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  scheme_name TEXT,
  scheme_code TEXT,
  monthly_amount INTEGER,
  start_date DATE,
  target_corpus BIGINT,
  target_date DATE,
  goal_name TEXT,                -- 'Retirement', 'Child Education', 'Home Down Payment'
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'watch', 'switch')),
  switch_reason TEXT,
  projected_corpus BIGINT,
  goal_achievable BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Routes

**GET `/api/sips`** — returns all SIPs with computed projections and health status

Logic per SIP:
1. Fetch scheme NAV history from MFAPI.in for the past 3 years
2. Compute 1Y and 3Y CAGR for the scheme
3. Get category average returns from a static lookup table (populated from AMFI data)
4. Flag as "switch" if scheme underperforms category by more than 2% over 3 years
5. Compute projected corpus using SIP future value formula
6. Check if projected corpus >= target corpus
7. Compute step-up scenario: what if monthly amount increases by 10% each year?

**POST `/api/sips`** — add a new SIP

**PATCH `/api/sips/:id`** — update SIP status or amount

---

---

# FEATURE 8 — Financial Services Marketplace

### Sub-features
- 8A: ET Services Concierge (conversational product discovery)
- 8B: Smart Product Matching (proactive recommendations)

---

## 8A. ET Services Concierge

### UX Research & Design

**The Problem:** Indians are underinsured, under-invested, and over-leveraged — often all at once. When they need a product (term insurance, health cover, personal loan), they go to Google, get overwhelmed by 50 options, and either make a poor decision or do nothing. A conversational concierge that already knows your financial profile can narrow 50 options to 3 in 30 seconds.

**What the Concierge Does:**
- Acts like a friendly financial advisor — asks 2–3 clarifying questions then recommends
- Pulls data from free public sources (scraped policy pages, known rate tables) rather than paid APIs
- Never hard-sells — explains why a product fits this specific user
- Connects to a partner application form (deep link, not hosted in-app)

**Product Categories to Support:**

| Category | Data Source | Key Parameters |
|---|---|---|
| Term Insurance | Policybazaar public rates | Age, sum assured, tenure |
| Health Insurance | Niva Bupa / Star Health public pages | Family size, sum insured |
| Personal Loan | BankBazaar public rates | Amount, tenure, credit score estimate |
| Home Loan | Deal4Loans public rates | Loan amount, property type |
| Credit Cards | Bank websites + BankBazaar | Income, spending pattern |
| NPS | PFRDA public portal | Age, risk profile, tax benefit goal |

**UX Flow:**
```
[Concierge home — 6 category icons]

User clicks "Term Insurance"

[AI asks] "Quick question — are you the sole earner in your household?"
[User] "Yes, wife doesn't work"
[AI asks] "And your approximate annual income?"
[User] "₹14 lakhs"

[Concierge responds with 3 specific recommendations]
  → HDFC Life Click 2 Protect — ₹1Cr cover, ₹11,400/year (why: good claim settlement ratio)
  → LIC Tech Term — ₹1Cr cover, ₹13,200/year (why: most trusted brand in India)
  → Max Life Smart Secure — ₹1Cr cover, ₹9,800/year (why: lowest premium, good CSR)

[Each card has: Apply Now button (deep link) + "Ask AI more" button]
```

### Database Schema

```sql
CREATE TABLE product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  category TEXT,
  conversation_context JSONB,     -- The Q&A that led to recommendations
  recommendations JSONB,          -- [{product_name, provider, premium, why_fit, apply_url}]
  was_useful BOOLEAN,             -- User feedback (thumbs up/down)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  product_name TEXT,
  provider TEXT,
  key_features JSONB,
  eligibility_rules JSONB,        -- {min_age, max_age, min_income, etc.}
  approximate_cost TEXT,
  apply_url TEXT,
  last_updated DATE
);
```

### API Routes

**POST `/api/marketplace/chat`**

This is a streaming chat route similar to Feature 3, but simpler:

Logic:
1. System prompt tells GPT-4o it is a financial product advisor who knows the user's profile
2. Include user's Money Health Score dimensions so AI knows their gaps
3. The conversation is short (2–3 turns max)
4. After 2 turns, trigger a product recommendation call:
   - Query `product_catalogue` from Supabase for the relevant category
   - Pass matching products to GPT-4o and ask it to rank + explain them for this specific user
5. Stream the full response
6. Save conversation and recommendations

**GET `/api/marketplace/catalogue/:category`** — returns available products in a category

### Frontend Approach

Page: `app/marketplace/page.tsx`

Category selection: 6 large cards. Each category card shows the user's current status ("You have no term insurance" in red, or "₹50L health cover — may need upgrade" in amber). This proactive framing drives clicks.

Chat interface per category: Same streaming chat component as Feature 3 — reuse the component, change the API endpoint.

Recommendation cards: Three cards side by side (or stacked on mobile). Each shows product name, monthly/annual cost, and a 1-sentence "why this fits you" explanation. The "why" is AI-personalised — it references their actual income, family size, and risk profile.

---

## 8B. Smart Product Matching

### UX Research & Design

**This feature is proactive — it surfaces recommendations without the user asking.**

**Trigger conditions:**

| Trigger | Recommendation |
|---|---|
| Money Health Score: Insurance < 4/10 | "You have zero term cover. At your income, ₹1Cr cover costs ₹10,000/year." |
| Cash sitting in savings > 6 months expenses | "₹3.2L sitting idle — move ₹2L to a liquid mutual fund for 6-7% returns" |
| 80C limit not fully used | "You have ₹47,000 left in 80C — invest before March 31 to save ₹14,100 in tax" |
| SIP with 'switch' health status | "Your HDFC Flexicap is underperforming — we recommend switching to Nifty 50 index" |

**UX:** These appear as cards on the main dashboard — not as notifications, not as a popup. They live in a "Recommended for You" section that users can dismiss. Each card has a direct action button (Apply / Invest / Switch).

### API Routes

**GET `/api/marketplace/smart-matches`**

Logic:
1. Fetch user's Money Health Score from latest assessment
2. Fetch idle cash (liquid_savings from health assessment)
3. Check tax season (October to March = 80C urgency period)
4. Fetch SIP health statuses
5. Run matching rules to generate up to 3 proactive recommendations
6. Each recommendation is built from the product catalogue + user context
7. Call GPT-4o-mini once to write the personalised pitch for each match ("You specifically because...")
8. Return the matches — cache for 24 hours

---

---

# FEATURE 9 — Alerts & Notifications Engine

### Sub-features
- 9A: Intelligent Alert System (custom + auto-generated alerts)
- 9B: Daily Morning Brief
- 9C: Weekly Portfolio Report

---

## 9A. Intelligent Alert System

### UX Research & Design

**The Problem:** Zerodha and Groww only alert on price targets. But the most important events in a stock's life have nothing to do with price — a promoter pledging shares, a credit rating downgrade, an earnings miss on a key metric. You can set a price alert at ₹500 and be completely blindsided by a promoter pledge happening at ₹480.

**Alert Types:**

| Type | Trigger | Source |
|---|---|---|
| Price target | Price crosses user-set level | Yahoo Finance |
| Earnings beat/miss | Quarterly result announcement | NSE filings |
| Promoter pledge increase | SAST/LODR filings | NSE filings |
| Credit rating change | Rating agency announcement | NSE filings |
| Dividend announcement | Board meeting outcome | NSE filings |
| Insider trade | SAST filing | NSE filings / your signal table |
| Bulk/block deal | NSE bulk deal data | Your signal table |
| 52-week high/low | Price level | Yahoo Finance |
| Portfolio risk | Concentration > 25% in one stock | Portfolio computation |

**Auto-generated alerts (no user configuration needed):**
- Any signal in Feature 2 (Opportunity Radar) with `final_score > 7` → auto-alert
- Any SIP with `health_status = 'switch'` → auto-alert
- Tax deadline within 14 days → auto-alert
- Portfolio allocation drifts more than 10% from target → auto-alert

**Notification Channels:**
- In-app notification bell (required for hackathon demo — instant visual)
- Email via Supabase built-in email (free tier)
- WhatsApp deep link (pre-fill a WhatsApp message to yourself — hacky but it works for demo)

**UX Design:**
- Notification bell in top navbar with unread count badge
- Notification drawer that slides in from right
- Each notification is a card: symbol + alert type + 1-line description + timestamp
- "Mark all read" button
- Tap any notification → goes to the relevant detail page

### Database Schema

```sql
CREATE TABLE user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  symbol TEXT,
  alert_type TEXT CHECK (alert_type IN (
    'price_target', 'earnings', 'promoter_pledge', 'credit_rating',
    'dividend', 'insider_trade', 'bulk_deal', '52w_high', '52w_low',
    'portfolio_risk', 'sip_health', 'tax_deadline', 'auto_signal'
  )),
  condition JSONB,               -- {target_price: 500, direction: 'above'} for price alerts
  is_active BOOLEAN DEFAULT true,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  alert_id UUID REFERENCES user_alerts(id),
  title TEXT,
  body TEXT,
  action_url TEXT,              -- Where to navigate on click
  is_read BOOLEAN DEFAULT false,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON notifications(clerk_user_id, is_read, created_at DESC);
CREATE INDEX ON user_alerts(clerk_user_id, is_active);
```

### API Routes

**GET `/api/alerts`** — list all user-configured alerts

**POST `/api/alerts`** — create a new alert (price target or fundamental trigger)

**GET `/api/notifications`** — returns unread notifications for the user, paginated

**POST `/api/notifications/:id/read`** — mark as read

**GET `/api/notifications/unread-count`** — for the navbar badge (lightweight, cached 30s)

**POST `/api/cron/check-alerts`** (Vercel Cron, every 15 minutes)

Logic:
1. Fetch all active alerts from `user_alerts`
2. Group by symbol
3. For each symbol in any active alert, fetch current price from Yahoo Finance
4. Check price target alerts: if current price crossed target, trigger notification
5. For fundamental alerts: check your `market_signals` table for matching signal types in last 15 minutes
6. For portfolio risk alerts: compute current allocation, flag if any holding > 25% of portfolio
7. For each triggered alert: insert into `notifications` and send email via Supabase

Supabase has built-in email sending in the free tier. Use it for critical notifications.

**Real-time notifications via Supabase Realtime:**

On the frontend, subscribe to the `notifications` table for the current user using `supabase.channel()`. When a new row is inserted (by the cron), the frontend receives it instantly via websocket without polling. This makes your alert demo dramatically more impressive — the notification pops up live while the jury watches.

```typescript
// In your notification component (client-side)
// Subscribe to new notifications in real time
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `clerk_user_id=eq.${userId}`
  }, (payload) => {
    // New notification received — update UI immediately
    addNotification(payload.new)
    incrementBadgeCount()
  })
  .subscribe()
```

This is your hackathon demo moment for this feature: trigger an NSE signal manually while presenting, and show the notification pop up live in the corner of the screen. The jury will be impressed.

### Frontend Approach

Notification bell: Fixed in the top-right of your global header. Shows an unread count badge. Clicking opens a slide-over drawer.

Drawer content: List of notification cards. Each has urgency colour coding (red left border for critical, amber for medium). Clicking a notification card navigates to the relevant page.

Alert configuration page `app/alerts/page.tsx`: A list of the user's active alerts with the option to add new ones. "Add Alert" opens a modal with a stock search input + condition builder (price target / fundamental type).

---

## 9B. Daily Morning Brief

### UX Research & Design

**The Problem:** Every Indian investor wakes up and checks Zerodha, then ET Markets, then Moneycontrol — spending 20 minutes across three apps to understand one thing: "what happened overnight and what matters for my portfolio today?" The Morning Brief collapses this into one 90-second read, personalised and ready by 7:30am.

**What the Brief Contains:**
1. Global overnight: SGX Nifty / Dow Jones close / Dollar-Rupee
2. What to watch today: key events (RBI announcement, F&O expiry, budget session, result announcements)
3. Your portfolio movers: any held stock with major pre-market movement
4. One actionable insight: specific to their portfolio + market context
5. Sentiment line: "Markets expected to open weak — IT under pressure from US slowdown"

**UX Design:**
- Delivered as an in-app card on the dashboard, pinned to the top every morning
- Also available at `app/brief/page.tsx` as a full page
- Tone adapts to persona: Active Trader gets technical details, Beginner gets plain language
- Should feel like a WhatsApp message from a smart friend — not a news article

### Database Schema

```sql
CREATE TABLE morning_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  brief_date DATE NOT NULL,
  content TEXT,                    -- The full brief text
  global_data JSONB,               -- {sgx_nifty, dow_jones, dollar_rupee, crude_oil}
  portfolio_movers JSONB,          -- [{symbol, change_pct, direction}]
  key_events JSONB,                -- [{event, time, impact}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, brief_date)
);
```

### API Routes

**GET `/api/brief/today`**

Logic:
1. Check if today's brief already exists in `morning_briefs` — if yes, return it (cached)
2. If not (first request of the day), generate it:
   - Fetch global data: SGX Nifty (`^NSEI` pre-market), Dow Jones (`^DJI`), USD-INR (`USDINR=X`), Crude (`CL=F`) — all from Yahoo Finance
   - Fetch user's portfolio holdings and their overnight price change
   - Get today's key market events from NSE event calendar (scrape or static knowledge for common events)
3. Call GPT-4o-mini with all the above data and the user's persona/profile
4. System prompt asks for a 120-word brief in the user's preferred language, ending with one specific insight about their portfolio
5. Save and return

**POST `/api/cron/generate-morning-briefs`** (Vercel Cron at 7:00am IST = 1:30am UTC)

Pre-generate briefs for all active users before they wake up. Use `Promise.allSettled` to process users in parallel batches of 10.

---

## 9C. Weekly Portfolio Report

### UX Research & Design

**The Problem:** Retail investors either obsessively check their portfolio every hour, or completely ignore it for months. Neither is healthy. A weekly digest creates a sustainable rhythm — informed but not anxious.

**What the Weekly Report Contains:**
1. Week's performance: portfolio % change vs Nifty 50 benchmark
2. What moved it: top 3 contributors and top 3 detractors with explanation
3. News that impacted holdings: 3 stories from the week that affected held stocks
4. Upcoming events: result dates, AGMs, dividend ex-dates for held stocks next week
5. Goal progress: SIP targets vs actual for the week
6. One recommendation: nudge toward an action (top up SIP, review a SIP health, check tax deadline)

**UX Design:**
- Delivered every Sunday evening as an in-app card
- Structured like a real equity research report — but 1 page, not 40 pages
- Each section is collapsible on mobile
- "Share Report" generates a clean image card for WhatsApp — users naturally share this with family

### Database Schema

```sql
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  week_start DATE,
  week_end DATE,
  portfolio_return_pct FLOAT,
  benchmark_return_pct FLOAT,     -- Nifty 50 weekly return
  top_contributors JSONB,         -- [{symbol, contribution_pct, reason}]
  top_detractors JSONB,
  impacting_news JSONB,           -- 3 news articles from the week
  upcoming_events JSONB,          -- [{symbol, event_type, date}]
  goal_progress JSONB,
  weekly_recommendation TEXT,
  ai_narrative TEXT,              -- Opening paragraph summary
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, week_start)
);
```

### API Routes

**GET `/api/reports/weekly/latest`**

Returns the most recent weekly report. If this week's report doesn't exist yet, return the previous week's.

**POST `/api/cron/generate-weekly-reports`** (Vercel Cron every Sunday at 6pm IST)

Logic:
1. For each active user, compute their portfolio's week-on-week performance
2. Fetch Nifty 50 weekly return as benchmark (Yahoo Finance `^NSEI`)
3. Identify top contributors and detractors (stocks with biggest % impact on overall portfolio)
4. Pull 3 news articles from `user_news_feed` from the past 7 days that were marked high portfolio impact
5. Fetch upcoming corporate events for held stocks from NSE event calendar
6. Check SIP completion for the week
7. Call GPT-4o-mini with all data to write the opening narrative paragraph and the weekly recommendation
8. Save report

---

---

## Full Project Folder Structure — All Features

```
et-ai/
├── app/
│   ├── page.tsx                               # Landing
│   ├── onboarding/page.tsx                    # F1: Onboarding chat
│   ├── dashboard/
│   │   ├── page.tsx                           # Main dashboard hub
│   │   └── radar/page.tsx                    # F2: Opportunity Radar
│   ├── chat/page.tsx                          # F3: Market AI Chat
│   ├── news/page.tsx                          # F4: Newsroom
│   ├── advisory/
│   │   ├── health-score/page.tsx             # F5A: Money Health Score
│   │   ├── fire-planner/page.tsx             # F5B: FIRE Planner
│   │   ├── life-events/page.tsx              # F5C: Life Event Advisor
│   │   └── couples/page.tsx                  # F5D: Couples Planner
│   ├── tax/
│   │   ├── wizard/page.tsx                   # F6A: Tax Wizard
│   │   └── capital-gains/page.tsx            # F6B: Capital Gains Tracker
│   ├── portfolio/
│   │   ├── xray/page.tsx                     # F7A: MF X-Ray
│   │   ├── dashboard/page.tsx                # F7B: Unified Dashboard
│   │   └── sips/page.tsx                     # F7C: SIP Intelligence
│   ├── marketplace/
│   │   ├── page.tsx                          # F8: Marketplace home
│   │   └── [category]/page.tsx              # F8A: Category concierge chat
│   ├── alerts/page.tsx                        # F9A: Alert configuration
│   ├── brief/page.tsx                         # F9B: Morning Brief full page
│   └── api/
│       ├── money-health/
│       │   ├── calculate/route.ts            # F5A: POST compute score
│       │   └── latest/route.ts               # F5A: GET latest score
│       ├── fire-planner/
│       │   ├── calculate/route.ts            # F5B: POST full plan
│       │   ├── what-if/route.ts              # F5B: POST slider update (math only)
│       │   └── latest/route.ts               # F5B: GET latest plan
│       ├── life-events/
│       │   ├── generate-plan/route.ts        # F5C: POST generate plan
│       │   └── history/route.ts              # F5C: GET past plans
│       ├── couples/
│       │   └── analyse/route.ts              # F5D: POST couples analysis
│       ├── tax/
│       │   ├── parse-form16/route.ts         # F6A: POST PDF upload + parse
│       │   ├── calculate/route.ts            # F6A: POST regime comparison
│       │   └── deadlines/route.ts            # F6A: GET upcoming deadlines
│       ├── capital-gains/
│       │   ├── parse-statement/route.ts      # F6B: POST CAMS upload
│       │   ├── compute/route.ts              # F6B: POST compute gains
│       │   └── report/route.ts               # F6B: GET latest report
│       ├── portfolio/
│       │   ├── xray/
│       │   │   ├── parse/route.ts            # F7A: POST parse CAMS
│       │   │   ├── analyse/route.ts          # F7A: POST run full analysis
│       │   │   └── latest/route.ts           # F7A: GET latest report
│       │   ├── dashboard/route.ts            # F7B: GET unified dashboard data
│       │   ├── assets/route.ts               # F7B: POST add asset
│       │   └── sips/route.ts                 # F7C: GET all SIPs with health
│       ├── marketplace/
│       │   ├── chat/route.ts                 # F8A: POST streaming concierge chat
│       │   ├── catalogue/[category]/route.ts # F8A: GET product catalogue
│       │   └── smart-matches/route.ts        # F8B: GET proactive recommendations
│       ├── alerts/route.ts                    # F9A: GET/POST alerts
│       ├── notifications/
│       │   ├── route.ts                      # F9A: GET notifications
│       │   ├── [id]/read/route.ts            # F9A: POST mark read
│       │   └── unread-count/route.ts         # F9A: GET badge count
│       ├── brief/today/route.ts              # F9B: GET morning brief
│       ├── reports/weekly/latest/route.ts    # F9C: GET weekly report
│       └── cron/
│           ├── ingest-signals/route.ts        # F2: NSE signals (every 15min)
│           ├── ingest-news/route.ts           # F4: RSS news (every 2hr)
│           ├── check-alerts/route.ts          # F9A: Alert checking (every 15min)
│           ├── update-portfolio-values/route.ts # F7B: Daily value update
│           ├── generate-morning-briefs/route.ts # F9B: Daily 7am
│           └── generate-weekly-reports/route.ts # F9C: Sunday 6pm
│
├── lib/
│   ├── supabase.ts
│   ├── market-data/
│   │   └── nse-client.ts
│   ├── ai/
│   │   ├── signal-scorer.ts
│   │   └── chat-tools.ts
│   └── news/
│       ├── rss-fetcher.ts
│       └── article-enricher.ts
│
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.tsx             # Badge + drawer trigger
│   │   └── NotificationDrawer.tsx           # Slide-over panel
│   ├── dashboard/
│   │   ├── HealthScoreWidget.tsx            # Mini score card for dashboard
│   │   ├── MorningBriefCard.tsx             # Morning brief on dashboard
│   │   └── SmartMatchCard.tsx               # Proactive recommendations
│   └── shared/
│       ├── ChatInterface.tsx                 # Reusable streaming chat (F3 + F8A)
│       └── FileUpload.tsx                    # Reusable PDF upload (F6A + F6B + F7A)
│
├── middleware.ts
├── vercel.json
└── .env.local
```

---

## Vercel Cron — All Jobs

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/ingest-signals",           "schedule": "*/15 * * * *" },
    { "path": "/api/cron/check-alerts",              "schedule": "*/15 * * * *" },
    { "path": "/api/cron/ingest-news",               "schedule": "0 */2 * * *"  },
    { "path": "/api/cron/update-portfolio-values",   "schedule": "0 18 * * 1-5" },
    { "path": "/api/cron/generate-morning-briefs",   "schedule": "30 1 * * *"    },
    { "path": "/api/cron/generate-weekly-reports",   "schedule": "30 12 * * 0"   }
  ]
}
```

Note: All times in UTC. 1:30am UTC = 7am IST. 12:30pm UTC = 6pm IST (Sunday).

---

## Complete Supabase Database — All Tables Reference

```
user_profiles              F1  — Persona, risk score, goals
onboarding_conversations   F1  — Chat history during onboarding
market_signals             F2  — NSE announcements, bulk deals (scored)
user_signals               F2  — Per-user signal relevance scores
portfolio_holdings         F2/F7 — User's equity holdings
chat_sessions              F3  — Chat session grouping
chat_messages              F3  — Individual messages with tool logs
news_articles              F4  — Fetched + enriched articles with embeddings
user_news_feed             F4  — Per-user scored feed + read/save status
money_health_assessments   F5A — Scores across 6 dimensions
fire_plans                 F5B — FIRE roadmap with milestones
life_event_plans           F5C — Action plans per life event
couples_plans              F5D — Joint optimisation analysis
tax_assessments            F6A — Form 16 data + regime comparison
mf_transactions            F6B/F7A — All MF buy/sell transactions
capital_gains_reports      F6B — STCG, LTCG, harvesting opportunities
mf_current_holdings        F7A — Current MF units + live value
portfolio_xray_reports     F7A — Overlap, expense drag, rebalancing plan
portfolio_assets           F7B — All asset classes (equity, FD, gold, RE)
net_worth_history          F7B — Daily net worth snapshots for trend
user_sips                  F7C — Active SIPs with health status
product_recommendations    F8A — Saved concierge recommendations
product_catalogue          F8B — Available financial products with eligibility
user_alerts                F9A — User-configured alert conditions
notifications              F9A — Triggered alerts as notifications
morning_briefs             F9B — Daily generated briefs per user
weekly_reports             F9C — Sunday weekly portfolio digest
```

---

## OpenAI Model Usage Guide — All Features

| Feature | Task | Model | Why |
|---|---|---|---|
| F1 Onboarding | Conversational chat | gpt-4o-mini | Low stakes, high volume |
| F2 Signal scoring | Bulk scoring of 20 signals/15min | gpt-4o-mini | Cost efficiency, simple task |
| F3 Market chat | User-facing multi-tool reasoning | gpt-4o | Quality matters here |
| F4 News enrichment | Category + sentiment + summary | gpt-4o-mini | Bulk, 20 articles/2hr |
| F5A Health score | Action item generation | gpt-4o-mini | Simple structured output |
| F5B FIRE planner | Narrative + plan | gpt-4o-mini | Math done separately |
| F5C Life events | Action plan generation | gpt-4o | Complex, user-facing |
| F5D Couples | Optimisation language | gpt-4o-mini | Structured rules |
| F6A Tax Wizard | PDF extraction | gpt-4o | Accuracy critical |
| F6A Tax Wizard | Regime comparison narrative | gpt-4o-mini | Simple output |
| F6B Capital gains | PDF extraction | gpt-4o | Accuracy critical |
| F7A X-Ray | PDF extraction | gpt-4o | Accuracy critical |
| F7A X-Ray | Rebalancing plan | gpt-4o | Complex recommendations |
| F8A Concierge | Conversational + recommendation | gpt-4o | User-facing quality |
| F8B Smart match | Personalised pitch per product | gpt-4o-mini | Simple, templated |
| F9B Morning brief | Brief generation | gpt-4o-mini | Short output |
| F9C Weekly report | Report narrative | gpt-4o-mini | Structured output |
| All — Embeddings | Semantic search | text-embedding-3-small | Cheapest, excellent |

---

## Cost Estimate — All 9 Features (Demo Scale, ~50 Users)

| Category | Est. tokens/day | Cost/day |
|---|---|---|
| Conversational AI (F3, F8A) | 30,000 gpt-4o | $0.30 |
| Bulk analysis (F2, F4, F5, F6, F7, F9) | 200,000 gpt-4o-mini | $0.12 |
| PDF parsing (F6A, F6B, F7A) | 50,000 gpt-4o (on upload) | $0.50 per batch |
| Embeddings (F4) | 200,000 tokens | $0.004 |
| **Daily operational total** | | **~$0.42/day** |
| **Per PDF upload event** | | **~$0.50 one-time** |

Well within any standard OpenAI credit allocation for a hackathon build and early demo.

---

## Reusable Components to Build Once and Reuse

**ChatInterface.tsx** — Used in F3 (Market Chat) and F8A (Concierge). Props: `apiEndpoint`, `systemContextType`, `initialMessage`, `showToolChips`. Build it once with these props and drop it anywhere.

**FileUpload.tsx** — Used in F6A (Form 16), F6B (CAMS), F7A (CAMS again). Props: `apiEndpoint`, `acceptedFileTypes`, `processingMessage`, `onSuccess`. The PDF parse logic varies per feature but the upload UI is identical.

**StreamingChatMessage.tsx** — The message bubble with animated cursor and tool-call chips. Same component across F3, F8A.

**HealthBadge.tsx** — The coloured badge (Healthy / Watch / Switch / Critical). Used in F7C (SIP health), F9A (alerts), F5A (health score dimensions).

---

*Build Features 1–4 first — that is your hackathon core demo. Features 5–9 are depth layers. If time allows: 5A (Money Health Score) and 6A (Tax Wizard PDF demo) have the highest visual impact-to-build-time ratio among the remaining features. Build those next.*