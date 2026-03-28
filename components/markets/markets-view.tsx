'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  mockStocks, 
  mockSectorPerformance, 
  mockChartPatterns,
  mockBulkDeals,
  formatCurrency, 
  formatPercent 
} from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import { 
  TrendingUp, 
  TrendingDown, 
  Search,
  Star,
  StarOff,
  Activity,
  BarChart3,
  Layers,
  ArrowRight,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

type MarketTab = 'overview' | 'watchlist' | 'patterns' | 'deals'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

const marketStats = {
  advancers: 1245,
  decliners: 892,
  unchanged: 156,
  fiiToday: 1250,
  diiToday: 890
}

export function MarketsView() {
  const [activeTab, setActiveTab] = useState<MarketTab>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAppStore()

  const marketIndices = mockStocks.filter(s => s.sector === 'Index')
  const stocksOnly = mockStocks.filter(s => s.sector !== 'Index')

  const filteredStocks = stocksOnly.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const watchlistStocks = stocksOnly.filter(s => watchlist.includes(s.symbol))

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 space-y-6"
    >
      {/* Market Indices */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {marketIndices.map((index) => (
          <div key={index.symbol} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{index.symbol}</span>
              {index.change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <p className="text-2xl font-semibold tabular-nums">{index.price.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-sm font-medium tabular-nums",
                index.change >= 0 ? "text-primary" : "text-destructive"
              )}>
                {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
              </span>
              <span className={cn(
                "text-sm tabular-nums",
                index.change >= 0 ? "text-primary" : "text-destructive"
              )}>
                ({formatPercent(index.changePercent)})
              </span>
            </div>
          </div>
        ))}
        
        {/* Market Breadth */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Market Breadth</span>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-muted">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${(marketStats.advancers / (marketStats.advancers + marketStats.decliners)) * 100}%` }} 
              />
              <div 
                className="h-full bg-destructive" 
                style={{ width: `${(marketStats.decliners / (marketStats.advancers + marketStats.decliners)) * 100}%` }} 
              />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-primary">{marketStats.advancers} Adv</span>
            <span className="text-destructive">{marketStats.decliners} Dec</span>
          </div>
        </div>

        {/* FII/DII */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">FII/DII Today</span>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">FII</span>
              <span className={cn(
                "text-sm font-medium tabular-nums",
                marketStats.fiiToday >= 0 ? "text-primary" : "text-destructive"
              )}>
                {marketStats.fiiToday >= 0 ? '+' : ''}{marketStats.fiiToday} Cr
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">DII</span>
              <span className={cn(
                "text-sm font-medium tabular-nums",
                marketStats.diiToday >= 0 ? "text-primary" : "text-destructive"
              )}>
                {marketStats.diiToday >= 0 ? '+' : ''}{marketStats.diiToday} Cr
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(['overview', 'watchlist', 'patterns', 'deals'] as MarketTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all capitalize",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'patterns' ? 'Chart Patterns' : tab === 'deals' ? 'Bulk Deals' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
          />
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Sector Performance */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Sector Performance</h3>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {mockSectorPerformance.map((sector) => (
                  <div 
                    key={sector.name}
                    className={cn(
                      "p-3 rounded-lg border transition-all hover:scale-[1.02]",
                      sector.trend === 'bullish' ? "border-primary/30 bg-primary/5" :
                      sector.trend === 'bearish' ? "border-destructive/30 bg-destructive/5" :
                      "border-border bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{sector.name}</p>
                      {sector.trend === 'bullish' && <TrendingUp className="w-3 h-3 text-primary" />}
                      {sector.trend === 'bearish' && <TrendingDown className="w-3 h-3 text-destructive" />}
                    </div>
                    <p className={cn(
                      "text-xl font-semibold tabular-nums",
                      sector.change >= 0 ? "text-primary" : "text-destructive"
                    )}>
                      {formatPercent(sector.change)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      FII: {sector.fiiFlow >= 0 ? '+' : ''}{sector.fiiFlow} Cr
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Movers */}
            <div className="bg-card border border-border rounded-xl">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Top Movers</h3>
              </div>
              <div className="divide-y divide-border">
                {stocksOnly
                  .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
                  .slice(0, 5)
                  .map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">{stock.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stock.symbol}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(stock.price)}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-sm font-medium tabular-nums",
                        stock.changePercent >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {formatPercent(stock.changePercent)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'watchlist' && (
          <motion.div
            key="watchlist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Your Watchlist</h3>
              <span className="text-sm text-muted-foreground">{watchlist.length} stocks</span>
            </div>
            
            {watchlistStocks.length > 0 ? (
              <div className="divide-y divide-border">
                {watchlistStocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeFromWatchlist(stock.symbol)}
                        className="text-accent hover:text-accent/80"
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(stock.price)}</p>
                      <p className={cn(
                        "text-sm tabular-nums",
                        stock.changePercent >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {formatPercent(stock.changePercent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <StarOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No stocks in your watchlist</p>
                <p className="text-sm text-muted-foreground mt-1">Add stocks from the overview tab</p>
              </div>
            )}

            {/* Add from search */}
            {searchQuery && (
              <div className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Search Results</p>
                <div className="space-y-2">
                  {filteredStocks.filter(s => !watchlist.includes(s.symbol)).slice(0, 3).map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">{stock.symbol.slice(0, 2)}</span>
                        </div>
                        <span className="font-medium text-sm">{stock.symbol}</span>
                      </div>
                      <button
                        onClick={() => addToWatchlist(stock.symbol)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Star className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'patterns' && (
          <motion.div
            key="patterns"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Chart Pattern Intelligence</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-detected technical patterns with historical success rates. Patterns are refreshed every 15 minutes.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {mockChartPatterns.map((pattern, i) => (
                <motion.div
                  key={`${pattern.stock}-${pattern.pattern}`}
                  variants={item}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{pattern.stock.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{pattern.stock}</p>
                        <p className="text-xs text-muted-foreground">{pattern.timeframe} chart</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      pattern.confidence >= 80 ? "bg-primary/20 text-primary" :
                      pattern.confidence >= 70 ? "bg-accent/20 text-accent" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {pattern.confidence}% conf
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-semibold text-primary">{pattern.pattern}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm">Historical Success</span>
                    </div>
                    <span className="font-medium tabular-nums">{pattern.historicalSuccess}%</span>
                  </div>

                  <button className="w-full mt-3 px-4 py-2 rounded-lg border border-border hover:bg-muted flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                    <Eye className="w-4 h-4" />
                    View Chart
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'deals' && (
          <motion.div
            key="deals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-semibold">Bulk & Block Deals</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Track institutional buying and selling</p>
              </div>
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="divide-y divide-border">
              {mockBulkDeals.map((deal, i) => (
                <motion.div
                  key={`${deal.stock}-${i}`}
                  variants={item}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        deal.buyer ? "bg-primary/10" : "bg-destructive/10"
                      )}>
                        {deal.buyer ? (
                          <TrendingUp className="w-5 h-5 text-primary" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{deal.stock}</p>
                        <p className="text-sm text-muted-foreground">{deal.buyer || deal.seller}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-medium",
                        deal.buyer ? "text-primary" : "text-destructive"
                      )}>
                        {deal.buyer ? 'BUY' : 'SELL'}
                      </p>
                      <p className="text-xs text-muted-foreground">{deal.date}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-medium text-sm">{deal.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium text-sm tabular-nums">{formatCurrency(deal.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-medium text-sm">{deal.value}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      This {"operator's"} past deals had {deal.historicalAccuracy}% predictive accuracy
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
