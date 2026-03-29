import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import yahooFinance from "yahoo-finance2"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { holdings, persona, riskProfile, goals } = body

    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json({ error: "No holdings provided." }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Build structured portfolio data
    const totalValue = holdings.reduce((s: number, h: any) => s + (h.livePrice * h.quantity), 0)
    const totalInvested = holdings.reduce((s: number, h: any) => s + (h.avgPrice * h.quantity), 0)
    const totalPnL = totalValue - totalInvested
    const totalReturnPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

    const holdingLines = holdings.map((h: any) => {
      const currVal = h.livePrice * h.quantity
      const inv = h.avgPrice * h.quantity
      const pnlPct = inv > 0 ? ((currVal - inv) / inv) * 100 : 0
      const alloc = totalValue > 0 ? (currVal / totalValue) * 100 : 0
      return `- ${h.displaySymbol} (${h.name}): ${h.quantity} sh | AvgCost ₹${h.avgPrice} | LTP ₹${h.livePrice?.toFixed(2)} | Return: ${pnlPct.toFixed(1)}% | Alloc: ${alloc.toFixed(1)}%`
    }).join("\n")

    const sectorMap: Record<string, number> = {}
    holdings.forEach((h: any) => {
      sectorMap[h.sector ?? "Other"] = (sectorMap[h.sector ?? "Other"] ?? 0) + h.livePrice * h.quantity
    })
    const sectorStr = Object.entries(sectorMap)
      .sort((a, b) => b[1] - a[1])
      .map(([s, v]) => `${s}: ${((v / totalValue) * 100).toFixed(1)}%`)
      .join(" | ")

    const prompt = `Analyze this Indian investor's live stock portfolio and give a comprehensive Portfolio X-Ray report.

INVESTOR PROFILE:
- Persona: ${persona ?? "Not specified"}
- Risk Profile: ${riskProfile ?? "Not specified"}
- Goals: ${goals?.join(", ") ?? "Wealth Creation"}

LIVE PORTFOLIO SNAPSHOT:
Total Value: ₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })} | Total Invested: ₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })} | Overall Return: ${totalReturnPct.toFixed(1)}%

Holdings:
${holdingLines}

Sector Allocation: ${sectorStr}

Provide your analysis in exactly these sections (use **Section Name** headers):

**Portfolio Health Score**: X/100 — brief reason (1 line)

**Key Strengths**: 2-3 bullet points on what's working

**Risk Flags**: 2-3 specific risks (concentration, volatility, underperformers)

**Rebalancing Plan**: Specific buy/trim/hold recommendations with reasoning

**Tax-Harvesting Opportunity**: Any stocks with losses that can be booked for tax savings before March 31

**One Action This Week**: The single highest-priority move right now

Be specific — use the actual stock names and mention real sector/market context. Keep it actionable.`

    // Use web_search so OpenAI can look up current market context for these specific stocks
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      tools: [{ type: "web_search_preview" }],
    })

    return NextResponse.json({ analysis: response.output_text })

  } catch (error: any) {
    console.error("Portfolio analysis error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
