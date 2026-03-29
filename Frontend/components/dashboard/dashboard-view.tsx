'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  mockPortfolio, 
  mockMutualFunds, 
  mockAlerts, 
  mockMoneyHealthMetrics,
  mockSectorPerformance,
  formatCurrency,
  formatPercent 
} from '@/lib/mock-data'
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
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// Calculate portfolio stats
const totalEquityValue = mockPortfolio.reduce((sum, h) => sum + h.value, 0)
const totalMFValue = mockMutualFunds.reduce((sum, f) => sum + f.value, 0)
const totalNetWorth = totalEquityValue + totalMFValue
const totalInvested = mockPortfolio.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0) + 
                      mockMutualFunds.reduce((sum, f) => sum + f.invested, 0)
const totalGain = totalNetWorth - totalInvested
const dayChange = mockPortfolio.reduce((sum, h) => sum + (h.value * h.dayChange / 100), 0)

export function DashboardView() {
  const { setActiveView, setSubView, openChatWithQuery } = useAppStore()
  const topGainer = mockPortfolio.reduce((prev, curr) => 
    curr.dayChange > prev.dayChange ? curr : prev
  )
  const topLoser = mockPortfolio.reduce((prev, curr) => 
    curr.dayChange < prev.dayChange ? curr : prev
  )

  const [articles, setArticles] = useState<any[]>([])
  const [loadingNews, setLoadingNews] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data && data.articles) {
          setArticles(data.articles)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingNews(false))
  }, [])

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 space-y-6"
    >
      {/* Morning Brief */}
      <motion.div 
        variants={item}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Morning Brief</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold mb-2">Good morning, Arjun</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
              Markets opened positive with Nifty up 0.63%. Your portfolio is up {formatCurrency(dayChange)} today. 
              {topGainer.symbol} is your top performer (+{topGainer.dayChange.toFixed(2)}%). 
              TCS Q3 results beat expectations - check the impact on your IT holdings.
            </p>
          </div>
          <button 
            onClick={() => openChatWithQuery(`Good morning brief: Nifty is up 0.63%, my portfolio is up today, and TCS Q3 results beat expectations. Please analyse the impact on my IT holdings and give me your morning market brief.`)}
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
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalNetWorth, true)}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={cn(
              "text-sm font-medium tabular-nums",
              totalGain >= 0 ? "text-primary" : "text-destructive"
            )}>
              {formatPercent((totalGain / totalInvested) * 100)}
            </span>
            <span className="text-xs text-muted-foreground">all time</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">{"Today's"} P&L</span>
          </div>
          <p className={cn(
            "text-2xl font-semibold tabular-nums",
            dayChange >= 0 ? "text-primary" : "text-destructive"
          )}>
            {dayChange >= 0 ? '+' : ''}{formatCurrency(dayChange, true)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {dayChange >= 0 ? (
              <ArrowUpRight className="w-3 h-3 text-primary" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-destructive" />
            )}
            <span className={cn(
              "text-sm tabular-nums",
              dayChange >= 0 ? "text-primary" : "text-destructive"
            )}>
              {formatPercent((dayChange / totalNetWorth) * 100)}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-chart-3" />
            </div>
            <span className="text-sm text-muted-foreground">Equity</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalEquityValue, true)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {mockPortfolio.length} holdings
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-chart-4" />
            </div>
            <span className="text-sm text-muted-foreground">Mutual Funds</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalMFValue, true)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {mockMutualFunds.length} schemes
          </p>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Holdings & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Holdings */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Top Holdings</h3>
              <button 
                onClick={() => setActiveView('portfolio')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {mockPortfolio.slice(0, 5).map((holding) => (
                <div 
                  key={holding.symbol} 
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSubView({ type: 'stock-detail', data: { symbol: holding.symbol } })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">{holding.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{holding.symbol}</p>
                      <p className="text-xs text-muted-foreground">{holding.quantity} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">{formatCurrency(holding.value, true)}</p>
                    <p className={cn(
                      "text-xs tabular-nums",
                      holding.dayChange >= 0 ? "text-primary" : "text-destructive"
                    )}>
                      {formatPercent(holding.dayChange)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sector Performance */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Sector Pulse</h3>
              <button 
                onClick={() => setActiveView('markets')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View Markets
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {mockSectorPerformance.map((sector) => (
                <div 
                  key={sector.name} 
                  className={cn(
                    "p-3 rounded-lg border",
                    sector.trend === 'bullish' ? "border-primary/20 bg-primary/5" :
                    sector.trend === 'bearish' ? "border-destructive/20 bg-destructive/5" :
                    "border-border bg-muted/50"
                  )}
                >
                  <p className="text-sm font-medium">{sector.name}</p>
                  <p className={cn(
                    "text-lg font-semibold tabular-nums",
                    sector.change >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {formatPercent(sector.change)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    FII: {sector.fiiFlow >= 0 ? '+' : ''}{sector.fiiFlow} Cr
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Money Health Score */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Money Health</h3>
              <button 
                onClick={() => setActiveView('planning')}
                className="text-sm text-primary hover:underline"
              >
                Details
              </button>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(mockMoneyHealthMetrics.overall / 100) * 352} 352`}
                    className="text-primary transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold tabular-nums">{mockMoneyHealthMetrics.overall}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {mockMoneyHealthMetrics.dimensions.slice(0, 3).map((dim) => (
                <div key={dim.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    {dim.status === 'excellent' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    {dim.status === 'good' && <CheckCircle2 className="w-4 h-4 text-primary/70" />}
                    {dim.status === 'needs_attention' && <AlertTriangle className="w-4 h-4 text-accent" />}
                    {dim.status === 'average' && <Clock className="w-4 h-4 text-muted-foreground" />}
                    <span className="tabular-nums font-medium">{dim.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Alerts</h3>
              </div>
              <button 
                onClick={() => setActiveView('alerts')}
                className="text-sm text-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-border">
              {mockAlerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id} 
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    !alert.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 shrink-0",
                      alert.priority === 'high' ? "bg-accent" :
                      alert.priority === 'medium' ? "bg-chart-3" :
                      "bg-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item} className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSubView({ type: 'watchlist' })}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4" />
                Watchlist
              </button>
              <button
                onClick={() => setSubView({ type: 'screener' })}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Screener
              </button>
              <button
                onClick={() => setActiveView('planning')}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
              >
                Tax Report
              </button>
              <button
                onClick={() => openChatWithQuery('Open my financial dashboard: analyse my portfolio performance, identify my top opportunities and risks, and suggest 3 actionable next steps.')}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
              >
                Ask AI
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* News Feed Preview */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Latest News</h3>
          <button 
            onClick={() => setActiveView('news')}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {loadingNews ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex gap-2"><div className="w-16 h-5 bg-muted rounded animate-pulse" /><div className="w-20 h-5 bg-muted rounded animate-pulse" /></div>
                <div className="w-full h-4 bg-muted rounded animate-pulse" />
                <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
                <div className="pt-2 flex gap-2"><div className="w-12 h-2 bg-muted rounded animate-pulse" /><div className="flex-1 h-2 bg-muted rounded animate-pulse" /></div>
              </div>
            ))
          ) : (
            articles.slice(0, 3).map((news) => (
              <div key={news.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => window.open(news.url, '_blank')}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded",
                    news.sentiment === 'positive' ? "bg-primary/10 text-primary" :
                    news.sentiment === 'negative' ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {news.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{news.time}</span>
                </div>
                <h4 className="font-medium text-sm line-clamp-2 mb-2">{news.title}</h4>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Impact:</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        news.impactScore >= 80 ? "bg-accent" :
                        news.impactScore >= 60 ? "bg-primary" :
                        "bg-muted-foreground"
                      )}
                      style={{ width: `${news.impactScore}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums font-medium">{news.impactScore}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
