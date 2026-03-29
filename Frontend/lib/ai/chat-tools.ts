// lib/ai/chat-tools.ts
// All tool definitions and executors for the Market AI Chat

import { createClient } from '@supabase/supabase-js'
import {
  getStockQuote,
  getMultipleQuotes,
  getHistoricalData,
  getMarketMovers,
  getIndexData,
  fetchNSEAnnouncements,
  fetchBulkDeals,
  type StockQuote,
  type HistoricalData,
} from '@/lib/market-data/nse-client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChartData {
  chartType: 'line' | 'bar' | 'pie' | 'candlestick' | 'area' | 'composed'
  title: string
  description?: string
  data: Record<string, unknown>[]
  xKey?: string
  series?: Array<{ key: string; label: string; color?: string }>
  colors?: string[]
}

export interface ToolResult {
  success: boolean
  data?: unknown
  chart?: ChartData
  error?: string
}

// ── Tool Definitions ──────────────────────────────────────────────────────────

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, { type: string; description: string; enum?: string[] }>
      required: string[]
    }
  }
}

export const CHAT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_user_portfolio',
      description: "Retrieve the authenticated user's stock portfolio holdings including symbols, quantities, current prices, allocation percentages, and returns. Always call this first when the user asks about their portfolio, personal holdings, or 'my stocks'.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_price',
      description: 'Get live real-time price, % change, 52-week high/low, market cap, and fundamentals for one or more NSE stock symbols. Use this whenever the user asks about a stock price or current market data.',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'string',
            description: 'Comma-separated EXACT Yahoo Finance ticker symbols (e.g. "RELIANCE.NS, TCS.NS", "^NSEI" for Nifty 50, "^NSEBANK" for Bank Nifty). Can also use US stocks like "AAPL".',
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_history',
      description: 'Get historical OHLCV data. To compare multiple stocks/indices on the SAME chart, you MUST provide ALL symbols in a single comma-separated list in ONE tool call. NEVER call this tool multiple times for a single comparison check.',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'string',
            description: 'Comma-separated EXACT Yahoo Finance ticker symbols e.g. "RELIANCE.NS, ^NSEI, ^NSEBANK". MUST group them in one string to combine charts.',
          },
          range: {
            type: 'string',
            description: 'Time range for data',
            enum: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'],
          },
          chartType: {
            type: 'string',
            description: 'Preferred chart visualization type',
            enum: ['candlestick', 'line', 'area'],
          },
        },
        required: ['symbols', 'range'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_portfolio_analysis',
      description: "Deep analyze the user's portfolio for sector exposure, concentration risk, allocation, gainers/losers, and generate visualization charts. Use when user asks for portfolio review, rebalancing advice, or risk analysis.",
      parameters: {
        type: 'object',
        properties: {
          analysisType: {
            type: 'string',
            description: 'Type of portfolio analysis to run',
            enum: ['allocation', 'performance', 'risk', 'sector', 'full'],
          },
        },
        required: ['analysisType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_stocks',
      description: 'Compare multiple stocks side by side on price performance, returns, fundamentals. Generates a comparative bar chart.',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'string',
            description: 'Comma-separated EXACT Yahoo Finance ticker symbols to compare e.g. "TCS.NS, INFY.NS"',
          },
          metric: {
            type: 'string',
            description: 'What metric to compare',
            enum: ['price', 'change_pct', 'week52', 'marketcap'],
          },
        },
        required: ['symbols', 'metric'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_market_overview',
      description: 'Get current Nifty 50 and Sensex index values, top gainers, top losers, and overall market sentiment. Use when user asks about market conditions, how markets are doing today, or general market status.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_signals',
      description: 'Search for recent market signals, insider trades, bulk deals, or corporate announcements for a specific NSE stock from NSE database and market data.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'NSE stock symbol to search signals for',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_financial_news',
      description: 'Search for latest financial news, market analysis, or information about stocks, sectors, or economic topics from Indian financial media.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query e.g. "RELIANCE Q3 results", "RBI rate hike", "IT sector FII outlook"',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the open web/internet for general queries, global news, company background, regulatory policies, or any other information not directly covered by market data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up on the internet',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_tax',
      description: "Calculate capital gains tax implication for selling a stock from user's portfolio. Computes STCG vs LTCG based on Indian tax laws.",
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'NSE stock symbol to calculate tax for',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sector_analysis',
      description: 'Get sector-wise performance analysis, FII/DII flow data, and sector rotation trends. Generates a sector performance chart.',
      parameters: {
        type: 'object',
        properties: {
          sector: {
            type: 'string',
            description: 'Specific sector like "IT", "Banking", "Pharma" — or "all" for full sector overview',
          },
        },
        required: ['sector'],
      },
    },
  },
]

