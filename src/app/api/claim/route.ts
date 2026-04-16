import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_SIZES = new Set(['S', 'M', 'L', 'XL'])

export async function POST(request: NextRequest) {
  // Parse body safely
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { jersey_number, player_name, size } = body

  // --- Input validation ---
  if (typeof jersey_number !== 'number' || !Number.isInteger(jersey_number)) {
    return NextResponse.json({ error: 'jersey_number must be an integer.' }, { status: 400 })
  }
  if (jersey_number < 1 || jersey_number > 999) {
    return NextResponse.json(
      { error: 'Jersey number must be between 1 and 999.' },
      { status: 400 }
    )
  }
  if (typeof player_name !== 'string' || player_name.trim().length === 0) {
    return NextResponse.json({ error: 'Player name is required.' }, { status: 400 })
  }
  if (player_name.trim().length > 100) {
    return NextResponse.json(
      { error: 'Player name must be 100 characters or fewer.' },
      { status: 400 }
    )
  }
  if (typeof size !== 'string' || !ALLOWED_SIZES.has(size)) {
    return NextResponse.json(
      { error: 'Size must be one of: S, M, L, XL.' },
      { status: 400 }
    )
  }

  // --- Database insert ---
  // Use the service-role key if available (bypasses RLS on server); falls back
  // to anon key which is fine because our RLS allows public inserts.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('jersey_signups')
    .insert({
      jersey_number,
      player_name: player_name.trim(),
      size,
    })
    .select()
    .single()

  if (error) {
    // Postgres unique-constraint violation code
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'That jersey number was just taken! Please choose another.' },
        { status: 409 }
      )
    }
    console.error('[/api/claim] Supabase error:', error.message)
    return NextResponse.json(
      { error: 'Failed to claim jersey. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data }, { status: 201 })
}
