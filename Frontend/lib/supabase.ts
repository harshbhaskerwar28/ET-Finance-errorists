import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/** Server-side Supabase client — attaches the current Clerk user-id as a
 *  header so Supabase RLS policies can read it via
 *  current_setting('request.headers')::json->>'x-user-id'
 */
export async function createServerClient() {
  const { userId } = await auth()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: { 'x-user-id': userId ?? '' },
      },
    }
  )
}

/** Public (anon) client — safe to use in Server Components that don't need
 *  per-user row-level security.
 */
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
