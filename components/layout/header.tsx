'use client'

import { useAppStore } from '@/lib/store'
import { mockStocks, formatPercent } from '@/lib/mock-data'
import { Menu, Search, Bell, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useUser, useClerk } from '@clerk/nextjs'

const marketIndices = mockStocks.filter((s) => s.sector === 'Index')

// ─── Profile dropdown (top-right) ────────────────────────────────────────────
function ProfileMenu() {
  const { user: clerkUser } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const { user, supabaseProfile, setActiveView, clearSubView } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const displayName =
    clerkUser?.firstName ||
    supabaseProfile?.first_name ||
    user.name ||
    clerkUser?.fullName ||
    'You'

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const personaLabel = supabaseProfile?.persona
    ? supabaseProfile.persona.replace(/_/g, ' ')
    : user.persona?.replace(/_/g, ' ') ?? 'Investor'

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const goToSettings = () => {
    setOpen(false)
    setActiveView('settings')
    clearSubView()
  }

  return (
    <div ref={ref} className="relative">
      <button
        id="profile-menu-button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-lg hover:bg-muted transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar */}
        {clerkUser?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clerkUser.imageUrl}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">{initials || 'U'}</span>
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
          {displayName}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                {clerkUser?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={clerkUser.imageUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{initials || 'U'}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  {email && (
                    <p className="text-xs text-muted-foreground truncate">{email}</p>
                  )}
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-medium capitalize">
                    {personaLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => { openUserProfile(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <span className="text-base">👤</span> Manage Account
              </button>
              <button
                onClick={goToSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <span className="text-base">⚙️</span> Settings
              </button>
            </div>

            <div className="border-t border-border py-1">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <span className="text-base">🚪</span> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
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
    settings: 'Settings',
  }

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-4 gap-4">
        {/* Left */}
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

        {/* Market ticker removed – everything dynamic in dashboard */}

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div
            className={cn('relative transition-all duration-200', searchFocused ? 'w-64' : 'w-40')}
          >
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

          {/* Profile dropdown — powered by Clerk */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
