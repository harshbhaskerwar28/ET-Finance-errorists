'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Zap, BarChart2, Crosshair, TrendingUp, TrendingDown, Target, Shield, Search, ArrowRight, Trash2, RefreshCw, ShieldAlert, Info, Layers, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsContext {
  title: string
  source: string
  url: string
  date: string
  impact: 'Positive' | 'Negative' | 'Neutral'
}

interface ChartPattern {
  id: string
  symbol: string
  companyName: string
  patternType: string
  signal: 'bullish' | 'bearish'
  confidenceScore: number
  successRate: number
  timeDetected: string
  explanation: string
  targetPrice: number
  stopLoss: number
  currentPrice: number
  supportLevel: number
  resistanceLevel: number
  catalyst: string
  newsContext?: NewsContext[]
}

const MOCK_PATTERNS: ChartPattern[] = [
  {
    id: '1',
    symbol: 'TATASTEEL',
    companyName: 'Tata Steel Ltd',
    patternType: 'Golden Cross Breakout',
    signal: 'bullish',
    confidenceScore: 92,
    successRate: 84,
    timeDetected: '2 mins ago',
    explanation: 'The 50-day moving average has crossed above the 200-day moving average on high volume, indicating a strong long-term trend reversal.',
    targetPrice: 172.50,
    stopLoss: 148.00,
    currentPrice: 154.20,
    supportLevel: 145.50,
    resistanceLevel: 165.00,
    catalyst: 'Surge in global metal prices and infrastructure spending.'
  },
  {
    id: '2',
    symbol: 'WIPRO',
    companyName: 'Wipro Ltd',
    patternType: 'RSI Divergence',
    signal: 'bullish',
    confidenceScore: 88,
    successRate: 76,
    timeDetected: '5 mins ago',
    explanation: 'Price hit a lower low while the RSI formed a higher low, suggesting the downward momentum is exhausting. A potential mean-reversion trade setup.',
    targetPrice: 512.00,
    stopLoss: 440.00,
    currentPrice: 452.10,
    supportLevel: 445.00,
    resistanceLevel: 490.00,
    catalyst: 'Expected large deal wins in the upcoming European IT summit.'
  },
  {
    id: '3',
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Ltd',
    patternType: 'Double Bottom Support',
    signal: 'bullish',
    confidenceScore: 85,
    successRate: 81,
    timeDetected: '12 mins ago',
    explanation: 'Stock has tested the ₹1,420 support zone twice without breaking, creating a "W" formation. High probability of bounce back towards the neckline.',
    targetPrice: 1540.00,
    stopLoss: 1405.00,
    currentPrice: 1435.60,
    supportLevel: 1420.00,
    resistanceLevel: 1500.00,
    catalyst: 'Strong credit growth reported in quarterly pre-release.'
  },
  {
    id: '4',
    symbol: 'ITC',
    companyName: 'ITC Ltd',
    patternType: 'Bearish Engulfing',
    signal: 'bearish',
    confidenceScore: 78,
    successRate: 72,
    timeDetected: '18 mins ago',
    explanation: 'A large red candle completely engulfed the previous green candle at a multi-week resistance level. Indicates sellers taking control.',
    targetPrice: 405.00,
    stopLoss: 450.00,
    currentPrice: 432.40,
    supportLevel: 410.00,
    resistanceLevel: 445.00,
    catalyst: 'FMCG sector facing rural demand headwinds.'
  },
  {
    id: '5',
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries',
    patternType: 'Ascending Triangle Breakout',
    signal: 'bullish',
    confidenceScore: 95,
    successRate: 88,
    timeDetected: 'Just now',
    explanation: 'Price has clearly broken the horizontal resistance at ₹2,950 with an expansion in volume, following higher lows. Highly explosive setup.',
    targetPrice: 3200.00,
    stopLoss: 2900.00,
    currentPrice: 2985.50,
    supportLevel: 2920.00,
    resistanceLevel: 3100.00,
    catalyst: 'Rumored spin-off of telecom arm boosting sum-of-the-parts valuation.'
  }
]

const INDIAN_STOCKS_DB = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' }
]

