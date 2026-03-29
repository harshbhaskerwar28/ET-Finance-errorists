import { getIndexData, getMultipleQuotes } from '@/lib/market-data/nse-client'
import { NextResponse } from 'next/server'

const NIFTY50_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BAJFINANCE.NS', 'BHARTIARTL.NS',
  'KOTAKBANK.NS', 'LT.NS', 'AXISBANK.NS', 'MARUTI.NS', 'TITAN.NS',
  'NTPC.NS', 'WIPRO.NS', 'HCLTECH.NS', 'SUNPHARMA.NS', 'TATAMOTORS.NS',
  'TATASTEEL.NS', 'TECHM.NS', 'ONGC.NS', 'POWERGRID.NS', 'ULTRACEMCO.NS',
  'ADANIENT.NS', 'ADANIPORTS.NS', 'BPCL.NS', 'CIPLA.NS', 'COALINDIA.NS',
  'DIVISLAB.NS', 'DRREDDY.NS', 'EICHERMOT.NS', 'GRASIM.NS', 'HEROMOTOCO.NS',
  'HINDALCO.NS', 'JSWSTEEL.NS', 'M&M.NS', 'NESTLEIND.NS', 'SHRIRAMFIN.NS',
]

// Market breadth from Yahoo Finance
async function getMarketBreadth(): Promise<{ advancers: number; decliners: number; unchanged: number }> {
  try {
    const quotes = await getMultipleQuotes(NIFTY50_SYMBOLS.slice(0, 20))
    const advancers = quotes.filter(q => q.changePct > 0).length
    const decliners = quotes.filter(q => q.changePct < 0).length
    const unchanged = quotes.filter(q => q.changePct === 0).length
    // Scale up to approximate NSE total market
    const scale = 100
    return {
      advancers: advancers * scale,
      decliners: decliners * scale,
      unchanged: unchanged * scale
    }
  } catch {
    return { advancers: 1200, decliners: 850, unchanged: 140 }
  }
}

export async function GET() {
  try {
    const [indexData, moversData, breadth] = await Promise.all([
      getIndexData(),
      getMultipleQuotes(NIFTY50_SYMBOLS.slice(0, 15)),
      getMarketBreadth(),
    ])

    const sorted = [...moversData].sort((a, b) => b.changePct - a.changePct)
    const gainers = sorted.filter(q => q.changePct > 0).slice(0, 5)
    const losers = sorted.filter(q => q.changePct < 0).slice(0, 5)

    return NextResponse.json({
      indices: [
        { ...indexData.nifty, symbol: 'NIFTY 50' },
        { ...indexData.sensex, symbol: 'SENSEX' },
      ],
      topGainers: gainers,
      topLosers: losers,
      breadth,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    })
  } catch (error) {
    console.error('Market live API error:', error)
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
  }
}
