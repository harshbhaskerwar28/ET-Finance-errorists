'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Target, Landmark, Sparkles, ChevronRight,
  Calculator, PieChart, ShieldCheck, Users, TreePine,
  LifeBuoy, FileText, Settings, HelpCircle, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MoneyHealthTab } from './money-health-tab'
import { FireTab } from './fire-tab'
import { LifeEventTab } from './life-event-tab'
import { TaxWizardTab } from './tax-wizard-tab'

const tabs = [
  { id: 'health', name: 'Money Health', icon: Heart, description: 'Financial wellness score & diagnosis' },
  { id: 'fire', name: 'FIRE Planner', icon: Target, description: 'Early retirement & freedom roadmap' },
  { id: 'events', name: 'Life Events', icon: ShieldCheck, description: 'Goal advisor for home, wedding, etc.' },
  { id: 'tax', name: 'Tax Wizard', icon: Landmark, description: 'Regime comparison & optimization' },
]

export function PlanningView() {
  const [activeTab, setActiveTab] = useState('health')

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Tabs */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Intelligence Hub</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            AI-powered strategic planning to secure your future. Map out your journey from monthly health checkups to lifelong financial freedom.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-4 p-1 bg-muted/30 rounded-2xl w-fit border border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-background text-primary shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {tab.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-primary/5 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {activeTab === 'health' && <MoneyHealthTab />}
            {activeTab === 'fire' && <FireTab />}
            {activeTab === 'events' && <LifeEventTab />}
            {activeTab === 'tax' && <TaxWizardTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global AI Floating Prompt Placeholder */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Still have questions?</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Our specialized AI agents can simulate complex scenarios like joint home loans, early pension withdrawals, or global diversification.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
           <button className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all">"Should I prepay home loan?"</button>
           <button className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all">"Optimize my SIP for FIRE"</button>
           <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20">
             Open Advisor Inbox <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  )
}
