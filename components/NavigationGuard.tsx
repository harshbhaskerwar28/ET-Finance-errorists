"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useStore } from "@/lib/store"

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { persona, _hasHydrated } = useStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (_hasHydrated) {
      if (!persona && pathname !== "/onboarding") {
        router.replace("/onboarding")
      } else {
        setReady(true)
      }
    }
  }, [_hasHydrated, persona, pathname, router])

  // Don't render until we know the persona state (prevents flash of content)
  if (!_hasHydrated || (!persona && pathname !== "/onboarding")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-gray-400">
        <div className="h-4 w-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full mb-2" />
        <p className="text-xs font-mono uppercase tracking-[0.2em] animate-pulse">Personalising Hub...</p>
      </div>
    )
  }

  return <>{children}</>
}
