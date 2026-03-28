// Global state management for ET AI Platform
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InvestorPersona = 'beginner' | 'active_trader' | 'sip_investor' | 'hni' | 'retiree' | 'nri' | null
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | null
export type OnboardingStep = 'welcome' | 'experience' | 'income' | 'goals' | 'risk' | 'style' | 'complete'

interface OnboardingState {
  step: OnboardingStep
  answers: Record<string, string | string[]>
  isComplete: boolean
}

interface UserState {
  name: string | null
  persona: InvestorPersona
  riskProfile: RiskProfile
  goals: string[]
  onboarding: OnboardingState
}

interface SubViewState {
  type: 'stock-detail' | 'screener' | 'watchlist' | null
  data?: { symbol?: string }
}

interface AppState {
  user: UserState
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeView: 'dashboard' | 'portfolio' | 'markets' | 'news' | 'chat' | 'alerts' | 'planning' | 'settings'
  subView: SubViewState
  chatMessages: ChatMessage[]
  watchlist: string[]
  hasCompletedOnboarding: boolean
  
  // Actions
  setUser: (user: Partial<UserState>) => void
  setOnboardingStep: (step: OnboardingStep) => void
  setOnboardingAnswer: (questionId: string, answer: string | string[]) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveView: (view: AppState['activeView']) => void
  setSubView: (subView: SubViewState) => void
  clearSubView: () => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
}

const initialUserState: UserState = {
  name: null,
  persona: null,
  riskProfile: null,
  goals: [],
  onboarding: {
    step: 'welcome',
    answers: {},
    isComplete: false,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: initialUserState,
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeView: 'dashboard',
      subView: { type: null },
      chatMessages: [],
      watchlist: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'],
      hasCompletedOnboarding: false,
      
      setUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      setOnboardingStep: (step) => set((state) => ({
        user: {
          ...state.user,
          onboarding: { ...state.user.onboarding, step }
        }
      })),
      
      setOnboardingAnswer: (questionId, answer) => set((state) => ({
        user: {
          ...state.user,
          onboarding: {
            ...state.user.onboarding,
            answers: { ...state.user.onboarding.answers, [questionId]: answer }
          }
        }
      })),
      
      completeOnboarding: () => set((state) => {
        // Determine persona based on answers
        const answers = state.user.onboarding.answers
        let persona: InvestorPersona = 'beginner'
        let riskProfile: RiskProfile = 'moderate'
        
        // Simple logic to determine persona
        if (answers.experience === '10+ years' || answers.income === '50 Lakhs+') {
          persona = 'hni'
        } else if (answers.style === 'Active trading') {
          persona = 'active_trader'
        } else if (answers.style === 'Set it and forget it (SIPs)') {
          persona = 'sip_investor'
        } else if (answers.experience === 'Just starting out') {
          persona = 'beginner'
        }
        
        // Determine risk profile
        if (answers.risk === 'Buy more at lower prices') {
          riskProfile = 'aggressive'
        } else if (answers.risk === 'Sell everything immediately') {
          riskProfile = 'conservative'
        }
        
        const goals = Array.isArray(answers.goals) ? answers.goals : [answers.goals].filter(Boolean)
        
        return {
          hasCompletedOnboarding: true,
          user: {
            ...state.user,
            persona,
            riskProfile,
            goals: goals as string[],
            onboarding: {
              ...state.user.onboarding,
              step: 'complete',
              isComplete: true
            }
          }
        }
      }),
      
      resetOnboarding: () => set((state) => ({
        user: {
          ...state.user,
          ...initialUserState
        }
      })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      setActiveView: (view) => set({ activeView: view, subView: { type: null } }),
      
      setSubView: (subView) => set({ subView }),
      
      clearSubView: () => set({ subView: { type: null } }),
      
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message]
      })),
      
      clearChat: () => set({ chatMessages: [] }),
      
      addToWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.includes(symbol) 
          ? state.watchlist 
          : [...state.watchlist, symbol]
      })),
      
      removeFromWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.filter(s => s !== symbol)
      })),
    }),
    {
      name: 'et-ai-storage',
      partialize: (state) => ({
        user: state.user,
        watchlist: state.watchlist,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
)
