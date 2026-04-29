import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_SIZES = new Set(['S', 'M', 'L', 'XL'])
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { id, jersey_number, email, size } = body

  if (typeof id !== 'string' || id.length === 0) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
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
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (email.trim().length > 255) {
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
    .update({ jersey_number, email: email.trim().toLowerCase(), size })
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
