import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { FORMATIONS } from '@/lib/formations'
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

  const { name, formation } = body

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Lineup name is required.' }, { status: 400 })
  }
  if (name.trim().length > 100) {
    return NextResponse.json(
      { error: 'Lineup name must be 100 characters or fewer.' },
      { status: 400 }
    )
  }
  if (typeof formation !== 'string' || !(formation in FORMATIONS)) {
    return NextResponse.json(
      { error: 'Unknown formation.' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: lineup, error: lineupError } = await supabase
    .from('lineups')
    .insert({ name: name.trim(), formation })
    .select()
    .single()

  if (lineupError || !lineup) {
    console.error('[/api/lineups/create] insert lineup:', lineupError?.message)
    return NextResponse.json(
      { error: 'Failed to create lineup. Please try again.' },
      { status: 500 }
    )
  }

  const starters = FORMATIONS[formation].map((spec, idx) => ({
    lineup_id: lineup.id,
    slot_index: idx,
    position_code: spec.position_code,
    player_id: null,
  }))
  const bench = Array.from({ length: 5 }, (_, i) => ({
    lineup_id: lineup.id,
    slot_index: 11 + i,
    position_code: null,
    player_id: null,
  }))

  const { error: slotsError } = await supabase
    .from('lineup_slots')
    .insert([...starters, ...bench])

  if (slotsError) {
    // Roll back the lineup so we don't leave a slot-less lineup behind.
    await supabase.from('lineups').delete().eq('id', lineup.id)
    console.error('[/api/lineups/create] insert slots:', slotsError.message)
    return NextResponse.json(
      { error: 'Failed to initialize lineup slots. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: lineup }, { status: 201 })
}
