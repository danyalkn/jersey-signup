import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

const ALLOWED_SIZES = new Set(['S', 'M', 'L', 'XL'])

export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { id, player_name, jersey_number, email, size } = body

  if (typeof id !== 'string' || id.length === 0) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
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
  if (typeof jersey_number !== 'number' || !Number.isInteger(jersey_number)) {
    return NextResponse.json({ error: 'jersey_number must be an integer.' }, { status: 400 })
  }
  if (jersey_number < 1 || jersey_number > 999) {
    return NextResponse.json(
      { error: 'Jersey number must be between 1 and 999.' },
      { status: 400 }
    )
  }
  // Email is optional on edit so that legacy rows without an email (or with a
  // non-format-conforming value) can still have their name/number/size edited.
  // If a value is provided, we only enforce the length cap.
  if (email !== null && email !== undefined && typeof email !== 'string') {
    return NextResponse.json({ error: 'email must be a string.' }, { status: 400 })
  }
  const normalizedEmail =
    typeof email === 'string' && email.trim().length > 0
      ? email.trim().toLowerCase()
      : null
  if (normalizedEmail !== null && normalizedEmail.length > 255) {
    return NextResponse.json(
      { error: 'Email must be 255 characters or fewer.' },
      { status: 400 }
    )
  }
  if (typeof size !== 'string' || !ALLOWED_SIZES.has(size)) {
    return NextResponse.json(
      { error: 'Size must be one of: S, M, L, XL.' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('jersey_signups')
    .update({
      player_name: player_name.trim(),
      jersey_number,
      email: normalizedEmail,
      size,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'That jersey number is already taken!' },
        { status: 409 }
      )
    }
    console.error('[/api/edit] Supabase error:', error.message)
    return NextResponse.json(
      { error: 'Failed to update. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
