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

  const { lineup_id, bench_player_id, starter_player_id } = body

  if (typeof lineup_id !== 'string' || lineup_id.length === 0) {
    return NextResponse.json({ error: 'lineup_id is required.' }, { status: 400 })
  }
  if (typeof bench_player_id !== 'string' || bench_player_id.length === 0) {
    return NextResponse.json(
      { error: 'bench_player_id is required.' },
      { status: 400 }
    )
  }
  if (typeof starter_player_id !== 'string' || starter_player_id.length === 0) {
    return NextResponse.json(
      { error: 'starter_player_id is required.' },
      { status: 400 }
    )
  }
  if (bench_player_id === starter_player_id) {
    return NextResponse.json(
      { error: 'Bench and starter players must differ.' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('lineup_subs')
    .insert({ lineup_id, bench_player_id, starter_player_id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'That sub link already exists.' },
        { status: 409 }
      )
    }
    // Trigger raises a generic exception (no specific code) when the players
    // aren't in matching bench/starter slots of the lineup.
    console.error('[/api/lineups/add-sub-link] insert:', error.message)
    return NextResponse.json(
      { error: 'Failed to add sub link. Both players must be in the lineup.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ data }, { status: 201 })
}
