import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'

export default function Journal() {
  const { participant } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participant) return
    supabase.from('reflections').select('*, sessions(title, session_number, session_date, session_laws(laws(name, journal_prompt)))')
      .eq('participant_id', participant.id)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => { setEntries(data || []); setLoading(false) })
  }, [participant])

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Leadership Journal</h1>
        <p className="text-gray-500 text-sm mb-6">{entries.length} reflection{entries.length !== 1 ? 's' : ''} submitted</p>

        {entries.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p className="text-4xl mb-3">📝</p>
            <p>No reflections yet. Complete your first session reflection to start your journal.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => {
              const session = entry.sessions
              const laws = session?.session_laws?.map(sl => sl.laws?.name).filter(Boolean).join(' · ')
              return (
                <div key={entry.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Session {session?.session_number}: {session?.title}</h3>
                      {laws && <p className="text-xs text-gray-500 mt-0.5">{laws}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(entry.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'What I Learned', value: entry.what_i_learned },
                      { label: 'Leadership Insight', value: entry.leadership_insight },
                      { label: 'Action Before Next Session', value: entry.action_before_next },
                      { label: 'Expected Result', value: entry.expected_result },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-xs font-semibold text-[#0F52BA] uppercase tracking-wide mb-1">{item.label}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{item.value}</p>
                      </div>
                    ))}
                    {entry.journal_prompt_response && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Journal Prompt Response</p>
                        <p className="text-sm text-gray-700 italic leading-relaxed">{entry.journal_prompt_response}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
