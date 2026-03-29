'use client'

import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Newspaper,
  MessageSquare,
  Bell,
  Calculator,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { mockAlerts } from '@/lib/mock-data'
import { useUser } from '@clerk/nextjs'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'news', label: 'News Feed', icon: Newspaper },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'planning', label: 'Planning', icon: Calculator },
] as const

const unreadAlerts = mockAlerts.filter(a => !a.read).length

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, setSidebarOpen, activeView, setActiveView, clearSubView, user, supabaseProfile } = useAppStore()
  const { user: clerkUser } = useUser()
  const isExpanded = !sidebarCollapsed

  // Resolve display name: Clerk first name > Supabase first_name > store name
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

  const personaLabel =
    supabaseProfile?.persona?.replace(/_/g, ' ') ||
    (user.persona?.replace(/_/g, ' ') ?? 'Investor')

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 256 : 64,
          x: 0
        }}
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50",
          "flex flex-col transition-all duration-200",
          "max-lg:fixed max-lg:-translate-x-full",
          sidebarOpen && "max-lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">ET</span>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-semibold text-lg tracking-tight text-sidebar-foreground whitespace-nowrap overflow-hidden"
                >
                  AI
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 rounded-lg hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id
            const hasNotification = item.id === 'alerts' && unreadAlerts > 0
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as typeof activeView)
                  clearSubView()
                  if (window.innerWidth < 1024) setSidebarOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {/* Notification badge */}
                {hasNotification && (
                  <span className={cn(
                    "absolute flex items-center justify-center bg-accent text-accent-foreground text-xs font-bold rounded-full",
                    isExpanded ? "right-3 w-5 h-5" : "top-1 right-1 w-4 h-4 text-[10px]"
                  )}>
                    {unreadAlerts}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg border border-border">
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => {
              setActiveView('settings')
              clearSubView()
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              activeView === 'settings'
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* User info card */}
          <div
            className={cn(
              'mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/50 cursor-pointer hover:bg-sidebar-accent transition-colors',
              !isExpanded && 'justify-center'
            )}
            onClick={() => { setActiveView('settings'); clearSubView() }}
          >
            {/* Avatar */}
            {clerkUser?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clerkUser.imageUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">{initials || 'U'}</span>
              </div>
            )}

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                    {personaLabel}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
