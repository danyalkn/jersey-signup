import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { id } = body
  if (typeof id !== 'string' || id.length === 0) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // FK from lineup_slots.player_id has ON DELETE SET NULL; lineup_subs.{bench,starter}_player_id
  // have ON DELETE CASCADE. So deleting a signup automatically tidies up lineup state.
  const { error } = await supabase.from('jersey_signups').delete().eq('id', id)

  if (error) {
    console.error('[/api/signups/delete] Supabase error:', error.message)
    return NextResponse.json(
      { error: 'Failed to delete. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { id } })
}
