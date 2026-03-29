'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Zap,
  RefreshCcw
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

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  time: string
  category: string
  impactScore: number
  affectedStocks: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  url?: string
}

export function NewsView() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNews, setExpandedNews] = useState<string | null>(null)
  const [savedArticles, setSavedArticles] = useState<string[]>([])
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const { openChatWithQuery } = useAppStore()

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchNews = () => {
    setLoading(true)
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data && data.articles) {
          setArticles(data.articles)
          setLastUpdated(new Date())
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 60 * 60 * 1000) // 1 Hour
    return () => clearInterval(interval)
  }, [])

  const filteredNews = articles.filter(news => {
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
          <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">News filtered by your portfolio and interests.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                Auto-updates every 1 hour
              </span>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button 
                onClick={fetchNews}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full disabled:opacity-50 transition-colors bg-primary/5 border border-primary/20"
              >
                <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
                {loading ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>
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
            ? articles.length 
            : articles.filter(n => n.category.toLowerCase() === category.id).length
          
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
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex gap-2"><div className="w-16 h-5 bg-muted rounded animate-pulse" /><div className="w-20 h-5 bg-muted rounded animate-pulse" /></div>
                <div className="w-full h-6 bg-muted rounded animate-pulse" />
                <div className="w-3/4 h-6 bg-muted rounded animate-pulse" />
                <div className="w-full h-16 bg-muted rounded animate-pulse" />
              </div>
            ))
          ) : (
            filteredNews.slice(0, 2).map((news) => (
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
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(news.url, '_blank') }}
                    className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors ml-1"
                  >
                    Read Article <ExternalLink className="w-3.5 h-3.5" />
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
          )))}
        </motion.div>
      )}

      {/* News List */}
      <motion.div variants={item} className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex gap-2"><div className="w-16 h-4 bg-muted rounded animate-pulse" /><div className="w-24 h-4 bg-muted rounded animate-pulse" /></div>
                <div className="w-3/4 h-5 bg-muted rounded animate-pulse" />
              </div>
            ))
          ) : (
            (activeCategory === 'all' ? filteredNews.slice(2) : filteredNews).map((news) => (
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
                          <button onClick={() => window.open(news.url, '_blank')} className="flex items-center gap-1 text-sm text-primary hover:underline">
                            Read full article
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <Bookmark className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openChatWithQuery(`Explain this news and its impact on Indian markets and my portfolio: "${news.title}". ${news.affectedStocks.length > 0 ? `It affects stocks: ${news.affectedStocks.join(', ')}.` : ''} Give me your analysis.`)
                            }}
                            className="flex items-center gap-1 text-sm text-accent hover:underline font-medium"
                          >
                            Ask AI ↗
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
          )))}
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
