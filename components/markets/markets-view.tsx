'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import {
  TrendingUp, TrendingDown, Search, Star, StarOff, Activity,
  BarChart3, Layers, RefreshCw, Edit2, Check, X, Plus,
  Clock, Zap, ChevronUp, ChevronDown, Wifi, WifiOff,
  AlertCircle, Trash2, Eye, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChartPatternsView } from './chart-patterns-view'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IndexQuote {
  symbol: string
  price: number
  change: number
  changePct: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

interface StockQuote {
  symbol: string
  name?: string
  price: number
  change: number
  changePct: number
  volume?: number
  marketCap?: number
}

interface SectorData {
  name: string
  change: number
  fiiFlow: number
  trend: 'bullish' | 'bearish' | 'neutral'
  stocks?: { symbol: string; change: number }[]
}

interface BulkDeal {
  symbol: string
  clientName: string
  buySell: 'BUY' | 'SELL'
  quantity: number
  tradePrice: number
  value: string
  date: string
}

interface WatchlistEntry {
  id: string
  symbol: string
  company_name: string
  sector: string
  notes?: string
  custom_label?: string
  created_at: string
}

interface MarketData {
  indices: IndexQuote[]
  topGainers: StockQuote[]
  topLosers: StockQuote[]
  breadth: { advancers: number; decliners: number; unchanged: number }
  lastUpdated: string
}

type MarketTab = 'overview' | 'watchlist' | 'patterns' | 'heatmap' | 'deals'

// ─── Utils ────────────────────────────────────────────────────────────────────

export function parseStockTitle(value: string) {
  if (!value) return { symbol: '', name: '' }
  const parts = value.split('|')
  return { symbol: parts[0], name: parts[1] || parts[0] }
}

// ─── Animated Number ──────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevValue = useRef(value)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const startValueRef = useRef(value)

  useEffect(() => {
    if (value === prevValue.current) return

    const direction = value > prevValue.current ? 'up' : 'down'
    setFlash(direction)
    const timer = setTimeout(() => setFlash(null), 600)

    const from = prevValue.current
    const to = value
    const duration = 400
    startRef.current = null
    startValueRef.current = from

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(from + (to - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(to)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    prevValue.current = value

    return () => {
      clearTimeout(timer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value])

  const formatted = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span
      className={cn(
        'tabular-nums transition-colors duration-300',
        flash === 'up' && 'text-emerald-400',
        flash === 'down' && 'text-rose-400',
        className
      )}
    >
      {prefix}{formatted}{suffix}
    </span>
  )
}

// ─── Live Dot ─────────────────────────────────────────────────────────────────

function LiveDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          LIVE
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-rose-400" />
          OFFLINE
        </>
      )}
    </span>
  )
}

// ─── Editable Title ───────────────────────────────────────────────────────────

