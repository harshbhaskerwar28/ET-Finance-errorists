import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('market_preferences')
      .select('preferences')
      .eq('clerk_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Preferences] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data?.preferences || null })
  } catch (err: any) {
    console.error('[Preferences] Critical GET error:', err)
    return NextResponse.json({ error: 'Internal Server Error', detail: err.message }, { status: 500 })
  }
}

// POST - add or update user's market preference (handles entire or partial)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = await createServerClient()
  
  // Fetch existing preferences
  const { data: current } = await supabase
    .from('market_preferences')
    .select('preferences')
    .eq('clerk_user_id', userId)
    .single()

  let updatedPrefs = {}
  if (body.key && body.value !== undefined) {
    // Legacy support for single-key updates from old MarketsView
    updatedPrefs = { ...(current?.preferences || {}), [body.key]: body.value }
  } else {
    // New pattern: send the full/partial preferences object
    updatedPrefs = { ...(current?.preferences || {}), ...body }
  }

  const { data, error } = await supabase
    .from('market_preferences')
    .upsert({
      clerk_user_id: userId,
      preferences: updatedPrefs,
      updated_at: new Date().toISOString()
    }, { onConflict: 'clerk_user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
