import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - fetch user's watchlist 
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('market_watchlist')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

// POST - add to watchlist
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { symbol, company_name, sector, notes } = await req.json()
  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('market_watchlist')
    .upsert({
      clerk_user_id: userId,
      symbol: symbol.toUpperCase(),
      company_name: company_name || symbol,
      sector: sector || 'Unknown',
      notes: notes || null,
    }, { onConflict: 'clerk_user_id,symbol' })
    .select()
    .single()

  if (error) {
    console.error('Watchlist POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE - remove from watchlist
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { symbol } = await req.json()
  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 })

  const supabase = getSupabase()
  const { error } = await supabase
    .from('market_watchlist')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('symbol', symbol.toUpperCase())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PATCH - update notes or custom label
export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { symbol, notes, custom_label } = await req.json()

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('market_watchlist')
    .update({ notes, custom_label, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .eq('symbol', symbol.toUpperCase())
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
