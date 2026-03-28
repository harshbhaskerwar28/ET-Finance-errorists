'use client'

import { useAppStore } from '@/lib/store'
import { mockStocks, formatPercent } from '@/lib/mock-data'
import { Menu, Search, Bell, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const marketIndices = mockStocks.filter(s => s.sector === 'Index')

export function Header() {
  const { sidebarOpen, setSidebarOpen, activeView } = useAppStore()
  const [searchFocused, setSearchFocused] = useState(false)

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    portfolio: 'Portfolio',
    markets: 'Market Intelligence',
    news: 'News Feed',
    chat: 'AI Chat',
    alerts: 'Alerts',
    planning: 'Financial Planning',
    settings: 'Settings'
  }

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-4 gap-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-lg font-semibold">{viewTitles[activeView]}</h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Last updated: Just now</span>
            </div>
          </div>
        </div>

        {/* Market ticker */}
        <div className="hidden md:flex items-center gap-6 px-4 py-2 bg-muted/50 rounded-lg">
          {marketIndices.map((index) => (
            <div key={index.symbol} className="flex items-center gap-2">
              <span className="text-sm font-medium">{index.symbol}</span>
              <span className="text-sm tabular-nums">{index.price.toLocaleString('en-IN')}</span>
              <span className={cn(
                "flex items-center text-xs font-medium tabular-nums",
                index.change >= 0 ? "text-primary" : "text-destructive"
              )}>
                {index.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {formatPercent(index.changePercent)}
              </span>
            </div>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={cn(
            "relative transition-all duration-200",
            searchFocused ? "w-64" : "w-40"
          )}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary focus:bg-background text-sm outline-none transition-all"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded hidden sm:inline-block">
              /
            </kbd>
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-lg hover:bg-muted flex items-center justify-center">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
          </button>

          {/* Profile */}
          <button className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-lg hover:bg-muted">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">AM</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
