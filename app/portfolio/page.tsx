"use client"

import { useState, useCallback } from "react"
import { useStore, type Holding } from "@/lib/store"
import { Plus, Trash2, RefreshCw, Brain, X, AlertTriangle, Loader2, BarChart3, TrendingUp, TrendingDown, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

// Map common NSE tickers to sectors
function getSector(display: string): string {
  const s = display.toUpperCase()
  if (["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM", "COFORGE"].some(x => s.includes(x))) return "IT"
  if (["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK", "BANDHANBNK", "FEDERALBNK"].some(x => s.includes(x))) return "Banking"
  if (["RELIANCE", "ONGC", "BPCL", "IOC", "GAIL"].some(x => s.includes(x))) return "Energy"
  if (["BHARTIARTL", "VIL"].some(x => s.includes(x))) return "Telecom"
  if (["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"].some(x => s.includes(x))) return "Pharma"
  if (["TATAMOTORS", "MARUTI", "M&M", "BAJAJ-AUTO", "EICHERMOT", "HEROMOTOCO"].some(x => s.includes(x))) return "Auto"
  if (["TATASTEEL", "JSWSTEEL", "HINDALCO", "COAL"].some(x => s.includes(x))) return "Metals"
  if (["TITAN", "ASIANPAINT", "HINDUNILVR", "NESTLEIND", "BRITANNIA"].some(x => s.includes(x))) return "Consumer"
  return "Others"
}

function fmt(n: number) { return n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) }
function fmtC(n: number) { return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 }) }

const SAMPLE_STOCKS = [
  { name: "Reliance", ticker: "RELIANCE", qty: "10", avg: "2850" },
  { name: "TCS", ticker: "TCS", qty: "5", avg: "3950" },
  { name: "HDFC Bank", ticker: "HDFCBANK", qty: "20", avg: "1650" },
  { name: "Infosys", ticker: "INFY", qty: "15", avg: "1550" },
]

