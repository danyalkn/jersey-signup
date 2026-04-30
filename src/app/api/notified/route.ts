import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { id, notified } = body

  if (typeof id !== 'string' || id.length === 0) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  }
  if (typeof notified !== 'boolean') {
    return NextResponse.json({ error: 'notified must be a boolean.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('jersey_signups')
    .update({ notified })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[/api/notified] Supabase error:', error.message)
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
