import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'

/** GET /api/profile — fetch the current user's profile from Supabase */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found — not an error for us
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data ?? null)
}

/** PATCH /api/profile — update preferred_language or other mutable fields */
export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowedFields = ['preferred_language', 'primary_goal', 'monthly_investment_capacity']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('clerk_user_id', userId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
