"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { PortfolioView } from "@/components/portfolio/portfolio-view"
import { MarketsView } from "@/components/markets/markets-view"
import { ChatView } from "@/components/chat/chat-view"
import { NewsView } from "@/components/news/news-view"
import { AlertsView } from "@/components/alerts/alerts-view"
import { PlanningView } from "@/components/planning/planning-view"
import { SettingsView } from "@/components/settings/settings-view"
import { StockDetailView } from "@/components/stocks/stock-detail-view"
import { ScreenerView } from "@/components/screener/screener-view"
import { WatchlistView } from "@/components/watchlist/watchlist-view"
import { cn } from "@/lib/utils"

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-lg bg-accent animate-pulse" />
          <div className="absolute inset-0 h-12 w-12 rounded-lg bg-accent/50 animate-ping" />
        </div>
        <p className="text-sm text-muted-foreground font-mono tracking-wider">LOADING ET AI</p>
      </div>
    </div>
  )
}

export function AppShell() {
  const { hasCompletedOnboarding, activeView, subView, sidebarCollapsed, setSubView, clearSubView } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <LoadingScreen />

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow />
  }

  const handleSelectStock = (symbol: string) => {
    setSubView({ type: 'stock-detail', data: { symbol } })
  }

  const handleOpenScreener = () => {
    setSubView({ type: 'screener' })
  }

  const handleOpenWatchlist = () => {
    setSubView({ type: 'watchlist' })
  }

  const renderView = () => {
    // Check if there's an active sub-view
    if (subView.type) {
      switch (subView.type) {
        case 'stock-detail':
          return (
            <StockDetailView
              symbol={subView.data?.symbol || ''}
              onBack={clearSubView}
            />
          )
        case 'screener':
          return (
            <ScreenerView
              onBack={clearSubView}
              onSelectStock={handleSelectStock}
            />
          )
        case 'watchlist':
          return (
            <WatchlistView
              onBack={clearSubView}
              onSelectStock={handleSelectStock}
            />
          )
      }
    }

    // Render main view
    switch (activeView) {
      case "dashboard":
        return <DashboardView />
      case "portfolio":
        return <PortfolioView />
      case "markets":
        return <MarketsView />
      case "chat":
        return <ChatView />
      case "news":
        return <NewsView />
      case "alerts":
        return <AlertsView />
      case "planning":
        return <PlanningView />
      case "settings":
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  )
}
