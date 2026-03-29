'use client'

import { useChat } from 'ai/react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type SupabaseProfile } from '@/lib/store'
import { Send, Sparkles, TrendingUp, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Persona metadata ────────────────────────────────────────────────────────
const PERSONA_DATA = {
  curious_beginner: {
    title: 'The Curious Learner',
    emoji: '🌱',
    gradient: 'from-emerald-500 to-green-700',
    color: 'text-emerald-400',
    insights: [
      'Every term gets explained before we use it',
      'Your news feed starts with investing basics',
      'Gentle alerts — no jargon, no panic',
    ],
  },
  sip_investor: {
    title: 'The Steady Builder',
    emoji: '🏗️',
    gradient: 'from-blue-500 to-indigo-700',
    color: 'text-blue-400',
    insights: [
      'SIP goal progress shown front and centre',
      'We flag when your funds underperform category',
      'News filtered for long-term investors like you',
    ],
  },
  active_trader: {
    title: 'The Market Hawk',
    emoji: '🦅',
    gradient: 'from-orange-500 to-red-700',
    color: 'text-orange-400',
    insights: [
      'Technical breakouts alert you first',
      'Bulk and block deal tracker always on',
      'Real-time NSE signals, no delay',
    ],
  },
  hni: {
    title: 'The Wealth Architect',
    emoji: '🏛️',
    gradient: 'from-purple-500 to-violet-700',
    color: 'text-purple-400',
    insights: [
      'Tax optimisation opportunities surfaced proactively',
      'Sector FII flow tracked for your allocation',
      'Estate and wealth planning prompts included',
    ],
  },
  retiree: {
    title: 'The Capital Guardian',
    emoji: '🛡️',
    gradient: 'from-teal-500 to-cyan-700',
    color: 'text-teal-400',
    insights: [
      'Capital preservation signals prioritised',
      'Dividend and FD rate alerts on',
      'Low-volatility news focus',
    ],
  },
  nri: {
    title: 'The Global Investor',
    emoji: '🌏',
    gradient: 'from-amber-500 to-orange-700',
    color: 'text-amber-400',
    insights: [
      'NRE and FCNR rate alerts included',
      'DTAA and remittance news prioritised',
      'USD-INR rate tracked for you',
    ],
  },
} as const

type PersonaKey = keyof typeof PERSONA_DATA

// ─── Welcome screen ──────────────────────────────────────────────────────────
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="mb-8"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-primary/20">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">ET</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Your AI-Powered
          <br />
          <span className="text-primary">Financial Co-Pilot</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
          We{"'"}ll have a quick 2-minute conversation to understand your financial goals — no forms, just a chat.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-2xl w-full"
      >
        {[
          { icon: TrendingUp, label: 'Market Intelligence', desc: 'Real-time signals & patterns' },
          { icon: Sparkles, label: 'AI Advisory', desc: 'Personalised recommendations' },
          { icon: Shield, label: 'Portfolio Guard', desc: 'Risk monitoring & alerts' },
        ].map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="p-4 rounded-xl bg-card border border-border"
          >
            <feature.icon className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-medium text-sm">{feature.label}</h3>
            <p className="text-xs text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onStart}
        className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all"
      >
        Start My Financial Journey
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-xs text-muted-foreground mt-4"
      >
        Takes only 2 minutes · Completely private
      </motion.p>
    </motion.div>
  )
}

// ─── Persona reveal card ─────────────────────────────────────────────────────
function PersonaReveal({
  personaKey,
  firstName,
  onContinue,
}: {
  personaKey: PersonaKey
  firstName: string
  onContinue: () => void
}) {
  const p = PERSONA_DATA[personaKey]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-6 bg-background"
    >
      <div className="max-w-sm w-full text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-sm mb-4"
        >
          {firstName ? `Great to meet you, ${firstName}!` : 'Profile Complete'}
        </motion.p>

        <motion.div
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className={cn(
            'rounded-3xl p-8 bg-gradient-to-br text-white mb-6 shadow-2xl',
            p.gradient
          )}
        >
          <div className="text-7xl mb-4">{p.emoji}</div>
          <p className="text-white/70 text-sm mb-1">You are a</p>
          <h2 className="text-3xl font-black">{p.title}</h2>
        </motion.div>

        <div className="space-y-2.5 mb-8">
          {p.insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.12 }}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 text-left"
            >
              <span className="text-primary font-bold text-base">✓</span>
              <span className="text-muted-foreground text-sm">{insight}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
        >
          Open My Dashboard →
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Main Onboarding Chat ────────────────────────────────────────────────────
function OnboardingChat({ onComplete }: { onComplete: () => void }) {
  const { setUserProfile } = useAppStore()
  const [persona, setPersona] = useState<PersonaKey | null>(null)
  const [firstName, setFirstName] = useState('')
  const [showReveal, setShowReveal] = useState(false)
  const [extractedProfile, setExtractedProfile] = useState<SupabaseProfile | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/onboarding/chat',
    initialMessages: [
      {
        id: 'init',
        role: 'assistant',
        content:
          "Hey! 👋 I'm your ET AI financial co-pilot. Before we set things up, I'd love to understand a bit about you. What's your first name?",
      },
    ],
    onFinish: (message) => {
      const match = message.content.match(/<PROFILE>(.*?)<\/PROFILE>/s)
      if (match) {
        try {
          const raw = JSON.parse(match[1])
          const profile: SupabaseProfile = {
            id: '',
            clerk_user_id: '',
            first_name: raw.first_name ?? null,
            persona: raw.persona ?? null,
            risk_score: raw.risk_score ?? null,
            income_range: null,
            monthly_investment_capacity: raw.monthly_capacity ?? null,
            primary_goal: raw.primary_goal ?? null,
            goal_horizon_years: raw.goal_horizon ?? null,
            has_existing_portfolio: raw.has_portfolio ?? false,
            preferred_language: 'en',
            onboarding_completed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setExtractedProfile(profile)
          setUserProfile(profile)
          setFirstName(raw.first_name ?? '')
          setPersona(raw.persona as PersonaKey)
          setTimeout(() => setShowReveal(true), 600)
        } catch (e) {
          console.error('Failed to parse profile:', e)
        }
      }
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const progress = Math.min(userMessageCount * 15, 90)

  const handleRevealContinue = () => {
    if (extractedProfile) setUserProfile(extractedProfile)
    onComplete()
  }

  if (showReveal && persona) {
    return (
      <PersonaReveal
        personaKey={persona}
        firstName={firstName}
        onContinue={handleRevealContinue}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">ET</span>
          </div>
          <span className="text-sm font-medium">Setting up your profile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 60 }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const content = m.content.replace(/<PROFILE>.*?<\/PROFILE>/s, '').trim()
            if (!content) return null
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <span className="text-[9px] font-bold text-primary">ET</span>
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-sm'
                  )}
                >
                  {content}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-primary">ET</span>
            </div>
            <div className="bg-card border border-border px-4 py-3.5 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block w-2 h-2 bg-muted-foreground rounded-full"
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-border">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your answer..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50 transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Root export (used by AppShell when hasCompletedOnboarding is false) ─────
export function OnboardingFlow() {
  const { completeOnboarding } = useAppStore()
  const [started, setStarted] = useState(false)

  const handleComplete = () => {
    completeOnboarding()
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {!started ? (
          <WelcomeScreen key="welcome" onStart={() => setStarted(true)} />
        ) : (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <OnboardingChat onComplete={handleComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
