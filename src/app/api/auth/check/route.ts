import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) return authError
  return NextResponse.json({ ok: true })
}
