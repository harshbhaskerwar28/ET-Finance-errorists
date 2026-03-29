import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function calculateFIREPlan(inputs: any) {
  const {
    current_age, target_retirement_age, monthly_income,
    monthly_expenses, current_investments, risk_profile = 'moderate'
  } = inputs

  const yearsToRetirement = target_retirement_age - current_age
  const monthsToRetirement = yearsToRetirement * 12
  const target_corpus = monthly_expenses * 12 * 25 // 4% SWR rule

  // Annual return rates by risk profile
  const returnRates: Record<string, number> = {
    aggressive: 0.14,
    moderate: 0.11,
    conservative: 0.08
  }
  const r = returnRates[risk_profile] || 0.11
  const monthlyRate = r / 12

  // SIP required = FV of goal - FV of existing corpus
  // FV of existing = current_investments * (1+r)^years
  const fvExisting = current_investments * Math.pow(1 + r, yearsToRetirement)
  const remaining = Math.max(0, target_corpus - fvExisting)

  // Monthly SIP needed: PV = PMT * [(1-(1+r)^-n) / r]  →  PMT = PV * r / (1-(1+r)^-n)
  // For FV formula: FV = PMT * [(1+r)^n - 1] / r
  const monthly_sip_required = monthsToRetirement > 0
    ? remaining * monthlyRate / (Math.pow(1 + monthlyRate, monthsToRetirement) - 1)
    : 0

  // Yearly milestones
  const yearly_milestones: any[] = []
  let corpus = current_investments
  for (let year = 1; year <= yearsToRetirement; year++) {
    corpus = corpus * (1 + r) + monthly_sip_required * 12
    const milestone_year = new Date().getFullYear() + year
    yearly_milestones.push({
      year: milestone_year,
      age: current_age + year,
      corpus: Math.round(corpus),
    })
  }

  // Find projected FIRE age
  let projected_fire_age = target_retirement_age
  let testCorpus = current_investments
  for (let yr = 0; yr <= 40; yr++) {
    if (testCorpus >= target_corpus) {
      projected_fire_age = current_age + yr
      break
    }
    testCorpus = testCorpus * (1 + r) + monthly_sip_required * 12
  }

  const allocation_plans: Record<string, any> = {
    aggressive: { nifty50: 50, elss: 30, nps: 15, ppf: 5 },
    moderate: { elss: 25, nifty50: 35, nps: 25, ppf: 15 },
    conservative: { balanced_fund: 20, nps: 20, ppf: 40, liquid_fund: 20 }
  }

  return {
    monthly_sip_required: Math.round(monthly_sip_required),
    target_corpus: Math.round(target_corpus),
    projected_fire_age,
    corpus_at_retirement: Math.round(yearly_milestones[yearly_milestones.length - 1]?.corpus || 0),
    allocation_plan: allocation_plans[risk_profile] || allocation_plans.moderate,
    yearly_milestones,
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const plan = calculateFIREPlan(body)

  const { current_age, monthly_income, monthly_expenses, target_retirement_age } = body

  // Generate narrative
  let ai_narrative = ''
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Generate a 100-word personalized FIRE plan narrative for an Indian investor:
Age: ${current_age}, Target retirement: ${target_retirement_age}
Monthly income: ₹${(monthly_income || 0).toLocaleString('en-IN')}, Expenses: ₹${(monthly_expenses || 0).toLocaleString('en-IN')}
SIP needed: ₹${plan.monthly_sip_required.toLocaleString('en-IN')}/month
Target corpus: ₹${(plan.target_corpus / 10000000).toFixed(2)} Crore
Projected FIRE age: ${plan.projected_fire_age}

Be specific, encouraging, and mention Indian investment products (ELSS, NPS, Nifty 50). Max 100 words.`
      }],
      max_tokens: 150,
    })
    ai_narrative = completion.choices[0]?.message?.content || ''
  } catch {}

  const fullPlan = { ...body, ...plan, ai_narrative }

  try {
    const supabase = await createServerClient()
    await supabase.from('fire_plans').upsert({
      clerk_user_id: userId,
      ...fullPlan,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'clerk_user_id' })
  } catch (e) {
    console.error('FIRE Plan Save Error:', e)
  }

  return NextResponse.json(fullPlan)
}
