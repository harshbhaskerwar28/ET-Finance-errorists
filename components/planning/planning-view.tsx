'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mockMoneyHealthMetrics, mockFirePlan, formatCurrency } from '@/lib/mock-data'
import { 
  Heart,
  Target,
  Calculator,
  PiggyBank,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  FileText,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PlanningTab = 'health' | 'fire' | 'tax'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle className="w-4 h-4 text-primary" />
    case 'good': return <CheckCircle className="w-4 h-4 text-primary/70" />
    case 'average': return <Clock className="w-4 h-4 text-chart-3" />
    case 'needs_attention': return <AlertTriangle className="w-4 h-4 text-accent" />
    default: return null
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'border-primary bg-primary/10'
    case 'good': return 'border-primary/50 bg-primary/5'
    case 'average': return 'border-chart-3 bg-chart-3/10'
    case 'needs_attention': return 'border-accent bg-accent/10'
    default: return 'border-border bg-muted'
  }
}

export function PlanningView() {
  const [activeTab, setActiveTab] = useState<PlanningTab>('health')
  const { overall, dimensions } = mockMoneyHealthMetrics
  const fire = mockFirePlan

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Financial Planning</h2>
          <p className="text-sm text-muted-foreground">Your personalized roadmap to financial freedom</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh Score
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Sparkles className="w-4 h-4" />
            Get AI Advice
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        {([
          { id: 'health', label: 'Money Health', icon: Heart },
          { id: 'fire', label: 'FIRE Planning', icon: Target },
          { id: 'tax', label: 'Tax Tools', icon: Calculator },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Score Card */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm text-muted-foreground mb-4">Overall Money Health</h3>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${(overall / 100) * 440} 440`}
                        className={cn(
                          "transition-all duration-1000",
                          overall >= 80 ? "text-primary" :
                          overall >= 60 ? "text-chart-3" :
                          "text-accent"
                        )}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-5xl font-bold tabular-nums">{overall}</span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-lg font-semibold",
                    overall >= 80 ? "text-primary" :
                    overall >= 60 ? "text-chart-3" :
                    "text-accent"
                  )}>
                    {overall >= 80 ? 'Excellent' :
                     overall >= 60 ? 'Good' :
                     'Needs Attention'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {"You're"} doing better than 68% of investors
                  </p>
                </div>
              </div>

              {/* Dimensions Grid */}
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                {dimensions.map((dim) => (
                  <div 
                    key={dim.name}
                    className={cn(
                      "p-4 rounded-xl border-l-4 transition-all hover:scale-[1.02]",
                      getStatusColor(dim.status)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{dim.name}</h4>
                      {getStatusIcon(dim.status)}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            dim.status === 'excellent' || dim.status === 'good' ? "bg-primary" :
                            dim.status === 'average' ? "bg-chart-3" :
                            "bg-accent"
                          )}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      <span className="text-lg font-semibold tabular-nums">{dim.score}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{dim.advice}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">AI Recommendations</h3>
              </div>
              <div className="space-y-3">
                {[
                  { priority: 'high', title: 'Increase Term Insurance Cover', description: 'Your current cover is only 8x annual income. Recommended: 15-20x for your age.', action: 'Get Quotes' },
                  { priority: 'medium', title: 'Maximize 80C Deductions', description: 'You have Rs 50,000 unutilized under Section 80C. Consider ELSS or PPF.', action: 'View Options' },
                  { priority: 'low', title: 'Start NPS for Extra Tax Benefit', description: 'Additional Rs 50,000 deduction available under 80CCD(1B).', action: 'Learn More' },
                ].map((rec, i) => (
                  <div key={i} className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        rec.priority === 'high' ? "bg-accent" :
                        rec.priority === 'medium' ? "bg-chart-3" :
                        "bg-muted-foreground"
                      )} />
                      <div>
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{rec.description}</p>
                      </div>
                    </div>
                    <button className="shrink-0 text-sm text-primary hover:underline flex items-center gap-1">
                      {rec.action}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'fire' && (
          <motion.div
            key="fire"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* FIRE Summary */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Current Age</p>
                <p className="text-2xl font-semibold tabular-nums">{fire.currentAge}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Target FIRE Age</p>
                <p className="text-2xl font-semibold tabular-nums">{fire.retirementAge}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Target Corpus</p>
                <p className="text-2xl font-semibold tabular-nums">{formatCurrency(fire.targetCorpus, true)}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Years to FIRE</p>
                <p className="text-2xl font-semibold tabular-nums">{fire.retirementAge - fire.currentAge}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Journey to Financial Independence</h3>
                <span className="text-sm text-muted-foreground">
                  {((fire.currentNetWorth / fire.targetCorpus) * 100).toFixed(1)}% complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-8">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: `${(fire.currentNetWorth / fire.targetCorpus) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">Current: {formatCurrency(fire.currentNetWorth, true)}</span>
                  <span className="text-muted-foreground">Target: {formatCurrency(fire.targetCorpus, true)}</span>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Milestones</h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {fire.milestones.map((milestone, i) => {
                    const isComplete = fire.currentNetWorth >= milestone.corpus
                    const isCurrent = i === fire.milestones.findIndex(m => fire.currentNetWorth < m.corpus) - 1 ||
                                     (fire.currentNetWorth < fire.milestones[0].corpus && i === 0)
                    
                    return (
                      <div key={i} className="relative pl-10 pb-6 last:pb-0">
                        <div className={cn(
                          "absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          isComplete ? "bg-primary border-primary" :
                          isCurrent ? "bg-background border-primary" :
                          "bg-background border-border"
                        )}>
                          {isComplete && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className={cn(
                          "p-4 rounded-lg",
                          isComplete ? "bg-primary/10" :
                          isCurrent ? "bg-muted border border-primary/50" :
                          "bg-muted/50"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{milestone.milestone}</span>
                            <span className="text-sm text-muted-foreground">{milestone.year}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Target: {formatCurrency(milestone.corpus, true)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* SIP Recommendation */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PiggyBank className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">SIP Analysis</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Monthly SIP</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(fire.currentSIP)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Required SIP</span>
                    <span className="font-semibold text-accent tabular-nums">{formatCurrency(fire.requiredSIP)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="text-muted-foreground">SIP Gap</span>
                    <span className="font-semibold text-accent tabular-nums">
                      {formatCurrency(fire.requiredSIP - fire.currentSIP)}/month
                    </span>
                  </div>
                </div>
                <button className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Increase SIP
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Projection</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Projected Corpus</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(fire.projectedCorpus, true)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Target Corpus</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(fire.targetCorpus, true)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <span className="text-muted-foreground">Shortfall</span>
                    <span className="font-semibold text-destructive tabular-nums">
                      {formatCurrency(fire.shortfall, true)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  *Assuming 12% annual returns and current SIP amount
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tax' && (
          <motion.div
            key="tax"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Tax Tools Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Calculator, title: 'Tax Wizard', desc: 'Old vs New regime comparison', status: 'Ready' },
                { icon: FileText, title: 'Capital Gains Report', desc: 'STCG/LTCG computation', status: 'Ready' },
                { icon: Shield, title: '80C Optimizer', desc: 'Maximize deductions', status: 'Rs 50K unused' },
                { icon: TrendingUp, title: 'Tax Loss Harvesting', desc: 'Offset gains with losses', status: 'Opportunities found' },
                { icon: Clock, title: 'Advance Tax Calculator', desc: 'Quarterly payment schedule', status: 'Due Jun 15' },
                { icon: PiggyBank, title: 'HRA Calculator', desc: 'Claim rent deduction', status: 'Ready' },
              ].map((tool, i) => (
                <motion.div
                  key={tool.title}
                  variants={item}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      tool.status.includes('unused') || tool.status.includes('found') || tool.status.includes('Due')
                        ? "bg-accent/20 text-accent"
                        : "bg-primary/20 text-primary"
                    )}>
                      {tool.status}
                    </span>
                  </div>
                  <h4 className="font-medium group-hover:text-primary transition-colors">{tool.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{tool.desc}</p>
                  <button className="mt-3 text-sm text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Tool
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Tax Summary */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <h3 className="font-semibold mb-4">FY 2024-25 Tax Summary</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">Regime Comparison</h4>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/30 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Old Regime</p>
                        <p className="text-xs text-muted-foreground">With deductions</p>
                      </div>
                      <p className="text-lg font-semibold tabular-nums">Rs 2,45,000</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-primary">New Regime</p>
                        <p className="text-xs text-muted-foreground">Recommended</p>
                      </div>
                      <p className="text-lg font-semibold tabular-nums text-primary">Rs 2,12,000</p>
                    </div>
                  </div>
                  <p className="text-sm text-primary mt-3 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Save Rs 33,000 with New Regime
                  </p>
                </div>

                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">Capital Gains (YTD)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">Short-term (STCG)</span>
                      <span className="font-medium tabular-nums">Rs 45,200</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">Long-term (LTCG)</span>
                      <span className="font-medium tabular-nums">Rs 1,82,500</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">LTCG Exempt (u/s 112A)</span>
                      <span className="font-medium text-primary tabular-nums">Rs 1,25,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg border border-border">
                      <span className="font-medium">Taxable LTCG</span>
                      <span className="font-semibold tabular-nums">Rs 57,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