// ── Tool Executor ─────────────────────────────────────────────────────────────

function humanizeSymbol(sym: string): string {
  const s = sym.toUpperCase()
  if (s === '^NSEI') return 'Nifty 50'
  if (s === '^NSEBANK') return 'Bank Nifty'
  if (s === '^CNXFIN') return 'FinNifty'
  if (s === '^BSESN') return 'Sensex'
  return s.replace('.NS', '').replace('.BO', '')
}


function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Mock portfolio for non-Supabase fallback (uses the mock data structure)
const MOCK_PORTFOLIO = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', quantity: 50, avgPrice: 2450, allocation: 22.4, sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', quantity: 25, avgPrice: 3200, allocation: 16.1, sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', quantity: 60, avgPrice: 1580, allocation: 15.6, sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys Ltd', quantity: 45, avgPrice: 1420, allocation: 10.7, sector: 'IT' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', quantity: 75, avgPrice: 890, allocation: 13.4, sector: 'Banking' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', quantity: 40, avgPrice: 780, allocation: 7.7, sector: 'Telecom' },
  { symbol: 'WIPRO.NS', name: 'Wipro Ltd', quantity: 100, avgPrice: 420, allocation: 7.5, sector: 'IT' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', quantity: 15, avgPrice: 2850, allocation: 6.4, sector: 'Consumer' },
]

