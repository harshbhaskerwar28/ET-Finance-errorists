// Central Zustand store — persisted to localStorage
import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Persona = "beginner" | "active_trader" | "sip_investor" | "hni" | "retiree" | "nri"
export type Risk = "conservative" | "moderate" | "aggressive"

export interface Holding {
  symbol: string      // e.g. RELIANCE.NS
  display: string     // e.g. RELIANCE
  name: string
  qty: number
  avgPrice: number
  livePrice: number
  change: number
  changePct: number
  sector: string
}

interface Store {
  // User profile
  name: string
  persona: Persona | null
  risk: Risk | null
  goals: string[]
  // Portfolio
  holdings: Holding[]
  // Status
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  // Actions
  setProfile: (p: Partial<Pick<Store, "name" | "persona" | "risk" | "goals">>) => void
  addHolding: (h: Holding) => void
  removeHolding: (display: string) => void
  updatePrices: (updates: Pick<Holding, "display" | "livePrice" | "change" | "changePct">[]) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      name: "",
      persona: null,
      risk: null,
      goals: [],
      holdings: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setProfile: (p) => set((s) => ({ ...s, ...p })),

      addHolding: (h) =>
        set((s) => ({
          holdings: s.holdings.some((x) => x.display === h.display)
            ? s.holdings
            : [...s.holdings, h],
        })),

      removeHolding: (display) =>
        set((s) => ({ holdings: s.holdings.filter((h) => h.display !== display) })),

      updatePrices: (updates) =>
        set((s) => ({
          holdings: s.holdings.map((h) => {
            const u = updates.find((x) => x.display === h.display)
            return u ? { ...h, livePrice: u.livePrice, change: u.change, changePct: u.changePct } : h
          }),
        })),
    }),
    {
      name: "et-ai-store",
      partialize: (s) => ({
        name: s.name,
        persona: s.persona,
        risk: s.risk,
        goals: s.goals,
        holdings: s.holdings,
      }),
      onRehydrateStorage: (state) => {
        return (state, error) => {
          if (!error && state) {
            state.setHasHydrated(true)
          }
        }
      }
    }
  )
)
