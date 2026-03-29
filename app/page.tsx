"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Activity, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"

interface Index { name: string; price: number; change: number; pct: number }
interface Article { title: string; summary: string; publisher: string; category: string; sentiment: string; stocks: string[] }

export default function Home() {
  const [indices, setIndices] = useState<Index[]>([])
  const [news, setNews] = useState<Article[]>([])
  const [idxLoading, setIdxLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)
  const [idxError, setIdxError] = useState("")
  const [newsError, setNewsError] = useState("")

  const loadIndices = useCallback(async () => {
    setIdxLoading(true); setIdxError("")
    try {
      const r = await fetch("/api/market?type=indices")
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setIndices(d.indices ?? [])
    } catch (e: any) { setIdxError(e.message) }
    finally { setIdxLoading(false) }
  }, [])

  const loadNews = useCallback(async () => {
    setNewsLoading(true); setNewsError("")
    try {
      const r = await fetch("/api/market?type=news")
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setNews(d.news ?? [])
    } catch (e: any) { setNewsError(e.message) }
    finally { setNewsLoading(false) }
  }, [])

  useEffect(() => {
    loadIndices(); loadNews()
    const t = setInterval(loadIndices, 60000)
    return () => clearInterval(t)
  }, [loadIndices, loadNews])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">My ET Newsroom</h1>
        <p className="text-gray-500 text-sm">Live indices from Yahoo Finance · News from OpenAI web search</p>
      </div>

      {/* Indices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
            <Activity className="h-4 w-4 text-red-500" /> Live Market Pulse
          </h2>
          <button onClick={loadIndices} disabled={idxLoading} className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-[#1a1f2e] transition-colors disabled:opacity-40">
            <RefreshCw className={cn("h-3.5 w-3.5", idxLoading && "animate-spin")} />
          </button>
        </div>
        {idxLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[#1a1f2e] animate-pulse" />)}
          </div>
        ) : idxError ? (
          <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{idxError}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {indices.map(idx => (
              <div key={idx.name} className={cn("rounded-xl border p-4", idx.pct >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-400">{idx.name}</span>
                  {idx.pct >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                </div>
                <div className="text-xl font-bold text-white tabular-nums">{idx.price?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={cn("text-sm font-semibold tabular-nums", idx.pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {idx.change >= 0 ? "+" : ""}{idx.change?.toFixed(2)} ({idx.pct >= 0 ? "+" : ""}{idx.pct?.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* News */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
            <Newspaper className="h-4 w-4 text-gray-400" /> Market News
          </h2>
          <button onClick={loadNews} disabled={newsLoading} className="text-xs text-gray-500 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-gray-800 transition-colors disabled:opacity-40">
            <RefreshCw className={cn("h-3 w-3", newsLoading && "animate-spin")} />Refresh
          </button>
        </div>
        {newsLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-[#1a1f2e] animate-pulse" />)}</div>
        ) : newsError ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
            <p className="text-sm text-orange-300 font-semibold mb-1">News unavailable</p>
            <p className="text-xs text-orange-400/80">{newsError}</p>
            <p className="text-xs text-gray-500 mt-2">Ensure <code className="text-gray-300">OPENAI_API_KEY</code> is set in .env.local</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((a, i) => (
              <div key={i} className="rounded-xl border border-[#1a1f2e] bg-[#0a0c10]/80 hover:bg-[#1a1f2e] hover:border-gray-700 transition-colors p-4 cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase text-gray-500">{a.category}</span>
                  <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border",
                    a.sentiment === "positive" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                    a.sentiment === "negative" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                    "text-gray-400 bg-gray-500/10 border-gray-700")}>{a.sentiment}</span>
                  {a.stocks?.slice(0, 2).map(s => (
                    <span key={s} className="text-[10px] font-mono bg-[#1a1f2e] border border-gray-700 px-1.5 py-0.5 rounded text-gray-400">{s}</span>
                  ))}
                </div>
                <h3 className="font-semibold text-gray-200 group-hover:text-white text-sm mb-1">{a.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{a.summary}</p>
                <p className="text-xs text-gray-600 mt-2">{a.publisher}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
