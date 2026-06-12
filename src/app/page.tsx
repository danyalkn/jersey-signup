import { createClient } from '@supabase/supabase-js'
import PublicRoster from '@/components/PublicRoster'
import TopNav from '@/components/TopNav'
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

export default async function HomePage() {
  const signups = await getSignups()

  return (
    <main className="min-h-screen bg-gradient-to-b from-praxis-black via-praxis-navy to-praxis-deep pb-10 px-4">
      <TopNav />
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="font-display italic uppercase text-4xl text-white tracking-wide">
            Roster
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Current jersey assignments</p>
        </div>

        <div className="bg-praxis-panel rounded-2xl border border-praxis-line p-5 sm:p-6 shadow-[0_0_60px_-15px_rgba(37,99,235,0.25)]">
          <PublicRoster initialSignups={signups} />
        </div>
      </div>
    </main>
  )
}
