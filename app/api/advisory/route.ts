import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import yahooFinance from "yahoo-finance2"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, portfolio, persona, riskProfile, goals, chatHistory } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured in .env.local" }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Build portfolio context
    let portfolioContext = ""
    if (portfolio && portfolio.length > 0) {
      const totalValue = portfolio.reduce((s: number, h: any) => s + (h.livePrice * h.quantity), 0)
      portfolioContext = `\n\nUser's Live Portfolio (Total ₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}):\n` +
        portfolio.map((h: any) => {
          const ret = ((h.livePrice - h.avgPrice) / h.avgPrice * 100).toFixed(1)
          return `- ${h.symbol}: ${h.quantity} sh | Avg ₹${h.avgPrice} | LTP ₹${h.livePrice?.toFixed(2)} | Return: ${ret}%`
        }).join("\n")
    }

    const systemPrompt = `You are the ET AI Investment Intelligence Platform's Financial Co-Pilot — India's best AI financial advisor.

Investor Profile:
- Persona: ${persona ?? "Active Trader"}
- Risk Profile: ${riskProfile ?? "Moderate"}  
- Goals: ${goals?.join(", ") ?? "Wealth Creation"}
${portfolioContext}

Your rules:
- Be direct, specific, and actionable. No vague answers.
- Use Indian market context: NSE/BSE, SEBI rules, Indian tax law (STCG 15%, LTCG 10%, 80C, 80D, 80CCD), RBI policies.
- When discussing stocks, cite real fundamentals: P/E ratio relative to sector, EPS growth, debt/equity, promoter holding.
- Format clearly: use **bold** for key figures/metrics, bullet points for lists.
- If the user's portfolio is provided and they ask about it, reference their actual holdings by name.
- Keep answers concise — max 3-4 short paragraphs or 6-7 bullet points.`

    // Build messages array for multi-turn
    const messages: any[] = [{ role: "system", content: systemPrompt }]

    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory.slice(-8)) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }
    messages.push({ role: "user", content: prompt })

    // Use web_search for market-related queries
    const isMarketQuery = /stock|market|nifty|sensex|nse|bse|share price|sector|ipo|results|quarterly|earnings|rbi|inflation|fii|dii|mutual fund/i.test(prompt)

    const completionOptions: any = {
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 800,
    }

    if (isMarketQuery) {
      // Use Responses API with web_search for real-time market data in queries
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: messages,
        tools: [{ type: "web_search_preview" }],
      })
      return NextResponse.json({ reply: response.output_text ?? "No response generated." })
    } else {
      // Standard chat for non-market queries (FIRE planning, tax, etc.)
      const completion = await openai.chat.completions.create(completionOptions)
      return NextResponse.json({ reply: completion.choices[0]?.message?.content ?? "No response generated." })
    }

  } catch (error: any) {
    console.error("Advisory API error:", error)
    return NextResponse.json({ error: error.message ?? "Failed to get AI response" }, { status: 500 })
  }
}
