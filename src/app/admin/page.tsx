import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import AdminTable from '@/components/AdminTable'
import type { JerseySignup } from '@/lib/supabase'

export const revalidate = 0

async function getSignups(): Promise<JerseySignup[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase
    .from('jersey_signups')
    .select('*')
    .order('jersey_number', { ascending: true })

  if (error) {
    console.error('Failed to load signups:', error.message)
    return []
  }
  return data ?? []
}

export default async function AdminPage() {
  const signups = await getSignups()

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Roster</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {signups.length} jerseys claimed
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors mt-1"
          >
            ← Back to Grid
          </Link>
        </div>

        <AdminTable signups={signups} />
      </div>
    </main>
  )
}
