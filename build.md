# ET AI Investment Intelligence Platform
## Technical Implementation Guide — Features 1–4
### Stack: Next.js 14 · TypeScript · OpenAI · Clerk · Supabase

---

> **Hackathon Mindset:** Every feature below is designed to be *demonstrable in 2 minutes*,
> *technically impressive to a jury*, and *genuinely useful to a real Indian retail investor*.
> UX is not an afterthought — it is the difference between winning and placing.

---

## Global Tech Stack

| Layer | Tool | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | API Routes = backend + frontend in one repo |
| Language | TypeScript throughout | Type safety, jury credibility |
| Auth | Clerk | 5-minute setup, social login, beautiful UI out of the box |
| Database | Supabase (PostgreSQL) | Real-time, row-level security, pgvector built in |
| LLM | OpenAI GPT-4o / GPT-4o-mini | Your credits, best quality |
| Embeddings | OpenAI text-embedding-3-small | Cheap, fast, excellent quality |
| Vector store | Supabase pgvector extension | No separate vector DB needed |
| Market data | NSE public APIs + Yahoo Finance | Completely free |
| News | RSS feeds (ET, Mint, BS, RBI) | Free, no API key |
| PDF parsing | pdf-parse npm package | Free |
| Streaming | Vercel AI SDK | Best-in-class streaming with Next.js |
| Hosting | Vercel free tier | Instant deploy, preview URLs |
| Background jobs | Vercel Cron free tier | Serverless scheduled tasks |

### Project Setup

```bash
npx create-next-app@latest et-ai --typescript --tailwind --app
cd et-ai
npm install @clerk/nextjs @supabase/supabase-js openai
npm install ai @ai-sdk/openai
npm install rss-parser cheerio axios pdf-parse
npm install @tanstack/react-query zustand
npm install framer-motion lucide-react recharts
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
CRON_SECRET=your-random-secret
```

### Supabase — Enable pgvector (run once in SQL editor)

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Clerk + Supabase Integration

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function createServerClient() {
  const { userId } = await auth()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { 'x-user-id': userId ?? '' } } }
  )
}

export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) await auth.protect()
})

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
```

---

## Hackathon Winning Demo Arc — Practice This 20 Times

```
0:00 — Open app on phone/laptop. Show landing page.
0:10 — Google one-tap sign in via Clerk. Instant.
0:15 — Onboarding chat begins. Type 5 natural answers.
0:50 — Persona reveal card animates in. "You are The Steady Builder."
1:00 — Dashboard loads. Opportunity Radar shows 3 live NSE signals.
       One has a red "AFFECTS YOUR PORTFOLIO" badge.
1:20 — Click "Ask AI about this" on the signal.
       Chat opens, streaming response with visible tool calls.
1:40 — Switch to News tab. Show the language toggle. Flip to Hindi.
       Feed changes. Show portfolio impact badge on an article.
2:00 — Done.
```

**On stage, say:** *"Every other app gives you the same Bloomberg terminal with an Indian skin. We built a personal analyst who already read your portfolio before you opened the app. That's the difference."*

---

---

# FEATURE 1 — User Onboarding & Profile Engine

---

## 1A. UX Research & Design

### Why Existing Onboarding Fails

Every Indian fintech app opens with a 40-field KYC form and a 10-radio-button risk questionnaire. Drop-off rates exceed 60%. The users who survive are already motivated — exactly the people who don't need the app's guidance.

**Research insight:** Indian users complete WhatsApp-style chat interactions at 3x the rate of forms. Voice-native Tier 2/3 users specifically abandon forms but complete conversations (IAMAI Digital Inclusion Report 2023).

### Winning UX Principles

- Never show more than one question at a time
- Follow up naturally based on prior answers — if user mentions a home loan, ask about the EMI
- Show a circular progress ring, not a bar — rings feel less like admin
- Visually confirm and summarise each answer: "Got it — saving for your daughter's education in 8 years"
- The persona reveal should feel like a personality test result — satisfying, shareable

### Screen Flow

```
Landing Page
  → "Start your financial journey" CTA
  → Clerk sign-up (Google one-tap — minimum friction)
  → Full-screen onboarding chat (no nav bar, no distractions)
      → 5 to 7 conversational questions
      → Real-time typing indicator while AI generates
      → Persona reveal — animated card flip
  → Dashboard (personalised from the very first load)
```

### The 7 Questions (Adaptive — Not All Always Shown)

| # | Question | What It Extracts |
|---|---|---|
| 1 | "Before we begin — what's your first name?" | Personalisation, trust-building |
| 2 | "Which stage of investing are you at?" (3 illustrated options) | Experience level |
| 3 | "What's bringing you here today?" (open text) | Primary goal |
| 4 | "Roughly, how much do you invest every month?" (range slider) | Investment capacity |
| 5 | "Do you already have stocks or mutual funds?" | Portfolio existence |
| 6 | "If your investments dropped 20% overnight, what would you do?" (3 options) | Risk appetite |
| 7 | "Is there a big financial goal you're working toward in the next 5 years?" | Goal horizon |

### Persona Reveal — Your WOW Moment

Full-screen animated card. Persona name, custom illustration, and 3 personalised insights. Example for "Steady Builder":
- "Your dashboard shows SIP goal progress front and centre"
- "We'll alert you when your funds underperform category"
- "News is filtered for mutual fund investors like you"

Make this card screenshot-worthy and shareable. Hackathon virality.

---

## 1B. Database Schema

```sql
-- Supabase SQL Editor

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  first_name TEXT,
  persona TEXT CHECK (persona IN (
    'curious_beginner', 'active_trader', 'sip_investor',
    'hni', 'retiree', 'nri'
  )),
  risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 10),
  income_range TEXT,
  monthly_investment_capacity INTEGER,
  primary_goal TEXT,
  goal_horizon_years INTEGER,
  has_existing_portfolio BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  extracted_profile JSONB,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"
  ON user_profiles FOR ALL
  USING (clerk_user_id = current_setting('app.user_id', true));
```

---

## 1C. API Route — Streaming Onboarding Chat

```typescript
// app/api/onboarding/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'