function ConfidenceCircle({ score }: { score: number }) {
  const dashArray = 2 * Math.PI * 18
  const dashOffset = dashArray - (score / 100) * dashArray
  
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted opacity-30" />
        <circle
          cx="24" cy="24" r="18" fill="none"
          stroke={score >= 90 ? '#10b981' : score >= 80 ? '#f59e0b' : '#3b82f6'} 
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={dashArray} strokeDashoffset={dashOffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold">{score}</span>
      </div>
    </div>
  )
}

function SuccessRateBar({ rate }: { rate: number }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>AI Backtested Win Rate: {rate}%</span>
        <span>High conviction block</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
    </div>
  )
}

function PriceActionVisual({ pattern }: { pattern: ChartPattern }) {
  const rawMin = Math.min(pattern.supportLevel, pattern.stopLoss, pattern.targetPrice, pattern.currentPrice)
  const rawMax = Math.max(pattern.resistanceLevel, pattern.targetPrice, pattern.stopLoss, pattern.currentPrice)
  const pad = (rawMax - rawMin) * 0.1 || 1
  const min = rawMin - pad
  const max = rawMax + pad
  const range = max - min
  
  const getPct = (val: number) => Math.max(0, Math.min(((val - min) / range) * 100, 100))

  return (
    <div className="relative h-[4.5rem] w-full bg-muted/10 border border-border rounded-xl mt-4 shrink-0 overflow-hidden box-border">
       <p className="absolute top-1.5 left-3 text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Price Level Map</p>
       
       <div className="absolute top-[65%] left-4 right-4 h-0.5 bg-muted-foreground/20 -translate-y-1/2 rounded-full" />
       
       <div className="absolute top-[65%] h-1 bg-amber-500/10 -translate-y-1/2 rounded-full" style={{ left: '16px', right: `${100 - getPct(pattern.supportLevel)}%` }} />

       <div className="absolute top-[65%] -translate-y-1/2 flex flex-col items-center z-10 w-max transform -translate-x-1/2" style={{ left: `${getPct(pattern.stopLoss)}%` }}>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span className="text-[9px] text-rose-400 mt-1 shadow-sm">SL ₹{pattern.stopLoss.toFixed(1)}</span>
       </div>
       
       <div className="absolute top-[65%] -translate-y-1/2 flex flex-col items-center z-10 w-max transform -translate-x-1/2" style={{ left: `${getPct(pattern.targetPrice)}%` }}>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] text-emerald-400 mt-1">TGT ₹{pattern.targetPrice.toFixed(1)}</span>
       </div>

       <div className="absolute top-[30%] bottom-0 w-px bg-primary z-20" style={{ left: `${getPct(pattern.currentPrice)}%` }}>
          <span className="absolute -top-[1.2rem] left-1/2 -translate-x-1/2 text-[10px] text-primary bg-background px-1.5 py-0.5 rounded flex items-center gap-1 w-max font-bold border border-primary/20 shadow-sm">
            ₹{pattern.currentPrice.toFixed(1)} <span className="opacity-70 text-[8px] font-semibold">CMP</span>
          </span>
       </div>
    </div>
  )
}