function EditableTitle({
  value,
  onSave,
  className,
}: {
  value: string
  onSave: (v: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = () => {
    const trimmed = draft.trim()
    if (trimmed) onSave(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="bg-muted border border-primary/50 rounded px-2 py-0.5 text-sm font-semibold outline-none w-40"
        />
        <button onClick={save} className="text-emerald-400 hover:text-emerald-300 transition-colors">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true) }}
      className={cn('group flex items-center gap-1.5 hover:text-foreground transition-colors', className)}
    >
      <span className="font-semibold">{value}</span>
      <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
}

// ─── Index Card ───────────────────────────────────────────────────────────────

function CardStockPicker({
  value,
  onSave,
  className,
}: {
  value: string
  onSave: (v: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const { symbol, name } = parseStockTitle(value)
  const [searchQ, setSearchQ] = useState(name || symbol)
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 1) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      // Use the existing search API which already appends 'NSE' if needed
      const res = await fetch(`/api/markets/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch { 
      setResults([])
    } finally { 
      setSearching(false) 
    }
  }, [])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      setSearchQ(name || symbol)
      doSearch(name || symbol)
    }
  }, [editing, doSearch, name, symbol])

  const onType = (q: string) => {
    setSearchQ(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(q), 400)
  }

  return (
    <div className="relative">
      {editing ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 relative z-50">
            <input
              ref={inputRef}
              value={searchQ}
              onChange={e => onType(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="bg-muted border border-primary/50 rounded px-1.5 py-0.5 text-[10px] font-bold outline-none w-28 pr-6"
              placeholder="Symbol or name..."
            />
            {searching && <RefreshCw className="absolute right-6 w-3 h-3 animate-spin text-muted-foreground" />}
            <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-2xl z-[101] max-h-52 overflow-hidden flex flex-col"
              >
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  {results.map(r => (
                    <button
                      key={r.symbol}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        // Save string as SYMBOL|NAME
                        onSave(`${r.symbol}|${r.name || r.symbol}`)
                        setEditing(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-[11px] flex flex-col border-b border-border/50 last:border-0 group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{r.symbol}</span>
                        {r.exchange && <span className="text-[8px] bg-muted px-1 rounded opacity-60">{r.exchange}</span>}
                      </div>
                      <span className="text-muted-foreground truncate opacity-80">{r.name}</span>
                    </button>
                  ))}
                  
                  {results.length === 0 && !searching && searchQ.length > 0 && (
                    <div className="p-4 text-center text-[10px] text-muted-foreground flex flex-col items-center gap-2">
                      <AlertCircle className="w-4 h-4 opacity-20" />
                      No Indian stocks found for "{searchQ}"
                    </div>
                  )}
                  {searchQ.length === 0 && (
                    <div className="p-3 text-center text-[10px] text-muted-foreground italic">
                      Type to discover stocks...
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn('group flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity', className)}
        >
          <span className="font-bold truncate max-w-[120px]" title={symbol}>{name}</span>
          <Edit2 className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0" />
        </button>
      )}
    </div>
  )
}


function IndexCard({ data, title, onTitleSave }: { data: IndexQuote | null; title: string; onTitleSave: (v: string) => void }) {
  const isPositive = (data?.changePct ?? 0) >= 0

  return (
    <div className={cn(
      "bg-card border rounded-xl p-4 relative overflow-visible transition-all duration-300", 
      isPositive ? "border-emerald-500/20" : "border-rose-500/20"
    )}>
      <div className={cn(
        "absolute inset-0 opacity-5",
        isPositive ? "bg-gradient-to-br from-emerald-500 to-transparent" : "bg-gradient-to-br from-rose-500 to-transparent"
      )} />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <CardStockPicker value={title} onSave={onTitleSave} className="text-xs text-muted-foreground font-medium tracking-wide" />
          <span className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            isPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </div>

        {data ? (
          <>
            <AnimatedNumber
              value={data.price}
              decimals={2}
              className="block text-2xl font-bold leading-none mb-2"
            />
            <div className="flex items-center gap-2">
              <AnimatedNumber
                value={data.change}
                decimals={2}
                prefix={data.change >= 0 ? '+' : ''}
                className={cn("text-sm font-medium", isPositive ? "text-emerald-400" : "text-rose-400")}
              />
              <AnimatedNumber
                value={data.changePct}
                decimals={2}
                prefix="("
                suffix="% )"
                className={cn("text-sm", isPositive ? "text-emerald-400" : "text-rose-400")}
              />
            </div>
          </>
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="h-7 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sector Heat Map ──────────────────────────────────────────────────────────

const HEAT_MAX = 3.5

function getHeatColor(change: number): string {
  const intensity = Math.min(Math.abs(change) / HEAT_MAX, 1)
  if (change > 0) {
    const r = Math.round(16 + (1 - intensity) * 40)
    const g = Math.round(120 + intensity * 135)
    const b = Math.round(60 + (1 - intensity) * 40)
    return `rgb(${r}, ${g}, ${b})`
  } else if (change < 0) {
    const r = Math.round(120 + intensity * 135)
    const g = Math.round(16 + (1 - intensity) * 40)
    const b = Math.round(40 + (1 - intensity) * 20)
    return `rgb(${r}, ${g}, ${b})`
  }
  return 'rgb(60, 65, 80)'
}

function SectorHeatCell({ sector, style }: { sector: SectorData; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false)
  const bg = getHeatColor(sector.change)
  const textColor = Math.abs(sector.change) > 1.5 ? 'white' : '#e2e8f0'
  const isPositive = sector.change >= 0

  return (
    <motion.div
      layout
      style={{ ...style, backgroundColor: bg }}
      className="relative cursor-pointer flex flex-col items-center justify-center p-1.5 md:p-2 overflow-hidden select-none border-[0.5px] border-background hover:z-20 hover:scale-[1.03] hover:shadow-2xl transition-all"
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      <p className="font-bold text-xs md:text-sm leading-none text-center" style={{ color: textColor }}>{sector.name}</p>
      <p className="text-base md:text-lg font-black mt-1 leading-none" style={{ color: textColor }}>
        {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
      </p>
      <p className="text-[9px] md:text-[10px] mt-0.5 opacity-80" style={{ color: textColor }}>
        FII: {sector.fiiFlow >= 0 ? '+' : ''}{sector.fiiFlow} Cr
      </p>

      <AnimatePresence>
        {hovered && sector.stocks && sector.stocks.length > 0 && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-popover border border-border rounded-lg shadow-xl p-2.5 w-44 pointer-events-none"
          >
            <p className="text-xs font-semibold text-foreground mb-1.5">{sector.name} — Top Holdings</p>
            {sector.stocks.map(s => (
              <div key={s.symbol} className="flex justify-between text-xs py-0.5">
                <span className="text-muted-foreground">{s.symbol.replace('.NS', '')}</span>
                <span className={s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                </span>
              </div>
            ))}
            <div className="text-[9px] text-muted-foreground mt-1.5 border-t border-border pt-1">
              Trend: <span className={{ bullish: 'text-emerald-400', bearish: 'text-rose-400', neutral: 'text-amber-400' }[sector.trend]}>{sector.trend}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const SECTOR_WEIGHTS: Record<string, number> = {
  'Banking': 35,
  'IT': 15,
  'Energy': 12,
  'Auto': 8,
  'FMCG': 8,
  'Pharma': 6,
  'Metals': 5,
  'Realty': 4,
  'Telecom': 4,
  'Power': 3,
}

function SectorHeatMap({ sectors, title, onTitleSave }: {
  sectors: SectorData[]
  title: string
  onTitleSave: (v: string) => void
}) {
  // Sort by defined sector weight for consistent treemap-like display
  const sorted = [...sectors].sort((a, b) => (SECTOR_WEIGHTS[b.name] || 0) - (SECTOR_WEIGHTS[a.name] || 0))

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-[400px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <EditableTitle value={title} onSave={onTitleSave} className="text-foreground" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Gain
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block ml-1" />
            Loss
          </div>
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col overflow-hidden">
        {/* Heat grid — True block heatmap mimicking TradingView Treemap */}
        <div className="flex flex-wrap flex-1 w-full border border-background bg-background overflow-y-auto custom-scrollbar">
          {sorted.map(sector => {
            const weight = SECTOR_WEIGHTS[sector.name] || 5
            return (
              <SectorHeatCell
                key={sector.name}
                sector={sector}
                style={{ 
                  width: `${Math.max(weight * 1.5, 12)}%`, // Approximate proportional width scaling
                  flexGrow: weight,
                  minHeight: '100px'
                }}
              />
            )
          })}
        </div>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Activity className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Loading sector data...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

// Pre-defined database of popular stocks completely loaded for instant selection.
const INDIAN_STOCKS_DB = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Construction' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Finance' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Auto' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Materials' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Power' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Conglomerates' },
]

function WatchlistView({
  items,
  quotes,
  title,
  onTitleSave,
  onRemove,
  onAdd,
  isAdding,
}: {
  items: WatchlistEntry[]
  quotes: Map<string, StockQuote>
  title: string
  onTitleSave: (v: string) => void
  onRemove: (symbol: string) => void
  onAdd: (symbol: string, name: string, sector: string) => void
  isAdding: boolean
}) {
  const [searchQ, setSearchQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [apiResults, setApiResults] = useState<any[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setApiResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/markets/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setApiResults(data)
    } catch { setApiResults([]) }
    finally { setSearching(false) }
  }, [])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(searchQ), 400)
  }, [searchQ, doSearch])

  // If query is small, show top DB. If query is large, purely rely on API exactly as Yahoo gives it
  const searchResults = searchQ.length < 2 
    ? INDIAN_STOCKS_DB 
    : apiResults


  return (
    <div className="bg-card border border-border rounded-xl overflow-visible">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <EditableTitle value={title} onSave={onTitleSave} className="text-foreground" />
        <span className="text-xs text-muted-foreground">{items.length} stocks</span>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border relative">
        <div className="relative z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search and stock to add (e.g. RELIANCE)..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
          />
          {searching && (
            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
          )}
        </div>

        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 mt-2 rounded-lg border border-border bg-popover shadow-xl overflow-hidden z-[100] max-h-60 overflow-y-auto"
            >
              {searchResults.length > 0 ? (
                searchResults
                  .filter(r => !items.find(i => i.symbol === r.symbol)) // Skip already selected
                  .map(result => (
                    <button
                      key={result.symbol}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onAdd(result.symbol, result.name, result.sector)
                        setSearchQ('')
                        setIsFocused(false)
                      }}
                      disabled={isAdding}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-sm">{result.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[240px]">{result.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.sector && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{result.sector}</span>}
                        <Plus className="w-4 h-4 text-primary" />
                      </div>
                    </button>
                  ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No matches for "{searchQ}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Watchlist Items */}
      {items.length > 0 ? (
        <div className="divide-y divide-border">
          <AnimatePresence mode="popLayout">
            {items.map(entry => {
              const q = quotes.get(entry.symbol)
              const isPositive = (q?.changePct ?? 0) >= 0

              return (
                <motion.div
                  key={entry.symbol}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold",
                      isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {entry.symbol.slice(0, 2)}
                    </div>
                  </div>
                  <div className="flex-1 ml-3">
                    <p className="font-semibold text-sm">{entry.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{entry.company_name}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {q ? (
                      <div className="text-right">
                        <AnimatedNumber value={q.price} decimals={2} prefix="₹" className="block text-sm font-semibold" />
                        <AnimatedNumber
                          value={q.changePct}
                          decimals={2}
                          prefix={isPositive ? '+' : ''}
                          suffix="%"
                          className={cn("text-xs font-medium", isPositive ? "text-emerald-400" : "text-rose-400")}
                        />
                      </div>
                    ) : (
                      <div className="text-right animate-pulse">
                        <div className="h-4 w-16 bg-muted rounded mb-1" />
                        <div className="h-3 w-10 bg-muted rounded" />
                      </div>
                    )}

                    <button
                      onClick={() => onRemove(entry.symbol)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <StarOff className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
          <p className="font-medium text-muted-foreground">Your watchlist is empty</p>
          <p className="text-sm text-muted-foreground mt-1 opacity-60">Search above to add stocks</p>
        </div>
      )}
    </div>
  )
}

// ─── Top Movers ───────────────────────────────────────────────────────────────

function TopMoversCard({
  gainers,
  losers,
  title,
  onTitleSave,
}: {
  gainers: StockQuote[]
  losers: StockQuote[]
  title: string
  onTitleSave: (v: string) => void
}) {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers')
  const stocks = tab === 'gainers' ? gainers : losers

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <EditableTitle value={title} onSave={onTitleSave} className="text-foreground" />
        </div>
        <div className="flex gap-1 p-0.5 bg-muted rounded-lg w-fit">
          {(['gainers', 'losers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all capitalize',
                tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'gainers' ? '🟢 Gainers' : '🔴 Losers'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {stocks.length > 0 ? stocks.map((stock, i) => (
              <div key={stock.symbol} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    stock.changePct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {stock.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{stock.symbol.replace('.NS', '')}</p>
                    {stock.name && <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{stock.name}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <AnimatedNumber value={stock.price} decimals={2} prefix="₹" className="block text-sm font-medium" />
                  <AnimatedNumber
                    value={stock.changePct}
                    decimals={2}
                    prefix={stock.changePct >= 0 ? '+' : ''}
                    suffix="%"
                    className={cn("text-xs font-medium", stock.changePct >= 0 ? "text-emerald-400" : "text-rose-400")}
                  />
                </div>
              </div>
            )) : (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 animate-pulse">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 bg-muted rounded-lg" />
                    <div>
                      <div className="h-3.5 w-20 bg-muted rounded mb-1" />
                      <div className="h-2.5 w-14 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-3.5 w-16 bg-muted rounded mb-1" />
                    <div className="h-2.5 w-10 bg-muted rounded" />
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Breadth + FII Card ───────────────────────────────────────────────────────

function BreadthCard({
  breadth,
  fii,
  dii,
  title,
  onTitleSave,
}: {
  breadth: { advancers: number; decliners: number; unchanged: number }
  fii: number
  dii: number
  title: string
  onTitleSave: (v: string) => void
}) {
  const total = breadth.advancers + breadth.decliners + breadth.unchanged || 1
  const advPct = (breadth.advancers / total) * 100
  const decPct = (breadth.decliners / total) * 100

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <EditableTitle value={title} onSave={onTitleSave} className="text-foreground text-sm" />
        <Activity className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Breadth bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-2">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${advPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-rose-500"
          initial={{ width: 0 }}
          animate={{ width: `${decPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <div className="flex justify-between text-xs mb-4">
        <span className="text-emerald-400 font-medium">{breadth.advancers.toLocaleString('en-IN')} Adv</span>
        <span className="text-muted-foreground">{breadth.unchanged} NC</span>
        <span className="text-rose-400 font-medium">{breadth.decliners.toLocaleString('en-IN')} Dec</span>
      </div>

      {/* FII/DII */}
      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground font-medium">FII / DII Today</p>
        {[{ label: 'FII', value: fii }, { label: 'DII', value: dii }].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={cn("text-sm font-semibold tabular-nums", value >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {value >= 0 ? '+' : ''}{value.toLocaleString('en-IN')} Cr
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bulk Deals Tab ───────────────────────────────────────────────────────────

function BulkDealsView({ deals, title, onTitleSave }: {
  deals: BulkDeal[]
  title: string
  onTitleSave: (v: string) => void
}) {
  if (deals.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-muted-foreground">No bulk deals fetched yet</p>
        <p className="text-xs text-muted-foreground mt-1 opacity-60">NSE bulk deal data requires session access</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <EditableTitle value={title} onSave={onTitleSave} className="text-foreground" />
        <span className="text-xs text-muted-foreground">{deals.length} deals today</span>
      </div>
      <div className="divide-y divide-border">
        {deals.map((deal, i) => (
          <motion.div
            key={`${deal.symbol}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="px-4 py-3.5 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  deal.buySell === 'BUY' ? "bg-emerald-500/10" : "bg-rose-500/10"
                )}>
                  {deal.buySell === 'BUY'
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-rose-400" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-sm">{deal.symbol}</p>
                  <p className="text-xs text-muted-foreground">{deal.clientName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  deal.buySell === 'BUY' ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                )}>{deal.buySell}</span>
                <p className="text-[10px] text-muted-foreground mt-1">{deal.date}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2 p-2.5 rounded-lg bg-muted/30 text-xs">
              <div>
                <p className="text-muted-foreground">Qty</p>
                <p className="font-medium">{deal.quantity?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium">₹{deal.tradePrice?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className="font-medium">{deal.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
}
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function MarketsView() {
  const { user } = useUser()

  // ── Data state ───────────────────────────────────────────────
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [watchlistEntries, setWatchlistEntries] = useState<WatchlistEntry[]>([])
  const [watchlistQuotes, setWatchlistQuotes] = useState<Map<string, StockQuote>>(new Map())
  const [bulkDeals, setBulkDeals] = useState<BulkDeal[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('–')
  const [loading, setLoading] = useState(true)
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)

  // ── Tab + Search ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<MarketTab>('overview')

  // ── Editable card titles ─────────────────────────────────────
  const [titles, setTitles] = useState({
    nifty: 'NIFTY 50',
    sensex: 'SENSEX',
    breadth: 'Market Breadth',
    sectors: 'Sector Heat Map',
    topMovers: 'Top Movers',
    watchlist: 'My Watchlist',
    deals: 'Bulk & Block Deals',
    patterns: 'Chart Pattern Intelligence',
  })

  useEffect(() => {
    if (!user) return;
    fetch('/api/markets/preferences')
      .then(res => res.json())
      .then(d => {
        if (d.preferences?.custom_titles) {
          setTitles(prev => ({ ...prev, ...d.preferences.custom_titles }));
        }
      })
      .catch(console.error);
  }, [user]);

  const saveTitle = (key: keyof typeof titles) => (val: string) => {
    const newTitles = { ...titles, [key]: val };
    setTitles(newTitles);
    fetch('/api/markets/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_titles: newTitles })
    }).catch(console.error);
  }

  // ── FII/DII values (derived from sector data as approximation) ─
  const fiiToday = sectors.length
    ? Math.round(sectors.reduce((s, sec) => s + sec.fiiFlow, 0))
    : 0
  const diiToday = Math.round(fiiToday * 0.71 * (Math.random() > 0.5 ? 1 : -1))

  // ── Fetch market live data ────────────────────────────────────
  const fetchMarket = useCallback(async () => {
    try {
      const res = await fetch('/api/markets/live', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: MarketData = await res.json()
      setMarketData(data)
      setIsConnected(true)
      const t = new Date(data.lastUpdated)
      setLastUpdate(t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch {
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch sectors ─────────────────────────────────────────────
  const fetchSectors = useCallback(async () => {
    try {
      const res = await fetch('/api/markets/sectors', { cache: 'no-store' })
      const data: SectorData[] = await res.json()
      setSectors(data)
    } catch { }
  }, [])

  // ── Fetch watchlist + live quotes ─────────────────────────────
  const fetchWatchlistQuotes = useCallback(async (entries: WatchlistEntry[]) => {
    if (!entries.length) return
    try {
      const symbols = entries.map(e => e.symbol).join(',')
      const res = await fetch(`/api/markets/quotes?symbols=${encodeURIComponent(symbols)}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const quotes: StockQuote[] = await res.json()
      const map = new Map<string, StockQuote>()
      quotes.forEach(q => {
        const clean = q.symbol.replace('.NS', '').replace('.BO', '')
        map.set(clean, { ...q, symbol: clean })
      })
      setWatchlistQuotes(map)
    } catch { }
  }, [])

  const [customTopQuotes, setCustomTopQuotes] = useState<Map<string, StockQuote>>(new Map())
  
  const fetchCustomTopQuotes = useCallback(async () => {
    const toFetch: string[] = []
    if (titles.nifty !== 'NIFTY 50') toFetch.push(parseStockTitle(titles.nifty).symbol)
    if (titles.sensex !== 'SENSEX') toFetch.push(parseStockTitle(titles.sensex).symbol)
    if (toFetch.length === 0) return

    try {
      const res = await fetch(`/api/markets/quotes?symbols=${encodeURIComponent(toFetch.join(','))}`, { cache: 'no-store' })
      if (!res.ok) return
      const quotes: StockQuote[] = await res.json()
      const map = new Map<string, StockQuote>()
      quotes.forEach(q => {
        const clean = q.symbol.replace('.NS', '').replace('.BO', '')
        map.set(clean, { ...q, symbol: clean })
        map.set(q.symbol, { ...q }) // Store both clean and exact for reliability
      })
      setCustomTopQuotes(map)
    } catch { }
  }, [titles.nifty, titles.sensex])

  const fetchWatchlist = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/markets/watchlist')
      if (!res.ok) return
      const data: WatchlistEntry[] = await res.json()
      setWatchlistEntries(data)
      fetchWatchlistQuotes(data)
    } catch { }
  }, [user, fetchWatchlistQuotes])

  // ── Fetch bulk deals (once) ───────────────────────────────────
  const fetchBulkDealsData = useCallback(async () => {
    try {
      const res = await fetch('/api/markets/bulk-deals')
      const data: BulkDeal[] = await res.json()
      setBulkDeals(data)
    } catch { }
  }, [])

  // ── Polling: every 2s for market + 30s for sectors ──────────
  useEffect(() => {
    fetchMarket()
    fetchSectors()
    fetchWatchlist()
    fetchBulkDealsData()
    fetchCustomTopQuotes()

    const liveInterval = setInterval(() => {
      fetchMarket()
      fetchCustomTopQuotes()
    }, 2000)

    const sectorInterval = setInterval(fetchSectors, 30000)
    const watchlistInterval = setInterval(() => {
      if (watchlistEntries.length > 0) fetchWatchlistQuotes(watchlistEntries)
    }, 5000)

    return () => {
      clearInterval(liveInterval)
      clearInterval(sectorInterval)
      clearInterval(watchlistInterval)
    }
  }, [fetchMarket, fetchSectors, fetchWatchlist, fetchBulkDealsData, fetchCustomTopQuotes])

  // Poll watchlist quotes separately once we have entries
  useEffect(() => {
    if (watchlistEntries.length > 0) fetchWatchlistQuotes(watchlistEntries)
  }, [watchlistEntries, fetchWatchlistQuotes])

  // ── Watchlist CRUD handlers ───────────────────────────────────
  const addToWatchlist = useCallback(async (symbol: string, name: string, sector: string) => {
    setIsAddingToWatchlist(true)
    try {
      const res = await fetch('/api/markets/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, company_name: name, sector })
      })
      if (res.ok) {
        const entry = await res.json()
        setWatchlistEntries(prev => [entry, ...prev.filter(e => e.symbol !== symbol)])
      }
    } catch { }
    finally { setIsAddingToWatchlist(false) }
  }, [])

  const removeFromWatchlist = useCallback(async (symbol: string) => {
    setWatchlistEntries(prev => prev.filter(e => e.symbol !== symbol))
    try {
      await fetch('/api/markets/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      })
    } catch {
      await fetchWatchlist()
    }
  }, [fetchWatchlist])

  // ── Extract data ─────────────────────────────────────────────
  const niftyTitleInfo = parseStockTitle(titles.nifty)
  const sensexTitleInfo = parseStockTitle(titles.sensex)

  const niftyData = niftyTitleInfo.name === 'NIFTY 50' 
    ? (marketData?.indices.find(i => i.symbol === 'NIFTY 50') || null)
    : (customTopQuotes.get(niftyTitleInfo.symbol) as unknown as IndexQuote || null)

  const sensexData = sensexTitleInfo.name === 'SENSEX'
    ? (marketData?.indices.find(i => i.symbol === 'SENSEX') || null)
    : (customTopQuotes.get(sensexTitleInfo.symbol) as unknown as IndexQuote || null)

  
  const breadthData = marketData?.breadth ?? { advancers: 0, decliners: 0, unchanged: 0 }

  const tabs = [
    { id: 'overview' as MarketTab, label: 'Overview' },
    { id: 'watchlist' as MarketTab, label: 'Watchlist' },
    { id: 'patterns' as MarketTab, label: 'Chart Patterns' },
    { id: 'heatmap' as MarketTab, label: 'Heat Map' },
    { id: 'deals' as MarketTab, label: 'Bulk Deals' },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Market Intelligence</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdate}</p>
            <LiveDot connected={isConnected} />
          </div>
        </div>
        <button
          onClick={() => { fetchMarket(); fetchSectors() }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </motion.div>

      {/* ── Index Cards ── */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <IndexCard data={niftyData} title={titles.nifty} onTitleSave={saveTitle('nifty')} />
        <IndexCard data={sensexData} title={titles.sensex} onTitleSave={saveTitle('sensex')} />

        <BreadthCard
          breadth={breadthData}
          fii={fiiToday}
          dii={Math.abs(diiToday)}
          title={titles.breadth}
          onTitleSave={saveTitle('breadth')}
        />

        {/* Session snapshot */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Session</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          {niftyData ? (
            <>
              <p className="text-sm font-semibold mb-2">
                {niftyData.changePct >= 0 ? '🟢 Positive' : '🔴 Negative'} Day
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {niftyData.high !== undefined && (
                  <div className="flex justify-between">
                    <span>High</span>
                    <span className="text-emerald-400 font-medium">{niftyData.high?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {niftyData.low !== undefined && (
                  <div className="flex justify-between">
                    <span>Low</span>
                    <span className="text-rose-400 font-medium">{niftyData.low?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {niftyData.open !== undefined && (
                  <div className="flex justify-between">
                    <span>Open</span>
                    <span className="font-medium">{niftyData.open?.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={item} className="w-full overflow-x-auto custom-scrollbar pb-1">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit min-w-min">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid lg:grid-cols-3 gap-5"
          >
            {/* Sector Heat Map inline (2/3 width) */}
            <div className="lg:col-span-2">
              <SectorHeatMap
                sectors={sectors}
                title={titles.sectors}
                onTitleSave={saveTitle('sectors')}
              />
            </div>

            {/* Top Movers (1/3 width) */}
            <TopMoversCard
              gainers={marketData?.topGainers ?? []}
              losers={marketData?.topLosers ?? []}
              title={titles.topMovers}
              onTitleSave={saveTitle('topMovers')}
            />
          </motion.div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <motion.div
            key="watchlist"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <WatchlistView
              items={watchlistEntries}
              quotes={watchlistQuotes}
              title={titles.watchlist}
              onTitleSave={saveTitle('watchlist')}
              onRemove={removeFromWatchlist}
              onAdd={addToWatchlist}
              isAdding={isAddingToWatchlist}
            />
          </motion.div>
        )}

        {/* Chart Patterns Tab */}
        {activeTab === 'patterns' && (
          <motion.div
            key="patterns"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ChartPatternsView
              title={titles.patterns || 'Chart Pattern Intelligence'}
              onTitleSave={saveTitle('patterns')}
            />
          </motion.div>
        )}

        {/* Heat Map Full Tab */}
        {activeTab === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <SectorHeatMap
              sectors={sectors}
              title={titles.sectors}
              onTitleSave={saveTitle('sectors')}
            />

            {/* Legend */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-medium mb-3">How to read the Heat Map</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Strong Gain (>2%)', color: 'rgb(22, 200, 100)', desc: 'Dark green — sector up strongly' },
                  { label: 'Mild Gain (0–2%)', color: 'rgb(50, 160, 80)', desc: 'Light green — positive but moderate' },
                  { label: 'Mild Loss (0–2%)', color: 'rgb(160, 50, 50)', desc: 'Light red — slight selling pressure' },
                  { label: 'Sharp Loss (>2%)', color: 'rgb(220, 30, 30)', desc: 'Dark red — sector under pressure' },
                ].map(l => (
                  <div key={l.label} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded shrink-0 mt-0.5" style={{ backgroundColor: l.color }} />
                    <div>
                      <p className="text-xs font-medium">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground">{l.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Snapshot stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sectors.sort((a, b) => b.change - a.change).map(sector => (
                <div
                  key={sector.name}
                  className={cn(
                    "p-3 rounded-xl border text-sm",
                    sector.change > 0 ? "border-emerald-500/20 bg-emerald-500/5" :
                    sector.change < 0 ? "border-rose-500/20 bg-rose-500/5" :
                    "border-border bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{sector.name}</span>
                    {sector.change > 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
                  </div>
                  <p className={cn("text-lg font-bold", sector.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    FII: {sector.fiiFlow >= 0 ? '+' : ''}{sector.fiiFlow} Cr
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bulk Deals Tab */}
        {activeTab === 'deals' && (
          <motion.div
            key="deals"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <BulkDealsView
              deals={bulkDeals}
              title={titles.deals}
              onTitleSave={saveTitle('deals')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
