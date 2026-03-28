'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  mockPortfolio, 
  mockMutualFunds, 
  formatCurrency, 
  formatPercent,
  type PortfolioHolding,
  type MutualFund
} from '@/lib/mock-data'
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Layers,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'equity' | 'mutualfunds' | 'overview'

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

// Calculate totals
const totalEquityValue = mockPortfolio.reduce((sum, h) => sum + h.value, 0)
const totalEquityInvested = mockPortfolio.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0)
const totalMFValue = mockMutualFunds.reduce((sum, f) => sum + f.value, 0)
const totalMFInvested = mockMutualFunds.reduce((sum, f) => sum + f.invested, 0)
const equityGain = totalEquityValue - totalEquityInvested
const mfGain = totalMFValue - totalMFInvested
const dayChange = mockPortfolio.reduce((sum, h) => sum + (h.value * h.dayChange / 100), 0)

// Sector allocation
const sectorAllocation = mockPortfolio.reduce((acc, h) => {
  if (!acc[h.sector]) acc[h.sector] = 0
  acc[h.sector] += h.value
  return acc
}, {} as Record<string, number>)

const sectorData = Object.entries(sectorAllocation)
  .map(([sector, value]) => ({
    sector,
    value,
    percentage: (value / totalEquityValue) * 100
  }))
  .sort((a, b) => b.value - a.value)

const sectorColors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-muted-foreground']

