'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency, formatPercent } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bell,
  ChevronRight,
  Wallet,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Filter,
  Loader2,
  RefreshCw,
  Target,
  Edit2,
  X,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableTitle, CardStockPicker } from '@/components/ui/editable-elements'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export function DashboardView() {
  const { 
    setActiveView, 
    setSubView, 
    openChatWithQuery, 
    user, 
    supabaseProfile,
    dashboardCache,
    setDashboardCache
  } = useAppStore()

  // Data state
  const [brief, setBrief] = useState<any>(null)
  const [briefLoading, setBriefLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [health, setHealth] = useState<any>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifsLoading, setNotifsLoading] = useState(true)
  const [marketData, setMarketData] = useState<any>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [preferences, setPreferences] = useState<any>(null)
  const [prefLoading, setPrefLoading] = useState(true)
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({
    portfolio: 'Portfolio Holdings',
    pulse: 'Market Pulse',
    health: 'Money Health',
    alerts: 'Alerts',
    news: 'Latest News'
  })

  const displayName = supabaseProfile?.first_name || user.name || 'there'
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Fetch morning brief
  useEffect(() => {
    if (dashboardCache.brief) {
      setBrief(dashboardCache.brief)
      setBriefLoading(false)
      return
    }
    fetch('/api/brief/today')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setBrief(d.brief); setDashboardCache({ brief: d.brief }) })
      .catch(console.error)
      .finally(() => setBriefLoading(false))
  }, [dashboardCache.brief, setDashboardCache])

  // Fetch portfolio
  useEffect(() => {
    if (dashboardCache.portfolio) {
      setPortfolio(dashboardCache.portfolio)
      setPortfolioLoading(false)
      return
    }
    fetch('/api/portfolio/assets')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { 
        setPortfolio(d)
        setDashboardCache({ portfolio: d })
        // Also update the centralized portfolio cache used by PortfolioView
        useAppStore.getState().setPortfolioCache({
          assets: d.assets || [],
          netWorth: d.netWorth || 0,
          totalInvested: d.totalInvested || 0,
          lastFetched: Date.now()
        })
      })
      .catch(console.error)
      .finally(() => setPortfolioLoading(false))
  }, [dashboardCache.portfolio, setDashboardCache])

  // Fetch money health
  useEffect(() => {
    if (dashboardCache.health) {
      setHealth(dashboardCache.health)
      setHealthLoading(false)
      return
    }
    fetch('/api/money-health/latest')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setHealth(d.assessment); setDashboardCache({ health: d.assessment }) })
      .catch(console.error)
      .finally(() => setHealthLoading(false))
  }, [dashboardCache.health, setDashboardCache])

  // Fetch notifications
  useEffect(() => {
    if (dashboardCache.notifications?.length > 0) {
      setNotifications(dashboardCache.notifications)
      setNotifsLoading(false)
      return
    }
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { 
        const notifs = d.notifications || []
        setNotifications(notifs)
        setDashboardCache({ notifications: notifs })
        // Removed dummy welcome notification to satisfy 'Everything dynamic' requirement
      })
      .catch(console.error)
      .finally(() => setNotifsLoading(false))
  }, [dashboardCache.notifications, setDashboardCache])

  // Fetch news
  useEffect(() => {
    if (dashboardCache.news?.length > 0) {
      setArticles(dashboardCache.news)
      setNewsLoading(false)
      return
    }
    fetch('/api/news')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d?.articles) { setArticles(d.articles); setDashboardCache({ news: d.articles }) } })
      .catch(console.error)
      .finally(() => setNewsLoading(false))
  }, [dashboardCache.news, setDashboardCache])

  // Fetch market data (default Nifty)
  useEffect(() => {
    if (dashboardCache.marketData) {
      setMarketData(dashboardCache.marketData)
      return
    }
    fetch('/api/markets/quotes?symbols=^NSEI')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setMarketData(d); setDashboardCache({ marketData: d }) })
      .catch(console.error)
  }, [dashboardCache.marketData, setDashboardCache])

  // Fetch preferences
  useEffect(() => {
    if (dashboardCache.preferences) {
      setPreferences(dashboardCache.preferences)
      if (dashboardCache.preferences.custom_titles) {
        setCustomTitles(prev => ({ ...prev, ...dashboardCache.preferences.custom_titles }))
      }
      setPrefLoading(false)
      return
    }
    fetch('/api/markets/preferences')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        if (d.preferences) {
          setPreferences(d.preferences)
          setDashboardCache({ preferences: d.preferences })
          if (d.preferences.custom_titles) {
            setCustomTitles(prev => ({ ...prev, ...d.preferences.custom_titles }))
          }
        }
      })
      .catch(console.error)
      .finally(() => setPrefLoading(false))
  }, [dashboardCache.preferences, setDashboardCache])

  const updatePreference = async (key: string, value: any) => {
    try {
      const newPrefs = { ...preferences, [key]: value }
      setPreferences(newPrefs)
      await fetch('/api/markets/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      })
    } catch (e) {
      console.error('Failed to update preference:', e)
    }
  }

  const updateCustomTitle = (key: string, title: string) => {
    const newTitles = { ...customTitles, [key]: title }
    setCustomTitles(newTitles)
    updatePreference('custom_titles', newTitles)
  }

  const updateIndexSymbol = (index: number, symbol: string, label: string) => {
    const currentIndices = preferences?.favorite_indices || [
      { symbol: '^NSEI', name: 'Nifty 50' },
      { symbol: '^BSESN', name: 'Sensex' },
      { symbol: 'USDINR=X', name: 'USD/INR' },
      { symbol: 'CL=F', name: 'Crude Oil' },
    ]
    const newIndices = [...currentIndices]
    newIndices[index] = { symbol, name: label }
    updatePreference('favorite_indices', newIndices)
  }

  const netWorth = portfolio?.netWorth || 0
  const totalInvested = portfolio?.totalInvested || 0
  const totalGain = netWorth - totalInvested
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  // Get equit assets
  const equityAssets = (portfolio?.assets || []).filter((a: any) => a.asset_type === 'equity')
  const dayChange = equityAssets.reduce((sum: number, a: any) =>
    sum + ((a.current_value || 0) * (a.day_change_pct || 0) / 100), 0)

  const topGainer = equityAssets.reduce((prev: any, curr: any) =>
    (curr.day_change_pct || 0) > (prev?.day_change_pct || 0) ? curr : prev, equityAssets[0])
  const topLoser = equityAssets.reduce((prev: any, curr: any) =>
    (curr.day_change_pct || 0) < (prev?.day_change_pct || 0) ? curr : prev, equityAssets[0])

  const unreadNotifs = notifications.filter(n => !n.is_read)

  // Health score dimensions
  const healthDimensions = health ? [
    { name: 'Emergency Fund', score: Math.round((health.score_emergency || 0) * 10), status: (health.score_emergency || 0) >= 7 ? 'good' : 'needs_attention' },
    { name: 'Insurance', score: Math.round((health.score_insurance || 0) * 10), status: (health.score_insurance || 0) >= 7 ? 'good' : 'needs_attention' },
    { name: 'Debt Health', score: Math.round((health.score_debt || 0) * 10), status: (health.score_debt || 0) >= 7 ? 'excellent' : 'average' },
  ] : null

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">

      {/* Morning Brief */}
      <motion.div variants={item}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Morning Brief</span>
            </div>
            {briefLoading ? (
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
              </div>
            ) : brief ? (
              <>
                <h2 className="text-lg md:text-xl font-semibold mb-1">
                  {greeting()}, {displayName}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                  {brief.content}
                </p>
                {brief.global_data && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {brief.global_data.nifty && (
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                        brief.global_data.nifty.change >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                        Nifty {brief.global_data.nifty.change >= 0 ? '▲' : '▼'} {Math.abs(brief.global_data.nifty.change || 0).toFixed(2)}%
                      </span>
                    )}
                    {brief.global_data.usd_inr && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted font-medium">
                        USD/INR ₹{brief.global_data.usd_inr.toFixed(2)}
                      </span>
                    )}
                    {brief.global_data.crude_oil && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted font-medium">
                        Crude ${brief.global_data.crude_oil.price?.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg md:text-xl font-semibold mb-2">{greeting()}, {displayName}! 👋</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {equityAssets.length > 0
                    ? `Your portfolio has ${equityAssets.length} stocks. ${topGainer ? `${topGainer.metadata?.symbol || 'Your top stock'} is leading today.` : ''}`
                    : 'Add your first stock to get personalized insights and tracking.'}
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => openChatWithQuery(`Give me a detailed morning market brief for today. What are the key events to watch? How does it impact my portfolio?`)}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Ask AI
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Portfolio Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Net Worth</span>
          </div>
          {portfolioLoading ? (
            <div className="h-8 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <p className="text-xl font-bold tabular-nums">{formatCurrency(netWorth, true)}</p>
              <div className="flex items-center gap-1 mt-1">
                {totalGain >= 0
                  ? <ArrowUpRight className="w-3 h-3 text-primary" />
                  : <ArrowDownRight className="w-3 h-3 text-destructive" />}
                <span className={cn("text-sm tabular-nums font-medium", totalGain >= 0 ? "text-primary" : "text-destructive")}>
                  {formatPercent(totalGainPct)}
                </span>
                <span className="text-xs text-muted-foreground">all time</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Today's P&L</span>
          </div>
          {portfolioLoading ? (
            <div className="h-8 bg-muted rounded animate-pulse" />
          ) : equityAssets.length === 0 ? (
            <p className="text-xl font-semibold text-muted-foreground">—</p>
          ) : (
            <>
              <p className={cn("text-xl font-bold tabular-nums", dayChange >= 0 ? "text-primary" : "text-destructive")}>
                {dayChange >= 0 ? '+' : ''}{formatCurrency(dayChange, true)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">from equity portfolio</p>
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-chart-3" />
            </div>
            <span className="text-sm text-muted-foreground">Equity</span>
          </div>
          {portfolioLoading ? (
            <div className="h-8 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCurrency(equityAssets.reduce((s: number, a: any) => s + (a.current_value || 0), 0), true)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{equityAssets.length} holdings</p>
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-chart-4" />
            </div>
            <span className="text-sm text-muted-foreground">Health Score</span>
          </div>
          {healthLoading ? (
            <div className="h-8 bg-muted rounded animate-pulse" />
          ) : health ? (
            <>
              <p className="text-xl font-bold tabular-nums">{Math.round((health.overall_score || 0) * 10)}/100</p>
              <p className={cn("text-xs mt-1 font-medium",
                (health.overall_score || 0) >= 7 ? "text-primary" : (health.overall_score || 0) >= 4 ? "text-accent" : "text-destructive")}>
                Grade {health.grade || '—'}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-muted-foreground">—</p>
              <button onClick={() => setActiveView('planning')} className="text-xs text-primary hover:underline mt-1">Calculate →</button>
            </>
          )}
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Holdings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Holdings */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <EditableTitle 
                value={customTitles.portfolio} 
                onSave={(v) => updateCustomTitle('portfolio', v)} 
                className="text-foreground" 
              />
              <button onClick={() => setActiveView('portfolio')}
                className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {portfolioLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="flex-1 h-4 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : equityAssets.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No equity holdings yet</p>
                <button onClick={() => setActiveView('portfolio')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
                  Add Your First Stock
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(equityAssets || []).slice(0, 5).map((asset: any) => {
                  const displayName = asset.metadata?.symbol || asset.asset_name || 'Asset'
                  return (
                    <div key={asset.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSubView({ type: 'stock-detail', data: { symbol: asset.metadata?.symbol } })}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold">{displayName.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{asset.quantity || 0} shares</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium tabular-nums text-sm">{formatCurrency(asset.current_value || 0, true)}</p>
                        <p className={cn("text-xs tabular-nums",
                          (asset.day_change_pct || 0) >= 0 ? "text-primary" : "text-destructive")}>
                          {(asset.day_change_pct || 0) >= 0 ? '+' : ''}{(asset.day_change_pct || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Market Pulse - Real Sector Data */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Market Pulse</h3>
              <button onClick={() => setActiveView('markets')}
                className="text-sm text-primary hover:underline flex items-center gap-1">
                View Markets <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {(preferences?.favorite_indices || [
                { symbol: '^NSEI', name: 'Nifty 50' },
                { symbol: '^BSESN', name: 'Sensex' },
                { symbol: 'USDINR=X', name: 'USD/INR' },
                { symbol: 'CL=F', name: 'Crude Oil' },
              ]).map((idx: any, i: number) => (
                <MarketIndexCard 
                  key={`${idx.symbol}-${i}`} 
                  symbol={idx.symbol} 
                  label={idx.name} 
                  onEdit={(sym, name) => updateIndexSymbol(i, sym, name)}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Money Health Widget */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <EditableTitle 
                value={customTitles.health} 
                onSave={(v) => updateCustomTitle('health', v)} 
                className="text-foreground" 
              />
              <button onClick={() => setActiveView('planning')} className="text-sm text-primary hover:underline">
                {health ? 'Recalculate' : 'Calculate'}
              </button>
            </div>
            {healthLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="w-24 h-24 bg-muted rounded-full mx-auto" />
                <div className="h-4 bg-muted rounded" />
              </div>
            ) : health ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="none"
                        strokeDasharray={`${(health.overall_score || 0) * 30.2} 302`}
                        className={cn("transition-all duration-1000",
                          (health.overall_score || 0) >= 7 ? "text-primary" :
                            (health.overall_score || 0) >= 4 ? "text-accent" : "text-destructive")}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold tabular-nums">{Math.round((health.overall_score || 0) * 10)}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {healthDimensions?.map(dim => (
                    <div key={dim.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">{dim.name}</span>
                      <div className="flex items-center gap-1.5">
                        {dim.status === 'excellent' && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                        {dim.status === 'good' && <CheckCircle2 className="w-3.5 h-3.5 text-primary/70" />}
                        {dim.status === 'needs_attention' && <AlertTriangle className="w-3.5 h-3.5 text-accent" />}
                        {dim.status === 'average' && <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span className="tabular-nums font-medium text-xs">{dim.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Get your financial health score</p>
                <button onClick={() => setActiveView('planning')}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors">
                  Calculate Score
                </button>
              </div>
            )}
          </motion.div>

          {/* Recent Alerts */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <EditableTitle 
                  value={customTitles.alerts} 
                  onSave={(v) => updateCustomTitle('alerts', v)} 
                  className="text-foreground" 
                />
                {unreadNotifs.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                    {unreadNotifs.length}
                  </span>
                )}
              </div>
              <button onClick={() => setActiveView('alerts')} className="text-sm text-primary hover:underline">
                View All
              </button>
            </div>
            {notifsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : unreadNotifs.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No new alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {unreadNotifs.slice(0, 3).map(notif => (
                  <div key={notif.id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setActiveView('alerts')}>
                    <div className="flex items-start gap-2">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                        notif.urgency === 'high' || notif.urgency === 'critical' ? "bg-accent" :
                          notif.urgency === 'medium' ? "bg-chart-3" : "bg-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSubView({ type: 'watchlist' })}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                Watchlist
              </button>
              <button onClick={() => setSubView({ type: 'screener' })}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                Screener
              </button>
              <button onClick={() => setActiveView('planning')}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors">
                Tax Report
              </button>
              <button onClick={() => openChatWithQuery('Analyse my portfolio: what are my top opportunities and risks today? Give me 3 specific actionable insights.')}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors">
                Ask AI
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* News Feed */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <EditableTitle 
            value={customTitles.news} 
            onSave={(v) => updateCustomTitle('news', v)} 
            className="text-foreground" 
          />
          <button onClick={() => setActiveView('news')}
            className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {newsLoading
            ? [...Array(3)].map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex gap-2"><div className="w-16 h-5 bg-muted rounded animate-pulse" /><div className="w-20 h-5 bg-muted rounded animate-pulse" /></div>
                <div className="w-full h-4 bg-muted rounded animate-pulse" />
                <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))
            : articles.slice(0, 3).map(news => (
              <div key={news.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => window.open(news.url, '_blank')}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded",
                    news.sentiment === 'positive' ? "bg-primary/10 text-primary" :
                      news.sentiment === 'negative' ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground")}>
                    {news.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{news.time}</span>
                </div>
                <h4 className="font-medium text-sm line-clamp-2 mb-2">{news.title}</h4>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Impact:</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      news.impactScore >= 80 ? "bg-accent" : news.impactScore >= 60 ? "bg-primary" : "bg-muted-foreground")}
                      style={{ width: `${news.impactScore}%` }} />
                  </div>
                  <span className="text-xs tabular-nums font-medium">{news.impactScore}</span>
                </div>
              </div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Market Index Card ─────────────────────────────────────────────
function MarketIndexCard({ symbol, label, onEdit }: { symbol: string; label: string; onEdit?: (sym: string, name: string) => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuote = () => {
      fetch(`/api/markets/quotes?symbols=${encodeURIComponent(symbol)}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => {
          const quote = d[0] || d.quote || d
          setData(quote)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }

    fetchQuote()
    const interval = setInterval(fetchQuote, 30000)
    return () => clearInterval(interval)
  }, [symbol])

  if (loading) return (
    <div className="p-3 rounded-lg bg-muted/30 animate-pulse">
      <div className="h-3 bg-muted rounded w-1/2 mb-2" />
      <div className="h-5 bg-muted rounded" />
    </div>
  )

  const change = data?.changePct || data?.change_pct || 0
  return (
    <div className={cn("p-3 rounded-lg border group relative",
      change >= 0 ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5")}>
      <CardStockPicker 
        value={label} 
        onSave={(sym, name) => onEdit?.(sym, name)} 
        className="text-xs text-muted-foreground mb-1 block w-full overflow-hidden" 
      />
      <p className="font-semibold text-sm tabular-nums">
        {data?.price ? (symbol === 'USDINR=X' ? `₹${data.price.toFixed(2)}` : symbol === 'CL=F' ? `$${data.price.toFixed(2)}` : data.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })) : '—'}
      </p>
      <p className={cn("text-xs tabular-nums font-medium", change >= 0 ? "text-primary" : "text-destructive")}>
        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
      </p>
    </div>
  )
}