export default function PortfolioPage() {
  const { holdings, persona, risk, goals, addHolding, removeHolding, updatePrices } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [ticker, setTicker] = useState("")
  const [qty, setQty] = useState("")
  const [avg, setAvg] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState("")
  const [analysisError, setAnalysisError] = useState("")

  const handleAdd = async (overrideTicker = "", overrideQty = "", overrideAvg = "") => {
    const t = overrideTicker || ticker
    const qVal = overrideQty || qty
    const aVal = overrideAvg || avg

    if (!t.trim() || !qVal || !aVal) { setAddError("Fill all fields."); return }
    const q = parseFloat(qVal), a = parseFloat(aVal)
    if (isNaN(q) || q <= 0 || isNaN(a) || a <= 0) { setAddError("Quantity and price must be positive."); return }
    if (holdings.some(h => h.display === t.toUpperCase())) { setAddError("Already in portfolio."); return }
    
    setAdding(true); setAddError("")
    try {
      const res = await fetch(`/api/market?type=quote&q=${t.trim()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const h: Holding = {
        symbol: data.symbol, display: data.display, name: data.name,
        qty: q, avgPrice: a,
        livePrice: data.price, change: data.change, changePct: data.pct,
        sector: getSector(data.display),
      }
      addHolding(h)
      setTicker(""); setQty(""); setAvg(""); setShowForm(false); setAnalysis("")
    } catch (e: any) { setAddError(e.message) }
    finally { setAdding(false) }
  }

  const handleRefresh = useCallback(async () => {
    if (!holdings.length) return
    setRefreshing(true)
    const updates = await Promise.all(holdings.map(async h => {
      try {
        const res = await fetch(`/api/market?type=quote&q=${h.display}`)
        const d = await res.json()
        return { display: h.display, livePrice: d.price ?? h.livePrice, change: d.change ?? h.change, changePct: d.pct ?? h.changePct }
      } catch { return { display: h.display, livePrice: h.livePrice, change: h.change, changePct: h.changePct } }
    }))
    updatePrices(updates)
    setRefreshing(false); setAnalysis("")
  }, [holdings, updatePrices])

  const handleAnalyze = async () => {
    if (!holdings.length) return
    setAnalyzing(true); setAnalysis(""); setAnalysisError("")
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings, persona, risk, goals }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setAnalysis(d.analysis)
    } catch (e: any) { setAnalysisError(e.message) }
    finally { setAnalyzing(false) }
  }

  // Stats
  const totalVal = holdings.reduce((s, h) => s + h.livePrice * h.qty, 0)
  const totalInv = holdings.reduce((s, h) => s + h.avgPrice * h.qty, 0)
  const pnl = totalVal - totalInv
  const pnlPct = totalInv > 0 ? (pnl / totalInv) * 100 : 0
  const todayPnl = holdings.reduce((s, h) => s + (h.livePrice * h.changePct / 100) * h.qty, 0)

  // Capital gains estimate
  const gainers = holdings.filter(h => h.livePrice > h.avgPrice)
  const losers = holdings.filter(h => h.livePrice < h.avgPrice)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">Add NSE stocks to track live P&L and get AI analysis</p>
        </div>
        <div className="flex gap-2">
          {holdings.length > 0 && (
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl bg-[#1a1f2e] border border-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-40">
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
          )}
          <button onClick={() => { setShowForm(v => !v); setAddError("") }} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Add Stock
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl border border-[#1a1f2e] bg-[#0a0c10] p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">Add New Asset</h3>
              <div className="flex gap-1.5 ml-4 border-l border-gray-800 pl-4 items-center overflow-x-auto hide-scrollbar">
                 <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1 shrink-0"><Lightbulb className="h-3 w-3 text-yellow-500" /> Samples:</span>
                 {SAMPLE_STOCKS.map(s => (
                   <button key={s.ticker} onClick={() => handleAdd(s.ticker, s.qty, s.avg)} className="px-2 py-0.5 bg-[#1a1f2e] border border-gray-800 rounded text-[10px] font-bold text-gray-500 hover:text-white hover:border-gray-600 transition-all whitespace-nowrap active:scale-95">
                     + {s.name}
                   </button>
                 ))}
              </div>
            </div>
            <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Company or Symbol</label>
              <input value={ticker} onChange={e => setTicker(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Reliance" className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Quantity</label>
              <input value={qty} onChange={e => setQty(e.target.value)} type="number" min={1}
                placeholder="e.g. 50" className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Avg Buy Price (₹)</label>
              <input value={avg} onChange={e => setAvg(e.target.value)} type="number" min={0.01} step={0.01}
                placeholder="e.g. 2400" className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500" />
            </div>
          </div>
          {addError && <p className="text-xs text-red-400 flex items-center gap-1.5 mb-3"><AlertTriangle className="h-3.5 w-3.5" />{addError}</p>}
          <button onClick={() => handleAdd()} disabled={adding} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            {adding ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><Plus className="h-4 w-4" />Add to Portfolio</>}
          </button>
        </div>
      )}

      {/* Remaining components (Empty State, Summary, Table, etc.) unchanged for brevity */}
      {!holdings.length && !showForm && (
        <div className="rounded-xl border border-dashed border-[#1a1f2e] py-16 text-center">
          <BarChart3 className="h-10 w-10 text-gray-800 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">No holdings yet</p>
          <p className="text-gray-600 text-sm mb-5">Add your first stock to start tracking P&L</p>
          <button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2 rounded-xl">Add First Stock</button>
        </div>
      )}

      {holdings.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Portfolio Value", val: fmtC(totalVal), sub: `Invested ${fmtC(totalInv)}`, pos: true },
              { label: "Total P&L", val: fmtC(pnl), sub: `${pnlPct.toFixed(2)}%`, pos: pnl >= 0 },
              { label: "Today's P&L", val: fmtC(todayPnl), sub: `${((todayPnl / totalVal)*100 || 0).toFixed(2)}%`, pos: todayPnl >= 0 },
              { label: "Holdings", val: `${holdings.length}`, sub: `${new Set(holdings.map(h => h.sector)).size} sectors`, pos: true },
            ].map((c, i) => (
              <div key={i} className="rounded-xl border border-[#1a1f2e] bg-[#0a0c10] p-4">
                <p className="text-xs text-gray-500 font-medium mb-2">{c.label}</p>
                <p className={cn("text-xl font-bold tabular-nums", i === 0 ? "text-white" : c.pos ? "text-emerald-400" : "text-red-400")}>{c.val}</p>
                <p className={cn("text-xs mt-0.5 tabular-nums", c.pos ? "text-emerald-600" : "text-red-600")}>{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#1a1f2e] overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-[#1a1f2e]/40 border-b border-[#1a1f2e]">
              <div className="col-span-3">Stock</div>
              <div className="col-span-2 text-right">LTP</div>
              <div className="col-span-2 text-right">Day</div>
              <div className="col-span-2 text-right">Value</div>
              <div className="col-span-2 text-right">P&L</div>
              <div className="col-span-1 text-right"></div>
            </div>
            {holdings.map(h => {
              const val = h.livePrice * h.qty
              const inv = h.avgPrice * h.qty
              const ret = ((val - inv) / inv * 100)
              return (
                <div key={h.display} className="grid grid-cols-12 px-4 py-3.5 border-b border-[#1a1f2e] last:border-0 hover:bg-[#1a1f2e]/30 transition-colors items-center">
                  <div className="col-span-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#1a1f2e] border border-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">{h.display.slice(0,2)}</div>
                    <div>
                      <p className="font-semibold text-white text-sm">{h.display}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[100px]">{h.sector}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-semibold text-white tabular-nums">₹{fmt(h.livePrice)}</p>
                    <p className="text-xs text-gray-600">{h.qty} qty</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={cn("text-sm font-semibold tabular-nums", h.changePct >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {h.changePct >= 0 ? "▲" : "▼"} {Math.abs(h.changePct).toFixed(2)}%
                    </p>
                    <p className={cn("text-xs tabular-nums", h.change >= 0 ? "text-emerald-600" : "text-red-600")}>{h.change >= 0 ? "+" : ""}₹{fmt(h.change)}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-semibold text-white tabular-nums">{fmtC(val)}</p>
                    <p className="text-xs text-gray-600">inv {fmtC(inv)}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className={cn("text-sm font-bold tabular-nums", ret >= 0 ? "text-emerald-400" : "text-red-400")}>{ret >= 0 ? "+" : ""}{ret.toFixed(2)}%</p>
                    <p className={cn("text-xs tabular-nums", ret >= 0 ? "text-emerald-600" : "text-red-600")}>{ret >= 0 ? "+" : ""}{fmtC(val - inv)}</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeHolding(h.display)} className="p-1.5 text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-600 mb-3 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Unrealized Gains</p>
              {gainers.length === 0 ? <p className="text-gray-600 text-sm">No gainers</p> : gainers.map(h => (
                <div key={h.display} className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{h.display}</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">+{fmtC((h.livePrice - h.avgPrice) * h.qty)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs font-semibold uppercase text-red-600 mb-3 flex items-center gap-1.5"><TrendingDown className="h-3.5 w-3.5" />Tax Harvest Opportunities</p>
              {losers.length === 0 ? <p className="text-gray-600 text-sm">No losses to harvest</p> : losers.map(h => (
                <div key={h.display} className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{h.display}</span>
                  <span className="text-red-400 font-semibold tabular-nums">{fmtC((h.livePrice - h.avgPrice) * h.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#1a1f2e] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1f2e] bg-[#1a1f2e]/30">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-red-500" /> AI Portfolio X-Ray
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">Uses OpenAI web search for real-time context on your holdings</p>
              </div>
              <button onClick={handleAnalyze} disabled={analyzing} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</> : <><Brain className="h-4 w-4" />Analyze Portfolio</>}
              </button>
            </div>
            <div className="p-5">
              {analysisError && <p className="text-sm text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{analysisError}</p>}
              {analysis && (
                <div className="space-y-1">
                  {analysis.split("\n").map((line, i) => {
                    const t = line.trim()
                    if (!t) return <div key={i} className="h-1.5" />
                    if (t.startsWith("**") && t.endsWith("**")) return <h4 key={i} className="text-sm font-bold text-white mt-4 mb-1">{t.slice(2,-2)}</h4>
                    if (t.startsWith("• ") || t.startsWith("- ")) return (
                      <div key={i} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <p className="text-sm text-gray-300">{t.slice(2).split("**").map((p,j) => j%2===1 ? <strong key={j} className="text-white">{p}</strong> : p)}</p>
                      </div>
                    )
                    return <p key={i} className="text-sm text-gray-300">{t.split("**").map((p,j) => j%2===1 ? <strong key={j} className="text-white">{p}</strong> : p)}</p>
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
