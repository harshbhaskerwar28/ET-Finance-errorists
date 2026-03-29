"use client"

import { Bell, User, LogOut } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/store"

export function Header() {
  const { name, setProfile } = useStore()

  const handleReset = () => {
    if (confirm("Reset your profile and re-onboard?")) {
      setProfile({ name: "", persona: null, risk: null, goals: [] })
      window.location.href = "/onboarding"
    }
  }

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[#1a1f2e] bg-[#0a0c10]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="text-xs font-bold text-gray-500 tracking-widest uppercase flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
        ET AI Investment Terminal
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1f2e] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1f2e] border border-gray-800">
          <User className="h-3.5 w-3.5 text-red-500" />
          <span className="text-xs font-bold text-gray-300">{name || "Investor"}</span>
          <button onClick={handleReset} title="Reset Profile" className="ml-2 pl-2 border-l border-gray-700 text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="h-3 w-3" />
          </button>
        </div>
      </div>
    </header>
  )
}
