"use client"

import { useState, useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Send, Bot, User, Sparkles, RefreshCw, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Plan my retirement (FIRE path)",
  "Analyze current market sentiment",
  "Nifty vs Sensex analysis today",
  "Explain Indian tax harvesting",
  "Top 3 sectors for next 5 years?",
  "Analyze my portfolio risks",
]

export default function AdvisoryPage() {
  const { name, persona, risk, goals, holdings } = useStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi ${name || "there"}! I'm your **ET AI Advisor**.\n\nI have access to live Indian market data and your portfolio. Ask me about:\n- **Market Analysis**: Current Nifty/Sensex trends.\n- **Portfolio Advice**: Risk and sector concentration.\n- **Tax Planning**: Optimizing STCG/LTCG.\n- **Goal Tracking**: Planning your FIRE path.`
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const onSend = async (text = input) => {
    if (!text.trim() || loading) return
    const userMsg = text.trim()
    setInput("")
    setError("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(1), // ignore greeting
          persona,
          risk,
          goals,
          portfolio: holdings
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "AI error")
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch (e: any) {
      setError(e.message)
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${e.message}. Make sure OPENAI_API_KEY is set.` }])
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessages([{
      role: "assistant",
      content: `Chat reset. How can I help you with your financial planning today, ${name || "Investor"}?`
    }])
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-500" /> ET AI Advisor
          </h1>
          <p className="text-gray-500 text-sm pl-7">Portfolio-aware · Live market search · OpenAI powered</p>
        </div>
        <button onClick={reset} className="p-2 rounded-xl bg-[#1a1f2e] border border-gray-800 text-gray-400 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3" /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col rounded-2xl border border-[#1a1f2e] bg-[#0d0f14]/80 shadow-xl">
        <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-red-600 flex shrink-0 items-center justify-center border border-red-500/30">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={cn(
                "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                m.role === "user" ? "bg-red-600 text-white rounded-tr-sm" : "bg-[#1a1f2e] text-gray-200 border border-gray-800 rounded-tl-sm"
              )}>
                {m.content.split("\n").map((line, j) => (
                  <p key={j} className={cn(j > 0 && "mt-2")}>
                    {line.split("**").map((p, k) => k % 2 === 1 ? <strong key={k} className="text-white font-bold">{p}</strong> : p)}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-600 flex shrink-0 items-center justify-center border border-red-500/30">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-[#1a1f2e] rounded-2xl p-4 flex gap-1.5 items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-bounce" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-[#0a0c10] border-t border-[#1a1f2e]">
          <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => onSend(s)} disabled={loading}
                className="px-3 py-1.5 bg-[#1a1f2e] hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 rounded-full whitespace-nowrap transition-all font-medium active:scale-95 disabled:opacity-40">
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); onSend() }} className="flex gap-2">
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask about markets, taxes, or your portfolio..."
              className="flex-1 bg-[#1a1f2e] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
              disabled={loading}
            />
            <button disabled={!input.trim() || loading} type="submit"
              className="p-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-lg active:scale-95 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
