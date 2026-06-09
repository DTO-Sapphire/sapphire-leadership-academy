import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { ArrowLeft } from 'lucide-react'

const COMPETENCIES = [
  { key: 'leadership_awareness', label: 'Leadership Awareness' },
  { key: 'delegation', label: 'Delegation' },
  { key: 'communication', label: 'Communication' },
  { key: 'decision_making', label: 'Decision Making' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'stakeholder_management', label: 'Stakeholder Management' },
  { key: 'team_development', label: 'Team Development' },
  { key: 'coaching', label: 'Coaching' },
  { key: 'influence', label: 'Influence' },
  { key: 'execution_excellence', label: 'Execution Excellence' },
]

const RATING_LABELS = { 1: 'No progress', 2: 'Slight progress', 3: 'Good progress', 4: 'Strong progress', 5: 'Excellent progress' }

function avg(scores) {
  if (!scores) return null
  const vals = Object.values(scores).map(Number).filter(v => !isNaN(v) && v > 0)
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
}

function fmt(n, dec = 1) { return n != null ? n.toFixed(dec) : '—' }

export default function ParticipantProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    const [
      partRes, scorecardRes, baselineRes, finalRes,
      attRes, sessRes, reflRes, subRes, assignRes,
      commRes, mentorSessRes,
    ] = await Promise.all([
      supabase.from('participants').select('*, facilitators(name)').eq('id', id).single(),
      supabase.from('scorecard').select('*').eq('participant_id', id).single(),
      supabase.from('assessments').select('scores').eq('participant_id', id).eq('type', 'baseline').single(),
      supabase.from('assessments').select('scores').eq('participant_id', id).eq('type', 'final').single(),
      supabase.from('attendance').select('session_id').eq('participant_id', id),
      supabase.from('sessions').select('id, session_number, title, session_date').order('session_number'),
      supabase.from('reflections').select('session_id, created_at').eq('participant_id', id),
      supabase.from('assignment_submissions').select('assignment_id').eq('participant_id', id),
      supabase.from('weekly_assignments').select('id, week_number, title').order('week_number'),
      supabase.from('commitments').select('*, commitment_updates(*)').eq('participant_id', id).order('created_at'),
      supabase.from('mentorship_sessions').select('*').eq('participant_id', id).order('session_date', { ascending: false }),
    ])

    const participant = partRes.data
    const sessions = sessRes.data || []
    const attendedIds = new Set((attRes.data || []).map(a => a.session_id))
    const reflectedIds = new Set((reflRes.data || []).map(r => r.session_id))
    const submittedIds = new Set((subRes.data || []).map(s => s.assignment_id))
    const baselineScores = baselineRes.data?.scores
    const finalScores = finalRes.data?.scores
    const baselineAvg = avg(baselineScores)
    const finalAvg = avg(finalScores)
    const growth = baselineAvg != null && finalAvg != null ? finalAvg - baselineAvg : null

    setProfile({
      participant,
      scorecard: scorecardRes.data,
      sessions,
      attendedIds,
      reflectedIds,
      submittedIds,
      baselineScores,
      finalScores,
      baselineAvg,
      finalAvg,
      growth,
      assignments: assignRes.data || [],
      commitments: commRes.data || [],
      mentorshipSessions: mentorSessRes.data || [],
    })
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div>
    </div>
  )

  if (!profile.participant) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Participant not found.</p>
        <Link to="/facilitator/insights" className="text-[#0F52BA] font-semibold text-sm hover:underline mt-4 block">← Back</Link>
      </div>
    </div>
  )

  const { participant, scorecard, sessions, attendedIds, reflectedIds, submittedIds, baselineScores, finalScores, baselineAvg, finalAvg, growth, assignments, commitments, mentorshipSessions } = profile
  const today = new Date()
  const heldSessions = sessions.filter(s => new Date(s.session_date) <= today)
  const totalScore = scorecard ? Object.keys(scorecard).filter(k => k.endsWith('_score')).reduce((s, k) => s + (scorecard[k] || 0), 0) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <Link to="/facilitator/insights" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={15} /> Back to Insights
        </Link>

        {/* Header */}
        <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #0A3480, #0F52BA)', color: 'white' }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{participant.name}</h1>
              <p className="text-blue-200 text-sm mt-0.5">{participant.department}</p>
              {participant.facilitators?.name && <p className="text-blue-200 text-xs mt-1">Mentor: {participant.facilitators.name}</p>}
            </div>
            {totalScore != null && (
              <div className="text-right">
                <p className="text-blue-200 text-xs">Scorecard Total</p>
                <p className="text-3xl font-bold">{totalScore}<span className="text-blue-200 text-base">/100</span></p>
                {scorecard?.graduated && <span className="text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded-full">Graduated</span>}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Sessions Attended', value: `${attendedIds.size}/${heldSessions.length}` },
            { label: 'Reflections', value: `${reflectedIds.size}/${heldSessions.length}` },
            { label: 'Assignments', value: `${submittedIds.size}/${assignments.length}` },
            { label: 'Growth Index', value: growth != null ? `${growth >= 0 ? '+' : ''}${fmt(growth)}` : '—', color: growth != null ? (growth >= 0 ? 'text-green-600' : 'text-red-500') : 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color || 'text-gray-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Assessment comparison */}
        {baselineScores && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-900">Competency Assessment</p>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-gray-300 rounded inline-block" />Baseline {fmt(baselineAvg)}</span>
                {finalScores && <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-[#0F52BA] rounded inline-block opacity-70" />Final {fmt(finalAvg)}</span>}
              </div>
            </div>
            <div className="space-y-2.5">
              {COMPETENCIES.map(c => {
                const b = Number(baselineScores?.[c.key] || 0)
                const f = finalScores ? Number(finalScores?.[c.key] || 0) : null
                const delta = f != null ? f - b : null
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-600">{c.label}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">{b}/10</span>
                        {f != null && <span className="text-gray-700 font-medium">{f}/10</span>}
                        {delta != null && <span className={`font-bold ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>{delta >= 0 ? '+' : ''}{delta}</span>}
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-gray-300 rounded-full" style={{ width: `${b * 10}%` }} />
                      {f != null && <div className="absolute inset-y-0 left-0 bg-[#0F52BA] rounded-full opacity-70" style={{ width: `${f * 10}%` }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Session attendance */}
        <div className="card mb-6">
          <p className="font-semibold text-gray-900 mb-3">Session Attendance</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {sessions.map(s => {
              const held = new Date(s.session_date) <= today
              const attended = attendedIds.has(s.id)
              const reflected = reflectedIds.has(s.id)
              return (
                <div key={s.id} className={`rounded-lg p-2 text-center text-xs ${!held ? 'bg-gray-50 text-gray-400' : attended ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="font-bold text-sm">{s.session_number}</p>
                  {held && <p className={attended ? 'text-green-600' : 'text-red-500'}>{attended ? '✓' : '✗'}</p>}
                  {held && attended && <p className={`text-xs ${reflected ? 'text-blue-500' : 'text-gray-300'}`}>{reflected ? '📝' : '—'}</p>}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">✓ = attended · 📝 = reflected</p>
        </div>

        {/* Leadership Commitments */}
        <div className="card mb-6">
          <p className="font-semibold text-gray-900 mb-3">Leadership Commitments</p>
          {commitments.length === 0 ? (
            <p className="text-sm text-gray-400">No commitments set yet.</p>
          ) : commitments.map(c => {
            const upds = (c.commitment_updates || []).sort((a, b) => a.week_number - b.week_number)
            return (
              <div key={c.id} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#0F52BA]/10 text-[#0F52BA] text-xs font-bold px-2 py-0.5 rounded-full">{c.area}</span>
                  <span className="text-xs text-gray-400">{upds.length}/4 updates</span>
                </div>
                <p className="text-xs text-gray-600 mb-1"><strong>Success:</strong> {c.success_definition}</p>
                <p className="text-xs text-gray-600 mb-2"><strong>Target:</strong> {c.measurable_target}</p>
                {upds.length > 0 && (
                  <div className="space-y-1.5">
                    {upds.map(u => (
                      <div key={u.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-gray-700">Week {u.week_number}</span>
                          <span className="text-[#0F52BA] font-bold">{u.rating}/5 · {RATING_LABELS[u.rating]}</span>
                        </div>
                        <p className="text-gray-600">{u.progress_note}</p>
                        {u.practical_example && <p className="text-gray-400 italic mt-0.5">"{u.practical_example}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mentorship sessions */}
        {mentorshipSessions.length > 0 && (
          <div className="card mb-6">
            <p className="font-semibold text-gray-900 mb-3">Mentorship Sessions</p>
            <div className="space-y-2">
              {mentorshipSessions.map(s => (
                <div key={s.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.topic || 'Session'}</p>
                    <p className="text-xs text-gray-400">{new Date(s.session_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {s.notes && <p className="text-xs text-gray-500 max-w-xs text-right">{s.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scorecard breakdown */}
        {scorecard && (
          <div className="card">
            <p className="font-semibold text-gray-900 mb-3">Scorecard Breakdown</p>
            <div className="space-y-2">
              {[
                { key: 'attendance_score', label: 'Attendance', max: 10 },
                { key: 'participation_score', label: 'Participation', max: 15 },
                { key: 'assignment_score', label: 'Assignments', max: 20 },
                { key: 'mentorship_score', label: 'Mentorship', max: 15 },
                { key: 'peer_feedback_score', label: 'Peer Feedback', max: 10 },
                { key: 'self_assessment_score', label: 'Self-Assessment', max: 10 },
                { key: 'manager_score', label: 'Manager Assessment', max: 20 },
              ].map(f => {
                const val = scorecard[f.key] || 0
                return (
                  <div key={f.key} className="flex items-center gap-3">
                    <p className="text-xs text-gray-600 w-36 shrink-0">{f.label}</p>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-2 bg-[#0F52BA] rounded-full" style={{ width: `${(val / f.max) * 100}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700 w-12 text-right">{val}/{f.max}</p>
                  </div>
                )
              })}
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <p className="text-sm font-bold text-gray-900">Total</p>
                <p className="text-sm font-bold text-[#0F52BA]">{totalScore}/100</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
