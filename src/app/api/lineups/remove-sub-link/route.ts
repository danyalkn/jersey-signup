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

  const { sub_id } = body
  if (typeof sub_id !== 'string' || sub_id.length === 0) {
    return NextResponse.json({ error: 'sub_id is required.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('lineup_subs')
    .delete()
    .eq('id', sub_id)

  if (error) {
    console.error('[/api/lineups/remove-sub-link] Supabase error:', error.message)
    return NextResponse.json(
      { error: 'Failed to remove sub link. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { sub_id } })
}
