import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

// Remove the player from a slot. Cleans up any sub links involving that
// player in this lineup (they're no longer in any slot).
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { slot_id } = body
  if (typeof slot_id !== 'string' || slot_id.length === 0) {
    return NextResponse.json({ error: 'slot_id is required.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: existing, error: readError } = await supabase
    .from('lineup_slots')
    .select('id, lineup_id, player_id')
    .eq('id', slot_id)
    .single()

  if (readError || !existing) {
    return NextResponse.json({ error: 'Slot not found.' }, { status: 404 })
  }

  if (existing.player_id === null) {
    return NextResponse.json({ data: existing })
  }

  const previousPlayerId = existing.player_id

  const { data: updated, error: updateError } = await supabase
    .from('lineup_slots')
    .update({ player_id: null })
    .eq('id', slot_id)
    .select()
    .single()

  if (updateError) {
    console.error('[/api/lineups/clear-slot] update slot:', updateError.message)
    return NextResponse.json(
      { error: 'Failed to clear slot. Please try again.' },
      { status: 500 }
    )
  }

  const { error: cleanupError } = await supabase
    .from('lineup_subs')
    .delete()
    .eq('lineup_id', existing.lineup_id)
    .or(
      `bench_player_id.eq.${previousPlayerId},starter_player_id.eq.${previousPlayerId}`
    )

  if (cleanupError) {
    console.error('[/api/lineups/clear-slot] sub cleanup:', cleanupError.message)
  }

  return NextResponse.json({ data: updated })
}