const SYSTEM_PROMPT = `You are a warm, friendly financial onboarding assistant for Indian retail investors.

Your job: have a natural 5 to 7 message conversation to understand the user's investment profile.
Extract these fields: experience_level, primary_goal, monthly_investment_capacity (in INR),
risk_score (1-10), has_existing_portfolio (boolean), goal_horizon_years, persona.

Persona options: curious_beginner, active_trader, sip_investor, hni, retiree, nri.

Rules:
- Ask exactly ONE question per message. Never list multiple questions.
- Use Indian financial context — mention SIPs, FDs, Sensex, PPF, not S&P 500 or 401k.
- Keep each message under 2 sentences.
- Be warm, never robotic. Use the user's first name after they give it.
- After 5 to 7 exchanges, output this exact format at the end of your message:
  <PROFILE>{"experience_level":"beginner","primary_goal":"retirement","monthly_capacity":5000,"risk_score":6,"has_portfolio":false,"goal_horizon":20,"persona":"sip_investor","first_name":"Rahul"}</PROFILE>
- If user mentions distress, job loss, or divorce — acknowledge warmly before continuing.`

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages } = await request.json()
  const supabase = await createServerClient()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    messages,
    onFinish: async ({ text }) => {
      const profileMatch = text.match(/<PROFILE>(.*?)<\/PROFILE>/s)
      if (profileMatch) {
        const profile = JSON.parse(profileMatch[1])
        await supabase.from('user_profiles').upsert({
          clerk_user_id: userId,
          first_name: profile.first_name,
          persona: profile.persona,
          risk_score: profile.risk_score,
          primary_goal: profile.primary_goal,
          monthly_investment_capacity: profile.monthly_capacity,
          has_existing_portfolio: profile.has_portfolio,
          goal_horizon_years: profile.goal_horizon,
          onboarding_completed: true,
        })
      }
      await supabase.from('onboarding_conversations').upsert({
        clerk_user_id: userId,
        messages,
        completed: !!profileMatch,
      })
    }
  })

  return result.toDataStreamResponse()
}
```

### Profile GET Route

```typescript
// app/api/profile/route.ts
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  return Response.json(data)
}
```

---

## 1D. Frontend — Onboarding Chat Page

```typescript
// app/onboarding/page.tsx
'use client'
import { useChat } from 'ai/react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

const PERSONA_DATA = {
  curious_beginner: {
    title: 'The Curious Learner',
    emoji: '🌱',
    gradient: 'from-green-400 to-emerald-600',
    insights: [
      'Every term gets explained before we use it',
      'Your news feed starts with investing basics',
      'Gentle alerts — no jargon, no panic',
    ],
  },
  sip_investor: {
    title: 'The Steady Builder',
    emoji: '🏗️',
    gradient: 'from-blue-400 to-indigo-600',
    insights: [
      'SIP goal progress is front and centre',
      'We flag when your funds underperform category',
      'News filtered for long-term investors like you',
    ],
  },
  active_trader: {
    title: 'The Market Hawk',
    emoji: '🦅',
    gradient: 'from-orange-400 to-red-600',
    insights: [
      'Technical breakouts alert you first',
      'Bulk and block deal tracker always on',
      'Real-time NSE signals, no delay',
    ],
  },
  hni: {
    title: 'The Wealth Architect',
    emoji: '🏛️',
    gradient: 'from-purple-400 to-violet-700',
    insights: [
      'Tax optimisation opportunities surfaced proactively',
      'Sector FII flow tracked for your allocation',
      'Estate and wealth planning prompts included',
    ],
  },
  retiree: {
    title: 'The Capital Guardian',
    emoji: '🛡️',
    gradient: 'from-teal-400 to-cyan-600',
    insights: [
      'Capital preservation signals prioritised',
      'Dividend and FD rate alerts on',
      'Low-volatility news focus',
    ],
  },
  nri: {
    title: 'The Global Investor',
    emoji: '🌏',
    gradient: 'from-amber-400 to-orange-600',
    insights: [
      'NRE and FCNR rate alerts included',
      'DTAA and remittance news prioritised',
      'USD-INR rate tracked for you',
    ],
  },
} as const

type PersonaKey = keyof typeof PERSONA_DATA

