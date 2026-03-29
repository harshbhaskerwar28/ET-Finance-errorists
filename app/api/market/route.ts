// GET /api/market?type=indices|news|quote&q=RELIANCE
import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"
import { aiChat } from "@/lib/openai"

const INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "SENSEX" },
  { symbol: "^NSEBANK", name: "BANK NIFTY" },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? "indices"
  const q = searchParams.get("q") ?? ""

  // 1. LIVE INDICES
  if (type === "indices") {
    const data = await Promise.all(
      INDICES.map(async ({ symbol, name }) => {
        try {
          const r: any = await yahooFinance.quote(symbol, {
            fields: ["regularMarketPrice", "regularMarketChange", "regularMarketChangePercent"],
          })
          if (!r.regularMarketPrice) throw new Error("Yahoo Zero")
          return { name, price: r.regularMarketPrice, change: r.regularMarketChange ?? 0, pct: r.regularMarketChangePercent ?? 0 }
        } catch {
          try {
            const aiRaw = await aiChat([{ role: "user", content: `Find the current live value of index ${name} (${symbol}) in Indian market today. Return JSON: {"price": number, "change": number, "pct": number}` }], true)
            const clean = aiRaw.replace(/```json|```/g, "").trim()
            const parsed = JSON.parse(clean)
            return { name, price: parsed.price, change: parsed.change, pct: parsed.pct }
          } catch {
            return { name, price: 0, change: 0, pct: 0 }
          }
        }
      })
    )
    return NextResponse.json({ indices: data })
  }

  // 2. SINGLE STOCK QUOTE WITH COMPANY-TO-TICKER SEARCH
  if (type === "quote" && q) {
    try {
      let finalTicker = q.toUpperCase()
      
      const resolveTicker = async (name: string) => {
        const res = await aiChat([{ role: "user", content: `Find the correct NSE ticker symbol for "${name}". Return ONLY the uppercase ticker symbol (e.g. RELIANCE, TCS, HDFCBANK). If not sure, return the best guess.` }], true)
        return res.trim().toUpperCase().replace(/\.NS$/, "")
      }

      const isSimpleTicker = /^[A-Z\-&]{2,10}$/.test(finalTicker)
      if (!isSimpleTicker || finalTicker.length > 10 || finalTicker.includes(" ")) {
        finalTicker = await resolveTicker(q)
      }

      const tickerWithNS = finalTicker.includes(".") ? finalTicker : `${finalTicker}.NS`
      let d: any = {}

      try {
        const r: any = await yahooFinance.quote(tickerWithNS, {
          fields: ["regularMarketPrice", "regularMarketChange", "regularMarketChangePercent", "shortName", "longName", "trailingPE", "marketCap", "fiftyTwoWeekHigh", "fiftyTwoWeekLow"],
        })
        if (!r.regularMarketPrice) throw new Error("Yahoo Zero")
        d = {
          symbol: tickerWithNS,
          display: finalTicker,
          name: r.shortName ?? r.longName ?? finalTicker,
          price: r.regularMarketPrice,
          change: r.regularMarketChange ?? 0,
          pct: r.regularMarketChangePercent ?? 0,
          pe: r.trailingPE ?? null,
          marketCap: r.marketCap ?? null,
          high52w: r.fiftyTwoWeekHigh ?? null,
          low52w: r.fiftyTwoWeekLow ?? null,
        }
      } catch (yahooErr) {
        const aiRaw = await aiChat([{ 
          role: "user", 
          content: `Search for the current live stock price and daily change for ${q} (or its NSE ticker ${finalTicker}) today. Return JSON only: {"price": number, "change": number, "pct": number, "name": string, "pe": number|null, "mcap": number|null, "ticker": string}` 
        }], true)
        const clean = aiRaw.replace(/```json|```/g, "").trim()
        const p = JSON.parse(clean)
        d = {
          symbol: (p.ticker ?? finalTicker) + ".NS", 
          display: p.ticker ?? finalTicker, 
          name: p.name ?? q,
          price: p.price, change: p.change, pct: p.pct,
          pe: p.pe, marketCap: p.mcap, high52w: null, low52w: null
        }
      }
      return NextResponse.json(d)
    } catch (e: any) {
      return NextResponse.json({ error: `Market data unavailable for ${q}` }, { status: 500 })
    }
  }

  if (type === "news") {
    try {
      const raw = await aiChat([{
        role: "user",
        content: `Search for the 6 most important Indian stock market news stories from today. Return JSON array only: [{"title":"...","summary":"...","publisher":"...","category":"...","sentiment":"...","stocks":["..."]}]`
      }], true)
      const clean = raw.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "")
      let news = []
      try { news = JSON.parse(clean) } catch { news = [] }
      return NextResponse.json({ news })
    } catch (e: any) {
      return NextResponse.json({ news: [] })
    }
  }

  return NextResponse.json({ error: "Unknown type" })
}