export function PortfolioView() {
  const [activeTab, setActiveTab] = useState<TabType>('equity')
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'return'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const sortedEquity = [...mockPortfolio]
    .filter(h => h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'value') comparison = a.value - b.value
      if (sortBy === 'change') comparison = a.dayChange - b.dayChange
      if (sortBy === 'return') comparison = a.totalReturn - b.totalReturn
      return sortOrder === 'desc' ? -comparison : comparison
    })

  const sortedMF = [...mockMutualFunds]
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'value') comparison = a.value - b.value
      if (sortBy === 'return') comparison = a.xirr - b.xirr
      return sortOrder === 'desc' ? -comparison : comparison
    })

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
    return sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 space-y-6"
    >
      {/* Portfolio Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Portfolio</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalEquityValue + totalMFValue, true)}</p>
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
              {formatCurrency(dayChange, true)} today
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Returns</p>
          <p className={cn(
            "text-2xl font-semibold tabular-nums",
            equityGain + mfGain >= 0 ? "text-primary" : "text-destructive"
          )}>
            {formatCurrency(equityGain + mfGain, true)}
          </p>
          <span className={cn(
            "text-sm tabular-nums",
            equityGain + mfGain >= 0 ? "text-primary" : "text-destructive"
          )}>
            {formatPercent(((equityGain + mfGain) / (totalEquityInvested + totalMFInvested)) * 100)}
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Equity Holdings</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalEquityValue, true)}</p>
          <span className="text-sm text-muted-foreground">{mockPortfolio.length} stocks</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Mutual Funds</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalMFValue, true)}</p>
          <span className="text-sm text-muted-foreground">{mockMutualFunds.length} schemes</span>
        </div>
      </motion.div>

      {/* Tabs and Controls */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(['equity', 'mutualfunds', 'overview'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'equity' ? 'Equity' : tab === 'mutualfunds' ? 'Mutual Funds' : 'Overview'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search holdings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
            />
          </div>
          <button className="h-9 px-3 rounded-lg bg-muted/50 hover:bg-muted flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">Filter</span>
          </button>
          <button className="h-9 px-3 rounded-lg bg-muted/50 hover:bg-muted flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'equity' && (
          <motion.div
            key="equity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-sm font-medium text-muted-foreground bg-muted/30">
              <div className="col-span-4 md:col-span-3">Stock</div>
              <div className="col-span-2 hidden md:block">Qty / Avg</div>
              <button 
                onClick={() => toggleSort('value')}
                className="col-span-3 md:col-span-2 flex items-center gap-1 group text-right justify-end"
              >
                Value <SortIcon column="value" />
              </button>
              <button 
                onClick={() => toggleSort('change')}
                className="col-span-3 md:col-span-2 flex items-center gap-1 group text-right justify-end"
              >
                Day P&L <SortIcon column="change" />
              </button>
              <button 
                onClick={() => toggleSort('return')}
                className="col-span-2 md:col-span-2 flex items-center gap-1 group text-right justify-end"
              >
                Total Return <SortIcon column="return" />
              </button>
              <div className="col-span-1 hidden md:block text-right">Alloc</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {sortedEquity.map((holding) => (
                <motion.div
                  key={holding.symbol}
                  variants={item}
                  className="group"
                >
                  <div 
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === holding.symbol ? null : holding.symbol)}
                  >
                    <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium">{holding.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{holding.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate hidden md:block">{holding.name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{formatCurrency(holding.currentPrice)}</p>
                      </div>
                    </div>
                    <div className="col-span-2 hidden md:flex flex-col justify-center">
                      <p className="text-sm tabular-nums">{holding.quantity} shares</p>
                      <p className="text-xs text-muted-foreground tabular-nums">@ {formatCurrency(holding.avgPrice)}</p>
                    </div>
                    <div className="col-span-3 md:col-span-2 flex flex-col justify-center text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(holding.value, true)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(holding.currentPrice)}</p>
                    </div>
                    <div className="col-span-3 md:col-span-2 flex flex-col justify-center text-right">
                      <p className={cn(
                        "font-medium tabular-nums",
                        holding.dayChange >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {formatPercent(holding.dayChange)}
                      </p>
                      <p className={cn(
                        "text-xs tabular-nums",
                        holding.dayChange >= 0 ? "text-primary/70" : "text-destructive/70"
                      )}>
                        {formatCurrency(holding.value * holding.dayChange / 100, true)}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-2 flex flex-col justify-center text-right">
                      <p className={cn(
                        "font-medium tabular-nums",
                        holding.totalReturn >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {formatPercent(holding.totalReturn)}
                      </p>
                    </div>
                    <div className="col-span-1 hidden md:flex flex-col justify-center text-right">
                      <p className="text-sm tabular-nums">{holding.allocation.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Expanded Row */}
                  <AnimatePresence>
                    {expandedRow === holding.symbol && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-muted/20"
                      >
                        <div className="p-4 grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Sector</p>
                            <p className="font-medium">{holding.sector}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Invested Value</p>
                            <p className="font-medium tabular-nums">{formatCurrency(holding.avgPrice * holding.quantity)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Unrealized P&L</p>
                            <p className={cn(
                              "font-medium tabular-nums",
                              holding.totalReturn >= 0 ? "text-primary" : "text-destructive"
                            )}>
                              {formatCurrency(holding.value - (holding.avgPrice * holding.quantity))}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                              Buy More
                            </button>
                            <button className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80">
                              Sell
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'mutualfunds' && (
          <motion.div
            key="mutualfunds"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-sm font-medium text-muted-foreground bg-muted/30">
              <div className="col-span-5 md:col-span-4">Fund</div>
              <div className="col-span-2 hidden md:block">NAV / Units</div>
              <div className="col-span-3 md:col-span-2 text-right">Value</div>
              <div className="col-span-2 text-right">Returns</div>
              <div className="col-span-2 text-right">XIRR</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {sortedMF.map((fund) => (
                <motion.div
                  key={fund.name}
                  variants={item}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-5 md:col-span-4">
                    <p className="font-medium truncate">{fund.name}</p>
                    <p className="text-xs text-muted-foreground">{fund.scheme} | {fund.category}</p>
                  </div>
                  <div className="col-span-2 hidden md:flex flex-col justify-center">
                    <p className="text-sm tabular-nums">{formatCurrency(fund.nav)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{fund.units.toLocaleString()} units</p>
                  </div>
                  <div className="col-span-3 md:col-span-2 flex flex-col justify-center text-right">
                    <p className="font-medium tabular-nums">{formatCurrency(fund.value, true)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">Inv: {formatCurrency(fund.invested, true)}</p>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center text-right">
                    <p className={cn(
                      "font-medium tabular-nums",
                      fund.returns >= 0 ? "text-primary" : "text-destructive"
                    )}>
                      {formatCurrency(fund.returns, true)}
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center text-right">
                    <p className={cn(
                      "font-medium tabular-nums",
                      fund.xirr >= 0 ? "text-primary" : "text-destructive"
                    )}>
                      {fund.xirr.toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Sector Allocation */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Sector Allocation</h3>
                <PieChart className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {/* Visual Bar */}
              <div className="h-4 rounded-full overflow-hidden flex mb-6">
                {sectorData.map((sector, i) => (
                  <div
                    key={sector.sector}
                    className={cn("h-full", sectorColors[i % sectorColors.length])}
                    style={{ width: `${sector.percentage}%` }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {sectorData.map((sector, i) => (
                  <div key={sector.sector} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded", sectorColors[i % sectorColors.length])} />
                      <span className="text-sm">{sector.sector}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm tabular-nums text-muted-foreground">{formatCurrency(sector.value, true)}</span>
                      <span className="text-sm tabular-nums font-medium w-12 text-right">{sector.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Performance Analysis</h3>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Top Performer</span>
                    <span className="text-xs text-primary">Best in portfolio</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mockPortfolio.reduce((prev, curr) => curr.totalReturn > prev.totalReturn ? curr : prev).symbol}</span>
                    <span className="text-primary font-semibold tabular-nums">
                      {formatPercent(mockPortfolio.reduce((prev, curr) => curr.totalReturn > prev.totalReturn ? curr : prev).totalReturn)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Needs Attention</span>
                    <span className="text-xs text-destructive">Underperforming</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mockPortfolio.reduce((prev, curr) => curr.totalReturn < prev.totalReturn ? curr : prev).symbol}</span>
                    <span className="text-destructive font-semibold tabular-nums">
                      {formatPercent(mockPortfolio.reduce((prev, curr) => curr.totalReturn < prev.totalReturn ? curr : prev).totalReturn)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consider rebalancing IT sector exposure. Current allocation is 34% vs recommended 25% for your risk profile.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105">
        <Plus className="w-6 h-6" />
      </button>
    </motion.div>
  )
}
