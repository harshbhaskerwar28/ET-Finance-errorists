import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  if (!query || query.length < 1) return NextResponse.json([])

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=25&newsCount=0&listsCount=0&enableFuzzyQuery=true&enableCb=false&enableNavLinks=false`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return NextResponse.json([])
    const data = await res.json()

    // Map all results globally without restricting to NSE
    const results = (data?.quotes ?? [])
      .map((q: any) => ({
        symbol: q.symbol, // Use exact symbol so we can fetch it properly
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchange,
        sector: q.sector || 'Unknown',
        type: q.quoteType,
      }))


    return NextResponse.json(results)
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json([])
  }
}
