'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, RefreshCw, Sparkles, CheckCircle, Clock, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

export function MoneyHealthTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [form, setForm] = useState({
    monthly_income: 100000,
    monthly_expenses: 50000,
    liquid_savings: 300000,
    life_cover_amount: 10000000,
    health_cover_amount: 500000,
    total_emi: 15000,
    tax_investments_80c: 120000,
    uses_nps: true,
    retirement_savings: 500000,
    age: 30
  })

  useEffect(() => {
    fetch('/api/money-health/latest')
      .then(r => r.json())
      .then(d => {
        if (d.assessment) setData(d.assessment)
        else setShowForm(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCalculating(true)
    try {
      const res = await fetch('/api/money-health/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const result = await res.json()
      setData({ ...form, ...result })
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
        <p className="text-muted-foreground">Diagnosing your money health...</p>
      </div>
    )
  }

  if (showForm) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Money Health Checkup
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Answer a few questions to get your personalized financial health score.</p>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Fund (Current Balance)</label>
              <input type="number" value={form.liquid_savings} onChange={e => setForm({...form, liquid_savings: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total EMIs (Monthly)</label>
              <input type="number" value={form.total_emi} onChange={e => setForm({...form, total_emi: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Life Insurance Cover (₹ Sum Assured)</label>
              <input type="number" value={form.life_cover_amount} onChange={e => setForm({...form, life_cover_amount: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Health Insurance Cover (₹)</label>
              <input type="number" value={form.health_cover_amount} onChange={e => setForm({...form, health_cover_amount: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Income Tax 80C used (₹)</label>
              <input type="number" value={form.tax_investments_80c} onChange={e => setForm({...form, tax_investments_80c: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Retirement Corpus (PPF, EPF, NPS, Shares)</label>
              <input type="number" value={form.retirement_savings} onChange={e => setForm({...form, retirement_savings: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={calculating}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
          >
            {calculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Calculate Money Health Score
          </button>
        </form>
      </motion.div>
    )
  }

  const overall = Math.round(data.overall_score * 10)
  const dimensions = [
    { name: 'Emergency Fund', score: Math.round(data.score_emergency * 10), status: data.score_emergency >= 8 ? 'excellent' : data.score_emergency >= 6 ? 'good' : 'needs_attention', advice: data.score_emergency < 6 ? 'Build 6 months of expenses as buffer.' : 'Your buffer is strong.' },
    { name: 'Insurance Coverage', score: Math.round(data.score_insurance * 10), status: data.score_insurance >= 8 ? 'excellent' : data.score_insurance >= 6 ? 'good' : 'needs_attention', advice: data.score_insurance < 6 ? 'Increase your term or health cover.' : 'You are well-covered.' },
    { name: 'Debt & EMI Health', score: Math.round(data.score_debt * 10), status: data.score_debt >= 8 ? 'excellent' : data.score_debt >= 6 ? 'good' : 'needs_attention', advice: data.score_debt < 6 ? 'High EMIs! Try to prepay loans.' : 'Debt is under control.' },
    { name: 'Tax Efficiency', score: Math.round(data.score_tax * 10), status: data.score_tax >= 8 ? 'excellent' : 'average', advice: data.score_tax < 8 ? 'Maximize 80C and NPS benefits.' : 'Great job on tax saving.' },
  ]

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider">Overall Health</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="none" className="text-muted" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="none" strokeDasharray={`${(overall / 100) * 440} 440`}
                  className={cn("transition-all duration-1000", overall >= 80 ? "text-primary" : overall >= 60 ? "text-chart-3" : "text-accent")}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-5xl font-bold tabular-nums">{overall}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className={cn("text-lg font-semibold", overall >= 80 ? "text-primary" : overall >= 60 ? "text-chart-3" : "text-accent")}>
              {overall >= 80 ? 'Excellent' : overall >= 60 ? 'Good' : 'Needs Attention'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Based on your recent financial checkup</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-xs font-medium text-primary hover:underline flex items-center gap-1 mx-auto">
              <RefreshCw className="w-3 h-3" /> Update Checkup
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
          {dimensions.map((dim) => (
            <div key={dim.name} className={cn("p-4 rounded-xl border border-border transition-all hover:bg-muted/30",
              dim.status === 'excellent' ? "bg-primary/5" : dim.status === 'good' ? "bg-primary/5" : "bg-accent/5")}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{dim.name}</h4>
                {dim.status === 'excellent' || dim.status === 'good' ? <CheckCircle className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-accent" />}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", dim.status === 'excellent' || dim.status === 'good' ? "bg-primary" : "bg-accent")} style={{ width: `${dim.score}%` }} />
                </div>
                <span className="text-lg font-bold tabular-nums">{dim.score}</span>
              </div>
              <p className="text-xs text-muted-foreground">{dim.advice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Actions */}
      {data.top_actions && data.top_actions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Prescribed Actions</h3>
          </div>
          <div className="space-y-3">
            {data.top_actions.map((rec: any, i: number) => (
              <div key={i} className="flex items-start justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors border border-transparent hover:border-border">
                <div className="flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", rec.priority === 'high' ? "bg-accent" : "bg-chart-3")} />
                  <div>
                    <h4 className="font-semibold text-sm">{rec.action}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.how_to || 'Follow this step to improve your score.'}</p>
                  </div>
                </div>
                {rec.estimated_impact && (
                  <div className="text-right shrink-0">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Impact</p>
                     <p className="text-xs font-bold text-primary">{rec.estimated_impact}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