export default function OnboardingPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<PersonaKey | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/onboarding/chat',
    initialMessages: [{
      id: 'init',
      role: 'assistant',
      content: "Hey! 👋 I'm your financial co-pilot. Before setting things up, I want to understand what you're looking for. What's your first name?",
    }],
    onFinish: (message) => {
      const match = message.content.match(/<PROFILE>(.*?)<\/PROFILE>/s)
      if (match) {
        const profile = JSON.parse(match[1])
        setPersona(profile.persona as PersonaKey)
        setTimeout(() => setShowReveal(true), 600)
      }
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const messageCount = messages.filter(m => m.role === 'user').length
  const progress = Math.min(messageCount * 15, 95)

  if (showReveal && persona) {
    const p = PERSONA_DATA[persona]
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center p-6 bg-gray-50"
      >
        <div className="max-w-sm w-full text-center">
          <motion.div
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
            className={`rounded-3xl p-8 bg-gradient-to-br ${p.gradient} text-white mb-6 shadow-xl`}
          >
            <div className="text-7xl mb-4">{p.emoji}</div>
            <p className="text-white/80 text-sm mb-1">You are a</p>
            <h2 className="text-3xl font-black">{p.title}</h2>
          </motion.div>

          <div className="space-y-2.5 mb-8">
            {p.insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 text-left shadow-sm"
              >
                <span className="text-green-500 font-bold text-base">✓</span>
                <span className="text-gray-600 text-sm">{insight}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white font-semibold text-base hover:bg-gray-800 transition-colors"
          >
            Open My Dashboard →
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto">
      <div className="px-6 py-5 flex items-center justify-between">
        <span className="text-sm text-gray-400">Setting up your profile</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gray-900 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring' }}
            />
          </div>
          <span className="text-xs text-gray-400">{progress}%</span>
        </div>
      </div>

      <div className="flex-1 px-6 space-y-4 overflow-y-auto pb-4">
        <AnimatePresence>
          {messages.map((m) => {
            const content = m.content.replace(/<PROFILE>.*?<\/PROFILE>/s, '').trim()
            if (!content) return null
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {content}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-5 py-4 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="block w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.5 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your answer..."
            disabled={isLoading}
            className="flex-1 px-5 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 text-[15px] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

## 1E. Hackathon Creative Edge

**What separates this from every other onboarding:**

1. The AI adapts in real time — if user says "I trade daily" it skips beginner questions immediately
2. The persona reveal is screenshot-worthy — make it feel like an MBTI result card
3. The user's first name appears in every subsequent response across the entire app
4. If a user types in Hindi mid-conversation, the AI switches to Hindi without being asked

**On stage:** *"Most apps make you fill a form. We have a conversation. By the end, the app knows more about your financial life than a bank with 10 years of your statements — because we asked the right questions."*

---

---

# FEATURE 2 — Opportunity Radar (Market Intelligence)

---

## 2A. UX Research & Design

### The Attention Problem

A retail investor following 15 stocks receives 200+ notifications daily from Zerodha, ET Markets, and Moneycontrol combined. None of them says: *"this specific announcement affects YOU because you hold 8% of your portfolio in this stock."*

The scarcest resource for a retail investor is not data — it is attention. Every design decision in Opportunity Radar is about giving attention back, not consuming it.

### Winning UX Concepts

**Signal Cards (not news articles):** Each signal is a compact card showing stock name, signal type badge (INSIDER BUY / EARNINGS BEAT / BREAKOUT), and critically: "You hold 12% in this — HIGH IMPACT" — this portfolio-aware context is your differentiator.

**The Score Dial:** Every signal has a circular score badge (0–10). Red above 7, amber 4–7, gray below 4. Juries love seeing a scoring system — it signals rigour.

**Scoring formula to explain on stage:**
```
Final Score = (Signal Strength × 0.4) + (Portfolio Relevance × 0.4) + (Recency × 0.2)

Signal Strength  = GPT-4o-mini analysis of the filing/announcement (0-10)
Portfolio Relevance = user's allocation % in that stock (scaled to 0-10)
Recency  = 1.0 if under 1 hour, 0.7 if under 6 hours, 0.3 if under 24 hours
```

**Empty state:** "Markets are quiet for your portfolio right now. Last checked 4 minutes ago." — never show a blank screen.

---

## 2B. Database Schema

```sql
CREATE TABLE market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  source_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  company_name TEXT,
  quantity FLOAT,
  avg_buy_price FLOAT,
  allocation_pct FLOAT,
  asset_type TEXT DEFAULT 'equity',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, symbol)
);

CREATE TABLE user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  signal_id UUID REFERENCES market_signals(id),
  portfolio_relevance FLOAT,
  final_score FLOAT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, signal_id)
);

CREATE INDEX ON market_signals(created_at DESC);
CREATE INDEX ON user_signals(clerk_user_id, final_score DESC);
CREATE INDEX ON portfolio_holdings(clerk_user_id);
```

---

## 2C. Free Market Data Client

```typescript
// lib/market-data/nse-client.ts

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com',
}

// NSE requires a session cookie obtained from the homepage
async function getNSECookie(): Promise<string> {
  const res = await fetch('https://www.nseindia.com', { headers: NSE_HEADERS })
  return res.headers.get('set-cookie')?.split(';')[0] ?? ''
}

export async function fetchNSEAnnouncements() {
  const cookie = await getNSECookie()
  const res = await fetch(
    'https://www.nseindia.com/api/corporate-announcements?index=equities',
    { headers: { ...NSE_HEADERS, Cookie: cookie } }
  )
  const data = await res.json()
  return (data?.data ?? []) as NSEAnnouncement[]
}

export async function fetchBulkDeals() {
  const cookie = await getNSECookie()
  const res = await fetch(
    'https://www.nseindia.com/api/bulk-deals',
    { headers: { ...NSE_HEADERS, Cookie: cookie } }
  )
  return ((await res.json())?.data ?? []) as BulkDeal[]
}

export async function getStockQuote(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=1d`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  )
  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  return {
    symbol,
    price: meta?.regularMarketPrice as number,
    change: (meta?.regularMarketPrice - meta?.previousClose) as number,
    changePct: ((meta?.regularMarketPrice - meta?.previousClose) / meta?.previousClose * 100) as number,
  }
}

export interface NSEAnnouncement {
  symbol: string
  desc: string
  an_dt: string
  attchmntFile?: string
}

export interface BulkDeal {
  symbol: string
  clientName: string
  buySell: 'BUY' | 'SELL'
  quantity: number
  tradePrice: number
}
```

---

## 2D. Signal Scoring via OpenAI

```typescript
// lib/ai/signal-scorer.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ScoredSignal {
  signalStrength: number
  summary: string
  signalType: string
  bullishBearish: 'bullish' | 'bearish' | 'neutral'
  urgency: 'low' | 'medium' | 'high'
}

export async function scoreSignal(rawData: object): Promise<ScoredSignal> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: `You are a senior Indian equity analyst. Analyze NSE market signals.
        Return JSON with:
        - signalStrength: number 0-10
        - summary: plain English max 25 words, no jargon
        - signalType: one of earnings_beat, earnings_miss, insider_buy, insider_sell, bulk_deal_buy, bulk_deal_sell, technical_breakout, rating_upgrade, rating_downgrade, dividend_announced, corporate_announcement
        - bullishBearish: bullish, bearish, or neutral
        - urgency: low, medium, or high`,
      },
      {
        role: 'user',
        content: `Analyze: ${JSON.stringify(rawData)}`,
      },
    ],
  })
  return JSON.parse(completion.choices[0].message.content ?? '{}') as ScoredSignal
}

export function computePortfolioRelevance(
  symbol: string,
  portfolio: Array<{ symbol: string; allocation_pct: number }>
): number {
  const holding = portfolio.find(h => h.symbol === symbol)
  return holding ? Math.min(holding.allocation_pct / 10, 2.0) : 0
}

export function computeFinalScore(
  signalStrength: number,
  portfolioRelevance: number,
  publishedAt: Date
): number {
  const hoursSince = (Date.now() - publishedAt.getTime()) / 3_600_000
  const recency = hoursSince < 1 ? 1.0 : hoursSince < 6 ? 0.7 : hoursSince < 24 ? 0.3 : 0.1
  return Number(
    ((signalStrength * 0.4) + (portfolioRelevance * 4 * 0.4) + (recency * 10 * 0.2)).toFixed(1)
  )
}
```

---

## 2E. API Routes

### Cron — Signal Ingestion (runs every 15 min)

```typescript
// app/api/cron/ingest-signals/route.ts
import { createClient } from '@supabase/supabase-js'
import { fetchNSEAnnouncements, fetchBulkDeals } from '@/lib/market-data/nse-client'
import { scoreSignal } from '@/lib/ai/signal-scorer'

