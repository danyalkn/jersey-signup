import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
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

const SIZE_COLORS: Record<string, string> = {
  S:  'bg-blue-100 text-blue-700',
  M:  'bg-green-100 text-green-700',
  L:  'bg-yellow-100 text-yellow-700',
  XL: 'bg-orange-100 text-orange-700',
}

export default async function AdminPage() {
  const signups = await getSignups()

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
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

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {signups.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="font-medium">No jerseys claimed yet</p>
              <p className="text-sm mt-1">Be the first!</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left w-16">#</th>
                  <th className="px-5 py-3 text-left">Player</th>
                  <th className="px-5 py-3 text-left w-20">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {signups.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-800 font-black text-base">
                        {s.jersey_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {s.player_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                          SIZE_COLORS[s.size] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.size}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
