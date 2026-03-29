// Market Data Client — NSE + Yahoo Finance (free, no API key)

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
}

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePct: number
  open?: number
  high?: number
  low?: number
  volume?: number
  marketCap?: number
  pe?: number
  eps?: number
  week52High?: number
  week52Low?: number
  name?: string
  sector?: string
  currency?: string
}

export interface HistoricalData {
  dates: string[]
  opens: number[]
  highs: number[]
  lows: number[]
  closes: number[]
  volumes: number[]
}

export interface NSEAnnouncement {
  symbol: string
  desc: string
  an_dt: string
  attchmntFile?: string
  companyName?: string
}

export interface BulkDeal {
  symbol: string
  clientName: string
  buySell: 'BUY' | 'SELL'
  quantity: number
  tradePrice: number
  date?: string
}

function getYahooSymbol(sym: string): string {
  const s = sym.toUpperCase().replace(/\s+/g, '')
  // If it's an index (^), has a suffix (.), or special symbol (=), return as is
  if (s.startsWith('^') || s.includes('.') || s.includes('=')) return s
  // Default to National Stock Exchange (.NS) for Indian stocks
  return `${s}.NS`
}

// Fetch real-time stock quote from Yahoo Finance with retries
export async function getStockQuote(symbol: string, retries = 3): Promise<StockQuote> {
  const nsSymbol = getYahooSymbol(symbol)
  let lastError: any = null
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(nsSymbol)}?interval=1d&range=5d`,
        { 
          headers: YF_HEADERS, 
          next: { revalidate: i === 0 ? 60 : 0 }, 
          signal: AbortSignal.timeout(6000)
        }
      )
      
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 100)}`)
      }

      const data = await res.json()
      const result = data?.chart?.result?.[0]
      if (!result) throw new Error('No chart data found for ' + nsSymbol)
      
      const meta = result?.meta
      const indicators = result?.indicators?.quote?.[0] || {}
      
      const closes = (indicators?.close ?? []).filter((v: any) => v !== null && v !== undefined)
      const lastCloseIndicator = closes[closes.length - 1]
      
      const price = meta?.regularMarketPrice 
                 ?? lastCloseIndicator 
                 ?? meta?.chartPreviousClose 
                 ?? meta?.previousClose
      
      if (price === undefined || price === null) {
        throw new Error(`Price not found for ${nsSymbol}`)
      }

      const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? closes[closes.length - 2]
      const change = price - (prevClose || price)
      const changePct = prevClose ? (change / prevClose) * 100 : 0

      return {
        symbol: symbol.toUpperCase(),
        name: meta?.longName ?? meta?.shortName ?? symbol,
        price: Number(Number(price).toFixed(2)),
        change: Number(Number(change).toFixed(2)),
        changePct: Number(Number(changePct).toFixed(2)),
        open: meta?.regularMarketOpen,
        high: meta?.regularMarketDayHigh,
        low: meta?.regularMarketDayLow,
        volume: meta?.regularMarketVolume,
        marketCap: meta?.marketCap,
        week52High: meta?.fiftyTwoWeekHigh,
        week52Low: meta?.fiftyTwoWeekLow,
        currency: meta?.currency ?? 'INR',
        sector: meta?.sector,
      }
    } catch (e: any) {
      lastError = e
      console.warn(`[StockQuote] Retry ${i+1}/${retries} for ${nsSymbol}: ${e.message}`)
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 600 * (i + 1)))
      }
    }
  }

  console.error(`[StockQuote] CRITICAL: Failed to fetch ${symbol} (${nsSymbol}):`, lastError?.message)
  return {
    symbol: symbol.toUpperCase(),
    price: 0,
    change: 0,
    changePct: 0,
    name: symbol,
  }
}

// Fetch multiple quotes in parallel
export async function getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
  const results = await Promise.allSettled(symbols.map(s => getStockQuote(s)))
  return results
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
    .map(r => r.value)
}

