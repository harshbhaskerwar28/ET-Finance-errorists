import { getMultipleQuotes } from '@/lib/market-data/nse-client'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbolsParam = searchParams.get('symbols')
  if (!symbolsParam) return NextResponse.json([])

  const symbols = symbolsParam.split(',').filter(Boolean).map(s => {
    const trimmed = s.trim().toUpperCase()
    if (trimmed.startsWith('^') || trimmed.includes('.')) return trimmed
    return `${trimmed}.NS`
  })

  if (symbols.length === 0) return NextResponse.json([])

  try {
    const quotes = await getMultipleQuotes(symbols)
    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}
