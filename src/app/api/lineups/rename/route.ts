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

  const { lineup_id, name } = body
  if (typeof lineup_id !== 'string' || lineup_id.length === 0) {
    return NextResponse.json({ error: 'lineup_id is required.' }, { status: 400 })
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 })
  }
  if (name.trim().length > 100) {
    return NextResponse.json(
      { error: 'name must be 100 characters or fewer.' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('lineups')
    .update({ name: name.trim() })
    .eq('id', lineup_id)
    .select()
    .single()

  if (error) {
    console.error('[/api/lineups/rename] Supabase error:', error.message)
    return NextResponse.json(
      { error: 'Failed to rename. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
