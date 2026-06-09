import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NavBar from '../../components/NavBar'
import { Calendar, User, MessageSquare } from 'lucide-react'

export default function ParticipantMentorship() {
  const { participant } = useAuth()
  const [mentor, setMentor] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participant) return
    load()
  }, [participant])

  async function load() {
    const queries = [
      supabase.from('mentorship_sessions')
        .select('id, session_date, topics, notes')
        .eq('participant_id', participant.id)
        .order('session_date', { ascending: false }),
    ]
    if (participant.mentor_id) {
      queries.push(
        supabase.from('facilitators').select('id, name').eq('id', participant.mentor_id).single()
      )
    }

    const results = await Promise.all(queries)
    setSessions(results[0].data || [])
    setMentor(results[1]?.data || null)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mentorship</h1>

        {/* Mentor card */}
        <div className={`rounded-2xl p-6 mb-6 ${mentor ? 'bg-[#0A3480] text-white' : 'bg-gray-100'}`}>
          {mentor ? (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <User size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide mb-1">Your EXCO Mentor</p>
                <p className="text-xl font-bold">{mentor.name}</p>
                <p className="text-blue-200 text-sm mt-1">Monthly 1-on-1 coaching sessions · Leadership shadowing · Career development</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <User size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Mentor not yet assigned</p>
                <p className="text-xs text-gray-500 mt-1">Your EXCO mentor will be assigned by the programme coordinator. Check back soon.</p>
              </div>
            </div>
          )}
        </div>

        {/* What to expect */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">What your mentorship covers</h2>
          <div className="space-y-2">
            {[
              { title: 'Monthly 1-on-1s', desc: 'Protected time dedicated solely to your development.' },
              { title: 'Leadership Coaching', desc: 'Navigating real challenges, difficult conversations, and strategic decisions.' },
              { title: 'Career Conversations', desc: 'Your long-term trajectory and growth within Sapphire.' },
              { title: 'Leadership Shadowing', desc: 'Observing your mentor in high-stakes meetings and planning sessions.' },
              { title: 'Feedback Sessions', desc: 'Candid, constructive feedback based on observations and your self-assessments.' },
              { title: 'Development Plans', desc: 'Co-created plans with specific growth objectives and milestones.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0F52BA] mt-2 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-gray-800">{item.title} — </span>
                  <span className="text-sm text-gray-500">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session history */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            Session History <span className="text-gray-400 font-normal">({sessions.length})</span>
          </h2>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No sessions recorded yet.</p>
              <p className="text-gray-400 text-xs mt-1">Your mentor will log your 1-on-1s here after each session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-[#0F52BA]" />
                    <span className="text-sm font-semibold text-gray-800">
                      {new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {s.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {s.topics.map(t => <span key={t} className="badge-blue">{t}</span>)}
                    </div>
                  )}
                  {s.notes && <p className="text-sm text-gray-600 mt-1">{s.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
