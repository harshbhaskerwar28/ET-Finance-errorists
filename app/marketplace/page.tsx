"use client"

import { useStore, type Persona } from "@/lib/store"
import { CreditCard, Home, Shield, IndianRupee, TrendingUp, Sparkles, CheckCircle2, ArrowRight, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Product {
  id: string
  category: string
  title: string
  description: string
  whyYou: string
  tags: string[]
  icon: React.ElementType
  gradient: string
  cta: string
  personas: Persona[]
}

const ALL_PRODUCTS: Product[] = [
  {
    id: "hdfc-regalia",
    category: "Credit Card",
    title: "HDFC Regalia Gold",
    description: "5X points on travel & dining. Complimentary lounge access.",
    whyYou: "As an Active Trader, high discretionary spend means maximum rewards.",
    tags: ["Pre-Approved", "Travel & Dining"],
    icon: CreditCard,
    gradient: "from-blue-600/20 to-indigo-600/20 border-blue-500/30",
    cta: "Check Eligibility",
    personas: ["active_trader", "hni", "nri"],
  },
  {
    id: "nps",
    category: "NPS Investment",
    title: "NPS Tier 1",
    description: "Extra ₹50,000 tax deduction under 80CCD(1B). Equity-heavy allocation.",
    whyYou: "With your income, NPS reduces your tax bill by ₹15,600+ annually.",
    tags: ["Tax Saving (80CCD)", "Retirement"],
    icon: IndianRupee,
    gradient: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    cta: "Open Account",
    personas: ["active_trader", "sip_investor", "hni", "beginner"],
  },
  {
    id: "term-insurance",
    category: "Term Insurance",
    title: "Max Life Smart Secure",
    description: "₹2 Crore cover till age 75. Low premium for younger age.",
    whyYou: "Your insurance gap is significant. A ₹2 Cr cover gives security.",
    tags: ["Safe", "Tax Saving (80C)"],
    icon: Shield,
    gradient: "from-red-500/20 to-orange-500/20 border-red-500/30",
    cta: "Free Quote",
    personas: ["beginner", "sip_investor", "active_trader"],
  },
  {
    id: "hni-pms",
    category: "Portfolio Management",
    title: "ET Direct PMS",
    description: "Expert-managed direct equity portfolio with stock selection.",
    whyYou: "For HNI investors, PMS offers efficiency and customization.",
    tags: ["HNI Exclusive", "₹50L Min"],
    icon: TrendingUp,
    gradient: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    cta: "Schedule Call",
    personas: ["hni"],
  },
  {
    id: "elss",
    category: "ELSS Mutual Fund",
    title: "Mirae Tax Saver",
    description: "3-year lock-in ELSS fund with high 5-year CAGR.",
    whyYou: "ELSS is the best 80C instrument with lowest (3 yrs) lock-in.",
    tags: ["Tax 80C", "Lock-in 3yr"],
    icon: TrendingUp,
    gradient: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
    cta: "Invest Now",
    personas: ["beginner", "sip_investor"],
  },
]

export default function MarketplacePage() {
  const { persona } = useStore()
  const p = persona ?? "active_trader"
  const recommended = ALL_PRODUCTS.filter(x => x.personas.includes(p))
  const others = ALL_PRODUCTS.filter(x => !recommended.includes(x))

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Financial Concierge</h1>
          <p className="text-gray-500 text-sm">Products tailored for {persona === null ? "all" : <strong className="text-white uppercase tracking-wider">{persona.replace("_", " ")}</strong>}</p>
        </div>
        {!persona && <Link href="/onboarding" className="bg-white text-black text-sm font-bold px-4 py-2 rounded-xl">Set Persona</Link>}
      </div>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5 flex items-center gap-2">
          <Brain className="h-4 w-4 text-red-500" /> Recommended For You
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {recommended.map(prod => (
            <div key={prod.id} className={cn("relative flex flex-col rounded-xl border bg-gradient-to-br p-5 shadow-lg group transition-all hover:scale-[1.03]", prod.gradient)}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{prod.category}</span>
                <prod.icon className="h-4 w-4 text-white/40" />
              </div>
              <h3 className="font-bold text-white mb-2">{prod.title}</h3>
              <p className="text-xs text-white/60 mb-4 leading-relaxed line-clamp-2">{prod.description}</p>
              <div className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5">
                <p className="text-[11px] text-white/70 italic leading-relaxed">"{prod.whyYou}"</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {prod.tags.map(t => (
                  <span key={t} className="text-[9px] font-bold uppercase text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> {t}
                  </span>
                ))}
              </div>
              <button className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-lg border border-white/10 transition-all uppercase tracking-wider">
                {prod.cta} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5">Explore All Categories</h2>
        <div className="grid grid-cols-4 gap-3">
          {others.map(p => (
            <button key={p.id} className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0a0c10]/50 hover:bg-[#1a1f2e] text-left transition-all active:scale-95 group">
              <p.icon className="h-4 w-4 text-gray-600 mb-2 group-hover:text-red-500 transition-colors" />
              <p className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{p.title}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{p.category}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
