'use client'

import { useAuth } from '@clerk/nextjs'
import { AppShell } from '@/components/app-shell'
import { LandingPage } from '@/components/landing/landing-page'

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

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth()

  // Wait for Clerk to initialise
  if (!isLoaded) return <LoadingScreen />

  // Not signed in → show public landing page
  if (!isSignedIn) return <LandingPage />

  // Signed in → show full app
  return <AppShell />
}
