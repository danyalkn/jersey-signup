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

  const { lineup_id } = body
  if (typeof lineup_id !== 'string' || lineup_id.length === 0) {
    return NextResponse.json({ error: 'lineup_id is required.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ON DELETE CASCADE on lineup_slots and lineup_subs handles the rest.
  const { error } = await supabase
    .from('lineups')
    .delete()
    .eq('id', lineup_id)

  if (error) {
    console.error('[/api/lineups/delete] Supabase error:', error.message)
    return NextResponse.json(
      { error: 'Failed to delete lineup. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { lineup_id } })
}
