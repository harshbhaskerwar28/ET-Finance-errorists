"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Briefcase, Calculator, MessageSquare, ShoppingBag, BarChart2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { name: "Newsroom", href: "/", icon: LayoutDashboard },
  { name: "Market Intel", href: "/markets", icon: BarChart2 },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Tax Wizard", href: "/tax", icon: Calculator },
  { name: "AI Advisor", href: "/advisory", icon: MessageSquare },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <div className="flex h-screen w-56 flex-col border-r border-[#1a1f2e] bg-[#0a0c10] shrink-0">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-[#1a1f2e]">
        <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white tracking-tight text-sm uppercase">ET AI Platform</span>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto hide-scrollbar">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active ? "bg-[#1a1f2e] text-white" : "text-gray-400 hover:text-white hover:bg-[#1a1f2e]/60"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-red-500" : "text-gray-500")} />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[#1a1f2e]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-medium tracking-tight">System Live</span>
        </div>
      </div>
    </div>
  )
}
