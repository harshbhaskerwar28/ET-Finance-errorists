'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { chatSuggestions, mockPortfolio } from '@/lib/mock-data'
import {
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ChevronRight,
  Bot,
  User,
  Database,
  TrendingUp,
  Newspaper,
  Search,
  BarChart2,
  PieChart,
  Activity,
  RefreshCw,
  X,
  Loader2,
  CandlestickChart,
  Globe,
  Calculator,
  LineChart,
  CheckCircle2,
  MessageSquare,
  History,
  Plus,
  Trash2,
  Trash,
  Edit3,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────

interface ChartData {
  chartType: 'line' | 'bar' | 'pie' | 'candlestick' | 'area' | 'composed'
  title: string
  description?: string
  data: Record<string, unknown>[]
  xKey?: string
  series?: Array<{ key: string; label: string; color?: string }>
  colors?: string[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolsUsed?: string[]
  suggestions?: string[]
  charts?: ChartData[]
  isStreaming?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
  isGeneratingTitle?: boolean
}

// ── Tool metadata ──────────────────────────────────────────────────────────

const TOOL_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  get_user_portfolio:   { label: 'Reading your portfolio',  Icon: Database,         color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  get_stock_price:      { label: 'Fetching live prices',    Icon: TrendingUp,       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  get_stock_history:    { label: 'Loading price history',   Icon: CandlestickChart, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  get_portfolio_analysis: { label: 'Analysing portfolio',  Icon: PieChart,         color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  compare_stocks:       { label: 'Comparing stocks',        Icon: BarChart2,        color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  get_market_overview:  { label: 'Checking markets',        Icon: Globe,            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  get_recent_signals:   { label: 'Scanning filings',        Icon: Search,           color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  search_financial_news:{ label: 'Searching latest news',   Icon: Newspaper,        color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  web_search:           { label: 'Searching the web',       Icon: Globe,            color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  calculate_tax:        { label: 'Calculating tax impact',  Icon: Calculator,       color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  sector_analysis:      { label: 'Analysing sectors',       Icon: Activity,         color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
}

// ── Glass Chart Component ──────────────────────────────────────────────────

const CHART_COLORS = [
  '#818cf8', '#34d399', '#fb923c', '#f87171', '#a78bfa',
  '#22d3ee', '#4ade80', '#fbbf24', '#e879f9', '#60a5fa',
]

function formatINR(val: number) {
  if (!val && val !== 0) return ''
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(1)}K`
  return `₹${val.toFixed(0)}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1d2e]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-xs text-slate-300">{p.name}:</span>
          <span className="text-xs font-bold" style={{ color: p.color }}>
            {typeof p.value === 'number' && Math.abs(p.value) > 100
              ? formatINR(p.value)
              : `${p.value}${typeof p.value === 'number' && Math.abs(p.value) < 100 ? '%' : ''}`}
          </span>
        </div>
      ))}
    </div>
  )
}

function AIChart({ chart, index }: { chart: ChartData; index: number }) {
  const colors = chart.colors ?? CHART_COLORS

  const renderChart = () => {
    if (chart.chartType === 'pie') {
      return (
        <RechartsPieChart>
          <Pie
            data={chart.data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={40}
            paddingAngle={3}
          >
            {chart.data.map((entry, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke="transparent" />
            ))}
          </Pie>
          <Legend
            formatter={(val) => (
              <span className="text-xs text-slate-300">{val}</span>
            )}
          />
          <Tooltip content={<CustomTooltip />} />
        </RechartsPieChart>
      )
    }

    if (chart.chartType === 'area') {
      return (
        <AreaChart data={chart.data}>
          <defs>
            {(chart.series ?? [{ key: 'value', label: 'Value' }]).map((s, i) => (
              <linearGradient key={s.key} id={`grad-${index}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color ?? colors[i]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color ?? colors[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={chart.xKey ?? 'date'} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {(chart.series ?? [{ key: 'close', label: 'Close', color: '#818cf8' }]).map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? colors[i]}
              fill={`url(#grad-${index}-${i})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </AreaChart>
      )
    }

    if (chart.chartType === 'line' || chart.chartType === 'candlestick') {
      const defaultSeries = [
        { key: 'close', label: 'Close', color: '#818cf8' },
        ...(chart.data[0]?.open !== undefined ? [{ key: 'open', label: 'Open', color: '#34d399' }] : [])
      ]
      const seriesToRender = chart.series ?? defaultSeries

      return (
        <AreaChart data={chart.data}>
          <defs>
            {seriesToRender.map((s, i) => (
              <linearGradient key={s.key} id={`grad-line-${index}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color ?? colors[i]} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color ?? colors[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey={chart.xKey ?? 'date'}
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatINR(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          {seriesToRender.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? colors[i]}
              fill={`url(#grad-line-${index}-${i})`}
              strokeWidth={i === 0 ? 2.5 : 1.5}
              strokeDasharray={i > 0 && chart.data[0]?.open !== undefined && !chart.series ? "4 2" : undefined}
              dot={false}
            />
          ))}
          <Legend formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
        </AreaChart>
      )
    }

    // Default: Bar chart
    return (
      <BarChart data={chart.data} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey={chart.xKey ?? 'name'}
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {(chart.series ?? [{ key: 'value', label: 'Value', color: '#818cf8' }]).map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            radius={[4, 4, 0, 0]}
          >
            {chart.data.map((_, di) => (
              <Cell
                key={di}
                fill={chart.chartType === 'bar' && chart.data[di] && (chart.data[di] as any).change !== undefined
                  ? (chart.data[di] as any).change >= 0 ? '#34d399' : '#f87171'
                  : colors[di % colors.length]}
              />
            ))}
          </Bar>
        ))}
        {(chart.series?.length ?? 0) > 1 && (
          <Legend formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
        )}
      </BarChart>
    )
  }

  const chartIcon = {
    pie: PieChart,
    bar: BarChart2,
    line: LineChart,
    area: Activity,
    candlestick: CandlestickChart,
    composed: BarChart2,
  }[chart.chartType] ?? BarChart2

  const ChartIcon = chartIcon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15, type: 'spring', stiffness: 200, damping: 25 }}
      className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl shadow-xl"
    >
      {/* Chart Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <ChartIcon className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{chart.title}</p>
          {chart.description && (
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{chart.description}</p>
          )}
        </div>
        <span className="text-[10px] text-slate-600 flex-shrink-0 capitalize bg-white/5 px-2 py-0.5 rounded-full">
          {chart.chartType}
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="p-3 sm:p-4 w-full h-[220px] sm:h-[250px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// ── Full Markdown Renderer ─────────────────────────────────────────────────

/** Render inline markdown: bold, italic, strikethrough, inline-code, links */
function renderInline(text: string): React.ReactNode[] {
  // Patterns: ![alt](url), <chart></chart>, `code`, **bold**, *italic*, ~~strike~~, [text](url)
  const pattern = /(!\[([^\]]+)\]\(([^)]+)\)|<\/?chart[^>]*>|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[([^\]]+)\]\(([^)]+)\))/gi
  const nodes: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const raw = match[0]
    
    const rawLower = raw.toLowerCase()
    
    if (raw.startsWith('![') || rawLower.startsWith('<chart') || rawLower.startsWith('</chart')) {
      // It's a markdown image or fabricated HTML tag, intentionally ignore and SWALLOW it so it never breaks UI
      nodes.push(null)
    } else if (raw.startsWith('`')) {
      nodes.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-white/8 text-indigo-300 font-mono text-[12px] border border-white/8">
          {raw.slice(1, -1)}
        </code>
      )
    } else if (raw.startsWith('**')) {
      nodes.push(<strong key={match.index} className="text-white font-semibold">{raw.slice(2, -2)}</strong>)
    } else if (raw.startsWith('*')) {
      nodes.push(<em key={match.index} className="text-slate-200 italic">{raw.slice(1, -1)}</em>)
    } else if (raw.startsWith('~~')) {
      nodes.push(<del key={match.index} className="text-slate-500">{raw.slice(2, -2)}</del>)
    } else if (raw.startsWith('[')) {
      nodes.push(
        <a key={match.index} href={match[6]} target="_blank" rel="noopener noreferrer"
           className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">
          {match[5]}
        </a>
      )
    }
    last = match.index + raw.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/** Parse and render a full markdown string */
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Fenced code block  ─────────────────────────────────────────────────
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden border border-white/8">
          {lang && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/8">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{lang}</span>
            </div>
          )}
          <pre className="p-4 overflow-x-auto bg-[#12141f] text-[12px] font-mono text-emerald-300 leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      i++
      continue
    }

    // ── Horizontal rule ────────────────────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-white/10" />)
      i++
      continue
    }

    // ── Table ──────────────────────────────────────────────────────────────
    if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const headerCells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      i += 2 // skip header + separator
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i].split('|').filter(c => c.trim()).map(c => c.trim()))
        i++
      }
      elements.push(
        <div key={`table-${i}`} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {headerCells.map((h, ci) => (
                    <th key={ci} className="px-4 py-2.5 text-left font-semibold text-slate-300 whitespace-nowrap">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={cn('border-b border-white/5', ri % 2 === 0 ? '' : 'bg-white/[0.02]')}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-slate-300 leading-relaxed">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
      continue
    }

    // ── Blockquote ─────────────────────────────────────────────────────────
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="my-2 pl-4 border-l-2 border-indigo-500/50 bg-indigo-500/5 py-2 pr-3 rounded-r-lg">
          <p className="text-sm text-slate-300 italic leading-relaxed">{renderInline(quoteLines.join(' '))}</p>
        </blockquote>
      )
      continue
    }

    // ── Headers ────────────────────────────────────────────────────────────
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-white mt-3 mb-1 leading-snug">
          {renderInline(line.slice(4))}
        </h4>
      )
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-base font-bold text-white mt-4 mb-1.5 leading-snug">
          {renderInline(line.slice(3))}
        </h3>
      )
      i++; continue
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-lg font-bold text-white mt-4 mb-2 leading-snug">
          {renderInline(line.slice(2))}
        </h2>
      )
      i++; continue
    }

    // ── Unordered list ─────────────────────────────────────────────────────
    if (/^[-*+] /.test(line)) {
      const listItems: React.ReactNode[] = []
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        listItems.push(
          <li key={i} className="flex gap-2.5 my-0.5">
            <span className="text-indigo-400 mt-0.5 flex-shrink-0 text-xs">◆</span>
            <span className="text-sm text-slate-200 leading-relaxed">{renderInline(lines[i].replace(/^[-*+] /, ''))}</span>
          </li>
        )
        i++
      }
      elements.push(<ul key={`ul-${i}`} className="my-2 space-y-0.5 list-none">{listItems}</ul>)
      continue
    }

    // ── Ordered list ───────────────────────────────────────────────────────
    if (/^\d+\. /.test(line)) {
      const listItems: React.ReactNode[] = []
      let num = 1
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(
          <li key={i} className="flex gap-2.5 my-0.5">
            <span className="text-indigo-400 flex-shrink-0 text-xs font-mono w-5 text-right mt-0.5">{num}.</span>
            <span className="text-sm text-slate-200 leading-relaxed">{renderInline(lines[i].replace(/^\d+\. /, ''))}</span>
          </li>
        )
        i++; num++
      }
      elements.push(<ol key={`ol-${i}`} className="my-2 space-y-0.5 list-none">{listItems}</ol>)
      continue
    }

    // ── Empty line ─────────────────────────────────────────────────────────
    if (!line.trim()) {
      elements.push(<div key={`sp-${i}`} className="h-2" />)
      i++; continue
    }

    // ── Regular paragraph ──────────────────────────────────────────────────
    elements.push(
      <p key={`p-${i}`} className="text-sm text-slate-200 leading-relaxed my-0.5">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <>{elements}</>
}

