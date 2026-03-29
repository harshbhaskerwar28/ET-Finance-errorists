'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, RefreshCw, Sparkles, CheckCircle, Clock, AlertTriangle, ChevronRight, Loader2, PiggyBank, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(v: number, short = false) {
  if (short) {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

export function FireTab() {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [form, setForm] = useState({
    current_age: 30,
    target_retirement_age: 45,
    monthly_income: 150000,
    monthly_expenses: 60000,
    current_investments: 2000000,
    risk_profile: 'moderate'
  })

  useEffect(() => {
    fetch('/api/fire-planner/latest')
      .then(r => r.json())
      .then(d => {
        if (d.plan) setPlan(d.plan)
        else setShowForm(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCalculating(true)
    try {
      const res = await fetch('/api/fire-planner/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const result = await res.json()
      setPlan(result)
      setShowForm(false)
    } catch (e) {
      console.error(e)
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Mapping your journey to financial freedom...</p>
      </div>
    )
  }

  if (showForm) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            FIRE Planning Engine
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Define your goals and we'll calculate your path to early retirement.</p>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Age</label>
              <input type="number" value={form.current_age} onChange={e => setForm({...form, current_age: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Retirement Age</label>
              <input type="number" value={form.target_retirement_age} onChange={e => setForm({...form, target_retirement_age: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Income (₹)</label>
              <input type="number" value={form.monthly_income} onChange={e => setForm({...form, monthly_income: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Expenses (₹)</label>
              <input type="number" value={form.monthly_expenses} onChange={e => setForm({...form, monthly_expenses: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Liquid Investments (₹)</label>
            <input type="number" value={form.current_investments} onChange={e => setForm({...form, current_investments: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Risk Profile</label>
            <div className="grid grid-cols-3 gap-2">
              {(['conservative', 'moderate', 'aggressive'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({...form, risk_profile: p})}
                  className={cn("h-10 rounded-lg text-xs font-medium border transition-all capitalize",
                    form.risk_profile === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-transparent hover:border-primary/50"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={calculating}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
          >
            {calculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate FIRE Roadmap
          </button>
        </form>
      </motion.div>
    )
  }

  const completion = Math.min((plan.current_investments / plan.target_corpus) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Current Age', value: plan.current_age, icon: Clock },
          { label: 'Target FIRE Age', value: plan.target_retirement_age, icon: Target },
          { label: 'Target Corpus', value: formatCurrency(plan.target_corpus, true), icon: PiggyBank },
          { label: 'Projected Age', value: plan.projected_fire_age, icon: Sparkles, color: plan.projected_fire_age <= plan.target_retirement_age ? 'text-primary' : 'text-accent' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
             <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
               <stat.icon className="w-3.5 h-3.5" />
               {stat.label}
             </div>
             <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Card */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Progress to Financial Independence</h3>
          <span className="text-sm font-bold text-primary">{completion.toFixed(1)}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Invested Value</p>
              <p className="text-lg font-bold">{formatCurrency(plan.current_investments)}</p>
           </div>
           <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Monthly SIP Required</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(plan.monthly_sip_required)}</p>
           </div>
        </div>
      </div>

      {/* AI Narrative */}
      {plan.ai_narrative && (
        <div className="bg-card border border-primary/20 bg-primary/5 rounded-xl p-4 md:p-6 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary">AI Strategy Insights</h3>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80 italic mb-4">"{plan.ai_narrative}"</p>
          <div className="grid md:grid-cols-2 gap-4 pb-4">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Milestones</h4>
              <div className="space-y-3">
                 {plan.yearly_milestones.slice(0, 5).map((m: any, i: number) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold">Y{i+1}</span>
                      </div>
                      <div className="flex-1 border-b border-border pb-2">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="font-medium">Age {m.age} ({m.year})</span>
                        </div>
                        <p className="text-sm font-bold">{formatCurrency(m.corpus, true)}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Asset Allocation Recommendation</h4>
              <div className="space-y-3">
                 {Object.entries(plan.allocation_plan || {}).map(([key, value]: any) => (
                   <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-bold">{value}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center -mb-4 pt-2">
              <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-background border border-border rounded-full text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Adjust Plan Inputs
              </button>
          </div>
        </div>
      )}
    </div>
  )
}
