import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

// Set a player into a slot. Cleans up any now-invalid sub links involving
// the slot's previous occupant (they're no longer in any slot of this lineup).
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { slot_id, player_id } = body
  if (typeof slot_id !== 'string' || slot_id.length === 0) {
    return NextResponse.json({ error: 'slot_id is required.' }, { status: 400 })
  }
  if (typeof player_id !== 'string' || player_id.length === 0) {
    return NextResponse.json({ error: 'player_id is required.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: existing, error: readError } = await supabase
    .from('lineup_slots')
    .select('id, lineup_id, slot_index, position_code, player_id')
    .eq('id', slot_id)
    .single()

  if (readError || !existing) {
    return NextResponse.json({ error: 'Slot not found.' }, { status: 404 })
  }

  if (existing.player_id === player_id) {
    return NextResponse.json({ data: existing })
  }

  const { data: updated, error: updateError } = await supabase
    .from('lineup_slots')
    .update({ player_id })
    .eq('id', slot_id)
    .select()
    .single()

  if (updateError) {
    // Partial unique index on (lineup_id, player_id) violation.
    if (updateError.code === '23505') {
      return NextResponse.json(
        { error: 'That player is already in this lineup.' },
        { status: 409 }
      )
    }
    console.error('[/api/lineups/assign-player] update slot:', updateError.message)
    return NextResponse.json(
      { error: 'Failed to assign player. Please try again.' },
      { status: 500 }
    )
  }

  // If we replaced a previous player, any sub link referencing them in this
  // lineup is now stale — they're no longer in any slot.
  if (existing.player_id) {
    const { error: cleanupError } = await supabase
      .from('lineup_subs')
      .delete()
      .eq('lineup_id', existing.lineup_id)
      .or(
        `bench_player_id.eq.${existing.player_id},starter_player_id.eq.${existing.player_id}`
      )

    if (cleanupError) {
      console.error(
        '[/api/lineups/assign-player] sub cleanup:',
        cleanupError.message
      )
    }
  }

  return NextResponse.json({ data: updated })
}
