'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  TrendingUp,
  BarChart2,
  Users,
  Newspaper,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  X,
  ChevronRight,
  Loader2,
  Search,
  Target,
  Activity,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/nextjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

type AlertFilter = 'all' | 'unread' | 'high' | 'medium' | 'low'

interface Notification {
  id: string
  alert_id: string | null
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  urgency: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

interface UserAlert {
  id: string
  symbol: string | null
  alert_type: string
  condition: any
  is_active: boolean
  created_at: string
}

// ─── Create Alert Modal ────────────────────────────────────────────
function CreateAlertModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [alertType, setAlertType] = useState('price_target')
  const [symbol, setSymbol] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (symbol.length < 2 || selectedStock) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      const res = await fetch(`/api/markets/search?q=${encodeURIComponent(symbol)}`)
      const data = await res.json()
      setSearchResults(Array.isArray(data) ? data : (data.results || []))
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [symbol, selectedStock])

  const alertTypes = [
    { id: 'price_target', label: 'Price Target', icon: Target },
    { id: '52w_high', label: '52-Week High', icon: TrendingUp },
    { id: '52w_low', label: '52-Week Low', icon: Activity },
    { id: 'portfolio_risk', label: 'Portfolio Risk', icon: AlertTriangle },
  ]

  const handleCreate = async () => {
    if (loading) return
    setLoading(true)
    const condition: any = {}
    if (alertType === 'price_target') {
      condition.target_price = parseFloat(targetPrice)
      condition.direction = direction
    }
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedStock?.symbol || symbol || null,
          alert_type: alertType,
          condition,
        }),
      })
      if (res.ok) { onCreated(); onClose() }
    } catch {}
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Create New Alert</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Alert Type */}
        <div className="mb-5">
          <label className="text-sm font-medium mb-2 block">Alert Type</label>
          <div className="grid grid-cols-2 gap-2">
            {alertTypes.map(type => (
              <button key={type.id} onClick={() => setAlertType(type.id)}
                className={cn("p-3 rounded-lg border text-sm flex items-center gap-2 transition-all",
                  alertType === type.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50")}>
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Search */}
        {(alertType === 'price_target' || alertType === '52w_high' || alertType === '52w_low') && (
          <div className="mb-4 relative">
            <label className="text-sm font-medium mb-2 block">Stock Symbol</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search stock..." value={symbol}
                onChange={e => { setSymbol(e.target.value); setSelectedStock(null) }}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none" />
              {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
            </div>
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50">
                  {searchResults.slice(0, 5).map(s => (
                    <button key={s.symbol} onClick={() => { setSelectedStock(s); setSymbol(s.symbol); setSearchResults([]); if (s.price) setTargetPrice(s.price.toFixed(2)) }}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 text-sm text-left">
                      <div>
                        <p className="font-medium">{s.symbol}</p>
                        <p className="text-xs text-muted-foreground">{s.name}</p>
                      </div>
                      {s.price && <p className="text-sm font-medium">₹{s.price.toFixed(2)}</p>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {selectedStock && (
              <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{selectedStock.symbol}</span>
                {selectedStock.price && <span className="text-sm">₹{selectedStock.price.toFixed(2)}</span>}
              </div>
            )}
          </div>
        )}

        {/* Condition for price target */}
        {alertType === 'price_target' && (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {(['above', 'below'] as const).map(d => (
                  <button key={d} onClick={() => setDirection(d)}
                    className={cn("py-2 rounded-lg border text-sm font-medium capitalize",
                      direction === d ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50")}>
                    Price {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Target Price (₹)</label>
              <input type="number" placeholder="Enter target price" value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none" />
              {selectedStock?.price && (
                <p className="text-xs text-muted-foreground mt-1">Current: ₹{selectedStock.price.toFixed(2)}</p>
              )}
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-medium">Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Alert
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Alerts View ──────────────────────────────────────────────
export function AlertsView() {
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const { openChatWithQuery } = useAppStore()
  const { user: clerkUser } = useUser()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [notifRes, alertsRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/alerts'),
      ])
      const notifData = await notifRes.json()
      const alertsData = await alertsRes.json()
      setNotifications(notifData.notifications || [])
      setUserAlerts(alertsData.alerts || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time subscription via Supabase
  useEffect(() => {
    if (!clerkUser?.id) return
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `clerk_user_id=eq.${clerkUser.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clerkUser?.id])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    await Promise.all(notifications.filter(n => !n.is_read).map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })))
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
    setUserAlerts(prev => prev.filter(a => a.id !== id))
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.is_read
    if (activeFilter === 'high') return n.urgency === 'high' || n.urgency === 'critical'
    if (activeFilter === 'medium') return n.urgency === 'medium'
    if (activeFilter === 'low') return n.urgency === 'low'
    return true
  })
  const unreadCount = notifications.filter(n => !n.is_read).length

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive'
      case 'high': return 'bg-accent'
      case 'medium': return 'bg-chart-3'
      default: return 'bg-muted-foreground'
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Alerts & Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Real-time alerts for your portfolio and markets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              Mark all read
            </button>
          )}
          <button onClick={() => setShowCreateAlert(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Set Alert
          </button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'unread', 'high', 'medium', 'low'] as AlertFilter[]).map(filter => {
          const count = filter === 'all' ? notifications.length
            : filter === 'unread' ? unreadCount
              : notifications.filter(n => n.urgency === filter || (filter === 'high' && n.urgency === 'critical')).length
          return (
            <button key={filter} onClick={() => setActiveFilter(filter)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all flex items-center gap-1.5",
                activeFilter === filter ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
              {filter}
              <span className={cn("text-xs px-1.5 py-0.5 rounded",
                activeFilter === filter ? "bg-primary-foreground/20" : "bg-border")}>
                {count}
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item} className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No notifications yet</p>
            <p className="text-sm text-muted-foreground">Set price alerts to get notified when stocks hit your targets</p>
            <button onClick={() => setShowCreateAlert(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
              Create First Alert
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map(notif => (
              <motion.div key={notif.id} variants={item} layout exit={{ opacity: 0, x: -20 }}
                className={cn("bg-card border border-border rounded-xl p-4 transition-all hover:border-primary/30",
                  !notif.is_read && "border-l-2 border-l-primary")}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", getUrgencyColor(notif.urgency))} />
                          <span className="text-xs text-muted-foreground capitalize">{notif.urgency}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{getTimeAgo(notif.created_at)}</span>
                        </div>
                        <h4 className="font-medium text-sm">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.is_read && (
                          <button onClick={() => markAsRead(notif.id)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Mark as read">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border">
                      <button onClick={() => openChatWithQuery(`Analyse this alert: "${notif.title}" — ${notif.body}. What should I do?`)}
                        className="text-xs text-accent hover:underline flex items-center gap-1 ml-auto">
                        Ask AI ↗
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Active Alert Rules */}
      {userAlerts.length > 0 && (
        <motion.div variants={item} className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">Active Alert Rules</h3>
            </div>
            <span className="text-xs text-muted-foreground">{userAlerts.length} active</span>
          </div>
          <div className="divide-y divide-border">
            {userAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-4 hover:bg-muted/30 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {alert.symbol && <span className="text-primary mr-1">{alert.symbol}</span>}
                      <span className="capitalize">{alert.alert_type.replace(/_/g, ' ')}</span>
                      {alert.condition?.target_price && (
                        <span className="text-muted-foreground ml-1">
                          — {alert.condition.direction} ₹{alert.condition.target_price?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Created {getTimeAgo(alert.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => deleteAlert(alert.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Alert Preference Cards */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">Alert Types Available</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, title: 'Price Target', desc: 'Alert when a stock crosses your target price' },
            { icon: BarChart2, title: '52-Week Extremes', desc: 'Alert on new 52-week highs or lows' },
            { icon: AlertTriangle, title: 'Portfolio Risk', desc: 'Alert if any position exceeds 25% of portfolio' },
          ].map(c => (
            <div key={c.title} className="p-3 rounded-lg bg-muted/30 flex items-start gap-3">
              <c.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showCreateAlert && (
          <CreateAlertModal onClose={() => setShowCreateAlert(false)} onCreated={fetchData} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
