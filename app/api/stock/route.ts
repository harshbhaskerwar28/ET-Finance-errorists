import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Missing query param ?q=" }, { status: 400 })
  }

  try {
    // Support raw tickers (e.g. "RELIANCE" → try "RELIANCE.NS")
    const ticker = query.includes(".") ? query : `${query.toUpperCase()}.NS`

    const quote = await yahooFinance.quote(ticker, {
      fields: [
        'regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent',
        'shortName', 'longName', 'symbol', 'marketCap', 'trailingPE',
        'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'regularMarketVolume',
        'regularMarketDayHigh', 'regularMarketDayLow', 'currency'
      ]
    })

    return NextResponse.json({
      symbol: ticker,
      displaySymbol: query.toUpperCase(),
      name: quote.shortName ?? quote.longName ?? ticker,
      price: quote.regularMarketPrice ?? 0,
      change: quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      volume: quote.regularMarketVolume ?? 0,
      marketCap: quote.marketCap ?? null,
      pe: quote.trailingPE ?? null,
      high52w: quote.fiftyTwoWeekHigh ?? null,
      low52w: quote.fiftyTwoWeekLow ?? null,
      dayHigh: quote.regularMarketDayHigh ?? null,
      dayLow: quote.regularMarketDayLow ?? null,
      currency: quote.currency ?? "INR",
    })
  } catch (error: any) {
    return NextResponse.json({ error: `Cannot find ticker: ${query}. Try appending .NS for NSE, .BO for BSE.` }, { status: 404 })
  }
}
