import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

function calculateFIREPlan(inputs: any) {
  const { current_age, target_retirement_age, monthly_income, monthly_expenses, current_investments, risk_profile = 'moderate' } = inputs
  const yearsToRetirement = target_retirement_age - current_age
  const monthsToRetirement = yearsToRetirement * 12
  const target_corpus = monthly_expenses * 12 * 25
  const returnRates: Record<string, number> = { aggressive: 0.14, moderate: 0.11, conservative: 0.08 }
  const r = returnRates[risk_profile] || 0.11
  const monthlyRate = r / 12
  const fvExisting = current_investments * Math.pow(1 + r, yearsToRetirement)
  const remaining = Math.max(0, target_corpus - fvExisting)
  const monthly_sip_required = monthsToRetirement > 0
    ? remaining * monthlyRate / (Math.pow(1 + monthlyRate, monthsToRetirement) - 1)
    : 0
  let projected_fire_age = target_retirement_age
  let testCorpus = current_investments
  for (let yr = 0; yr <= 40; yr++) {
    if (testCorpus >= target_corpus) { projected_fire_age = current_age + yr; break }
    testCorpus = testCorpus * (1 + r) + monthly_sip_required * 12
  }
  const yearly_milestones: any[] = []
  let corpus = current_investments
  for (let year = 1; year <= yearsToRetirement; year++) {
    corpus = corpus * (1 + r) + monthly_sip_required * 12
    yearly_milestones.push({ year: new Date().getFullYear() + year, age: current_age + year, corpus: Math.round(corpus) })
  }
  return {
    monthly_sip_required: Math.round(monthly_sip_required),
    target_corpus: Math.round(target_corpus),
    projected_fire_age,
    corpus_at_retirement: Math.round(corpus),
    yearly_milestones,
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const plan = calculateFIREPlan(body)
  return NextResponse.json(plan)
}