export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const [announcements, bulkDeals] = await Promise.all([
    fetchNSEAnnouncements(),
    fetchBulkDeals(),
  ])

  let saved = 0
  for (const item of [...announcements.slice(0, 8), ...bulkDeals.slice(0, 8)]) {
    const symbol = (item as any).symbol
    const { data: exists } = await supabase
      .from('market_signals')
      .select('id')
      .eq('symbol', symbol)
      .gt('created_at', cutoff)
      .maybeSingle()

    if (exists) continue

    const scored = await scoreSignal(item)
    await supabase.from('market_signals').insert({
      symbol,
      signal_type: scored.signalType,
      raw_data: item,
      summary: scored.summary,
      signal_strength: scored.signalStrength,
      published_at: new Date().toISOString(),
    })
    saved++
  }

  return Response.json({ saved })
}
```

### GET — Personalised Signals for User

```typescript
// app/api/signals/route.ts
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import { computePortfolioRelevance, computeFinalScore } from '@/lib/ai/signal-scorer'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()
  const [{ data: portfolio }, { data: signals }] = await Promise.all([
    supabase.from('portfolio_holdings').select('symbol, allocation_pct').eq('clerk_user_id', userId),
    supabase.from('market_signals').select('*')
      .gt('created_at', new Date(Date.now() - 86_400_000).toISOString())
      .order('created_at', { ascending: false })
      .limit(60),
  ])

  if (!signals) return Response.json([])

  const scored = (signals ?? [])
    .map(signal => {
      const portfolioRelevance = computePortfolioRelevance(signal.symbol, portfolio ?? [])
      const finalScore = computeFinalScore(signal.signal_strength, portfolioRelevance, new Date(signal.published_at))
      return { ...signal, portfolioRelevance, finalScore }
    })
    .filter(s => s.finalScore > 1)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 15)

  return Response.json(scored)
}
```

---

## 2F. Frontend — Opportunity Radar

```typescript
// app/dashboard/radar/page.tsx
'use client'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SIGNAL_STYLES: Record<string, { badge: string; label: string }> = {
  insider_buy:        { badge: 'bg-orange-100 text-orange-700 border-orange-200', label: 'INSIDER BUY' },
  bulk_deal_buy:      { badge: 'bg-blue-100 text-blue-700 border-blue-200',   label: 'BULK BUY' },
  earnings_beat:      { badge: 'bg-green-100 text-green-700 border-green-200', label: 'EARNINGS BEAT' },
  technical_breakout: { badge: 'bg-purple-100 text-purple-700 border-purple-200', label: 'BREAKOUT' },
  rating_upgrade:     { badge: 'bg-teal-100 text-teal-700 border-teal-200',   label: 'UPGRADED' },
  earnings_miss:      { badge: 'bg-red-100 text-red-700 border-red-200',      label: 'EARNINGS MISS' },
  insider_sell:       { badge: 'bg-red-100 text-red-700 border-red-200',      label: 'INSIDER SELL' },
  bulk_deal_sell:     { badge: 'bg-gray-100 text-gray-600 border-gray-200',   label: 'BULK SELL' },
}

