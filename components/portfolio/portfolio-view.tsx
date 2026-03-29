'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatPercent } from '@/lib/mock-data'
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Layers,
  RefreshCw,
  Trash2,
  Edit3,
  X,
  Check,
  Loader2,
  Star,
  Building,
  Coins,
  Home,
  Landmark,
  Gem,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

type TabType = 'equity' | 'overview' | 'all'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
}
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

interface Asset {
  id: string
  asset_type: string
  asset_name: string
  quantity: number
  purchase_price: number
  purchase_date: string
  current_value: number
  current_price?: number
  day_change_pct?: number
  total_return_pct?: number
  live_data?: { change: number; changePct: number; name: string }
  metadata?: any
}

// ─── Add Asset Modal ───────────────────────────────────────────────
function AddAssetModal({ onClose, onAdd, editingAsset }: { onClose: () => void; onAdd: () => void; editingAsset?: Asset | null }) {
  const [assetType, setAssetType] = useState(editingAsset?.asset_type || 'equity')
  const [searchQuery, setSearchQuery] = useState(editingAsset?.asset_name || '')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(editingAsset?.asset_type === 'equity' ? { symbol: editingAsset.metadata?.symbol, name: editingAsset.asset_name, sector: editingAsset.metadata?.sector } : null)
  const [quantity, setQuantity] = useState(editingAsset?.quantity?.toString() || '')
  const [buyPrice, setBuyPrice] = useState(editingAsset?.purchase_price?.toString() || '')
  const [buyDate, setBuyDate] = useState(editingAsset?.purchase_date || new Date().toISOString().split('T')[0])
  const [assetName, setAssetName] = useState(editingAsset?.asset_name || '')
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // Search stocks
  useEffect(() => {
    if (assetType !== 'equity' || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/markets/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : (data.results || []))
      } catch {}
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, assetType])

  const handleSelectStock = (stock: any) => {
    setSelectedStock(stock)
    setSearchQuery(stock.symbol)
    setSearchResults([])
    if (stock.price) setBuyPrice(stock.price.toFixed(2))
  }

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    try {
      const body: any = {
        asset_type: assetType,
        quantity: parseFloat(quantity) || 1,
        purchase_price: parseFloat(buyPrice) || 0,
        purchase_date: buyDate,
      }

      if (assetType === 'equity' && selectedStock) {
        body.asset_name = selectedStock.name || selectedStock.symbol
        body.metadata = { symbol: selectedStock.symbol, sector: selectedStock.sector }
      } else {
        body.asset_name = assetName
        if (assetType === 'fd') body.metadata = { principal: parseFloat(quantity) || 0, interest_rate: parseFloat(buyPrice) || 7, start_date: buyDate }
        if (assetType === 'ppf') body.metadata = { balance: parseFloat(quantity) || 0, last_updated: buyDate }
        if (assetType === 'gold') body.metadata = { unit: 'grams' }
      }

      const res = await fetch('/api/portfolio/assets', {
        method: editingAsset ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, id: editingAsset?.id }),
      })
      if (res.ok) { onAdd(); onClose() }
    } catch {}
    setLoading(false)
  }

  const assetTypes = [
    { id: 'equity', label: 'Stocks', icon: TrendingUp },
    { id: 'gold', label: 'Gold', icon: Coins },
    { id: 'fd', label: 'Fixed Deposit', icon: Landmark },
    { id: 'ppf', label: 'PPF', icon: Star },
    { id: 'real_estate', label: 'Real Estate', icon: Home },
    { id: 'other', label: 'Other', icon: Gem },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">{editingAsset ? 'Edit Holding' : 'Add to Portfolio'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Asset Type Selection */}
        <div className="mb-5">
          <label className="text-sm font-medium mb-2 block">Asset Type</label>
          <div className="grid grid-cols-3 gap-2">
            {assetTypes.map(type => (
              <button
                key={type.id}
                onClick={() => { setAssetType(type.id); setSelectedStock(null); setSearchQuery('') }}
                className={cn(
                  "p-2.5 rounded-lg border text-sm flex flex-col items-center gap-1 transition-all",
                  assetType === type.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <type.icon className="w-4 h-4" />
                <span className="text-xs">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Equity Search */}
        {assetType === 'equity' && (
          <div className="mb-4 relative">
            <label className="text-sm font-medium mb-2 block">Search Stock</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedStock(null) }}
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
              />
              {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto"
                >
                  {searchResults.map(stock => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectStock(stock)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 text-left text-sm"
                    >
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                      {stock.price && (
                        <div className="text-right">
                          <p className="font-medium tabular-nums">₹{stock.price.toFixed(2)}</p>
                          <p className={cn("text-xs tabular-nums", (stock.change_pct || 0) >= 0 ? "text-primary" : "text-destructive")}>
                            {(stock.change_pct || 0) >= 0 ? '+' : ''}{(stock.change_pct || 0).toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedStock && (
              <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">{selectedStock.symbol}</p>
                  <p className="text-xs text-muted-foreground">{selectedStock.sector}</p>
                </div>
                {selectedStock.price && <p className="text-sm font-medium">₹{selectedStock.price.toFixed(2)}</p>}
              </div>
            )}
          </div>
        )}

        {/* Non-equity name */}
        {assetType !== 'equity' && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              {assetType === 'fd' ? 'Bank Name' : assetType === 'real_estate' ? 'Property Name' : 'Asset Name'}
            </label>
            <input
              type="text"
              placeholder={assetType === 'fd' ? 'e.g., HDFC Bank FD' : assetType === 'gold' ? 'e.g., Sovereign Gold Bond' : 'Asset name'}
              value={assetName}
              onChange={e => setAssetName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
            />
          </div>
        )}

        {/* Quantity / Amount */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">
            {assetType === 'equity' ? 'Number of Shares' :
              assetType === 'gold' ? 'Quantity (grams)' :
                assetType === 'fd' || assetType === 'ppf' ? 'Principal Amount (₹)' :
                  assetType === 'real_estate' ? 'Current Value (₹)' : 'Quantity'}
          </label>
          <input
            type="number"
            placeholder={assetType === 'equity' ? '10' : '100000'}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
          />
        </div>

        {/* Buy Price */}
        {assetType !== 'ppf' && assetType !== 'real_estate' && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              {assetType === 'equity' ? 'Buy Price (₹ per share)' :
                assetType === 'gold' ? 'Buy Price (₹ per gram)' :
                  assetType === 'fd' ? 'Interest Rate (% p.a.)' : 'Cost Price (₹)'}
            </label>
            <input
              type="number"
              placeholder={assetType === 'fd' ? '7.5' : '0'}
              value={buyPrice}
              onChange={e => setBuyPrice(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
            />
            {assetType === 'equity' && selectedStock?.price && (
              <p className="text-xs text-muted-foreground mt-1">
                Current market price: ₹{selectedStock.price.toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Date */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">
            {assetType === 'fd' ? 'Start Date' : 'Purchase Date'}
          </label>
          <input
            type="date"
            value={buyDate}
            onChange={e => setBuyDate(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
          />
        </div>

        {/* Summary */}
        {assetType === 'equity' && selectedStock && quantity && buyPrice && (
          <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm font-medium mb-2">Investment Summary</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{quantity} shares</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Cost</p>
                <p className="font-medium">₹{parseFloat(buyPrice).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Invested</p>
                <p className="font-medium">₹{(parseFloat(quantity) * parseFloat(buyPrice)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
              {selectedStock.price && (
                <div>
                  <p className="text-muted-foreground">Current Value</p>
                  <p className={cn("font-medium", parseFloat(quantity) * selectedStock.price >= parseFloat(quantity) * parseFloat(buyPrice) ? "text-primary" : "text-destructive")}>
                    ₹{(parseFloat(quantity) * selectedStock.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (assetType === 'equity' && !selectedStock) || (!quantity)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {editingAsset ? 'Update Asset' : 'Add to Portfolio'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Portfolio View ───────────────────────────────────────────
export function PortfolioView() {
  const { portfolioCache, setPortfolioCache } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabType>('equity')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  
  // Use cache as initial state
  const [assets, setAssets] = useState<Asset[]>(portfolioCache.assets)
  const [netWorth, setNetWorth] = useState(portfolioCache.netWorth)
  const [totalInvested, setTotalInvested] = useState(portfolioCache.totalInvested)
  
  const [loading, setLoading] = useState(!portfolioCache.lastFetched)
  const [refreshing, setRefreshing] = useState(false)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'return'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchAssets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/portfolio/assets')
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
        setNetWorth(data.netWorth || 0)
        setTotalInvested(data.totalInvested || 0)
        
        // Update global cache
        setPortfolioCache({
          assets: data.assets || [],
          netWorth: data.netWorth || 0,
          totalInvested: data.totalInvested || 0,
          lastFetched: Date.now()
        })
      }
    } catch (err) {
      console.error('[Portfolio] Fetch error:', err)
    }
    setLoading(false)
    setRefreshing(false)
  }, [setPortfolioCache])

  useEffect(() => {
    fetchAssets()
    // Poll every 30 seconds for live prices
    const interval = setInterval(() => fetchAssets(true), 30000)
    return () => clearInterval(interval)
  }, [fetchAssets])

  const deleteAsset = async (id: string) => {
    try {
      await fetch(`/api/portfolio/assets?id=${id}`, { method: 'DELETE' })
      setAssets(prev => prev.filter(a => a.id !== id))
    } catch {}
  }

  const equityAssets = assets.filter(a => a.asset_type === 'equity')
  const totalGain = netWorth - totalInvested
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  const filteredEquity = equityAssets.filter(a => {
    const sym = (a.metadata?.symbol || '').toLowerCase()
    const nm = (a.asset_name || '').toLowerCase()
    const q = (searchQuery || '').toLowerCase()
    return sym.includes(q) || nm.includes(q)
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === 'value') comparison = (a.current_value || 0) - (b.current_value || 0)
    if (sortBy === 'change') comparison = (a.day_change_pct || 0) - (b.day_change_pct || 0)
    if (sortBy === 'return') comparison = (a.total_return_pct || 0) - (b.total_return_pct || 0)
    return sortOrder === 'desc' ? -comparison : comparison
  })

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortOrder('desc') }
  }

  const SortIcon = ({ column }: { column: typeof sortBy }) =>
    sortBy !== column
      ? <ChevronDown className="w-3 h-3 opacity-30" />
      : sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />

  // Asset type breakdown
  const byType = assets.reduce((acc: Record<string, number>, a) => {
    acc[a.asset_type] = (acc[a.asset_type] || 0) + (a.current_value || 0)
    return acc
  }, {})

  const assetTypeColors: Record<string, string> = {
    equity: 'bg-primary', mutual_fund: 'bg-accent', gold: 'bg-yellow-500',
    fd: 'bg-blue-500', ppf: 'bg-green-500', real_estate: 'bg-orange-500', other: 'bg-muted-foreground'
  }
  const assetTypeLabels: Record<string, string> = {
    equity: 'Stocks', mutual_fund: 'Mutual Funds', gold: 'Gold',
    fd: 'Fixed Deposits', ppf: 'PPF', real_estate: 'Real Estate', other: 'Other'
  }
  const assetTypeIcons: Record<string, any> = {
    equity: TrendingUp, gold: Coins, fd: Landmark, ppf: Star, real_estate: Home, other: Gem
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-3" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded mb-2" />)}
        </div>
      </div>
    )
  }

  // Empty state
  if (assets.length === 0) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Start Building Your Portfolio</h2>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Add your equity holdings, mutual funds, gold, FDs, and PPF — all in one place. We'll track live prices and calculate your real returns.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Your First Asset
          </button>
        </motion.div>

        <AnimatePresence>
          {showAddModal && (
            <AddAssetModal 
              editingAsset={editingAsset} 
              onClose={() => { setShowAddModal(false); setEditingAsset(null) }} 
              onAdd={() => fetchAssets()} 
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(netWorth, true)}</p>
          <div className="flex items-center gap-1 mt-1">
            {totalGain >= 0
              ? <ArrowUpRight className="w-3 h-3 text-primary" />
              : <ArrowDownRight className="w-3 h-3 text-destructive" />}
            <span className={cn("text-sm tabular-nums", totalGain >= 0 ? "text-primary" : "text-destructive")}>
              {formatPercent(totalGainPct)} overall
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Returns</p>
          <p className={cn("text-2xl font-semibold tabular-nums", totalGain >= 0 ? "text-primary" : "text-destructive")}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, true)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            from ₹{(totalInvested / 100000).toFixed(1)}L invested
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Equity Holdings</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(byType.equity || 0, true)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{equityAssets.length} stocks</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Other Assets</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(netWorth - (byType.equity || 0), true)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{assets.filter(a => a.asset_type !== 'equity').length} holdings</p>
        </div>
      </motion.div>

      {/* Tabs + Controls */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(['equity', 'all', 'overview'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'equity' ? 'Equity' : tab === 'all' ? 'All Assets' : 'Overview'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search holdings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
            />
          </div>
          <button
            onClick={() => fetchAssets(true)}
            className={cn("h-9 px-3 rounded-lg bg-muted/50 hover:bg-muted flex items-center gap-2 text-sm", refreshing && "opacity-50")}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            <span className="hidden md:inline">{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add Asset</span>
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Equity Tab */}
        {activeTab === 'equity' && (
          <motion.div key="equity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-xs font-medium text-muted-foreground bg-muted/30">
              <div className="col-span-4 md:col-span-3">Stock</div>
              <div className="col-span-2 hidden md:block">Qty / Avg</div>
              <button onClick={() => toggleSort('value')} className="col-span-3 md:col-span-2 flex items-center gap-1 justify-end">
                Value <SortIcon column="value" />
              </button>
              <button onClick={() => toggleSort('change')} className="col-span-3 md:col-span-2 flex items-center gap-1 justify-end">
                Day P&L <SortIcon column="change" />
              </button>
              <button onClick={() => toggleSort('return')} className="col-span-2 md:col-span-2 flex items-center gap-1 justify-end">
                Return <SortIcon column="return" />
              </button>
              <div className="col-span-1 hidden md:block" />
            </div>

            {filteredEquity.length === 0 ? (
              <div className="p-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No equity holdings yet</p>
                <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
                  Add Stock
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEquity.map(asset => {
                  const displayName = asset.metadata?.symbol || asset.asset_name || 'Asset'
                  const displayInitials = displayName.slice(0, 2).toUpperCase()
                  return (
                    <motion.div key={asset.id} variants={item} className="group">
                      <div
                        className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === asset.id ? null : asset.id)}
                      >
                        <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold">{displayInitials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate text-sm">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate hidden md:block">{asset.metadata?.sector || 'Stock'}</p>
                          </div>
                      </div>
                      <div className="col-span-2 hidden md:flex flex-col justify-center">
                        <p className="text-sm tabular-nums">{asset.quantity} shares</p>
                        <p className="text-xs text-muted-foreground tabular-nums">@ ₹{(asset.purchase_price || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="col-span-3 md:col-span-2 flex flex-col justify-center text-right">
                        <p className="font-medium tabular-nums text-sm">{formatCurrency(asset.current_value, true)}</p>
                        {asset.current_price && (
                          <p className="text-xs text-muted-foreground tabular-nums">₹{asset.current_price.toFixed(2)}</p>
                        )}
                      </div>
                      <div className="col-span-3 md:col-span-2 flex flex-col justify-center text-right">
                        {asset.day_change_pct !== undefined ? (
                          <>
                            <p className={cn("font-medium tabular-nums text-sm", (asset.day_change_pct || 0) >= 0 ? "text-primary" : "text-destructive")}>
                              {(asset.day_change_pct || 0) >= 0 ? '+' : ''}{(asset.day_change_pct || 0).toFixed(2)}%
                            </p>
                            <p className={cn("text-xs tabular-nums", (asset.day_change_pct || 0) >= 0 ? "text-primary/70" : "text-destructive/70")}>
                              {formatCurrency((asset.current_value || 0) * (asset.day_change_pct || 0) / 100, true)}
                            </p>
                          </>
                        ) : <p className="text-xs text-muted-foreground">—</p>}
                      </div>
                      <div className="col-span-2 md:col-span-2 flex flex-col justify-center text-right">
                        {asset.total_return_pct !== undefined ? (
                          <p className={cn("font-medium tabular-nums text-sm", (asset.total_return_pct || 0) >= 0 ? "text-primary" : "text-destructive")}>
                            {(asset.total_return_pct || 0) >= 0 ? '+' : ''}{(asset.total_return_pct || 0).toFixed(1)}%
                          </p>
                        ) : <p className="text-xs text-muted-foreground">—</p>}
                      </div>
                      <div className="col-span-1 hidden md:flex items-center justify-end gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingAsset(asset); setShowAddModal(true) }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteAsset(asset.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedRow === asset.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-muted/10"
                        >
                          <div className="p-4 grid md:grid-cols-4 gap-4 text-sm border-t border-border">
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs">Sector</p>
                              <p className="font-medium">{asset.metadata?.sector || '—'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs">Invested</p>
                              <p className="font-medium tabular-nums">{formatCurrency((asset.purchase_price || 0) * (asset.quantity || 1))}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs">Unrealized P&L</p>
                              <p className={cn("font-medium tabular-nums", (asset.total_return_pct || 0) >= 0 ? "text-primary" : "text-destructive")}>
                                {formatCurrency((asset.current_value || 0) - ((asset.purchase_price || 0) * (asset.quantity || 1)))}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs">Purchase Date</p>
                              <p className="font-medium">{asset.purchase_date || '—'}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* All Assets Tab */}
        {activeTab === 'all' && (
          <motion.div key="all" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">All Assets</h3>
            </div>
            {assets.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No assets added yet</div>
            ) : (
              <div className="divide-y divide-border">
                {assets.map(asset => {
                  const Icon = assetTypeIcons[asset.asset_type] || Gem
                  const invested = asset.asset_type === 'fd'
                    ? asset.metadata?.principal || 0
                    : (asset.purchase_price || 0) * (asset.quantity || 1)
                  const gain = (asset.current_value || 0) - invested
                  const gainPct = invested > 0 ? (gain / invested) * 100 : 0
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-muted/30 group">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", assetTypeColors[asset.asset_type] + '/10')}>
                          <Icon className={cn("w-5 h-5", assetTypeColors[asset.asset_type]?.replace('bg-', 'text-'))} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{asset.metadata?.symbol || asset.asset_name}</p>
                          <p className="text-xs text-muted-foreground">{assetTypeLabels[asset.asset_type] || asset.asset_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium tabular-nums">{formatCurrency(asset.current_value || 0, true)}</p>
                          <p className={cn("text-xs tabular-nums", gain >= 0 ? "text-primary" : "text-destructive")}>
                            {gain >= 0 ? '+' : ''}{formatCurrency(gain, true)} ({gainPct.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingAsset(asset); setShowAddModal(true) }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteAsset(asset.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid lg:grid-cols-2 gap-6">
            {/* Asset Allocation */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Asset Allocation</h3>
                <PieChart className="w-5 h-5 text-muted-foreground" />
              </div>
              {/* Visual Bar */}
              <div className="h-4 rounded-full overflow-hidden flex mb-6">
                {Object.entries(byType).map(([type, value]) => (
                  <div
                    key={type}
                    className={cn("h-full", assetTypeColors[type] || 'bg-muted-foreground')}
                    style={{ width: `${netWorth > 0 ? (value / netWorth) * 100 : 0}%` }}
                  />
                ))}
              </div>
              <div className="space-y-3">
                {Object.entries(byType).sort(([, a], [, b]) => b - a).map(([type, value]) => {
                  const Icon = assetTypeIcons[type] || Gem
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{assetTypeLabels[type] || type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm tabular-nums text-muted-foreground">{formatCurrency(value, true)}</span>
                        <span className="text-sm tabular-nums font-medium w-12 text-right">
                          {netWorth > 0 ? ((value / netWorth) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Performance Analysis</h3>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {equityAssets.length > 0 && (
                  <>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Top Performer</p>
                      {(() => {
                        const top = equityAssets.reduce((prev, curr) =>
                          (curr.total_return_pct || 0) > (prev.total_return_pct || 0) ? curr : prev, equityAssets[0])
                        return (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{top.metadata?.symbol || top.asset_name}</span>
                            <span className="text-primary font-semibold tabular-nums">
                              +{(top.total_return_pct || 0).toFixed(1)}%
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Needs Attention</p>
                      {(() => {
                        const worst = equityAssets.reduce((prev, curr) =>
                          (curr.total_return_pct || 0) < (prev.total_return_pct || 0) ? curr : prev, equityAssets[0])
                        return (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{worst.metadata?.symbol || worst.asset_name}</span>
                            <span className={cn("font-semibold tabular-nums", (worst.total_return_pct || 0) >= 0 ? "text-primary" : "text-destructive")}>
                              {(worst.total_return_pct || 0).toFixed(1)}%
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                  </>
                )}
                <div className="p-4 rounded-lg bg-muted/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Invested</span>
                    <span className="font-medium tabular-nums">{formatCurrency(totalInvested, true)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Value</span>
                    <span className="font-medium tabular-nums">{formatCurrency(netWorth, true)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Total Gain/Loss</span>
                    <span className={cn("font-semibold tabular-nums", totalGain >= 0 ? "text-primary" : "text-destructive")}>
                      {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, true)} ({totalGainPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddAssetModal 
            editingAsset={editingAsset} 
            onClose={() => { setShowAddModal(false); setEditingAsset(null) }} 
            onAdd={() => fetchAssets()} 
          />
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105"
      >
        <Plus className="w-6 h-6" />
      </button>
    </motion.div>
  )
}
