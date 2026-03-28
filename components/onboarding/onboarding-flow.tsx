'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { onboardingQuestions } from '@/lib/mock-data'
import { ArrowRight, Sparkles, TrendingUp, Shield, Target, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
      <span className="text-primary-foreground font-bold text-sm">ET</span>
    </div>
    <span className="font-semibold text-lg tracking-tight">AI</span>
  </div>
)

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-primary/20">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl">ET</span>
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-balance">
        Your AI-Powered
        <br />
        <span className="text-primary">Financial Co-Pilot</span>
      </h1>
      <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
        Real-time market intelligence, personalized insights, and smart portfolio management in one unified platform.
      </p>
    </motion.div>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-2xl w-full"
    >
      {[
        { icon: TrendingUp, label: 'Market Intelligence', desc: 'Real-time signals & patterns' },
        { icon: Sparkles, label: 'AI Advisory', desc: 'Personalized recommendations' },
        { icon: Shield, label: 'Portfolio Guard', desc: 'Risk monitoring & alerts' },
      ].map((feature, i) => (
        <motion.div
          key={feature.label}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="p-4 rounded-lg bg-card border border-border"
        >
          <feature.icon className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-medium text-sm">{feature.label}</h3>
          <p className="text-xs text-muted-foreground">{feature.desc}</p>
        </motion.div>
      ))}
    </motion.div>

    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7 }}
      onClick={onStart}
      className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium text-lg hover:bg-primary/90 transition-all"
    >
      Get Started
      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
    </motion.button>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="text-xs text-muted-foreground mt-6"
    >
      Takes only 2 minutes to personalize your experience
    </motion.p>
  </motion.div>
)

interface QuestionScreenProps {
  question: typeof onboardingQuestions[0]
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | string[] | undefined
  onSelect: (answer: string | string[]) => void
  onNext: () => void
  onBack: () => void
  isMultiSelect?: boolean
}

const QuestionScreen = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelect,
  onNext,
  onBack,
  isMultiSelect = false
}: QuestionScreenProps) => {
  const isGoalsQuestion = question.id === 'goals'
  const selectedOptions = isGoalsQuestion 
    ? (Array.isArray(selectedAnswer) ? selectedAnswer : [])
    : null

  const handleOptionClick = (option: string) => {
    if (isGoalsQuestion) {
      const current = selectedOptions || []
      if (current.includes(option)) {
        onSelect(current.filter(o => o !== option))
      } else {
        onSelect([...current, option])
      }
    } else {
      onSelect(option)
    }
  }

  const isSelected = (option: string) => {
    if (isGoalsQuestion) {
      return selectedOptions?.includes(option) || false
    }
    return selectedAnswer === option
  }

  const canProceed = isGoalsQuestion 
    ? (selectedOptions && selectedOptions.length > 0)
    : !!selectedAnswer

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen p-6"
    >
      <div className="flex items-center justify-between mb-8">
        <Logo />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="tabular-nums">{questionNumber}</span>
          <span>/</span>
          <span className="tabular-nums">{totalQuestions}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
        {/* Progress bar */}
        <div className="w-full h-1 bg-border rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl md:text-3xl font-semibold mb-2 text-balance"
        >
          {question.question}
        </motion.h2>
        
        {isGoalsQuestion && (
          <p className="text-muted-foreground mb-6">Select all that apply</p>
        )}

        <div className="space-y-3 mt-6">
          {question.options.map((option, i) => (
            <motion.button
              key={option}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleOptionClick(option)}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between group",
                isSelected(option)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:border-primary/50 text-foreground"
              )}
            >
              <span className="font-medium">{option}</span>
              {isSelected(option) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
            canProceed
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

const CompletionScreen = ({ onComplete }: { onComplete: () => void }) => {
  const { user } = useAppStore()
  
  const personaLabels: Record<string, string> = {
    beginner: 'Curious Beginner',
    active_trader: 'Active Trader',
    sip_investor: 'SIP Investor',
    hni: 'High Net Worth',
    retiree: 'Retiree',
    nri: 'NRI Investor'
  }

  const riskLabels: Record<string, string> = {
    conservative: 'Conservative',
    moderate: 'Balanced',
    aggressive: 'Aggressive'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-8"
      >
        <Target className="w-10 h-10 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-semibold mb-4"
      >
        {"You're"} all set!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-lg mb-8 max-w-md"
      >
        {"We've"} personalized your experience based on your profile
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-6 mb-8 max-w-sm w-full"
      >
        <h3 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">Your Profile</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Investor Type</span>
            <span className="font-medium text-primary">
              {user.persona ? personaLabels[user.persona] : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Risk Profile</span>
            <span className="font-medium">
              {user.riskProfile ? riskLabels[user.riskProfile] : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Goals</span>
            <span className="font-medium text-right max-w-[180px] truncate">
              {user.goals.length > 0 ? user.goals.slice(0, 2).join(', ') : 'Not set'}
              {user.goals.length > 2 && ` +${user.goals.length - 2}`}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onComplete}
        className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium text-lg hover:bg-primary/90 transition-all"
      >
        Enter Dashboard
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  )
}

export function OnboardingFlow() {
  const { user, setOnboardingStep, setOnboardingAnswer, completeOnboarding } = useAppStore()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleStart = () => {
    setCurrentQuestionIndex(0)
    setOnboardingStep('experience')
  }

  const handleNext = () => {
    if (currentQuestionIndex < onboardingQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      const nextQuestion = onboardingQuestions[currentQuestionIndex + 1]
      setOnboardingStep(nextQuestion.id as any)
    } else {
      setIsCompleting(true)
      completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      const prevQuestion = onboardingQuestions[currentQuestionIndex - 1]
      setOnboardingStep(prevQuestion.id as any)
    } else {
      setCurrentQuestionIndex(-1)
      setOnboardingStep('welcome')
    }
  }

  const handleComplete = () => {
    // State update from completeOnboarding() will automatically trigger re-render
    // No action needed - the app shell will show the dashboard
  }

  const currentQuestion = currentQuestionIndex >= 0 ? onboardingQuestions[currentQuestionIndex] : null

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentQuestionIndex === -1 && !isCompleting && (
          <WelcomeScreen key="welcome" onStart={handleStart} />
        )}
        
        {currentQuestion && !isCompleting && (
          <QuestionScreen
            key={currentQuestion.id}
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={onboardingQuestions.length}
            selectedAnswer={user.onboarding.answers[currentQuestion.id]}
            onSelect={(answer) => setOnboardingAnswer(currentQuestion.id, answer)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {isCompleting && (
          <CompletionScreen key="complete" onComplete={handleComplete} />
        )}
      </AnimatePresence>
    </div>
  )
}
