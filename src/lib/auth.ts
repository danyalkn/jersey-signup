import { NextRequest, NextResponse } from 'next/server'

// Shared password gate for admin-only mutations. Set ADMIN_PASSWORD in the
// environment; if it's unset, all gated routes refuse (fail closed).
export function requireAdmin(request: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || expected.length === 0) {
    return NextResponse.json(
      { error: 'Admin is not configured on the server.' },
      { status: 503 }
    )
  }
  const provided = request.headers.get('x-admin-password') ?? ''
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  return null
}
