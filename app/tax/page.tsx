"use client"

import { useState, useMemo } from "react"
import { Calculator, CheckCircle, Info, IndianRupee, Sparkles, ChevronRight, AlertTriangle, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) { return n.toLocaleString("en-IN", { maximumFractionDigits: 0 }) }

// FY 2024-25 Indian Tax Calculation
function calcTaxOld(gross: number, deductions: number): number {
  const taxable = Math.max(0, gross - deductions)
  let tax = 0
  if (taxable <= 250000) tax = 0
  else if (taxable <= 500000) tax = (taxable - 250000) * 0.05
  else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20
  else tax = 112500 + (taxable - 1000000) * 0.30
  if (taxable <= 500000) tax = 0 // Sec 87A rebate
  return Math.round(tax * 1.04) // +4% cess
}

function calcTaxNew(gross: number): number {
  const taxable = Math.max(0, gross - 75000) // Standard Deduction increased to 75k
  let tax = 0
  if (taxable <= 300000) tax = 0
  else if (taxable <= 700000) tax = (taxable - 300000) * 0.05
  else if (taxable <= 1000000) tax = 20000 + (taxable - 700000) * 0.10
  else if (taxable <= 1200000) tax = 50000 + (taxable - 1000000) * 0.15
  else if (taxable <= 1500000) tax = 80000 + (taxable - 1200000) * 0.20
  else tax = 140000 + (taxable - 1500000) * 0.30
  if (taxable <= 700000) tax = 0 // Sec 87A rebate
  return Math.round(tax * 1.04) // +4% cess
}

const EXAMPLES = [
  { name: "Mid-Level Professional", gross: "1200000", hra: "150000", c80: "150000", d80: "25000", nps: "50000", loan: "0" },
  { name: "HNI / Senior Manager", gross: "3500000", hra: "400000", c80: "150000", d80: "75000", nps: "50000", loan: "200000" },
  { name: "Entry Level / Junior", gross: "650000", hra: "40000", c80: "150000", d80: "0", nps: "0", loan: "0" },
]