// ── Streaming wrapper (adds blinking cursor while streaming) ───────────────

function StreamingText({ text, done }: { text: string; done?: boolean }) {
  return (
    <div className="markdown-content">
      <MarkdownContent text={text} />
      {!done && (
        <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-text-bottom rounded-full" />
      )}
    </div>
  )
}


// ── Main ChatView ──────────────────────────────────────────────────────────

export function ChatView() {
  const { clearChat, pendingChatQuery, clearPendingChatQuery } = useAppStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [showHistory, setShowHistory] = useState(false)
  const isInitialized = useRef(false)

  const DEFAULT_MESSAGE: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: "I've loaded your portfolio — you're holding **8 positions** across Banking, IT, Energy, and Telecom sectors. Your portfolio is up **+15.2%** overall.\n\nWhat would you like to analyse today?",
    timestamp: new Date(),
    suggestions: [
      'Analyse my portfolio allocation and risk',
      'Which of my holdings have insider buying?',
      'Show IT sector performance vs Nifty today',
      'What\'s the tax impact if I sell RELIANCE?',
    ],
  }

  // Load from sessionStorage on mount
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    
    try {
      const stored = sessionStorage.getItem('et_chat_sessions')
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored)
        if (parsed.length > 0) {
          // Re-hydrate dates
          parsed.forEach(s => s.messages.forEach(m => m.timestamp = new Date(m.timestamp)))
          setSessions(parsed)
          setCurrentSessionId(parsed[0].id)
          setMessages(parsed[0].messages)
          return
        }
      }
    } catch { /* ignore parse errors */ }

    // First time setup
    const newId = crypto.randomUUID()
    setSessions([{ id: newId, title: 'New Chat', messages: [DEFAULT_MESSAGE], updatedAt: Date.now() }])
    setCurrentSessionId(newId)
    setMessages([DEFAULT_MESSAGE])
  }, [])

  // Sync to sessions and sessionStorage whenever messages change
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return
    
    setSessions(prev => {
      const next = prev.map(s => 
        s.id === currentSessionId ? { ...s, messages, updatedAt: Date.now() } : s
      )
      
      sessionStorage.setItem('et_chat_sessions', JSON.stringify(next))
      return next
    })
  }, [messages, currentSessionId])

  const createNewChat = () => {
    const newId = crypto.randomUUID()
    const newSession = { id: newId, title: 'New Chat', messages: [DEFAULT_MESSAGE], updatedAt: Date.now() }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newId)
    setMessages([DEFAULT_MESSAGE])
    setShowHistory(false)
  }

  const switchSession = (id: string) => {
    const s = sessions.find(s => s.id === id)
    if (s) {
      setCurrentSessionId(id)
      setMessages(s.messages)
      setShowHistory(false)
    }
  }

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (next.length === 0) {
        const newId = crypto.randomUUID()
        const newS = { id: newId, title: 'New Chat', messages: [DEFAULT_MESSAGE], updatedAt: Date.now() }
        setCurrentSessionId(newId)
        setMessages([DEFAULT_MESSAGE])
        sessionStorage.setItem('et_chat_sessions', JSON.stringify([newS]))
        return [newS]
      }
      if (currentSessionId === id) {
        setCurrentSessionId(next[0].id)
        setMessages(next[0].messages)
      }
      sessionStorage.setItem('et_chat_sessions', JSON.stringify(next))
      return next
    })
  }

  const clearAllSessions = () => {
    const newId = crypto.randomUUID()
    const newS = { id: newId, title: 'New Chat', messages: [DEFAULT_MESSAGE], updatedAt: Date.now() }
    setSessions([newS])
    setCurrentSessionId(newId)
    setMessages([DEFAULT_MESSAGE])
    setShowHistory(false)
    sessionStorage.setItem('et_chat_sessions', JSON.stringify([newS]))
  }

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)

  const handleTitleEdit = (id: string, newTitle: string) => {
    setSessions(prev => {
      const next = prev.map(s => s.id === id ? { ...s, title: newTitle.trim() || 'Chat Session' } : s)
      sessionStorage.setItem('et_chat_sessions', JSON.stringify(next))
      return next
    })
    setEditingTitleId(null)
  }

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [streamingCharts, setStreamingCharts] = useState<ChartData[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, activeTools])

  // Auto-send pending query from "Ask AI about X" context buttons
  useEffect(() => {
    if (pendingChatQuery) {
      clearPendingChatQuery()
      // Small delay to let component fully mount
      setTimeout(() => {
        sendMessage(pendingChatQuery)
      }, 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setStreamingText('')
    setStreamingCharts([])
    setActiveTools([])

    // Parallel Title Generation on First Message
    const isFirstUserMessage = messages.length === 1 && messages[0].id === 'welcome'
    if (isFirstUserMessage) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, isGeneratingTitle: true } : s))
      fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text.trim() }),
      }).then(res => res.json()).then(data => {
        setSessions(prev => {
           const next = prev.map(s => s.id === currentSessionId ? { ...s, title: data.title || 'Market Analysis', isGeneratingTitle: false } : s)
           sessionStorage.setItem('et_chat_sessions', JSON.stringify(next))
           return next
        })
      }).catch(() => {
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: 'Market Analysis', isGeneratingTitle: false } : s))
      })
    }

    // Build message history (filter out suggestions, keep content only)
    const history = [...messages, userMsg].map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    let fullText = ''
    const usedTools: string[] = []
    const charts: ChartData[] = []

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId: currentSessionId }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error(`API error ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))

            switch (ev.type) {
              case 'text':
                fullText += ev.content
                // Hide suggestions blocks from streaming text
                const suggIdx = fullText.search(/(?:```json\s*\n?)?(?:\{?"?SUGGESTIONS"?\s*:|<suggestions>)/i)
                if (suggIdx !== -1) {
                  setStreamingText(fullText.slice(0, suggIdx).trim())
                } else {
                  setStreamingText(fullText)
                }
                break
              case 'tool_start':
                setActiveTools(prev => [...new Set([...prev, ev.tool])])
                if (!usedTools.includes(ev.tool)) usedTools.push(ev.tool)
                break
              case 'tool_end':
                setActiveTools(prev => prev.filter(t => t !== ev.tool))
                break
              case 'chart':
                charts.push(ev.chart)
                setStreamingCharts(prev => [...prev, ev.chart])
                break
              case 'done':
                break
              case 'error':
                fullText += `\n\n⚠️ ${ev.message}`
                setStreamingText(fullText)
                break
            }
          } catch { /* malformed SSE line */ }
        }
      }

      // Parse suggestions robustly from end of response
      let suggestions: string[] = []
      
      // Try to match <suggestions>[...]</suggestions> first (new format)
      let suggMatch = fullText.match(/<suggestions>(.*?)<\/suggestions>/is)
      if (!suggMatch) {
         // Fallback to old format just in case
         suggMatch = fullText.match(/\{?"?SUGGESTIONS"?\s*:\s*(\[[^\]]*\])/is)
      }
      
      if (suggMatch) {
        try {
          suggestions = JSON.parse(suggMatch[1])
        } catch { /* ignore */ }
      }
      
      const cleanContent = fullText.replace(/<suggestions>.*?<\/suggestions>/is, '')
                                   .replace(/```json\s*\n?\{?"?SUGGESTIONS"?\s*:\s*\[.*?\]\}?\s*```/is, '')
                                   .replace(/\{?"?SUGGESTIONS"?\s*:\s*\[.*?\]\}?/is, '')
                                   .trim()

      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
        toolsUsed: usedTools,
        suggestions,
        charts,
      }])
    } catch (err: any) {
      if (err?.name === 'AbortError') return

      // Graceful fallback
      const fallbackText = 'Sorry, I encountered an issue connecting to the market data. Please try again.'
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
      setStreamingText('')
      setStreamingCharts([])
      setActiveTools([])
    }
  }, [messages, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const stopGeneration = () => {
    abortRef.current?.abort()
    setIsLoading(false)
    if (streamingText) {
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: streamingText + '\n\n*(Response stopped)*',
        timestamp: new Date(),
        charts: streamingCharts.length > 0 ? streamingCharts : undefined,
      }])
    }
    setStreamingText('')
    setStreamingCharts([])
    setActiveTools([])
  }

  const isEmpty = messages.length === 1 && messages[0].id === 'welcome' && !streamingText

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden relative">
      
      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-background relative z-10 transition-transform duration-300">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d0f14]/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistory(true)}
              className="md:hidden -ml-2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d0f14]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">ET Market AI</h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">Live data · Tool calling · GPT-4o-mini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {/* Bot avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div className={cn('max-w-[95%] md:max-w-[85%] lg:max-w-[82%] min-w-0 flex-1', msg.role === 'user' && 'flex flex-col items-end')}>
                {/* Tool badges (used tools) */}
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.toolsUsed.map(t => {
                      const meta = TOOL_META[t]
                      if (!meta) return null
                      return (
                        <motion.span
                          key={t}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-full border font-medium',
                            meta.color
                          )}
                        >
                          <meta.Icon className="w-3 h-3" />
                          {meta.label}
                          <CheckCircle2 className="w-3 h-3 opacity-60" />
                        </motion.span>
                      )
                    })}
                  </div>
                )}

                {/* Message bubble */}
                <div className={cn(
                  'rounded-2xl px-4 py-3.5',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 border border-white/8 text-slate-200 rounded-bl-sm backdrop-blur-sm'
                )}>
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <StreamingText text={msg.content} done />
                  )}
                </div>

                {/* Charts */}
                {msg.charts && msg.charts.length > 0 && (
                  <div className="w-full mt-1 space-y-2">
                    {msg.charts.map((chart, i) => (
                      <AIChart key={i} chart={chart} index={i} />
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 w-full">
                    {msg.suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        onClick={() => sendMessage(s)}
                        disabled={isLoading}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-indigo-500/30 rounded-xl transition-all group flex items-center justify-between disabled:opacity-40"
                      >
                        <span>{s}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0 ml-2" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Actions for assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-1.5 ml-1">
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="p-1.5 rounded-lg hover:bg-white/8 text-slate-600 hover:text-slate-300 transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/8 text-slate-600 hover:text-emerald-400 transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/8 text-slate-600 hover:text-red-400 transition-colors">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-700 ml-1">
                      {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {/* User avatar */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Active Tool Indicators ── */}
        <AnimatePresence>
          {activeTools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex justify-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="space-y-1.5">
                {activeTools.map(t => {
                  const meta = TOOL_META[t] ?? { label: t, Icon: Activity, color: 'text-slate-400 bg-white/5 border-white/10' }
                  return (
                    <motion.div
                      key={t}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 text-xs rounded-xl border font-medium',
                        meta.color
                      )}
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {meta.label}...
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Streaming Response ── */}
        <AnimatePresence>
          {streamingText && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="max-w-[95%] md:max-w-[85%] lg:max-w-[82%] min-w-0 flex-1">
                <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3.5 backdrop-blur-sm">
                  <StreamingText text={streamingText} done={false} />
                </div>
                {streamingCharts.length > 0 && (
                  <div className="w-full mt-1 space-y-2">
                    {streamingCharts.map((chart, i) => (
                      <AIChart key={i} chart={chart} index={i} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Thinking dots (no text yet) ── */}
        <AnimatePresence>
          {isLoading && !streamingText && activeTools.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-4 max-w-[95%] md:max-w-[85%] lg:max-w-[82%] min-w-0">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, delay: i * 0.18, duration: 0.9 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mb-5"
            >
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-1.5">Portfolio-Aware Market AI</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              Ask anything — I fetch live NSE data, analyse your actual holdings, and render charts in real time.
            </p>
            <div className="w-full max-w-xl grid gap-2">
              <p className="text-xs text-slate-600 text-left mb-1">Try asking:</p>
              {chatSuggestions.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-indigo-500/30 text-sm text-slate-300 transition-all group flex items-center justify-between"
                >
                  <span>{s}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 ml-2" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-3.5 border-t border-white/5 bg-[#0d0f14]/80 backdrop-blur-sm shrink-0">
        <div className="flex items-end gap-2.5 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio, any stock, tax impact, sector trends..."
              rows={1}
              disabled={isLoading}
              className="w-full resize-none bg-white/[0.06] border border-white/10 hover:border-white/15 focus:border-indigo-500/50 rounded-2xl px-4 py-3 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all min-h-[48px] max-h-32 disabled:opacity-50"
              style={{ lineHeight: '1.5' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`
              }}
            />
          </div>

          {isLoading ? (
            <button
              onClick={stopGeneration}
              className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all shrink-0"
              title="Stop generation"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className={cn(
                'p-3 rounded-xl transition-all shrink-0',
                input.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/8'
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>
      
      </div> {/* Closes Main Chat Area JSX wrapper */}
      
      {/* ── History Sidebar (Right Side) ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
            />
            {/* Sidebar Panel */}
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute md:static right-0 top-0 bottom-0 w-[280px] bg-[#0a0c10] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Chat History
                </h3>
                <div className="flex items-center gap-1">
                  <button onClick={clearAllSessions} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="Clear all history">
                    <Trash className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors hidden md:block" title="Close">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors md:hidden">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sessions.length === 0 && <p className="text-xs text-center text-slate-500 mt-10">No history yet.</p>}
                {sessions.map(s => (
                  <div key={s.id} className={cn("relative group w-full text-left rounded-xl transition-all border border-transparent", s.id === currentSessionId ? 'bg-indigo-500/10 border-indigo-500/30' : 'hover:bg-white/5 hover:border-white/10')}>
                    <button onClick={() => switchSession(s.id)} className="w-full px-3 py-3 text-left">
                      {editingTitleId === s.id ? (
                        <input
                          autoFocus
                          defaultValue={s.title}
                          className="w-full bg-[#12141a] text-white text-sm px-2 py-1 mb-1 rounded outline-none border border-indigo-500/50"
                          onBlur={e => handleTitleEdit(s.id, e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleTitleEdit(s.id, e.currentTarget.value)
                            if (e.key === 'Escape') setEditingTitleId(null)
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center gap-2 mb-1 pr-10">
                          {s.isGeneratingTitle && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin flex-shrink-0" />}
                          <p className={cn("text-sm font-medium truncate", s.id === currentSessionId ? "text-indigo-300" : "text-slate-300 group-hover:text-white", s.isGeneratingTitle && "opacity-75 italic text-slate-400")}>
                            {s.isGeneratingTitle ? 'Generating title...' : s.title}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[10px] text-slate-500 font-medium">{s.messages.length} msg{s.messages.length !== 1 && 's'}</p>
                        <p className="text-[10px] text-slate-500">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </button>
                    {!editingTitleId && (
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[#0a0c10]/90 backdrop-blur shadow rounded-lg p-0.5 border border-white/10">
                        <button onClick={(e) => { e.stopPropagation(); setEditingTitleId(s.id) }} className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-colors" title="Edit title">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => deleteSession(s.id, e)} className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors" title="Delete session">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
