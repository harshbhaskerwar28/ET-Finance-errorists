import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ assessment: null })

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('money_health_assessments')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return NextResponse.json({ assessment: null })
  return NextResponse.json({ assessment: data })
}