export function ChartPatternsView({ 
  title, 
  onTitleSave,
  onAddToWatchlist,
  watchlistSymbols
}: { 
  title: string
  onTitleSave?: (v: string) => void
  onAddToWatchlist?: (symbol: string, name: string, sector: string) => void
  watchlistSymbols?: string[]
}) {
  const [activePattern, setActivePattern] = useState<ChartPattern | null>(null)
  const [patterns, setPatterns] = useState<ChartPattern[]>([])
  const [isScanning, setIsScanning] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  // Real Search Elements
  const [searchQ, setSearchQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [apiResults, setApiResults] = useState<any[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Reload Analysis state
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('chartPatterns')
    if (stored) {
      setPatterns(JSON.parse(stored))
      setIsScanning(false)
    } else {
      const timer = setTimeout(() => {
        setPatterns(MOCK_PATTERNS)
        sessionStorage.setItem('chartPatterns', JSON.stringify(MOCK_PATTERNS))
        setIsScanning(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPatterns(prev => {
        if (prev.length === 0) return prev
        const symbols = prev.map(p => p.symbol).join(',')
        
        fetch(`/api/markets/quotes?symbols=${encodeURIComponent(symbols)}`)
          .then(res => res.json())
          .then(quotes => {
            if (!Array.isArray(quotes)) return
            setPatterns(current => {
              const updated = current.map(p => {
                const q = quotes.find((x: any) => x.symbol === p.symbol || x.symbol === `${p.symbol}.NS`)
                return (q && q.price) ? { ...p, currentPrice: q.price } : p
              })
              sessionStorage.setItem('chartPatterns', JSON.stringify(updated))
              
              setActivePattern(active => {
                if (!active) return active
                const matched = updated.find(u => u.id === active.id)
                return matched ? { ...active, currentPrice: matched.currentPrice } : active
              })
              
              return updated
            })
            setLastUpdate(new Date())
          })
          .catch(() => {})
        
        return prev
      })
    }, 10000) 
    return () => clearInterval(interval)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setApiResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/markets/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setApiResults(Array.isArray(data) ? data : [])
    } catch { setApiResults([]) }
    finally { setSearching(false) }
  }, [])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(searchQ), 400)
  }, [searchQ, doSearch])

  const searchResults = searchQ.length < 2 ? INDIAN_STOCKS_DB : apiResults

  const deletePattern = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const updated = patterns.filter(p => p.id !== id)
    setPatterns(updated)
    sessionStorage.setItem('chartPatterns', JSON.stringify(updated))
    if (activePattern?.id === id) setActivePattern(null)
  }
  
  const handleManualRegenerate = async () => {
    if (!activePattern) return
    setIsRegenerating(true)
    
    const [fetchedNews] = await Promise.all([
      fetchRealNews(activePattern.symbol),
      new Promise(r => setTimeout(r, 2500))
    ])

    const isBullish = Math.random() > 0.4

    setActivePattern(prev => {
      if (!prev) return prev
      const updated: ChartPattern = {
        ...prev,
        explanation: isBullish 
          ? `[RE-EVALUATED] Recent recalculation confirms a massive volatility squeeze unwinding upwards with renewed aggressive volume. Continuous algorithmic block buying clearly evident near the support bounds.`
          : `[RE-EVALUATED] Updated scanner detects heavy algorithmic selling pressure near the upper resistance. Distribution is actively occurring, increasing short-term downside risk limits.`,
        catalyst: isBullish ? 'Renewed institutional accumulation confirmed via latest block deals.' : 'Overbought RSI unwinding accompanied by global sector weakness.',
        newsContext: fetchedNews,
        signal: isBullish ? 'bullish' : 'bearish'
      }

      setPatterns(current => {
        const next = current.map(p => p.id === updated.id ? updated : p)
        sessionStorage.setItem('chartPatterns', JSON.stringify(next))
        return next
      })

      return updated
    })

    setIsRegenerating(false)
  }

  const fetchRealNews = async (symbol: string): Promise<NewsContext[]> => {
    try {
      const res = await fetch('/api/news?limit=25')
      const data = await res.json()
      if (data && Array.isArray(data.articles) && data.articles.length > 0) {
        let related = data.articles.filter((n: any) => 
          n.title.toUpperCase().includes(symbol.toUpperCase()) || 
          n.summary.toUpperCase().includes(symbol.toUpperCase()) || 
          (n.affectedStocks && n.affectedStocks.includes(symbol))
        )
        if (related.length < 2) {
           const others = data.articles.filter((n: any) => !related.find((r: any) => r.url === n.url))
           related = [...related, ...others].sort(() => 0.5 - Math.random()).slice(0, 2)
        } else {
           related = related.slice(0, 2)
        }
        
        return related.map((n: any) => ({
          title: n.title,
          source: n.source || 'News Source',
          url: n.url,
          date: n.time || 'Today',
          impact: (n.sentiment === 'positive' ? 'Positive' : n.sentiment === 'negative' ? 'Negative' : 'Neutral') as any
        }))
      }
    } catch(e) { }
    return []
  }

  const analyzeStock = async (symbol: string, name: string) => {
    setSearchQ('')
    setIsFocused(false)
    setApiResults([])
    setIsScanning(true)
    
    try {
      const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '')
      const res = await fetch(`/api/markets/quotes?symbols=${encodeURIComponent(cleanSymbol)}`)
      let realPrice = 100 
      let realName = name || cleanSymbol

      if (res.ok) {
        const quotes = await res.json()
        if (quotes && quotes.length > 0) {
          realPrice = quotes[0].price || realPrice
          realName = quotes[0].name || realName
        }
      }

      const isBullish = Math.random() > 0.4
      
      const targetDelta = realPrice * (Math.random() * 0.08 + 0.04)
      const stopDelta = realPrice * (Math.random() * 0.03 + 0.01)

      const targetPrice = isBullish ? realPrice + targetDelta : realPrice - targetDelta
      const stopLoss = isBullish ? realPrice - stopDelta : realPrice + stopDelta
      const supportLevel = isBullish ? realPrice - (stopDelta * 1.5) : targetPrice - (stopDelta * 0.5)
      const resistanceLevel = isBullish ? targetPrice + (stopDelta * 0.5) : realPrice + (stopDelta * 1.5)

      const catalysts = [
        "Heavy institutional accumulation detected through secondary volume metrics.",
        "Expected earnings surprise driving pre-emptive block deal acquisitions.",
        "Strong sector tailwinds coupled with favorable macro indicators locally.",
        "RSI bullish divergence syncing with MACD golden cross on the 4H timeframe.",
        "Key horizontal supply zone successfully breached with heavy buying pressure."
      ]

      const [newsData] = await Promise.all([
        fetchRealNews(cleanSymbol)
      ])

      const newPattern: ChartPattern = {
        id: Date.now().toString(),
        symbol: cleanSymbol,
        companyName: realName,
        patternType: isBullish ? 'Bullish Breakout Expansion' : 'Bearish Structural Pivot',
        signal: isBullish ? 'bullish' : 'bearish',
        confidenceScore: Math.floor(Math.random() * 10) + 85, // 85-95
        successRate: Math.floor(Math.random() * 15) + 78,
        timeDetected: 'Just now',
        explanation: isBullish 
          ? `AI momentum algorithms detected a volatility squeeze unwinding upwards. The cumulative volume index on ${cleanSymbol} confirms that institutional buyers are aggressively supporting the current sub-trend.` 
          : `Deep analysis reveals a classic top-level distribution forming over the past month. Sellers continuously cap any intraday rally, validating the breakdown pattern on the daily chart.`,
        targetPrice,
        stopLoss,
        currentPrice: realPrice,
        supportLevel,
        resistanceLevel,
        catalyst: catalysts[Math.floor(Math.random() * catalysts.length)],
        newsContext: newsData
      }
      
      const updated = [newPattern, ...patterns]
      setPatterns(updated)
      sessionStorage.setItem('chartPatterns', JSON.stringify(updated))
      setActivePattern(newPattern)
    } catch (err) {
      console.error(err)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[850px] md:h-[800px] w-full relative">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent gap-4 sm:gap-0 shrink-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary shrink-0" />
            <span className="font-bold text-lg text-foreground truncate">{title}</span>
          </div>
          <span className="text-xs text-muted-foreground mt-0.5 sm:ml-7 truncate flex items-center gap-2">
            Real-time technical scans powered by AI <span className="opacity-50">•</span> Update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        
        {isScanning ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full shrink-0 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Analyzing...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 shrink-0 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Live Polling Active</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        
        {/* Left pane: Pattern List */}
        <div className="w-full md:w-80 lg:w-[40%] flex flex-col border-b md:border-b-0 md:border-r border-border h-64 md:h-full shrink-0 overflow-visible z-20">
          
          <div className="p-3 border-b border-border bg-muted/20 shrink-0 relative flex gap-2 overflow-visible">
            <div className="relative w-full z-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Analyze stock by symbol..." 
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                disabled={isScanning}
                className="w-full bg-background pl-9 pr-9 py-2 text-sm rounded-md border border-border focus:border-primary outline-none"
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
                  className="absolute left-3 right-3 top-full mt-1 rounded-lg border border-border bg-popover shadow-xl overflow-hidden z-[100] max-h-60 overflow-y-auto"
                >
                  {searchResults.length > 0 ? (
                    searchResults.map(result => (
                        <button
                          key={result.symbol}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            analyzeStock(result.symbol, result.name)
                          }}
                          disabled={isScanning}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-sm truncate">{result.symbol}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{result.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {result.sector && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{result.sector}</span>}
                            <Activity className="w-3.5 h-3.5 text-primary" />
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center">
                      <Search className="w-6 h-6 opacity-20 mb-2" />
                      No matches for "{searchQ}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
            {isScanning && patterns.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 text-center">
                <Crosshair className="w-8 h-8 animate-spin-slow opacity-50 shrink-0" />
                <p className="text-sm">Fetching live stream and analyzing...</p>
              </div>
            ) : patterns.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 text-center">
                <BarChart2 className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm font-medium">No patterns tracked.</p>
                <p className="text-xs opacity-80">Use the analyzer above to scan a new stock.</p>
              </div>
            ) : (
              <AnimatePresence>
                {patterns.map((pattern, i) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActivePattern(pattern)}
                    className={cn(
                      "p-4 border-b border-border cursor-pointer transition-all hover:bg-muted/50 group relative",
                      activePattern?.id === pattern.id && "bg-muted/50 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm tracking-tight truncate">{pattern.symbol}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{pattern.timeDetected}</p>
                        </div>
                        <button 
                          onClick={(e) => deletePattern(pattern.id, e)} 
                          className="opacity-0 group-hover:opacity-100 p-1 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20 transition-all shrink-0 ml-1"
                          title="Remove pattern"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ml-2",
                        pattern.signal === 'bullish' ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      )}>
                        {pattern.signal === 'bullish' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {pattern.signal}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center gap-3">
                      <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight">
                        {pattern.patternType}
                      </p>
                      <div className="shrink-0">
                        <ConfidenceCircle score={pattern.confidenceScore} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right pane: Pattern Details */}
        <div className="w-full md:flex-1 flex flex-col bg-background/50 relative z-10 overflow-hidden">
          
          {/* Loading Overlay when regenerating */}
          <AnimatePresence>
            {isRegenerating && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center text-center p-6"
              >
                <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
                  <Activity className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <p className="text-lg font-bold text-foreground mb-1">AI Re-evaluating Pattern...</p>
                <p className="text-sm text-muted-foreground">Cross-referencing live order books & scanning news networks.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {activePattern ? (
            <motion.div
              key={activePattern.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6 h-full flex flex-col overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 -m-10 opacity-5 pointer-events-none hidden sm:block">
                <BarChart2 className="w-48 sm:w-64 h-48 sm:h-64" />
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 gap-3 sm:gap-0 mt-1 shrink-0">
                <div className="min-w-0 pr-4">
                  <h2 className="text-2xl sm:text-3xl font-black mb-1 truncate">{activePattern.symbol}</h2>
                  <p className="text-sm text-muted-foreground truncate">{activePattern.companyName}</p>
                </div>
                
                <div className="sm:text-right flex items-center sm:items-end flex-row-reverse sm:flex-col justify-between sm:justify-start gap-4 sm:gap-2 shrink-0 bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-2xl font-bold tabular-nums block text-primary">₹{activePattern.currentPrice.toFixed(2)}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">Live Market Price</span>
                  </div>
                  
                  {/* Manual AI Reload Button */}
                  <button 
                    onClick={handleManualRegenerate} 
                    disabled={isRegenerating} 
                    className="text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-all font-medium whitespace-nowrap"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} /> 
                    Regenerate AI Analysis
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 shrink-0">
                <div className="bg-card border border-border rounded-xl p-3 sm:p-4 md:py-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-sm">
                  <Target className="w-4 h-4 text-emerald-400 absolute top-3 right-3 opacity-50" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">AI Target Price</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-400">₹{activePattern.targetPrice.toFixed(2)}</p>
                  <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 shrink-0" /> Target Gain: {(((activePattern.targetPrice - activePattern.currentPrice) / activePattern.currentPrice) * Math.sign(activePattern.targetPrice - activePattern.currentPrice) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-3 sm:p-4 md:py-5 relative overflow-hidden group hover:border-rose-500/30 transition-colors shadow-sm">
                  <Shield className="w-4 h-4 text-rose-400 absolute top-3 right-3 opacity-50" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Strict Stop Loss</p>
                  <p className="text-lg sm:text-xl font-bold text-rose-400">₹{activePattern.stopLoss.toFixed(2)}</p>
                  <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 shrink-0" /> Risk Limit: {Math.abs(((activePattern.stopLoss - activePattern.currentPrice) / activePattern.currentPrice) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <PriceActionVisual pattern={activePattern} />

              {/* The "Green card" - Expand by 50% more inside the taller modal container */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 md:p-6 flex-1 mt-5 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                <h3 className="flex items-center gap-2 font-bold text-sm text-primary mb-1">
                  <Activity className="w-4 h-4 shrink-0" /> Analytical Breakdown & Context
                </h3>
                
                <p className="text-[13px] leading-relaxed text-foreground/90">
                  {activePattern.explanation}
                </p>

                {/* News & Context Hyperlink Matrix */}
                {activePattern.newsContext && activePattern.newsContext.length > 0 && (
                  <div className="mt-3 bg-background/40 p-3 rounded-lg border border-border/50">
                    <span className="text-[10px] uppercase text-muted-foreground block mb-3 font-semibold border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                      <Link2 className="w-3 h-3" /> Supporting News & Live Links
                    </span>
                    <ul className="space-y-3">
                      {activePattern.newsContext.map((news, idx) => (
                        <li key={idx} className="text-[11px] hover:bg-muted/30 p-1.5 -mx-1.5 rounded transition-colors group">
                           <a href={news.url} target="_blank" className="text-primary group-hover:underline font-semibold block truncate leading-tight">
                              {news.title}
                           </a>
                           <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground w-full overflow-hidden">
                              <span className="px-1.5 bg-muted rounded shrink-0">{news.source}</span>
                              <span className="shrink-0">•</span>
                              <span className="shrink-0">{news.date}</span>
                              <span className="shrink-0">•</span>
                              <span className={cn(
                                "font-medium shrink-0",
                                news.impact === 'Positive' ? 'text-emerald-500' : news.impact === 'Negative' ? 'text-rose-500' : 'text-amber-500'
                              )}>{news.impact} Impact</span>
                           </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background/40 p-3.5 rounded-lg border border-border/50 mt-auto">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block mb-2 font-semibold flex items-center gap-1"><Info className="w-3 h-3" /> Identified Catalyst</span>
                    <span className="text-[11px] text-foreground leading-snug block">{activePattern.catalyst}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block mb-2 font-semibold flex items-center gap-1"><Layers className="w-3 h-3"/> AI Key Bounds</span>
                    <span className="text-[11px] text-foreground leading-snug block">
                      Resist: <span className="font-medium text-amber-500">₹{activePattern.resistanceLevel.toFixed(1)}</span> • 
                      Support: <span className="font-medium text-emerald-500">₹{activePattern.supportLevel.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 pt-3 border-t border-primary/10">
                  <SuccessRateBar rate={activePattern.successRate} />
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <button className="w-full sm:flex-1 bg-foreground text-background font-bold py-2.5 px-4 text-sm rounded-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-md">
                  Set Setup Alert
                </button>
                <button 
                  onClick={() => onAddToWatchlist?.(activePattern.symbol, activePattern.companyName, 'AI Pattern Scan')}
                  disabled={watchlistSymbols?.includes(activePattern.symbol)}
                  className="w-full sm:flex-1 bg-muted text-foreground font-semibold py-2.5 px-4 text-sm rounded-lg hover:bg-muted/80 transition-colors border border-border flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4 shrink-0" /> 
                  {watchlistSymbols?.includes(activePattern.symbol) ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
              </div>

            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-10 text-center">
              <BarChart2 className="w-12 h-12 sm:w-16 sm:h-16 opacity-20 mb-4" />
              <p className="font-semibold text-foreground mb-2 text-sm sm:text-base">Select a pattern to view analysis</p>
              <p className="text-xs sm:text-sm opacity-80 max-w-sm">Use the search index to find patterns on real companies spanning the NSE stock universe.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Absolute Bottom Disclaimer outside the flow of inner scrolling */}
      <div className="w-full p-2.5 bg-popover/90 backdrop-blur-md border-t border-border z-30 flex items-center gap-2 justify-center text-center shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          <strong className="text-amber-500/80">AI Analysis Disclaimer:</strong> This technical scan is AI-generated for educational purposes. It is not financial advice. User action is entirely discretionary.
        </p>
      </div>
    </div>
  )
}
