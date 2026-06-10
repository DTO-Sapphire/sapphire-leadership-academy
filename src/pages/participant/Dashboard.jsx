import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { cache } from '../../lib/cache'
import NavBar from '../../components/NavBar'
import { CheckCircle, BookOpen, Star, TrendingUp, AlertCircle, Copy, Check, User } from 'lucide-react'

function ShareLink() {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/register`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 text-xs text-[#0F52BA] hover:text-[#0a3a9e] font-semibold transition-colors">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Link copied!' : 'Share registration link'}
    </button>
  )
}

export default function Dashboard() {
  const { participant } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participant) return
    loadData()
  }, [participant])

  async function loadData() {
    const cacheKey = `p-dash-${participant.id}`
    const cached = cache.get(cacheKey)
    if (cached) { setData(cached); setLoading(false) }

    const [sessions, attendance, reflections, scorecard, baseline, final, assignments, submissions, settings, mentorResult] = await Promise.all([
      supabase.from('sessions').select('*, facilitators(name), session_laws(laws(name, law_number))').order('session_number'),
      supabase.from('attendance').select('session_id').eq('participant_id', participant.id),
      supabase.from('reflections').select('session_id').eq('participant_id', participant.id),
      supabase.from('scorecard').select('*').eq('participant_id', participant.id).single(),
      supabase.from('assessments').select('*').eq('participant_id', participant.id).eq('type', 'baseline').single(),
      supabase.from('assessments').select('*').eq('participant_id', participant.id).eq('type', 'final').single(),
      supabase.from('weekly_assignments').select('*').order('week_number'),
      supabase.from('assignment_submissions').select('assignment_id').eq('participant_id', participant.id),
      supabase.from('settings').select('*'),
      participant.mentor_id
        ? supabase.from('facilitators').select('id, name').eq('id', participant.mentor_id).single()
        : Promise.resolve({ data: null }),
    ])
    const settingsMap = Object.fromEntries((settings.data || []).map(s => [s.key, s.value]))
    const fresh = {
      sessions: sessions.data || [],
      attendedIds: new Set((attendance.data || []).map(a => a.session_id)),
      reflectedIds: new Set((reflections.data || []).map(r => r.session_id)),
      scorecard: scorecard.data,
      baseline: baseline.data,
      final: final.data,
      assignments: assignments.data || [],
      submittedAssignments: new Set((submissions.data || []).map(s => s.assignment_id)),
      finalOpen: settingsMap.final_assessment_open === 'true',
      programmeWeek: parseInt(settingsMap.programme_week || '1'),
      mentor: mentorResult.data || null,
    }
    cache.set(cacheKey, fresh)
    setData(fresh)
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

  const { sessions, attendedIds, reflectedIds, scorecard, baseline, final, assignments, submittedAssignments, finalOpen, programmeWeek, mentor } = data
  const attended = attendedIds.size
  const totalSessions = sessions.length
  const score = scorecard?.total_score ?? 0
  const currentWeekAssignment = assignments.find(a => a.week_number === programmeWeek)
  const currentAssignmentDone = currentWeekAssignment && submittedAssignments.has(currentWeekAssignment.id)
  const assignmentDaysLeft = currentWeekAssignment
    ? (new Date(currentWeekAssignment.due_date + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24)
    : null
  const showAssignmentBanner = currentWeekAssignment && !currentAssignmentDone && assignmentDaysLeft !== null && assignmentDaysLeft <= 2

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {participant?.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{participant?.role} · {participant?.department}</p>
          </div>
          <div className="pt-1 shrink-0">
            <ShareLink />
          </div>
        </div>

        {/* Banners */}
        {!baseline && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-amber-800">Complete your Baseline Assessment</p>
              <p className="text-amber-700 text-sm">Establish your leadership starting point before the programme begins.</p>
              <Link to="/dashboard/assessment" className="inline-block mt-2 text-sm font-medium text-amber-700 underline">
                Start Assessment →
              </Link>
            </div>
          </div>
        )}
        {baseline && finalOpen && !final && (
          <div className="bg-[#0F52BA] text-white rounded-xl p-4 mb-4 flex items-start gap-3">
            <Star className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold">The final assessment is now open.</p>
              <p className="text-blue-200 text-sm">Complete your final self-assessment to see your leadership growth.</p>
              <Link to="/dashboard/assessment" className="inline-block mt-2 text-sm font-medium text-white underline">
                Take Final Assessment →
              </Link>
            </div>
          </div>
        )}
        {baseline && final && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <CheckCircle className="text-green-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-green-800">Both assessments submitted.</p>
              <Link to="/dashboard/growth" className="text-sm text-green-700 underline">View your Growth Index →</Link>
            </div>
          </div>
        )}
        {showAssignmentBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <BookOpen className="text-blue-600 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-blue-800">Week {programmeWeek} Assignment Due</p>
              <p className="text-blue-700 text-sm">{currentWeekAssignment.title}</p>
              <Link to="/dashboard/assignments" className="text-sm text-blue-700 underline">Submit now →</Link>
            </div>
          </div>
        )}

        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Star size={20} className="text-amber-500" />, label: 'Baseline Assessment', value: baseline ? 'Complete' : 'Pending', color: baseline ? 'text-green-700' : 'text-amber-700' },
            { icon: <CheckCircle size={20} className="text-green-500" />, label: 'Sessions Attended', value: `${attended} / ${totalSessions}`, color: 'text-gray-900' },
            { icon: <BookOpen size={20} className="text-blue-500" />, label: 'Reflections', value: `${reflectedIds.size} submitted`, color: 'text-gray-900' },
            { icon: <TrendingUp size={20} className="text-[#0F52BA]" />, label: 'My Scorecard', value: `${score.toFixed(0)} / 100`, color: score >= 75 ? 'text-green-700' : score >= 50 ? 'text-amber-700' : 'text-red-600' },
          ].map((card, i) => (
            <div key={i} className="card flex flex-col gap-2">
              {card.icon}
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className={`font-bold text-lg ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Mentor card */}
        <Link to="/dashboard/mentorship" className="card flex items-center gap-4 mb-8 hover:shadow-md transition-shadow group">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mentor ? 'bg-[#0A3480]' : 'bg-gray-100'}`}>
            <User size={18} className={mentor ? 'text-white' : 'text-gray-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">Your EXCO Mentor</p>
            <p className={`font-bold text-sm ${mentor ? 'text-gray-900' : 'text-gray-400'}`}>
              {mentor ? mentor.name : 'Not yet assigned'}
            </p>
          </div>
          <span className="text-xs text-[#0F52BA] font-semibold group-hover:underline shrink-0">View →</span>
        </Link>

        {/* Sessions list */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Programme Sessions</h2>
          <div className="space-y-3">
            {sessions.map(s => {
              const attended = attendedIds.has(s.id)
              const reflected = reflectedIds.has(s.id)
              const date = new Date(s.session_date + 'T00:00:00')
              const sessionEnd = new Date(s.session_date + 'T10:30:00')
              const isPast = sessionEnd < new Date()
              const laws = s.session_laws?.map(sl => sl.laws?.name).filter(Boolean).join(', ')
              return (
                <div key={s.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${attended ? 'bg-green-100 text-green-700' : isPast ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {s.session_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{s.title}</p>
                    {laws && <p className="text-xs text-gray-500 truncate">{laws}</p>}
                    <p className="text-xs text-gray-400">{date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={attended ? 'badge-green' : isPast ? 'badge-red' : 'badge-gray'}>
                      {attended ? 'Attended' : isPast ? 'Missed' : 'Upcoming'}
                    </span>
                    {s.reflections_open && (
                      <span className={reflected ? 'badge-green' : 'badge-yellow'}>
                        {reflected ? 'Reflected' : 'Reflect'}
                      </span>
                    )}
                    {s.slide_url && (
                      <a href={s.slide_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#0F52BA] font-semibold hover:underline">
                        View Slides →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
