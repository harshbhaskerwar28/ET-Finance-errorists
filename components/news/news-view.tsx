'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mockNews, type NewsItem } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Filter,
  Search,
  Bookmark,
  Share2,
  ExternalLink,
  ChevronRight,
  Newspaper,
  BarChart2,
  Users,
  Building2,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NewsCategory = 'all' | 'macro' | 'corporate' | 'earnings' | 'fii/dii' | 'sector'

const categories: { id: NewsCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All News', icon: Newspaper },
  { id: 'macro', label: 'Macro', icon: BarChart2 },
  { id: 'corporate', label: 'Corporate', icon: Building2 },
  { id: 'earnings', label: 'Earnings', icon: TrendingUp },
  { id: 'fii/dii', label: 'FII/DII', icon: Users },
  { id: 'sector', label: 'Sector', icon: Zap },
]

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

// Extended news for demo
const extendedNews: NewsItem[] = [
  ...mockNews,
  {
    id: '7',
    title: 'Adani Group Stocks Rally After Supreme Court Verdict',
    summary: 'Adani group stocks saw a sharp rally today following favorable Supreme Court observations on the Hindenburg report case.',
    source: 'ET Markets',
    time: '12 hours ago',
    category: 'Corporate',
    impactScore: 82,
    affectedStocks: ['ADANIENT', 'ADANIPORTS', 'ADANIPOWER'],
    sentiment: 'positive'
  },
  {
    id: '8',
    title: 'IT Sector Outlook: Analysts Remain Cautious on Near-term Growth',
    summary: 'Major brokerages have trimmed their IT sector growth estimates citing slower deal closures and client budget constraints.',
    source: 'ET Tech',
    time: '14 hours ago',
    category: 'Sector',
    impactScore: 68,
    affectedStocks: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'],
    sentiment: 'negative'
  },
  {
    id: '9',
    title: 'Gold Prices Hit Record High Amid Global Uncertainty',
    summary: 'Gold prices surged to all-time highs as investors seek safe haven assets amid geopolitical tensions and inflation concerns.',
    source: 'ET Markets',
    time: '16 hours ago',
    category: 'Macro',
    impactScore: 72,
    affectedStocks: ['GOLDIAM', 'TITAN'],
    sentiment: 'positive'
  },
  {
    id: '10',
    title: 'Zomato Reports Profitable Quarter, Stock Jumps 8%',
    summary: 'Zomato reported its third consecutive profitable quarter with strong growth in food delivery and quick commerce segments.',
    source: 'ET Startups',
    time: '18 hours ago',
    category: 'Earnings',
    impactScore: 85,
    affectedStocks: ['ZOMATO'],
    sentiment: 'positive'
  }
]

export function NewsView() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNews, setExpandedNews] = useState<string | null>(null)
  const [savedArticles, setSavedArticles] = useState<string[]>([])

  const filteredNews = extendedNews.filter(news => {
    const matchesCategory = activeCategory === 'all' || 
      news.category.toLowerCase() === activeCategory.toLowerCase()
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleSave = (id: string) => {
    setSavedArticles(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const getSentimentColor = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'text-primary bg-primary/10'
      case 'negative': return 'text-destructive bg-destructive/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

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
          <h2 className="text-xl font-semibold">Personalized News Feed</h2>
          <p className="text-sm text-muted-foreground">News filtered by your portfolio and interests</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border border-transparent focus:border-primary text-sm outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div variants={item} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon
          const count = category.id === 'all' 
            ? extendedNews.length 
            : extendedNews.filter(n => n.category.toLowerCase() === category.id).length
          
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {category.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                activeCategory === category.id
                  ? "bg-primary-foreground/20"
                  : "bg-border"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Featured News */}
      {activeCategory === 'all' && (
        <motion.div variants={item} className="grid md:grid-cols-2 gap-4">
          {filteredNews.slice(0, 2).map((news) => (
            <div
              key={news.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => setExpandedNews(expandedNews === news.id ? null : news.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded",
                  getSentimentColor(news.sentiment)
                )}>
                  {news.sentiment === 'positive' ? 'Bullish' : 
                   news.sentiment === 'negative' ? 'Bearish' : 'Neutral'}
                </span>
                <span className="text-xs text-muted-foreground">{news.category}</span>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {news.time}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {news.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {news.summary}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Impact:</span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        news.impactScore >= 80 ? "bg-accent" :
                        news.impactScore >= 60 ? "bg-primary" :
                        "bg-muted-foreground"
                      )}
                      style={{ width: `${news.impactScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums">{news.impactScore}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleSave(news.id) }}
                    className={cn(
                      "p-1.5 rounded hover:bg-muted transition-colors",
                      savedArticles.includes(news.id) ? "text-accent" : "text-muted-foreground"
                    )}
                  >
                    <Bookmark className={cn("w-4 h-4", savedArticles.includes(news.id) && "fill-current")} />
                  </button>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Affected Stocks */}
              {news.affectedStocks.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">Affected:</span>
                  <div className="flex flex-wrap gap-1">
                    {news.affectedStocks.slice(0, 4).map((stock) => (
                      <span key={stock} className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                        {stock}
                      </span>
                    ))}
                    {news.affectedStocks.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        +{news.affectedStocks.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* News List */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {(activeCategory === 'all' ? filteredNews.slice(2) : filteredNews).map((news) => (
            <motion.article
              key={news.id}
              variants={item}
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => setExpandedNews(expandedNews === news.id ? null : news.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      getSentimentColor(news.sentiment)
                    )}>
                      {news.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{news.source}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{news.time}</span>
                  </div>

                  <h4 className="font-medium mb-1 line-clamp-2 hover:text-primary transition-colors">
                    {news.title}
                  </h4>

                  <AnimatePresence>
                    {expandedNews === news.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-muted-foreground mt-2 mb-3">
                          {news.summary}
                        </p>
                        
                        {news.affectedStocks.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-muted-foreground">Related stocks:</span>
                            <div className="flex flex-wrap gap-1">
                              {news.affectedStocks.map((stock) => (
                                <span key={stock} className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                                  {stock}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                            Read full article
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <Bookmark className="w-3 h-3" />
                            Save
                          </button>
                          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <Share2 className="w-3 h-3" />
                            Share
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    {news.sentiment === 'positive' && <TrendingUp className="w-4 h-4 text-primary" />}
                    {news.sentiment === 'negative' && <TrendingDown className="w-4 h-4 text-destructive" />}
                    <span className={cn(
                      "text-sm font-medium tabular-nums",
                      news.impactScore >= 80 ? "text-accent" :
                      news.impactScore >= 60 ? "text-primary" :
                      "text-muted-foreground"
                    )}>
                      {news.impactScore}
                    </span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    expandedNews === news.id && "rotate-90"
                  )} />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>

      {/* Load More */}
      <motion.div variants={item} className="flex justify-center">
        <button className="px-6 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
          Load More News
        </button>
      </motion.div>
    </motion.div>
  )
}