export default function TaxPage() {
  const [gross, setGross] = useState("")
  const [hra, setHra] = useState("")
  const [c80, setC80] = useState("")
  const [d80, setD80] = useState("")
  const [nps, setNps] = useState("")
  const [loan, setLoan] = useState("")

  const loadExample = (e: (typeof EXAMPLES)[0]) => {
    setGross(e.gross); setHra(e.hra); setC80(e.c80); setD80(e.d80); setNps(e.nps); setLoan(e.loan)
  }

  const res = useMemo(() => {
    const g = parseFloat(gross) || 0
    if (g <= 0) return null
    const stdOld = 50000
    const h = parseFloat(hra) || 0
    const c = Math.min(parseFloat(c80) || 0, 150000)
    const d = Math.min(parseFloat(d80) || 0, 75000)
    const n = Math.min(parseFloat(nps) || 0, 50000)
    const l = Math.min(parseFloat(loan) || 0, 200000)

    const totalOldDed = stdOld + h + c + d + n + l
    const taxOld = calcTaxOld(g, totalOldDed)
    const taxNew = calcTaxNew(g)
    const save = taxOld - taxNew
    const reco = taxNew <= taxOld ? "new" : "old"

    return { g, totalOldDed, taxOld, taxNew, save: Math.abs(save), reco }
  }, [gross, hra, c80, d80, nps, loan])

  const fields = [
    { label: "Gross Salary", val: gross, set: setGross, ph: "e.g. 15,00,000", req: true },
    { label: "HRA Exempt", val: hra, set: setHra, ph: "e.g. 1,80,000" },
    { label: "Section 80C", val: c80, set: setC80, ph: "Max 1.5 Lakh" },
    { label: "Section 80D", val: d80, set: setD80, ph: "Max 75k" },
    { label: "NPS (80CCD)", val: nps, set: setNps, ph: "Max 50k" },
    { label: "Home Loan (24B)", val: loan, set: setLoan, ph: "Max 2 Lakh" },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Tax Wizard FY 24-25</h1>
          <p className="text-gray-500 text-sm">Compare Old vs New Tax Regimes with live Indian slabs.</p>
        </div>
        <div className="flex gap-2 h-10 overflow-x-auto pb-1 max-w-[400px] hide-scrollbar items-center">
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1 shrink-0"><Lightbulb className="h-3 w-3 text-yellow-500" /> Examples:</span>
          {EXAMPLES.map(ex => (
            <button key={ex.name} onClick={() => loadExample(ex)} className="px-3 py-1 bg-[#1a1f2e] border border-gray-800 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white hover:border-gray-600 whitespace-nowrap transition-all uppercase tracking-tight active:scale-95">
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <aside className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0c10]/80 p-5 sticky top-20">
            <h2 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2"><IndianRupee className="h-4 w-4 text-emerald-500" /> Income & Deductions</h2>
            <div className="space-y-3.5">
              {fields.map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.label} {f.req && <span className="text-red-500">*</span>}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                    <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-4">
          {!res ? (
            <div className="rounded-xl border border-dashed border-[#1a1f2e] py-16 text-center">
              <Calculator className="h-10 w-10 text-gray-800 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">Enter your salary to see the comparison</p>
              <p className="text-xs text-gray-600">Or use one of the examples above for a quick test.</p>
            </div>
          ) : (
            <>
              <div className={cn("rounded-xl border p-5 transition-all shadow-lg", res.reco === "new" ? "border-emerald-500/30 bg-emerald-500/10" : "border-blue-500/30 bg-blue-500/10")}>
                <div className="flex items-start gap-3">
                  <CheckCircle className={cn("h-6 w-6 mt-0.5", res.reco === "new" ? "text-emerald-400" : "text-blue-400")} />
                  <div>
                    <h3 className="font-bold text-white text-lg">{res.reco === "new" ? "New Regime is Better" : "Old Regime is Better"}</h3>
                    <p className={cn("text-sm font-semibold mt-0.5", res.reco === "new" ? "text-emerald-500" : "text-blue-500")}>Save ₹{fmt(res.save)}/year by choosing this regime</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={cn("rounded-xl border p-5 relative", res.reco === "old" ? "border-blue-500/30 bg-blue-500/5 ring-1 ring-blue-500/20" : "border-[#1a1f2e] bg-[#0a0c10]/80")}>
                  {res.reco === "old" && <span className="absolute -top-2 left-4 text-[9px] font-bold uppercase py-0.5 px-2 bg-blue-600 text-white rounded-full">Recommended</span>}
                  <h3 className="font-bold text-white mb-4 text-sm uppercase text-gray-400">Old Tax Regime</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-gray-500 uppercase font-medium tracking-wider"><span>Taxable</span><span className="text-white">₹{fmt(Math.max(0, res.g - res.totalOldDed))}</span></div>
                    <div className="flex justify-between text-gray-500 uppercase font-medium tracking-wider"><span>Deductions</span><span className="text-emerald-400">-₹{fmt(res.totalOldDed)}</span></div>
                    <div className="border-t border-[#1a1f2e] pt-2 flex justify-between text-gray-500 uppercase font-bold tracking-wider"><span>Tax Payable</span><span className="text-red-400 text-sm">₹{fmt(res.taxOld)}</span></div>
                  </div>
                </div>

                <div className={cn("rounded-xl border p-5 relative", res.reco === "new" ? "border-emerald-500/30 bg-emerald-500/10 ring-1 ring-emerald-500/20" : "border-[#1a1f2e] bg-[#0a0c10]/80")}>
                  {res.reco === "new" && <span className="absolute -top-2 left-4 text-[9px] font-bold uppercase py-0.5 px-2 bg-emerald-600 text-white rounded-full">Recommended</span>}
                  <h3 className="font-bold text-white mb-4 text-sm uppercase text-gray-400">New Tax Regime</h3>
                  <div className="space-y-2.5 text-xs">
                     <div className="flex justify-between text-gray-500 uppercase font-medium tracking-wider"><span>Taxable</span><span className="text-white">₹{fmt(Math.max(0, res.g - 75000))}</span></div>
                    <div className="flex justify-between text-gray-500 uppercase font-medium tracking-wider"><span>Std. Deduction</span><span className="text-emerald-400">-₹75,000</span></div>
                    <div className="border-t border-[#1a1f2e] pt-2 flex justify-between text-gray-500 uppercase font-bold tracking-wider"><span>Tax Payable</span><span className="text-red-400 text-sm">₹{fmt(res.taxNew)}</span></div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0c10]/80 p-5 space-y-4 shadow-inner">
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><Sparkles className="h-4 w-4 text-yellow-500" /> AI Optimization Insight</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#1a1f2e] bg-[#1a1f2e]/20">
                    <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {res.save > 0 
                        ? `Choosing the ${res.reco.toUpperCase()} REGIME saves you the equivalent of ₹${fmt(res.save/12)} per month in SIP potential.` 
                        : "Both regimes appear identical for your current income structure."}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
                    <p className="text-xs text-emerald-600 font-medium leading-relaxed">
                      FY 2024-25 Budget Update: Standard deduction is now ₹75,000 in the New Regime, and tax slabs have been relaxed. {res.reco === 'new' ? 'This makes the New Regime highly attractive for you.' : 'The deductions you have mean the Old Regime still wins.'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0c10]/80 p-5 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-500 mt-1 shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">Calculations are based on current Union Budget 2024 announcements. Always consult a Tax Professional (CA) for official filings. ET AI data is for educational simulation only.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