// Fetch historical OHLCV data from Yahoo Finance
export async function getHistoricalData(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '3mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
): Promise<HistoricalData> {
  const nsSymbol = getYahooSymbol(symbol)
  
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${nsSymbol}?interval=${interval}&range=${range}`,
      { headers: YF_HEADERS, next: { revalidate: 300 } }
    )
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    const timestamps: number[] = result?.timestamp ?? []
    const quotes = result?.indicators?.quote?.[0] ?? {}
    
    const dates = timestamps.map(t => new Date(t * 1000).toISOString().split('T')[0])
    
    return {
      dates,
      opens: quotes.open?.map((v: number) => Number(v?.toFixed(2))) ?? [],
      highs: quotes.high?.map((v: number) => Number(v?.toFixed(2))) ?? [],
      lows: quotes.low?.map((v: number) => Number(v?.toFixed(2))) ?? [],
      closes: quotes.close?.map((v: number) => Number(v?.toFixed(2))) ?? [],
      volumes: quotes.volume ?? [],
    }
  } catch (e) {
    return { dates: [], opens: [], highs: [], lows: [], closes: [], volumes: [] }
  }
}

// Fetch NSE Announcements (requires session cookie)
const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com',
}

async function getNSECookie(): Promise<string> {
  try {
    const res = await fetch('https://www.nseindia.com', { 
      headers: NSE_HEADERS,
      signal: AbortSignal.timeout(5000)
    })
    return res.headers.get('set-cookie')?.split(';')[0] ?? ''
  } catch {
    return ''
  }
}

export async function fetchNSEAnnouncements(): Promise<NSEAnnouncement[]> {
  try {
    const cookie = await getNSECookie()
    if (!cookie) return []
    
    const res = await fetch(
      'https://www.nseindia.com/api/corporate-announcements?index=equities',
      { 
        headers: { ...NSE_HEADERS, Cookie: cookie },
        signal: AbortSignal.timeout(8000)
      }
    )
    const data = await res.json()
    return (data?.data ?? []).slice(0, 20) as NSEAnnouncement[]
  } catch {
    return []
  }
}

export async function fetchBulkDeals(): Promise<BulkDeal[]> {
  try {
    const cookie = await getNSECookie()
    if (!cookie) return []
    
    const res = await fetch(
      'https://www.nseindia.com/api/bulk-deals',
      { 
        headers: { ...NSE_HEADERS, Cookie: cookie },
        signal: AbortSignal.timeout(8000)
      }
    )
    const data = await res.json()
    return ((data?.data ?? []).slice(0, 20)) as BulkDeal[]
  } catch {
    return []
  }
}

// Fetch top gaining/losing stocks from Yahoo Finance screener
export async function getMarketMovers(): Promise<{ gainers: StockQuote[]; losers: StockQuote[] }> {
  // Using a set of major Nifty 50 stocks
  const NIFTY50 = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS',
    'ITC.NS', 'SBIN.NS', 'BAJFINANCE.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'LT.NS', 'AXISBANK.NS',
    'MARUTI.NS', 'TITAN.NS', 'NTPC.NS', 'WIPRO.NS', 'HCLTECH.NS', 'SUNPHARMA.NS', 'TATAMOTORS.NS',
    'TATASTEEL.NS', 'TECHM.NS', 'ONGC.NS', 'POWERGRID.NS', 'ULTRACEMCO.NS']
  
  try {
    const quotes = await getMultipleQuotes(NIFTY50.slice(0, 10))
    const sorted = quotes.sort((a, b) => b.changePct - a.changePct)
    return {
      gainers: sorted.filter(q => q.changePct > 0).slice(0, 5),
      losers: sorted.filter(q => q.changePct < 0).slice(0, 5),
    }
  } catch {
    return { gainers: [], losers: [] }
  }
}

// Get Nifty/Sensex index data
export async function getIndexData(): Promise<{ nifty: StockQuote; sensex: StockQuote }> {
  const [nifty, sensex] = await Promise.all([
    getStockQuote('^NSEI'),
    getStockQuote('^BSESN'),
  ])
  return {
    nifty: { ...nifty, symbol: 'NIFTY 50' },
    sensex: { ...sensex, symbol: 'SENSEX' },
  }
}
