"use client"

import { useState, useCallback } from "react"
import { Search, TrendingUp, TrendingDown, RefreshCw, AlertCircle, BarChart2, Activity, Zap, ExternalLink, IndianRupee } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stock {
  symbol: string; display: string; name: string; price: number; change: number; pct: number;
  pe: number | null; marketCap: number | null; high52w: number | null; low52w: number | null;
}

const TOP_STOCKS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "AXISBANK"]

export default function MarketsHub() {
  const [query, setQuery] = useState("")
  const [stock, setStock] = useState<Stock | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onSearch = async (s = query) => {
    if (!s.trim()) return
    setLoading(true); setError(""); setStock(null)
    try {
      const res = await fetch(`/api/market?type=quote&q=${s.trim()}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setStock(d)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const fmt = (n: number | null) => n ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "N/A"
  const fmtC = (n: number | null) => n ? "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "N/A"

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Market Intel</h1>
          <p className="text-gray-500 text-sm">Real-time NSE/BSE stock terminal powered by Yahoo Finance</p>
        </div>
        <div className="flex items-center gap-2">
           <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Engine Active</span>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <label className="text-xs text-gray-500 font-medium block mb-1">Company or Symbol</label>
          <input 
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch()}
            placeholder="e.g. Reliance"
            className="w-full bg-[#1a1f2e] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
          />
        </div>
        <button onClick={() => onSearch()} disabled={!query.trim() || loading} className="mt-5 px-5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Search"}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}

      {stock && (
        <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0c10]/80 p-6 shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-bold bg-white text-black px-1.5 py-0.5 rounded">{stock.display}</span>
                <h2 className="text-xl font-bold text-white">{stock.name}</h2>
              </div>
              <p className="text-xs text-gray-600 font-bold tracking-widest uppercase">National Stock Exchange (NSE)</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white tabular-nums">₹{fmt(stock.price)}</p>
              <p className={cn("text-sm font-bold tabular-nums mt-1", stock.pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                {stock.change >= 0 ? "+" : ""}{fmt(stock.change)} ({stock.pct >= 0 ? "+" : ""}{stock.pct.toFixed(2)}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 pt-6 border-t border-[#1a1f2e]">
            {[
              { label: "P/E Ratio", val: stock.pe?.toFixed(1) || "N/A" },
              { label: "Market Cap", val: "₹" + (stock.marketCap ? (stock.marketCap / 1e11).toFixed(2) + " L Cr" : "N/A") },
              { label: "52W High", val: fmt(stock.high52w) },
              { label: "52W Low", val: fmt(stock.low52w) },
            ].map(c => (
              <div key={c.label}>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">{c.label}</p>
                <p className="text-sm font-bold text-white">{c.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2"><Activity className="h-4 w-4 text-red-500" /> Watchlist Trends</h2>
        <div className="grid grid-cols-4 gap-3">
          {TOP_STOCKS.map(s => (
            <button key={s} onClick={() => onSearch(s)} className="p-4 rounded-xl border border-[#1a1f2e] bg-[#0a0c10]/40 hover:bg-[#1a1f2e] hover:border-gray-700 text-left transition-all active:scale-95 group">
              <div className="flex justify-between items-center mb-1">
                 <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{s}</span>
                 <ExternalLink className="h-3 w-3 text-gray-700 group-hover:text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-600 font-bold uppercase">NSE: {s}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
