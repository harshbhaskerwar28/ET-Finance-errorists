"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore, type Persona, type Risk } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { User, Target, Shield, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const PERSONAS: { id: Persona, label: string, desc: string }[] = [
  { id: "beginner", label: "Curious Beginner", desc: "Just starting my investment journey." },
  { id: "active_trader", label: "Active Trader", desc: "I trade stocks and F&O frequently." },
  { id: "sip_investor", label: "SIP Investor", desc: "I believe in long-term wealth via MFs." },
  { id: "hni", label: "HNI Investor", desc: "Managing significant wealth and assets." },
  { id: "retiree", label: "Retiree", desc: "Focus on capital protection and income." },
]

const RISKS: { id: Risk, label: string, desc: string }[] = [
  { id: "conservative", label: "Conservative", desc: "Capital safety is my priority." },
  { id: "moderate", label: "Moderate", desc: "Balanced growth with some risk." },
  { id: "aggressive", label: "Aggressive", desc: "High risk for maximum wealth creation." },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { setProfile, persona: storedPersona, risk: storedRisk, name: storedName } = useStore()
  
  const [step, setStep] = useState(1)
  const [name, setName] = useState(storedName || "")
  const [persona, setPersona] = useState<Persona | null>(storedPersona)
  const [risk, setRisk] = useState<Risk | null>(storedRisk)

  const handleFinish = () => {
    setProfile({ name, persona, risk })
    router.push("/")
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to ET AI</h1>
        <p className="text-gray-500">Let's personalize your intelligence platform.</p>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className={cn("h-1 w-12 rounded-full transition-colors", step >= i ? "bg-red-600" : "bg-gray-800")} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="flex items-center gap-2 mb-6 text-white font-semibold">
              <User className="h-5 w-5 text-red-500" /> What's your name?
            </div>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
            <button 
              disabled={!name.trim()} onClick={() => setStep(2)}
              className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="flex items-center gap-2 mb-6 text-white font-semibold">
              <Target className="h-5 w-5 text-red-500" /> Define your investor persona
            </div>
            <div className="space-y-3">
              {PERSONAS.map(p => (
                <button 
                  key={p.id} onClick={() => setPersona(p.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    persona === p.id ? "bg-red-600/10 border-red-500 ring-1 ring-red-500" : "bg-[#0a0c10] border-[#1a1f2e] hover:border-gray-700"
                  )}
                >
                  <p className="font-bold text-white text-sm">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white text-sm font-semibold py-3 border border-gray-800 rounded-xl">Back</button>
              <button 
                disabled={!persona} onClick={() => setStep(3)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="flex items-center gap-2 mb-6 text-white font-semibold">
              <Shield className="h-5 w-5 text-red-500" /> What's your risk appetite?
            </div>
            <div className="space-y-3">
              {RISKS.map(r => (
                <button 
                  key={r.id} onClick={() => setRisk(r.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    risk === r.id ? "bg-red-600/10 border-red-500 ring-1 ring-red-500" : "bg-[#0a0c10] border-[#1a1f2e] hover:border-gray-700"
                  )}
                >
                  <p className="font-bold text-white text-sm">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:text-white text-sm font-semibold py-3 border border-gray-800 rounded-xl">Back</button>
              <button 
                disabled={!risk} onClick={handleFinish}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Start Exploring <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