export async function runChatTool(
  name: string,
  args: Record<string, string>,
  userId: string
): Promise<string> {
  try {
    switch (name) {
      case 'get_user_portfolio': {
        let portfolio = MOCK_PORTFOLIO
        // Try Supabase first
        try {
          const supabase = getSupabaseServiceClient()
          const { data } = await supabase
            .from('portfolio_holdings')
            .select('*')
            .eq('clerk_user_id', userId)
          if (data && data.length > 0) portfolio = data
        } catch { /* use mock */ }

        // Fetch live prices for portfolio
        const symbols = portfolio.map((h: any) => h.symbol)
        const quotes = await getMultipleQuotes(symbols)
        const quoteMap = Object.fromEntries(quotes.map(q => [q.symbol, q]))

        const enriched = portfolio.map((h: any) => {
          const q = quoteMap[h.symbol]
          const currentPrice = q?.price ?? h.avgPrice
          const value = currentPrice * h.quantity
          const totalReturn = h.avgPrice ? ((currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0
          return {
            ...h,
            currentPrice,
            dayChange: q?.changePct,
            value,
            totalReturn: Number(totalReturn.toFixed(2)),
          }
        })

        return JSON.stringify({
          holdings: enriched,
          summary: {
            totalValue: enriched.reduce((s: number, h: any) => s + (h.value || 0), 0).toFixed(0),
            holdingsCount: enriched.length,
          },
        })
      }

      case 'get_stock_price': {
        const symbols = (args.symbols ?? '').split(',').map(s => s.trim()).filter(Boolean)
        if (symbols.length === 0) return JSON.stringify({ error: 'No symbols provided' })

        const quotes = await getMultipleQuotes(symbols)
        return JSON.stringify(quotes)
      }

      case 'get_stock_history': {
        const { symbols: rawSymbols, range = '3mo', chartType = 'line' } = args
        const symbols = (rawSymbols || args.symbol || '').split(',').map(s => s.trim()).filter(Boolean)
        
        if (symbols.length === 0) return JSON.stringify({ error: 'Symbols required' })

        const histories = await Promise.all(symbols.map(s => getHistoricalData(s, range as any)))
        
        // Find the one with most dates to act as base timeline
        const primaryHistIndex = histories.reduce((bestIdx, h, i) => h.dates.length > histories[bestIdx].dates.length ? i : bestIdx, 0)
        const primaryHist = histories[primaryHistIndex]

        if (!primaryHist.dates || primaryHist.dates.length === 0) {
          return JSON.stringify({ 
            symbols, range, error: 'No historical data available for these symbols and range.' 
          })
        }

        const isMulti = symbols.length > 1

        const chartDataPoints = primaryHist.dates.map((date, i) => {
          const point: Record<string, any> = { date }
          symbols.forEach((sym, sIdx) => {
            const h = histories[sIdx]
            // Align dates (simplified alignment assuming same trading days)
            const dIdx = h.dates.indexOf(date)
            // If Single stock, include OHLCV for candlesticks
            if (!isMulti) {
              point.open = h.opens[dIdx] ?? null
              point.high = h.highs[dIdx] ?? null
              point.low = h.lows[dIdx] ?? null
              point.close = h.closes[dIdx] ?? null
              point.volume = h.volumes[dIdx] ?? null
            } else {
              // If multiple, just use Close price
              point[sym.toUpperCase()] = h.closes[dIdx] ?? null
            }
          })
          return point
        }).slice(-60) // last 60 points

        const series = isMulti 
          ? symbols.map((sym, i) => ({
              key: sym.toUpperCase(),
              label: humanizeSymbol(sym),
              color: ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
            }))
          : [
              { key: 'close', label: 'Close Price', color: '#10b981' },
              { key: 'open', label: 'Open Price', color: '#6366f1' },
            ]

        const inferredChartType = isMulti ? 'line' : (chartType === 'candlestick' ? 'candlestick' : (chartType as any) ?? 'line')

        const chartData: ChartData = {
          chartType: inferredChartType,
          title: `${symbols.map(humanizeSymbol).join(' vs ')} Price History (${range})`,
          description: `Historical data for ${symbols.map(humanizeSymbol).join(', ')}`,
          data: chartDataPoints,
          xKey: 'date',
          series,
          colors: ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'],
        }

        return JSON.stringify({
          symbols,
          range,
          dataPoints: primaryHist.dates.length,
          chart: chartData,
        })
      }

      case 'get_portfolio_analysis': {
        const { analysisType = 'full' } = args
        let portfolio = MOCK_PORTFOLIO
        try {
          const supabase = getSupabaseServiceClient()
          const { data } = await supabase
            .from('portfolio_holdings')
            .select('*')
            .eq('clerk_user_id', userId)
          if (data && data.length > 0) portfolio = data
        } catch { /* use mock */ }

        // Enrich with live prices
        const quotes = await getMultipleQuotes(portfolio.map((h: any) => h.symbol))
        const quoteMap = Object.fromEntries(quotes.map(q => [q.symbol, q]))
        const enriched = portfolio.map((h: any) => {
          const q = quoteMap[h.symbol]
          const currentPrice = q?.price ?? h.avgPrice
          const value = currentPrice * h.quantity
          const totalReturn = ((currentPrice - h.avgPrice) / h.avgPrice) * 100
          return { ...h, currentPrice, value, totalReturn: Number(totalReturn.toFixed(2)), sector: h.sector ?? q?.sector ?? 'Other' }
        })

        const totalValue = enriched.reduce((s: number, h: any) => s + h.value, 0)

        // Sector aggregation
        const sectors = enriched.reduce((acc: Record<string, number>, h: any) => {
          acc[h.sector] = (acc[h.sector] ?? 0) + h.value
          return acc
        }, {})
        const sectorData = Object.entries(sectors).map(([name, value]) => ({
          name,
          value: Number(((value / totalValue) * 100).toFixed(1)),
          absoluteValue: Number(value.toFixed(0)),
        }))

        let chart: ChartData

        if (analysisType === 'allocation' || analysisType === 'full') {
          chart = {
            chartType: 'pie',
            title: 'Portfolio Sector Allocation',
            description: 'Distribution of your holdings across sectors',
            data: sectorData,
            colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
          }
        } else if (analysisType === 'performance') {
          chart = {
            chartType: 'bar',
            title: 'Portfolio Holdings Performance',
            description: 'Total return % for each holding',
            data: enriched.map((h: any) => ({
              name: h.symbol,
              return: h.totalReturn,
              value: Number(h.value.toFixed(0)),
            })).sort((a: any, b: any) => b.return - a.return),
            xKey: 'name',
            series: [{ key: 'return', label: 'Total Return %', color: '#10b981' }],
          }
        } else {
          chart = {
            chartType: 'bar',
            title: 'Sector Allocation',
            data: sectorData,
            xKey: 'name',
            series: [{ key: 'value', label: 'Allocation %', color: '#6366f1' }],
          }
        }

        return JSON.stringify({
          analysis: {
            totalValue: Number(totalValue.toFixed(0)),
            holdingsCount: enriched.length,
            sectors: sectorData,
            topGainer: [...enriched].sort((a: any, b: any) => b.totalReturn - a.totalReturn)[0],
            topLoser: [...enriched].sort((a: any, b: any) => a.totalReturn - b.totalReturn)[0],
            avgReturn: Number((enriched.reduce((s: number, h: any) => s + h.totalReturn, 0) / enriched.length).toFixed(2)),
            holdings: enriched,
          },
          chart,
        })
      }

      case 'compare_stocks': {
        const symbols = (args.symbols ?? '').split(',').map(s => s.trim()).filter(Boolean)
        if (symbols.length < 2) return JSON.stringify({ error: 'Need at least 2 symbols to compare' })

        const quotes = await getMultipleQuotes(symbols)

        const metric = args.metric ?? 'change_pct'
        const metricLabel: Record<string, string> = {
          price: 'Current Price (₹)',
          change_pct: 'Day Change (%)',
          week52: '52-Week High (₹)',
          marketcap: 'Market Cap',
        }
        const metricKey: Record<string, keyof StockQuote> = {
          price: 'price',
          change_pct: 'changePct',
          week52: 'week52High',
          marketcap: 'marketCap',
        }

        const data = quotes.map(q => ({
          name: q.symbol,
          value: q[metricKey[metric]] as number,
          price: q.price,
          change: q.changePct,
        }))

        const chart: ChartData = {
          chartType: 'bar',
          title: `${symbols.join(' vs ')} — ${metricLabel[metric]}`,
          description: `Side-by-side comparison of ${metricLabel[metric]}`,
          data,
          xKey: 'name',
          series: [{ key: 'value', label: metricLabel[metric], color: '#6366f1' }],
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        }

        return JSON.stringify({ quotes, chart })
      }

      case 'get_market_overview': {
        const [indices, movers] = await Promise.all([
          getIndexData(),
          getMarketMovers(),
        ])

        const marketChart: ChartData = {
          chartType: 'bar',
          title: 'Top Movers Today — NSE',
          description: 'Biggest gainers and losers by % change today',
          data: [
            ...movers.gainers.map(q => ({ name: q.symbol, change: q.changePct, type: 'gainer' })),
            ...movers.losers.map(q => ({ name: q.symbol, change: q.changePct, type: 'loser' })),
          ],
          xKey: 'name',
          series: [{ key: 'change', label: 'Day Change %', color: '#10b981' }],
          colors: ['#10b981'],
        }

        return JSON.stringify({
          indices: {
            nifty: { value: indices.nifty.price, change: indices.nifty.changePct },
            sensex: { value: indices.sensex.price, change: indices.sensex.changePct },
          },
          gainers: movers.gainers,
          losers: movers.losers,
          sentiment: movers.gainers.length > movers.losers.length ? 'bullish' : 'bearish',
          chart: marketChart,
        })
      }

      case 'get_recent_signals': {
        const { symbol } = args
        if (!symbol) return JSON.stringify({ error: 'Symbol required' })

        let dbSignals: any[] = []
        try {
          const supabase = getSupabaseServiceClient()
          const { data } = await supabase
            .from('market_signals')
            .select('summary, signal_type, signal_strength, published_at')
            .eq('symbol', symbol.toUpperCase())
            .order('published_at', { ascending: false })
            .limit(5)
          dbSignals = data ?? []
        } catch { /* continue */ }

        // Also fetch fresh NSE data
        const [announcements, bulkDeals] = await Promise.all([
          fetchNSEAnnouncements(),
          fetchBulkDeals(),
        ])

        const relevant = [
          ...announcements.filter(a => a.symbol.toUpperCase().includes(symbol.toUpperCase())).slice(0, 3),
          ...bulkDeals.filter(d => d.symbol.toUpperCase().includes(symbol.toUpperCase())).slice(0, 2),
        ]

        return JSON.stringify({
          symbol,
          dbSignals,
          freshSignals: relevant,
          summary: `Found ${dbSignals.length} historical signals and ${relevant.length} fresh market events for ${symbol}`,
        })
      }

      case 'search_financial_news': {
        const { query } = args
        if (!query) return JSON.stringify({ error: 'Query required' })

        // Use DuckDuckGo instant answers (free, no API key)
        try {
          const q = encodeURIComponent(`${query} site:economictimes.com OR site:livemint.com OR site:moneycontrol.com`)
          const res = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' India NSE stock market')}&format=json&no_redirect=1&no_html=1`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
          )
          const data = await res.json()
          const topics = (data.RelatedTopics ?? [])
            .filter((t: any) => t.Text)
            .slice(0, 6)
            .map((t: any) => ({ text: t.Text, url: t.FirstURL }))

          const abstract = data.Abstract ? { text: data.Abstract, source: data.AbstractSource } : null

          return JSON.stringify({
            query,
            abstract,
            relatedTopics: topics,
            searchNote: 'Results from DuckDuckGo instant search. For live news, check Economic Times or Moneycontrol.',
          })
        } catch {
          return JSON.stringify({
            query,
            error: 'News search temporarily unavailable',
            suggestion: `Check https://economictimes.indiatimes.com/markets for latest news on "${query}"`,
          })
        }
      }

      case 'web_search': {
        const { query } = args
        if (!query) return JSON.stringify({ error: 'Query required' })

        try {
          const res = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
          )
          const data = await res.json()
          const topics = (data.RelatedTopics ?? [])
            .filter((t: any) => t.Text)
            .slice(0, 8)
            .map((t: any) => ({ text: t.Text, url: t.FirstURL }))

          const abstract = data.Abstract ? { text: data.Abstract, source: data.AbstractSource, url: data.AbstractURL } : null

          return JSON.stringify({
            query,
            abstract,
            relatedTopics: topics,
            source: 'DuckDuckGo Web Search',
          })
        } catch {
          return JSON.stringify({ error: 'Web search temporarily unavailable' })
        }
      }

      case 'calculate_tax': {
        const { symbol } = args
        let portfolio = MOCK_PORTFOLIO
        try {
          const supabase = getSupabaseServiceClient()
          const { data } = await supabase
            .from('portfolio_holdings')
            .select('*')
            .eq('clerk_user_id', userId)
          if (data && data.length > 0) portfolio = data
        } catch { /* use mock */ }

        const holding = portfolio.find((h: any) => h.symbol.toUpperCase() === symbol.toUpperCase()) as any
        if (!holding) return JSON.stringify({ error: `${symbol} not found in your portfolio` })

        const quote = await getStockQuote(symbol)
        const currentPrice = quote.price || holding.avgPrice
        const gain = (currentPrice - holding.avgPrice) * holding.quantity
        const gainPct = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100

        // Indian tax rules FY25
        // LTCG (held >1 year): 12.5% above ₹1.25 lakh exemption
        // STCG (held <1 year): 20%
        const isLTCG = true // Assume LT for now (would need purchase date)
        const exemptionLimit = 125000
        const taxableAmount = Math.max(0, gain - exemptionLimit)
        const taxLiability = isLTCG
          ? taxableAmount * 0.125
          : gain * 0.20

        const chart: ChartData = {
          chartType: 'bar',
          title: `Tax Analysis — ${symbol}`,
          description: 'Capital gains breakdown for tax calculation',
          data: [
            { name: 'Purchase Value', value: holding.avgPrice * holding.quantity },
            { name: 'Current Value', value: currentPrice * holding.quantity },
            { name: 'Capital Gain', value: gain },
            { name: 'Tax Liability', value: taxLiability },
          ],
          xKey: 'name',
          series: [{ key: 'value', label: 'Amount (₹)', color: '#6366f1' }],
        }

        return JSON.stringify({
          symbol,
          holding: {
            quantity: holding.quantity,
            avgBuyPrice: holding.avgPrice,
            currentPrice,
            holdingValue: currentPrice * holding.quantity,
          },
          taxCalculation: {
            capitalGain: Number(gain.toFixed(0)),
            gainPercent: Number(gainPct.toFixed(2)),
            taxType: isLTCG ? 'LTCG (Long-Term Capital Gains)' : 'STCG (Short-Term Capital Gains)',
            taxRate: isLTCG ? '12.5% above ₹1.25L exemption' : '20%',
            exemptionApplied: isLTCG ? Math.min(gain, exemptionLimit) : 0,
            estimatedTax: Number(taxLiability.toFixed(0)),
          },
          chart,
        })
      }

      case 'sector_analysis': {
        const { sector = 'all' } = args

        // Sector-wise representative stocks
        const SECTORS: Record<string, string[]> = {
          IT: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
          Banking: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
          Pharma: ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'BIOCON.NS'],
          Energy: ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'BPCL.NS'],
          Auto: ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS'],
          FMCG: ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'DABUR.NS', 'BRITANNIA.NS'],
          Telecom: ['BHARTIARTL.NS', 'IDEA.NS'],
          Metals: ['TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'VEDL.NS', 'SAIL.NS'],
        }

        const targetSectors = sector === 'all'
          ? Object.keys(SECTORS)
          : [Object.keys(SECTORS).find(s => s.toLowerCase().includes(sector.toLowerCase())) ?? sector]

        const sectorResults: Record<string, any> = {}

        for (const sec of targetSectors.slice(0, 4)) {
          const symbols = SECTORS[sec]?.slice(0, 3) ?? []
          if (symbols.length === 0) continue
          const quotes = await getMultipleQuotes(symbols)
          const avgChange = quotes.reduce((s, q) => s + q.changePct, 0) / quotes.length
          sectorResults[sec] = {
            stocks: quotes,
            avgChange: Number(avgChange.toFixed(2)),
            sentiment: avgChange > 0.5 ? 'bullish' : avgChange < -0.5 ? 'bearish' : 'neutral',
          }
        }

        const chartData = Object.entries(sectorResults).map(([name, d]: [string, any]) => ({
          name,
          change: d.avgChange,
          sentiment: d.sentiment,
        }))

        const chart: ChartData = {
          chartType: 'bar',
          title: sector === 'all' ? 'Sector Performance Today' : `${sector} Sector Analysis`,
          description: 'Average price change % across key sector stocks',
          data: chartData.sort((a, b) => b.change - a.change),
          xKey: 'name',
          series: [{ key: 'change', label: 'Avg Change %', color: '#6366f1' }],
          colors: ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'],
        }

        return JSON.stringify({ sectors: sectorResults, chart })
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err) {
    console.error(`Tool ${name} error:`, err)
    return JSON.stringify({ error: `Tool execution failed: ${String(err)}` })
  }
}
