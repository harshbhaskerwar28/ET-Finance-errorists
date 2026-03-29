'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mockAlerts, type Alert } from '@/lib/mock-data'
import { 
  Bell, 
  TrendingUp,
  BarChart2,
  Users,
  Newspaper,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Settings,
  X,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

type AlertFilter = 'all' | 'unread' | 'price' | 'earnings' | 'insider' | 'technical'

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

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'price': return TrendingUp
    case 'earnings': return BarChart2
    case 'insider': return Users
    case 'technical': return AlertTriangle
    case 'news': return Newspaper
    default: return Bell
  }
}

const getAlertColor = (type: Alert['type']) => {
  switch (type) {
    case 'price': return 'bg-primary/10 text-primary'
    case 'earnings': return 'bg-accent/10 text-accent'
    case 'insider': return 'bg-chart-3/10 text-chart-3'
    case 'technical': return 'bg-chart-4/10 text-chart-4'
    case 'news': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

const getPriorityColor = (priority: Alert['priority']) => {
  switch (priority) {
    case 'high': return 'bg-accent'
    case 'medium': return 'bg-chart-3'
    case 'low': return 'bg-muted-foreground'
    default: return 'bg-muted-foreground'
  }
}

export function AlertsView() {
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all')
  const [alerts, setAlerts] = useState(mockAlerts)
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const { openChatWithQuery } = useAppStore()

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return !alert.read
    return alert.type === activeFilter
  })

  const unreadCount = alerts.filter(a => !a.read).length

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, read: true } : a
    ))
  }

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Alerts</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Stay updated on your portfolio and markets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Mark all as read
          </button>
          <button
            onClick={() => setShowCreateAlert(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['all', 'unread', 'price', 'earnings', 'insider', 'technical'] as AlertFilter[]).map((filter) => {
          const count = filter === 'all' 
            ? alerts.length 
            : filter === 'unread'
            ? alerts.filter(a => !a.read).length
            : alerts.filter(a => a.type === filter).length

          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all",
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {filter}
              <span className={cn(
                "ml-2 text-xs px-1.5 py-0.5 rounded",
                activeFilter === filter
                  ? "bg-primary-foreground/20"
                  : "bg-border"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Alerts List */}
      <motion.div variants={item} className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const Icon = getAlertIcon(alert.type)
              
              return (
                <motion.div
                  key={alert.id}
                  variants={item}
                  layout
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "bg-card border border-border rounded-xl p-4 transition-all hover:border-primary/30",
                    !alert.read && "border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      getAlertColor(alert.type)
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              getPriorityColor(alert.priority)
                            )} />
                            <span className="text-xs text-muted-foreground capitalize">{alert.type}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{alert.time}</span>
                          </div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!alert.read && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                        <span className="text-xs px-2 py-1 rounded bg-muted font-medium">{alert.stock}</span>
                        <button className="text-xs text-primary hover:underline flex items-center gap-1">
                          View Details
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openChatWithQuery(`Analyse this alert about ${alert.stock}: "${alert.title}" — ${alert.description}. What does this mean for my portfolio? Should I take any action?`)}
                          className="text-xs text-accent hover:underline flex items-center gap-1 ml-auto"
                        >
                          Ask AI ↗
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No alerts in this category</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Alert Settings Card */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Alert Preferences</h3>
          </div>
          <button className="text-sm text-primary hover:underline">Edit</button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Price Alerts</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">Active</span>
            </div>
            <p className="text-xs text-muted-foreground">Get notified when stocks hit your target prices</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Earnings Alerts</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">Active</span>
            </div>
            <p className="text-xs text-muted-foreground">Alerts for quarterly results of your holdings</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Morning Brief</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">8:00 AM</span>
            </div>
            <p className="text-xs text-muted-foreground">Daily summary delivered to your inbox</p>
          </div>
        </div>
      </motion.div>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showCreateAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateAlert(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Create New Alert</h3>
                <button
                  onClick={() => setShowCreateAlert(false)}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Alert Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Price Target', 'Earnings', 'Insider Trade', 'Technical Pattern'].map((type) => (
                      <button
                        key={type}
                        className="p-3 rounded-lg border border-border hover:border-primary text-sm text-left transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Stock Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g., RELIANCE"
                    className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Condition</label>
                  <select className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none">
                    <option>Price rises above</option>
                    <option>Price falls below</option>
                    <option>Volume spike</option>
                    <option>New 52-week high</option>
                    <option>New 52-week low</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Value</label>
                  <input
                    type="number"
                    placeholder="Enter price"
                    className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateAlert(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowCreateAlert(false)}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Create Alert
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
