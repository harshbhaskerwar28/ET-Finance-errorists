'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Landmark, Sparkles, CheckCircle2, Calculator, Info, FileText, ArrowRight, Loader2, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

export function TaxWizardTab() {
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [data, setData] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [form, setForm] = useState({
    annual_income: 1500000,
    hra_received: 300000,
    actual_rent: 240000,
    section_80c: 150000,
    section_80d: 25000,
    nps_80ccd: 50000,
    home_loan_interest: 0,
    other_exemptions: 0
  })

  useEffect(() => {
    // In a real app, fetch from /api/tax/latest
    // For now, let's keep it interactive
    setLoading(false)
    setShowForm(true)
  }, [])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCalculating(true)
    // Simulate AI calculation
    setTimeout(() => {
      const { annual_income, section_80c, section_80d, nps_80ccd, hra_received, actual_rent, home_loan_interest } = form
      
      // Rough Old Regime
      const hra_exemption = Math.min(hra_received, actual_rent - (annual_income * 0.1), annual_income * 0.4)
      const total_deductions = Math.min(150000, section_80c) + Math.min(25000, section_80d) + Math.min(50000, nps_80ccd) + 50000 + hra_exemption + home_loan_interest
      const taxable_old = Math.max(0, annual_income - total_deductions)
      
      // Simple tax bracket for old
      let tax_old = 0
      if (taxable_old > 1000000) tax_old = 112500 + (taxable_old - 1000000) * 0.3
      else if (taxable_old > 500000) tax_old = 12500 + (taxable_old - 500000) * 0.2
      else if (taxable_old > 250000) tax_old = (taxable_old - 250000) * 0.05
      
      // New Regime (FY 2024-25 simplified)
      const taxable_new = Math.max(0, annual_income - 75000) // Standard deduction
      let tax_new = 0
      if (taxable_new > 1500000) tax_new = 150000 + (taxable_new - 1500000) * 0.3
      else if (taxable_new > 1200000) tax_new = 90000 + (taxable_new - 1200000) * 0.2
      else if (taxable_new > 1000000) tax_new = 60000 + (taxable_new - 1000000) * 0.15
      else if (taxable_new > 700000) tax_new = 30000 + (taxable_new - 700000) * 0.1
      else if (taxable_new > 300000) tax_new = (taxable_new - 300000) * 0.05

      setData({
        old_tax: tax_old,
        new_tax: tax_new,
        recommended: tax_new < tax_old ? 'New Regime' : 'Old Regime',
        savings: Math.abs(tax_old - tax_new),
        deductions: total_deductions
      })
      setCalculating(false)
      setShowForm(false)
    }, 1500)
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  if (showForm) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              Tax Optimization Wizard
            </h3>
            <p className="text-sm text-muted-foreground mt-1">FY 2024-25 Analysis (New vs Old Regime)</p>
          </div>
          <Calculator className="w-8 h-8 text-muted-foreground opacity-20" />
        </div>

        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gross Annual Salary (₹)</label>
            <div className="relative">
               <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input type="number" value={form.annual_income} onChange={e => setForm({...form, annual_income: +e.target.value})} className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/50 border-transparent focus:border-primary outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">80C Investments (₹)</label>
                <input type="number" value={form.section_80c} onChange={e => setForm({...form, section_80c: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border-transparent focus:border-primary outline-none text-sm" />
                <p className="text-[10px] text-muted-foreground">ELSS, PPF, LIC, EPF (Max 1.5L)</p>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">80D (Health Ins) (₹)</label>
                <input type="number" value={form.section_80d} onChange={e => setForm({...form, section_80d: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border-transparent focus:border-primary outline-none text-sm" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">NPS (80CCD(1B)) (₹)</label>
                <input type="number" value={form.nps_80ccd} onChange={e => setForm({...form, nps_80ccd: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border-transparent focus:border-primary outline-none text-sm" />
                <p className="text-[10px] text-muted-foreground">Additional 50k deduction</p>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Home Loan Interest (₹)</label>
                <input type="number" value={form.home_loan_interest} onChange={e => setForm({...form, home_loan_interest: +e.target.value})} className="w-full h-10 px-3 rounded-lg bg-muted/50 border-transparent focus:border-primary outline-none text-sm" />
             </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
             <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">HRA Optimization</h4>
             </div>
             <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span>HRA in Salary Slip (Yearly)</span>
                  <input type="number" value={form.hra_received} onChange={e => setForm({...form, hra_received: +e.target.value})} className="w-full h-8 px-2 rounded bg-background border border-border" />
                </div>
                <div className="space-y-1">
                  <span>Actual Rent Paid (Yearly)</span>
                  <input type="number" value={form.actual_rent} onChange={e => setForm({...form, actual_rent: +e.target.value})} className="w-full h-8 px-2 rounded bg-background border border-border" />
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={calculating}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
          >
            {calculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Compare Regimes & Optimize
          </button>
        </form>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
         {/* Recommendation Card */}
         <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
               <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Recommended</h3>
            <p className="text-3xl font-black text-foreground mb-4">{data.recommended}</p>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-6">
               <p className="text-xs font-medium text-emerald-400">Total Savings: {formatCurrency(data.savings)} / year</p>
            </div>
            <button onClick={() => setShowForm(true)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
               <ArrowRight className="w-3 h-3" /> Adjust Inputs
            </button>
         </div>

         {/* Breakdown Card */}
         <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
               <FileText className="w-4 h-4 text-muted-foreground" />
               Tax Breakdown
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm font-medium">New Regime Tax</span>
                  <span className={cn("text-lg font-bold", data.recommended === 'New Regime' ? 'text-primary' : '')}>{formatCurrency(data.new_tax)}</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm font-medium">Old Regime Tax</span>
                  <span className={cn("text-lg font-bold", data.recommended === 'Old Regime' ? 'text-primary' : '')}>{formatCurrency(data.old_tax)}</span>
               </div>
               <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs">Total Deductions Used (Old)</span>
                  <span className="text-xs font-bold">{formatCurrency(data.deductions)}</span>
               </div>
            </div>
         </div>
      </div>

      {/* AI Tips */}
      <div className="bg-card border border-border rounded-xl p-6">
         <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Optimization Strategies</h4>
         <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "NPS Tier 1", desc: "Invest additional ₹50,000 to save up to ₹15,600 in tax (30% bracket).", action: "Open NPS Account" },
              { title: "ELSS Funds", desc: "Equity Linked Savings Schemes offer the shortest lock-in (3 years) under 80C.", action: "View ELSS Funds" },
              { title: "Parent's Health", desc: "Claim up to ₹50,000 for health insurance of senior citizen parents.", action: "Add 80D Entry" }
            ].map((tip, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/20 border border-transparent hover:border-primary/20 transition-all flex flex-col justify-between">
                 <div>
                   <h5 className="font-bold text-sm mb-1">{tip.title}</h5>
                   <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                 </div>
                 <button className="mt-4 text-[10px] font-bold text-primary uppercase text-left hover:underline">{tip.action} →</button>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}
