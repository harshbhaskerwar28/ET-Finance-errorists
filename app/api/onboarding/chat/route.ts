import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'

const SYSTEM_PROMPT = `You are a warm, friendly financial onboarding assistant for Indian retail investors.

Your job: have a natural 5 to 7 message conversation to understand the user's investment profile.
Extract these fields: experience_level, primary_goal, monthly_investment_capacity (in INR),
risk_score (1-10), has_existing_portfolio (boolean), goal_horizon_years, persona, first_name.

Persona options: curious_beginner, active_trader, sip_investor, hni, retiree, nri.

Rules:
- Ask exactly ONE question per message. Never list multiple questions.
- Use Indian financial context — mention SIPs, FDs, Sensex, PPF, ELSS, not S&P 500 or 401k.
- Keep each message under 2 sentences.
- Be warm, never robotic. Use the user's first name after they give it.
- After 5 to 7 exchanges, output this exact format at the END of your final message (after a newline):
  <PROFILE>{"experience_level":"beginner","primary_goal":"retirement","monthly_capacity":5000,"risk_score":6,"has_portfolio":false,"goal_horizon":20,"persona":"sip_investor","first_name":"Rahul"}</PROFILE>
- If user mentions distress, job loss, or divorce — acknowledge warmly before continuing.
- Start by asking their first name.`

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const { messages } = await request.json()
    const supabase = await createServerClient()

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages,
      onFinish: async ({ text }) => {
        const profileMatch = text.match(/<PROFILE>(.*?)<\/PROFILE>/s)

        if (profileMatch) {
          try {
            const profile = JSON.parse(profileMatch[1])
            await supabase.from('user_profiles').upsert(
              {
                clerk_user_id: userId,
                first_name: profile.first_name,
                persona: profile.persona,
                risk_score: profile.risk_score,
                primary_goal: profile.primary_goal,
                monthly_investment_capacity: profile.monthly_capacity,
                has_existing_portfolio: profile.has_portfolio,
                goal_horizon_years: profile.goal_horizon,
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'clerk_user_id' }
            )
          } catch (e) {
            console.error('Failed to save profile:', e)
          }
        }

        // Always save conversation progress
        await supabase.from('onboarding_conversations').upsert(
          {
            clerk_user_id: userId,
            messages,
            completed: !!profileMatch,
          },
          { onConflict: 'clerk_user_id' }
        )
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error?.toString() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
