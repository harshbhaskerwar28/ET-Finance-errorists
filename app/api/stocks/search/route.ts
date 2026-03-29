import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote } from '@/lib/market-data/nse-client'

// Common NSE stocks for search suggestions
const NSE_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Auto' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries', sector: 'Pharma' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Auto' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', sector: 'Energy' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India', sector: 'Power' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Auto' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Conglomerate' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone', sector: 'Infrastructure' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd', sector: 'Energy' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Auto' },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd", sector: 'Pharma' },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma' },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd", sector: 'Pharma' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', sector: 'Healthcare' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Financial Services' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Auto' },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive (India) Ltd', sector: 'FMCG' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd', sector: 'Chemicals' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Cement' },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', sector: 'Financial Services' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd', sector: 'FMCG' },
  { symbol: 'HDFC', name: 'Housing Development Finance Corporation', sector: 'Financial Services' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', sector: 'Technology' },
  { symbol: 'PAYTM', name: 'One 97 Communications (Paytm)', sector: 'Technology' },
  { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures (Nykaa)', sector: 'Technology' },
  { symbol: 'DMART', name: 'Avenue Supermarts (DMart)', sector: 'Retail' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  const q = query.toUpperCase()
  const matched = NSE_STOCKS.filter(s =>
    s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  ).slice(0, 8)

  // Fetch live prices for top 3 results
  if (matched.length > 0 && query.length >= 3) {
    try {
      const top3 = matched.slice(0, 3)
      const quotes = await Promise.allSettled(
        top3.map(s => getStockQuote(s.symbol + '.NS'))
      )
      const result = matched.map((s, i) => {
        const quote = i < 3 && quotes[i]?.status === 'fulfilled'
          ? (quotes[i] as any).value
          : null
        return {
          ...s,
          price: quote?.price || null,
          change_pct: quote?.changePct || null,
          change: quote?.change || null,
        }
      })
      return NextResponse.json({ results: result })
    } catch {}
  }

  return NextResponse.json({ results: matched })
}