export default function RadarPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'portfolio'>('all')

  const { data: signals, isLoading } = useQuery({
    queryKey: ['signals'],
    queryFn: () => fetch('/api/signals').then(r => r.json()),
    refetchInterval: 5 * 60 * 1000,
  })

  const visible = filter === 'portfolio'
    ? (signals ?? []).filter((s: any) => s.portfolioRelevance > 0)
    : (signals ?? [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunity Radar</h1>
          <p className="text-xs text-gray-400 mt-1">Signals scored for your portfolio · refreshes every 15 min</p>
        </div>
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
          {(['all', 'portfolio'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {f === 'all' ? 'All Signals' : 'My Portfolio'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📡</div>
          <p className="font-medium">Markets are quiet for your portfolio</p>
          <p className="text-sm mt-1">Last checked a moment ago</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {visible.map((signal: any, i: number) => {
              const style = SIGNAL_STYLES[signal.signal_type] ?? { badge: 'bg-gray-100 text-gray-500 border-gray-200', label: signal.signal_type }
              const scoreColor = signal.finalScore > 7 ? 'bg-red-100 text-red-700' : signal.finalScore > 4 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              return (
                <motion.div key={signal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 text-lg">{signal.symbol}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}>{style.label}</span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed">{signal.summary}</p>
                      {signal.portfolioRelevance > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs font-semibold text-red-600">AFFECTS YOUR PORTFOLIO</span>
                        </div>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${scoreColor}`}>
                      {signal.finalScore}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => router.push(`/chat?q=Tell me more about ${signal.symbol}: ${signal.summary}`)}
                      className="flex-1 py-2.5 text-sm rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors">
                      Ask AI about this ↗
                    </button>
                    <button className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      + Watchlist
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
```

---

## 2G. Hackathon Creative Edge

For the demo, show the "My Portfolio" filter — the list shrinks to only signals affecting held stocks, each with the red "AFFECTS YOUR PORTFOLIO" badge. This single moment communicates the entire value proposition without a word.

**On stage:** *"Every other app gives you 200 alerts and calls it intelligence. We give you the 3 that affect money you already have in the market. This signal here — promoter bought ₹45 crore. We know you hold 8% in this stock, so it's at the top. That's the difference."*

---

---

# FEATURE 3 — Conversational Market Intelligence (Market AI Chat)

---

## 3A. UX Research & Design

### Why Existing Finance Chatbots Fail

Groww's chatbot, Zerodha's FAQ bot: they answer generic questions, have no tools to fetch live data, forget context between messages, and hallucinate numbers without citing sources.

### The Winning Approach — Portfolio-Aware Streaming Chat with Visible Tool Use

**The proactive opener (your instant credibility signal):**
Before the user types anything, the chat already says: *"I've loaded your portfolio. You're 40% in IT stocks — want me to assess your exposure given the current FII selling trend?"*

This opening alone demonstrates that the AI has already done work. No other fintech chatbot does this.

**What impresses juries:**
- Streaming responses — text appears word by word, never a 10-second spinner
- Tool calls visible — when AI fetches data, show "Checking NSE prices..." chip in UI
- Source citations in every factual answer
- Follow-up suggestion chips below every response

**Multi-step query to demo live on stage:**
> "Which of my mid-cap pharma stocks have insider buying and improving margins this quarter?"

The AI visibly: checks your portfolio → scans insider filings → fetches quarterly results → synthesises answer. All in under 15 seconds. That is your tech credibility moment.

---

## 3B. Database Schema

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tools_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON chat_messages(session_id, created_at);
```

---

## 3C. Tool Definitions

```typescript
// lib/ai/chat-tools.ts
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase'
import { getStockQuote } from '@/lib/market-data/nse-client'

export const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_user_portfolio',
      description: "Retrieve the current user's holdings with allocation percentages",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_data',
      description: 'Get live price, % change, and basic fundamentals for an NSE stock symbol',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'NSE symbol e.g. INFY, TCS, RELIANCE' },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_financial_news',
      description: 'Search latest financial news for a stock or topic',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_signals',
      description: 'Get recent insider trades, bulk deals, or earnings for a stock',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string' },
        },
        required: ['symbol'],
      },
    },
  },
]

export async function runTool(
  name: string,
  args: Record<string, string>,
  userId: string
): Promise<string> {
  const supabase = await createServerClient()

  switch (name) {
    case 'get_user_portfolio': {
      const { data } = await supabase
        .from('portfolio_holdings').select('*').eq('clerk_user_id', userId)
      return JSON.stringify(data ?? [])
    }
    case 'get_stock_data': {
      try {
        return JSON.stringify(await getStockQuote(args.symbol))
      } catch {
        return JSON.stringify({ error: 'Price unavailable' })
      }
    }
    case 'search_financial_news': {
      const q = encodeURIComponent(`${args.query} NSE India`)
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      )
      const data = await res.json()
      const snippets = (data.RelatedTopics ?? []).slice(0, 5).map((t: any) => t.Text).join('\n')
      return snippets || 'No recent news found'
    }
    case 'get_recent_signals': {
      const { data } = await supabase
        .from('market_signals').select('summary, signal_type, published_at')
        .eq('symbol', args.symbol)
        .order('published_at', { ascending: false }).limit(5)
      return JSON.stringify(data ?? [])
    }
    default:
      return JSON.stringify({ error: 'Unknown tool' })
  }
}
```

---

## 3D. API Route — Streaming Chat with Tool Use

```typescript
// app/api/chat/market/route.ts
import OpenAI from 'openai'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import { TOOLS, runTool } from '@/lib/ai/chat-tools'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are an expert Indian stock market analyst and personal financial advisor with access to live tools.

Rules:
- Always use tools when answering factual questions — never guess prices or news.
- Reference the user's specific holdings when relevant.
- Cite your source after every factual claim.
- Add "For informational purposes only, not financial advice." at the end of any recommendation.
- Use Indian context: NSE, BSE, SEBI, NIFTY, SENSEX, SIP, ELSS, PPF, FD, etc.
- Keep answers under 200 words for simple queries.
- End every response with exactly this format on a new line:
  SUGGESTIONS: ["question one", "question two", "question three"]`

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages, sessionId } = await req.json() as {
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
    sessionId: string
  }

  const supabase = await createServerClient()
  const { data: profile } = await supabase
    .from('user_profiles').select('persona, risk_score, primary_goal')
    .eq('clerk_user_id', userId).single()

  const systemWithCtx = `${SYSTEM_PROMPT}\n\nUser: persona=${profile?.persona}, risk=${profile?.risk_score}/10, goal=${profile?.primary_goal}`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        let allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemWithCtx },
          ...messages,
        ]
        let finalText = ''
        const toolsUsed: string[] = []

        for (let round = 0; round < 5; round++) {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: allMessages,
            tools: TOOLS,
            tool_choice: 'auto',
            stream: true,
          })

          let assistantText = ''
          const toolCallAccumulator: Record<number, { id: string; name: string; args: string }> = {}

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta
            if (delta?.content) {
              assistantText += delta.content
              finalText += delta.content
              send({ type: 'text', content: delta.content })
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!toolCallAccumulator[tc.index]) {
                  toolCallAccumulator[tc.index] = { id: '', name: '', args: '' }
                }
                if (tc.id) toolCallAccumulator[tc.index].id = tc.id
                if (tc.function?.name) toolCallAccumulator[tc.index].name += tc.function.name
                if (tc.function?.arguments) toolCallAccumulator[tc.index].args += tc.function.arguments
              }
            }
          }

          const toolCalls = Object.values(toolCallAccumulator)
          if (toolCalls.length === 0) break

          // Push assistant message with tool_calls
          allMessages.push({
            role: 'assistant',
            content: assistantText || null,
            tool_calls: toolCalls.map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: tc.args },
            })),
          })

          // Execute each tool
          for (const tc of toolCalls) {
            send({ type: 'tool_start', tool: tc.name })
            if (!toolsUsed.includes(tc.name)) toolsUsed.push(tc.name)
            const result = await runTool(tc.name, JSON.parse(tc.args || '{}'), userId)
            allMessages.push({ role: 'tool', tool_call_id: tc.id, content: result })
            send({ type: 'tool_end', tool: tc.name })
          }
        }

        // Persist to DB
        const supabase = await createServerClient()
        await supabase.from('chat_messages').insert([
          { session_id: sessionId, clerk_user_id: userId, role: 'user', content: messages.at(-1)?.content as string },
          { session_id: sessionId, clerk_user_id: userId, role: 'assistant', content: finalText, tools_used: toolsUsed },
        ])

        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

---

## 3E. Frontend — Streaming Chat UI

```typescript
// app/chat/page.tsx
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Database, TrendingUp, Newspaper, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const TOOL_META: Record<string, { label: string; Icon: any }> = {
  get_user_portfolio:   { label: 'Reading your portfolio', Icon: Database },
  get_stock_data:       { label: 'Checking NSE prices',  Icon: TrendingUp },
  search_financial_news:{ label: 'Scanning latest news',  Icon: Newspaper },
  get_recent_signals:   { label: 'Checking filings',      Icon: Search },
}

interface Msg {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
  suggestions?: string[]
}

export default function ChatPage() {
  const params = useSearchParams()
  const [messages, setMessages] = useState<Msg[]>([{
    role: 'assistant',
    content: "I've loaded your portfolio. I can see your top holdings and your overall allocation. What would you like to analyse today?",
    suggestions: [
      'Which of my holdings underperformed their category this quarter?',
      'Show me stocks with insider buying in the last 7 days',
      'How should I rebalance given current FII selling?',
    ],
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [streaming, setStreaming] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(crypto.randomUUID())

  useEffect(() => {
    const q = params.get('q')
    if (q) sendMessage(q)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, activeTools])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: Msg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setStreaming('')
    setActiveTools([])

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    let full = ''
    const usedTools: string[] = []

    try {
      const res = await fetch('/api/chat/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId: sessionId.current }),
      })

      const reader = res.body!.getReader()
      const dec = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of dec.decode(value).split('\n\n').filter(Boolean)) {
          if (!line.startsWith('data: ')) continue
          const ev = JSON.parse(line.slice(6))
          if (ev.type === 'text') { full += ev.content; setStreaming(full) }
          else if (ev.type === 'tool_start') { setActiveTools(p => [...new Set([...p, ev.tool])]); if (!usedTools.includes(ev.tool)) usedTools.push(ev.tool) }
          else if (ev.type === 'tool_end')   { setActiveTools(p => p.filter(t => t !== ev.tool)) }
        }
      }

      const suggMatch = full.match(/SUGGESTIONS:\s*(\[.*?\])/s)
      const suggestions: string[] = suggMatch ? JSON.parse(suggMatch[1]) : []
      const clean = full.replace(/SUGGESTIONS:\s*\[.*?\]/s, '').trim()
      setMessages(p => [...p, { role: 'assistant', content: clean, toolsUsed: usedTools, suggestions }])
    } finally {
      setIsLoading(false)
      setStreaming('')
      setActiveTools([])
    }
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="font-semibold text-gray-900">Market AI</h1>
        <p className="text-xs text-gray-400">Portfolio-aware · Live market data · GPT-4o</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
              {m.toolsUsed && m.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {m.toolsUsed.map(t => {
                    const meta = TOOL_META[t]
                    if (!meta) return null
                    return (
                      <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        <meta.Icon size={10} />
                        {meta.label} ✓
                      </span>
                    )
                  })}
                </div>
              )}
              <div className={`px-5 py-4 rounded-2xl text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                {m.content}
              </div>
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {m.suggestions.map((s, j) => (
                    <button key={j} onClick={() => sendMessage(s)}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      {s} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {activeTools.length > 0 && (
          <div className="flex justify-start">
            <div className="space-y-1.5">
              {activeTools.map(t => {
                const meta = TOOL_META[t]
                if (!meta) return null
                return (
                  <motion.div key={t} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-xl border border-blue-100">
                    <Loader2 size={12} className="animate-spin" />
                    {meta.label}...
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-5 py-4 rounded-2xl rounded-bl-sm bg-gray-50 border border-gray-100 text-[15px] leading-relaxed">
              {streaming}
              <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-text-bottom" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask about your portfolio, any stock, or market trends..."
            disabled={isLoading}
            className="flex-1 px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 text-[15px] disabled:opacity-50" />
          <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
            className="px-5 py-3.5 bg-gray-900 text-white rounded-2xl disabled:opacity-40 hover:bg-gray-800 transition-colors">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 3F. Hackathon Creative Edge

Ask this question live on stage with the jury watching: *"Which of my mid-cap pharma stocks have insider buying this quarter?"*

The jury watches: portfolio tool fires → signal tool fires → answer streams. Then say: *"That query would take an analyst 45 minutes. We did it in 12 seconds, and it already knew which stocks were yours."*

---

---

# FEATURE 4 — Personalized News & Content (My ET Newsroom)

---

## 4A. UX Research & Design

### The Sameness Problem

ET Markets, Moneycontrol, and Mint show every user the same homepage. A retired investor managing ₹50 lakh in FDs and a 24-year-old F&O trader see identical content. The average Indian retail investor reads financial news for 11 minutes a day (Nielsen 2023). In that time, 80% of what they read is irrelevant to their portfolio.

**The opportunity is not more news. It is the right 3 articles in those 11 minutes.**

### Winning UX Concepts

**Portfolio Impact Badge:** Every article card shows a red banner "AFFECTS YOUR HOLDINGS: INFY, TCS" when the article mentions a stock the user holds. This is the single feature that makes users say "no other app does this." Show it prominently on stage.

**The Daily 7:** Show exactly 7 articles per day — curated by AI. Display the count: "7 stories that matter to you today." Scarcity creates perceived value. Infinite scroll is the enemy.

**Language Toggle:** A single tap switches the entire feed to Hindi. Instant (pre-translated and cached). This inclusion angle is a powerful narrative for Indian fintech juries.

**Depth by Persona:**
- Curious Beginner sees a 50-word plain English summary
- Active Trader sees headline plus key numbers plus stock impact
- HNI sees detailed sector analysis and macro implications

---

## 4B. Database Schema

```sql
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  published_at TIMESTAMPTZ,
  mentioned_stocks TEXT[],
  category TEXT CHECK (category IN ('markets','economy','company','mutual_funds','tax','global')),
  sentiment TEXT CHECK (sentiment IN ('bullish','bearish','neutral')),
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_news_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  article_id UUID REFERENCES news_articles(id),
  relevance_score FLOAT,
  portfolio_impact_score FLOAT,
  portfolio_impact_stocks TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  summary_hi TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, article_id)
);

CREATE INDEX ON news_articles(published_at DESC);
CREATE INDEX ON news_articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON user_news_feed(clerk_user_id, relevance_score DESC);
```

### pgvector Match Function

```sql
CREATE OR REPLACE FUNCTION match_articles(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  published_after timestamptz
)
RETURNS TABLE (
  id uuid, title text, summary text, url text, source text,
  category text, sentiment text, mentioned_stocks text[],
  published_at timestamptz, similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT id, title, summary, url, source, category, sentiment,
         mentioned_stocks, published_at,
         1 - (embedding <=> query_embedding) AS similarity
  FROM news_articles
  WHERE published_at > published_after
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

---

## 4C. News Ingestion + Enrichment

### RSS Fetcher

```typescript
// lib/news/rss-fetcher.ts
import Parser from 'rss-parser'

const parser = new Parser()

const FEEDS = [
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'ET Markets' },
  { url: 'https://economictimes.indiatimes.com/mf/rssfeeds/3816.cms',            source: 'ET MF' },
  { url: 'https://www.livemint.com/rss/markets',                                  source: 'LiveMint' },
  { url: 'https://www.business-standard.com/rss/markets-106.rss',                source: 'Business Standard' },
  { url: 'https://rbi.org.in/scripts/rss.aspx',                                  source: 'RBI' },
]

export interface RawArticle {
  title: string
  summary: string
  url: string
  source: string
  published_at: Date
}

export async function fetchAllFeeds(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async feed => {
      const parsed = await parser.parseURL(feed.url)
      return parsed.items.map(item => ({
        title: item.title ?? '',
        summary: item.contentSnippet ?? item.summary ?? '',
        url: item.link ?? '',
        source: feed.source,
        published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
      }))
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<RawArticle[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(a => a.url && a.title)
}
```

### Article Enricher

```typescript
// lib/news/article-enricher.ts
import OpenAI from 'openai'
import type { RawArticle } from './rss-fetcher'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const NIFTY_SYMBOLS = ['RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','HINDUNILVR','ITC','SBIN',
  'BAJFINANCE','BHARTIARTL','KOTAKBANK','LT','ASIANPAINT','AXISBANK','MARUTI',
  'TITAN','NTPC','POWERGRID','ULTRACEMCO','WIPRO','HCLTECH','SUNPHARMA','ONGC',
  'TATAMOTORS','TATASTEEL','ADANIENT','ADANIPORTS','JSWSTEEL','BAJAJFINSV','TECHM']

export interface EnrichedArticle {
  mentioned_stocks: string[]
  category: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  summary: string
  embedding: number[]
}

export async function enrichArticle(article: RawArticle): Promise<EnrichedArticle> {
  const text = `${article.title}\n${article.summary}`
  const mentioned_stocks = NIFTY_SYMBOLS.filter(s => text.toUpperCase().includes(s))

  const [aiRes, embRes] = await Promise.all([
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 180,
      messages: [{
        role: 'user',
        content: `Analyze this Indian financial news. Return JSON:
        - category: markets | economy | company | mutual_funds | tax | global
        - sentiment: bullish | bearish | neutral
        - summary: 60-word plain English summary for retail investors

        Article: ${text.slice(0, 800)}`,
      }],
    }),
    openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 2000),
    }),
  ])

  const ai = JSON.parse(aiRes.choices[0].message.content ?? '{}')
  return {
    mentioned_stocks,
    category: ai.category ?? 'markets',
    sentiment: ai.sentiment ?? 'neutral',
    summary: ai.summary ?? article.summary,
    embedding: embRes.data[0].embedding,
  }
}
```

---

## 4D. Cron — News Ingestion

```typescript
// app/api/cron/ingest-news/route.ts
import { createClient } from '@supabase/supabase-js'
import { fetchAllFeeds } from '@/lib/news/rss-fetcher'
import { enrichArticle } from '@/lib/news/article-enricher'

export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const articles = await fetchAllFeeds()
  let saved = 0

  for (const article of articles.slice(0, 20)) {  // Process 20 per run to manage cost
    const { data: exists } = await supabase
      .from('news_articles').select('id').eq('url', article.url).maybeSingle()
    if (exists) continue

    const enriched = await enrichArticle(article)
    const { error } = await supabase.from('news_articles').insert({
      title: article.title,
      summary: enriched.summary,
      url: article.url,
      source: article.source,
      published_at: article.published_at.toISOString(),
      mentioned_stocks: enriched.mentioned_stocks,
      category: enriched.category,
      sentiment: enriched.sentiment,
      embedding: JSON.stringify(enriched.embedding),
    })
    if (!error) saved++
  }

  return Response.json({ saved })
}
```

---

## 4E. Personalisation + Feed API

```typescript
// app/api/news/feed/route.ts
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PERSONA_CATEGORIES: Record<string, string[]> = {
  curious_beginner: ['economy', 'mutual_funds', 'markets'],
  sip_investor:     ['mutual_funds', 'economy', 'markets'],
  active_trader:    ['markets', 'company', 'global'],
  hni:              ['company', 'economy', 'tax', 'global'],
  retiree:          ['economy', 'tax', 'mutual_funds'],
  nri:              ['global', 'economy', 'tax'],
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()
  const [{ data: profile }, { data: portfolio }] = await Promise.all([
    supabase.from('user_profiles').select('persona').eq('clerk_user_id', userId).single(),
    supabase.from('portfolio_holdings').select('symbol, allocation_pct').eq('clerk_user_id', userId),
  ])

  const persona = profile?.persona ?? 'curious_beginner'
  const preferredCategories = PERSONA_CATEGORIES[persona] ?? PERSONA_CATEGORIES.curious_beginner
  const portfolioSymbols = (portfolio ?? []).map(p => p.symbol)

  // Build user interest vector
  const userContext = `${persona} investor interested in ${preferredCategories.join(', ')} with holdings in ${portfolioSymbols.join(', ')}`
  const embRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: userContext })
  const embedding = embRes.data[0].embedding

  // Semantic search via pgvector
  const { data: articles } = await supabase.rpc('match_articles', {
    query_embedding: embedding,
    match_threshold: 0.45,
    match_count: 30,
    published_after: new Date(Date.now() - 86_400_000).toISOString(),
  })

  if (!articles) return Response.json([])

  // Score and sort
  const scored = (articles as any[]).map(a => {
    const affectedStocks = (portfolio ?? []).filter(h => a.mentioned_stocks?.includes(h.symbol))
    const portfolioImpactScore = affectedStocks.reduce((s, h) => s + h.allocation_pct, 0)
    const categoryBoost = preferredCategories.includes(a.category) ? 1.3 : 1.0
    const hoursSince = (Date.now() - new Date(a.published_at).getTime()) / 3_600_000
    const recency = hoursSince < 2 ? 1.0 : hoursSince < 8 ? 0.7 : 0.4
    const finalScore = (a.similarity * 0.4 + (portfolioImpactScore / 100) * 0.4 + recency * 0.2) * categoryBoost
    return { ...a, portfolioImpactScore, affectedStocks: affectedStocks.map(h => h.symbol), finalScore }
  })
  .sort((a, b) => b.finalScore - a.finalScore)
  .slice(0, 7)  // The Daily 7

  // Cache in user_news_feed
  if (scored.length > 0) {
    await supabase.from('user_news_feed').upsert(
      scored.map(a => ({
        clerk_user_id: userId,
        article_id: a.id,
        relevance_score: a.finalScore,
        portfolio_impact_score: a.portfolioImpactScore,
        portfolio_impact_stocks: a.affectedStocks,
      })),
      { onConflict: 'clerk_user_id,article_id' }
    )
  }

  return Response.json(scored)
}
```

---

## 4F. Frontend — Personalised Newsroom

```typescript
// app/news/page.tsx
'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Bookmark, ExternalLink, TrendingUp } from 'lucide-react'

const CAT_STYLE: Record<string, string> = {
  markets:       'bg-blue-50 text-blue-700',
  economy:       'bg-purple-50 text-purple-700',
  company:       'bg-orange-50 text-orange-700',
  mutual_funds:  'bg-green-50 text-green-700',
  tax:           'bg-yellow-50 text-yellow-700',
  global:        'bg-gray-100 text-gray-600',
}

const SENTIMENT_LABEL: Record<string, { text: string; color: string }> = {
  bullish: { text: '▲ Bullish', color: 'text-green-600' },
  bearish: { text: '▼ Bearish', color: 'text-red-600' },
  neutral: { text: '— Neutral', color: 'text-gray-400' },
}

export default function NewsPage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en')

  const { data: articles, isLoading } = useQuery({
    queryKey: ['news-feed'],
    queryFn: () => fetch('/api/news/feed').then(r => r.json()),
    staleTime: 30 * 60 * 1000,
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Briefing</h1>
          <p className="text-xs text-gray-400 mt-1">
            {isLoading ? 'Curating...' : `${articles?.length ?? 0} stories picked for you`}
          </p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
          {(['en', 'hi'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {l === 'en' ? 'English' : 'हिंदी'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {(articles ?? []).map((a: any, i: number) => {
            const sentiment = SENTIMENT_LABEL[a.sentiment] ?? SENTIMENT_LABEL.neutral
            return (
              <motion.article key={a.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CAT_STYLE[a.category] ?? 'bg-gray-100 text-gray-500'}`}>
                      {a.category?.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium ${sentiment.color}`}>{sentiment.text}</span>
                  </div>
                  <span className="text-xs text-gray-400">{a.source}</span>
                </div>

                {a.portfolioImpactScore > 0 && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                    <TrendingUp size={12} className="text-red-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-600">
                      AFFECTS YOUR HOLDINGS: {a.affectedStocks?.join(', ')}
                    </span>
                  </div>
                )}

                <h3 className="font-semibold text-gray-900 text-[15px] leading-snug mb-2">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {lang === 'hi' && a.summary_hi ? a.summary_hi : a.summary}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Full article <ExternalLink size={10} />
                  </a>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.location.href = `/chat?q=Explain this news and how it affects my portfolio: ${a.title}`}
                      className="text-xs text-blue-600 font-medium hover:text-blue-700">
                      Ask AI ↗
                    </button>
                    <button className="text-gray-400 hover:text-gray-600"><Bookmark size={14} /></button>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

## 4G. Hackathon Creative Edge

**Show two accounts side by side on stage** — same news articles exist in the DB, but a "Curious Beginner" and an "Active Trader" see completely different feeds, different depths, different article order. Same data. Completely different experience. The jury gets it immediately.

**On stage:** *"In 11 minutes of news reading, the average Indian investor wastes 9 minutes on irrelevant content. We give them the 2 that matter. Every article is filtered through their portfolio, their persona, and their goals. That red banner — 'AFFECTS YOUR HOLDINGS' — that is the feature no other Indian fintech has built."*

---

---

## Vercel Cron Config

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/ingest-signals", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/ingest-news",    "schedule": "0 */2 * * *" }
  ]
}
```

---

## Project Structure — Features 1–4

```
et-ai/
├── app/
│   ├── page.tsx                             # Landing
│   ├── onboarding/page.tsx                  # F1: Chat onboarding + persona reveal
│   ├── dashboard/
│   │   ├── page.tsx                         # Main dashboard
│   │   └── radar/page.tsx                  # F2: Opportunity Radar
│   ├── chat/page.tsx                        # F3: Market AI Chat
│   ├── news/page.tsx                        # F4: Personalised Newsroom
│   └── api/
│       ├── onboarding/chat/route.ts         # F1: Streaming onboarding
│       ├── profile/route.ts                 # F1: Profile read/write
│       ├── signals/route.ts                 # F2: Personalised signals GET
│       ├── chat/market/route.ts             # F3: Streaming chat + tools
│       ├── news/
│       │   └── feed/route.ts               # F4: Personalised feed
│       └── cron/
│           ├── ingest-signals/route.ts      # F2: NSE signal ingestion
│           └── ingest-news/route.ts         # F4: RSS + enrichment
│
├── lib/
│   ├── supabase.ts                          # DB client (server + public)
│   ├── market-data/
│   │   └── nse-client.ts                   # NSE APIs + Yahoo Finance
│   ├── ai/
│   │   ├── signal-scorer.ts                # F2: OpenAI signal scoring
│   │   └── chat-tools.ts                   # F3: Tool definitions + executor
│   └── news/
│       ├── rss-fetcher.ts                  # F4: RSS ingestion
│       └── article-enricher.ts             # F4: AI enrichment + embeddings
│
├── middleware.ts                            # Clerk auth
├── vercel.json                              # Cron schedule
└── .env.local                              # Keys
```

---

## OpenAI Cost Estimate — Hackathon Demo Scale

| Feature | Model | Est. tokens/day | Cost/day |
|---|---|---|---|
| Onboarding chat | gpt-4o-mini | ~5,000 | ~$0.005 |
| Signal scoring (cron) | gpt-4o-mini | ~40,000 | ~$0.04 |
| Market AI chat | gpt-4o | ~20,000 | ~$0.20 |
| News enrichment (cron) | gpt-4o-mini | ~80,000 | ~$0.08 |
| Embeddings | text-embedding-3-small | ~150,000 | ~$0.003 |
| **Total** | | | **~$0.33/day** |

Comfortably within standard OpenAI credit allocations for a hackathon build.

---