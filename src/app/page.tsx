import { createClient } from '@supabase/supabase-js'
import JerseyGrid from '@/components/JerseyGrid'
import type { JerseySignup } from '@/lib/supabase'

// Always fetch fresh on each request — real-time keeps the client updated after that
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

export default async function HomePage() {
  const signups = await getSignups()

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Praxis FC Jersey Signup</h1>
          <p className="text-gray-500 mt-1 text-sm">Tap a green number to claim your jersey</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <JerseyGrid initialSignups={signups} />
        </div>

      </div>
    </main>
  )
}
