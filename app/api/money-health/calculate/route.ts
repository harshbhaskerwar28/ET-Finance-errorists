import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function calculateScores(data: any) {
  const {
    monthly_income, monthly_expenses, liquid_savings,
    life_cover_amount, health_cover_amount, total_emi,
    tax_investments_80c, uses_nps, retirement_savings, age, retirement_age = 60
  } = data

  const score_emergency = Math.min(10, (liquid_savings / (monthly_expenses * 6)) * 10)
  const score_insurance_life = Math.min(10, (life_cover_amount / (monthly_income * 12 * 10)) * 10)
  const score_insurance_health = Math.min(10, (health_cover_amount / 1_000_000) * 10)
  const score_insurance = (score_insurance_life + score_insurance_health) / 2
  const score_debt = Math.max(0, 10 - (total_emi / monthly_income * 25))
  const score_tax = Math.min(10, (tax_investments_80c / 150_000) * 7 + (uses_nps ? 3 : 0))
  const target_corpus = monthly_expenses * 12 * 25
  const score_retirement = Math.min(10, (retirement_savings / target_corpus) * 10)

  const overall = (score_emergency + score_insurance + score_debt + score_tax + score_retirement) / 5
  let grade = 'D'
  if (overall >= 8) grade = 'A'
  else if (overall >= 6) grade = 'B'
  else if (overall >= 4) grade = 'C'

  return {
    score_emergency: Math.round(score_emergency * 10) / 10,
    score_insurance: Math.round(score_insurance * 10) / 10,
    score_diversification: 7.0, // static placeholder, needs portfolio data
    score_debt: Math.round(score_debt * 10) / 10,
    score_tax: Math.round(score_tax * 10) / 10,
    score_retirement: Math.round(score_retirement * 10) / 10,
    overall_score: Math.round(overall * 10) / 10,
    grade,
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const scores = calculateScores(body)

  // Generate AI-powered action items
  const actionPrompt = `You are a certified financial planner for Indian investors. Based on these financial health scores (out of 10), provide the top 2 most impactful action items. Be very specific with rupee amounts.

Scores:
- Emergency Fund: ${scores.score_emergency}/10 (${body.liquid_savings ? Math.round(body.liquid_savings / body.monthly_expenses) : 0} months of expenses covered, target is 6)
- Insurance: ${scores.score_insurance}/10 (Life cover: ₹${(body.life_cover_amount || 0).toLocaleString('en-IN')}, Health: ₹${(body.health_cover_amount || 0).toLocaleString('en-IN')})
- Debt: ${scores.score_debt}/10 (EMI is ${body.monthly_income > 0 ? Math.round(body.total_emi / body.monthly_income * 100) : 0}% of income)
- Tax Efficiency: ${scores.score_tax}/10 (80C used: ₹${(body.tax_investments_80c || 0).toLocaleString('en-IN')} of ₹1.5L limit)
- Retirement: ${scores.score_retirement}/10

User context: Monthly income ₹${(body.monthly_income || 0).toLocaleString('en-IN')}, Age: ${body.age || 'unknown'}

Return JSON: { "actions": [{ "action": "...", "priority": "high/medium", "estimated_impact": "₹X/year or specific outcome", "how_to": "..." }, ...] }`

  let top_actions: any[] = []
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: actionPrompt }],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    })
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}')
    top_actions = parsed.actions || []
  } catch {}

  try {
    const supabase = await createServerClient()
    await supabase.from('money_health_assessments').upsert({
      clerk_user_id: userId,
      ...body,
      ...scores,
      top_actions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'clerk_user_id' })
  } catch {}

  return NextResponse.json({ ...scores, top_actions })
}
