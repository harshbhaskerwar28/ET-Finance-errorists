// POST /api/chat  — AI advisor with web search for market queries
import { NextRequest, NextResponse } from "next/server"
import { aiChat } from "@/lib/openai"

export async function POST(req: NextRequest) {
  try {
    const { message, history, persona, risk, goals, portfolio } = await req.json()
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 })

    // Build portfolio context if holdings exist
    let portfolioCtx = ""
    if (portfolio?.length > 0) {
      const total = portfolio.reduce((s: number, h: any) => s + h.livePrice * h.qty, 0)
      portfolioCtx = `\nUser's portfolio (₹${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })} total):\n` +
        portfolio.map((h: any) => {
          const ret = ((h.livePrice - h.avgPrice) / h.avgPrice * 100).toFixed(1)
          return `• ${h.display}: ${h.qty} shares @ avg ₹${h.avgPrice}, LTP ₹${h.livePrice?.toFixed(2)} (${ret >= '0' ? '+' : ''}${ret}%)`
        }).join("\n")
    }

    const system = `You are ET AI, an expert Indian stock market financial advisor.
Investor: Persona=${persona ?? "active_trader"}, Risk=${risk ?? "moderate"}, Goals=${(goals ?? []).join(", ") || "wealth creation"}
${portfolioCtx}
Rules: Be specific and concise. Use Indian market context (NSE/BSE, SEBI, Indian tax law). Use **bold** for key numbers. Bullet points for lists. Max 300 words.`

    // Determine if query needs live web data
    const needsWeb = /stock|market|nifty|sensex|price|sector|ipo|rbi|inflation|fii|earnings|results|today|latest|current/i.test(message)

    const messages: any[] = [
      { role: "system", content: system },
      ...(history ?? []).slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ]

    const reply = await aiChat(messages, needsWeb)
    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
