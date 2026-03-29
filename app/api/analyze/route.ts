// POST /api/analyze — AI portfolio X-Ray using OpenAI with web search
import { NextRequest, NextResponse } from "next/server"
import { aiChat } from "@/lib/openai"

export async function POST(req: NextRequest) {
  try {
    const { holdings, persona, risk, goals } = await req.json()
    if (!holdings?.length) return NextResponse.json({ error: "No holdings" }, { status: 400 })

    const total = holdings.reduce((s: number, h: any) => s + h.livePrice * h.qty, 0)
    const invested = holdings.reduce((s: number, h: any) => s + h.avgPrice * h.qty, 0)
    const overallRet = ((total - invested) / invested * 100).toFixed(1)

    const rows = holdings.map((h: any) => {
      const val = h.livePrice * h.qty
      const ret = ((h.livePrice - h.avgPrice) / h.avgPrice * 100).toFixed(1)
      const alloc = (val / total * 100).toFixed(1)
      return `• ${h.display}: ${h.qty} sh | ₹${h.livePrice?.toFixed(0)} | P&L: ${ret}% | Alloc: ${alloc}% | Sector: ${h.sector}`
    }).join("\n")

    const sectorMap: Record<string, number> = {}
    holdings.forEach((h: any) => { sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + h.livePrice * h.qty })
    const sectors = Object.entries(sectorMap).map(([s, v]) => `${s}: ${(v / total * 100).toFixed(0)}%`).join(", ")

    const prompt = `Portfolio X-Ray for an Indian investor.
Profile: ${persona ?? "active_trader"}, ${risk ?? "moderate"} risk, goals: ${(goals ?? []).join(", ") || "wealth creation"}
Total Value: ₹${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })} | Invested: ₹${invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })} | Overall Return: ${overallRet}%
Sectors: ${sectors}
Holdings:
${rows}

Give a portfolio X-Ray with these sections using **Header** format:
**Health Score**: X/100 — one line reason
**Strengths**: 2-3 bullets  
**Risk Flags**: 2-3 specific risks (name the stocks)
**Rebalancing Actions**: specific buy/trim/hold with reasoning
**Tax Opportunity**: Loss harvesting before March 31 (STCG/LTCG)
**This Week's Priority**: single most important action
Be specific. Reference the actual stock names.`

    const analysis = await aiChat([{ role: "user", content: prompt }], true)
    return NextResponse.json({ analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
