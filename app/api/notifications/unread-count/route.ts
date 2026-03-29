import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ count: 0 })

  const supabase = await createServerClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .eq('is_read', false)

  if (error) return NextResponse.json({ count: 0 })
  return NextResponse.json({ count: count || 0 }, { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } })
}
