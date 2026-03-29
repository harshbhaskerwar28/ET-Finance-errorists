'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendingUp, Sparkles, Shield, Zap, BarChart2,
  Newspaper, ArrowRight, ChevronRight, Star
} from 'lucide-react'

// ─── Stats bar ───────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Active Users', value: '12,000+' },
  { label: 'Signals Generated', value: '3.4M+' },
  { label: 'Avg Portfolio Return', value: '+18.4%' },
  { label: 'News Articles/Day', value: '500+' },
]

// ─── Feature cards ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Sparkles,
    tag: 'AI Onboarding',
    title: 'Knows you before you sit down',
    desc: 'A 2-minute chat builds your complete investor profile. No forms. No jargon. Just a conversation — and a personalised dashboard waiting at the end.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    icon: Zap,
    tag: 'Opportunity Radar',
    title: 'Signals that affect YOUR money',
    desc: 'Not 200 generic alerts — just the 3 NSE signals that impact stocks you actually hold. Insider buys, bulk deals, breakouts — scored and ranked for you.',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
  },
  {
    icon: BarChart2,
    tag: 'Market AI Chat',
    title: 'Ask anything. Get answers with sources.',
    desc: 'Portfolio-aware streaming chat. The AI already read your holdings before you typed. Ask about your mid-cap pharma exposure — watch it check live NSE data.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
  },
  {
    icon: Newspaper,
    tag: 'Curated News',
    title: 'News filtered for your portfolio',
    desc: 'ET, Mint, RBI feeds — summarised, translated to Hindi on demand, and tagged with "AFFECTS YOUR PORTFOLIO" when relevant. Zero noise.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
  },
]

// ─── Persona previews ─────────────────────────────────────────────────────────
const PERSONAS = [
  { emoji: '🌱', name: 'The Curious Learner', sub: 'Just starting out' },
  { emoji: '🏗️', name: 'The Steady Builder', sub: 'SIP investor' },
  { emoji: '🦅', name: 'The Market Hawk', sub: 'Active trader' },
  { emoji: '🏛️', name: 'The Wealth Architect', sub: 'HNI profile' },
  { emoji: '🛡️', name: 'The Capital Guardian', sub: 'Retiree' },
  { emoji: '🌏', name: 'The Global Investor', sub: 'NRI profile' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ET</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">ET AI</span>
            <span className="hidden sm:inline text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-1">
              Investment Intelligence
            </span>
          </div>

          {/* Nav right */}
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-4 pt-24 pb-20 text-center">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6">
            <Star className="w-3.5 h-3.5 fill-current" />
            Built for Indian Retail Investors · Powered by GPT-4o
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Your Personal
            <br />
            <span className="text-primary">AI Financial</span>
            <br />
            Co-Pilot
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time NSE market signals, portfolio-aware news, and a conversational advisor
            that already knows your investments — before you say a word.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 border border-border text-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-muted transition-all"
            >
              Sign In
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            No credit card required · 2-minute setup · Google sign-in supported
          </p>
        </motion.div>

        {/* Demo card preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="relative mt-16 mx-auto max-w-3xl"
        >
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-warning/70" />
              <div className="w-3 h-3 rounded-full bg-primary/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">ET AI · Dashboard</span>
            </div>
            {/* Fake signal cards */}
            <div className="space-y-3">
              {[
                { sym: 'RELIANCE', badge: 'INSIDER BUY', score: 9.2, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', impact: true },
                { sym: 'TCS', badge: 'EARNINGS BEAT', score: 7.8, color: 'text-green-400 bg-green-400/10 border-green-400/20', impact: false },
                { sym: 'HDFCBANK', badge: 'BREAKOUT', score: 6.4, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', impact: true },
              ].map((s) => (
                <div key={s.sym} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{s.sym}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${s.color}`}>{s.badge}</span>
                    </div>
                    {s.impact && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-semibold text-red-400">AFFECTS YOUR PORTFOLIO</span>
                      </div>
                    )}
                  </div>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                    s.score > 8 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {s.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl font-black text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">
            Everything a retail investor needs.
            <br />
            <span className="text-primary">Nothing they don't.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Four powerful features working together — each one designed for the way real Indians invest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.bg}`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${f.color}`}>{f.tag}</span>
              <h3 className="text-xl font-bold mt-2 mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Persona section ─────────────────────────────────────────────── */}
      <section className="bg-card/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">We adapt to <span className="text-primary">who you are</span></h2>
            <p className="text-muted-foreground">Answer 5 questions. Get a personalised profile. The app changes for you.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PERSONAS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-background border border-border rounded-2xl p-4 text-center hover:border-primary/40 transition-colors"
              >
                <div className="text-4xl mb-3">{p.emoji}</div>
                <p className="text-xs font-bold leading-tight">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Bottom ─────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Start your financial journey
            <br />
            <span className="text-primary">in 2 minutes.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Every other app gives you the same Bloomberg terminal with an Indian skin.
            We built a personal analyst who already read your portfolio before you opened the app.
          </p>
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-5 rounded-xl font-bold text-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25"
          >
            Get Started Free
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">Free forever · No credit card</p>
        </motion.div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">ET</span>
            </div>
            <span className="text-sm text-muted-foreground">ET AI Investment Intelligence</span>
          </div>
          <p className="text-xs text-muted-foreground">
            For informational purposes only. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
