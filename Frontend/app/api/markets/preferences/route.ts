import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - fetch user's market preferences
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('market_preferences')
    .select('key, value')
    .eq('clerk_user_id', userId)

  if (error) {
    console.error('Preferences GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// POST - add or update user's market preference
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('market_preferences')
    .upsert({
      clerk_user_id: userId,
      key: key,
      value: value,
    }, { onConflict: 'clerk_user_id,key' })
    .select()
    .single()

  if (error) {
    console.error('Preferences POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
