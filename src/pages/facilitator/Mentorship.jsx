import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Calendar, Users, Settings, CheckSquare, Square, Eye } from 'lucide-react'

const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December']

const TOPICS = [
  'Goal Setting', 'Career Development', 'Leadership Skills', 'Performance Issues',
  'Team Dynamics', 'Conflict Resolution', 'Communication', 'Strategic Thinking',
  'Work-Life Balance', 'Other',
]

const ENGAGEMENT_TYPES = [
  { value: 'executive_meeting',   label: 'Executive Meeting' },
  { value: 'strategy_session',    label: 'Strategy Session' },
  { value: 'partner_engagement',  label: 'Partner Engagement' },
  { value: 'planning_meeting',    label: 'Planning Meeting' },
  { value: 'problem_solving',     label: 'Problem Solving' },
  { value: 'other',               label: 'Other' },
]

export default function FacilitatorMentorship() {
  const { facilitator } = useAuth()
  const isCoordinator = facilitator?.role === 'coordinator'

  const [tab, setTab]         = useState('mentees')
  const [mentees, setMentees] = useState([])
  const [allMentors, setAllMentors] = useState([])

  // Circles
  const [circles, setCircles]         = useState([])
  const [circleForm, setCircleForm]   = useState({ month_number: 1, session_date: '', notes: '', topics: [] })
  const [circleAttend, setCircleAttend] = useState({}) // participantId -> boolean
  const [savingCircle, setSavingCircle] = useState(false)

  // 1:1 sessions
  const [sessions, setSessions]   = useState([])
  const [form, setForm]           = useState({ participant_id: '', session_date: '', notes: '', topics: [] })
  const [saving1on1, setSaving1on1] = useState(false)

  // Shadowing
  const [shadowings, setShadowings]     = useState([])
  const [shadowForm, setShadowForm]     = useState({ participant_id: '', shadow_date: '', engagement_type: 'executive_meeting', notes: '' })
  const [savingShadow, setSavingShadow] = useState(false)

  // Coordinator: all groups
  const [allCircles, setAllCircles]     = useState([])
  const [allSessions, setAllSessions]   = useState([])

  const [loading, setLoading] = useState(true)

  useEffect(() => { if (facilitator) load() }, [facilitator])

  async function load() {
    if (isCoordinator) {
      const [partsRes, sessRes, circRes, mentorsRes] = await Promise.all([
        supabase.from('participants').select('id, name, department, mentor_id, facilitators(name)').order('name'),
        supabase.from('mentorship_sessions').select('*, participants(name), facilitators(name)').order('session_date', { ascending: false }),
        supabase.from('mentor_circles').select('*, facilitators(name), mentor_circle_attendance(participant_id, attended, participants(name))').order('month_number'),
        supabase.from('facilitators').select('id, name, focus_area').neq('role', 'coordinator').order('name'),
      ])
      setMentees(partsRes.data || [])
      setAllSessions(sessRes.data || [])
      setAllCircles(circRes.data || [])
      setAllMentors(mentorsRes.data || [])
    } else {
      const [partsRes, sessRes, circRes, shadowRes] = await Promise.all([
        supabase.from('participants').select('id, name, department').eq('mentor_id', facilitator.id).order('name'),
        supabase.from('mentorship_sessions').select('*, participants(name)').eq('facilitator_id', facilitator.id).order('session_date', { ascending: false }),
        supabase.from('mentor_circles').select('*, mentor_circle_attendance(participant_id, attended, participants(name))').eq('facilitator_id', facilitator.id).order('month_number'),
        supabase.from('executive_shadowing').select('*, participants(name)').eq('facilitator_id', facilitator.id).order('shadow_date', { ascending: false }),
      ])
      setMentees(partsRes.data || [])
      setSessions(sessRes.data || [])
      setCircles(circRes.data || [])
      setShadowings(shadowRes.data || [])

      // Default circle attendance to all mentees present
      const init = {}
      ;(partsRes.data || []).forEach(p => { init[p.id] = true })
      setCircleAttend(init)
    }
    setLoading(false)
  }

  async function saveCircle(e) {
    e.preventDefault()
    if (!circleForm.session_date) { toast.error('Pick a session date'); return }
    setSavingCircle(true)
    try {
      const { data: circle, error: ce } = await supabase.from('mentor_circles').upsert({
        facilitator_id: facilitator.id,
        month_number: circleForm.month_number,
        session_date: circleForm.session_date,
        notes: circleForm.notes || null,
        topics: circleForm.topics.length > 0 ? circleForm.topics : null,
      }, { onConflict: 'facilitator_id,month_number' }).select().single()
      if (ce) throw ce

      // Upsert attendance for all mentees
      const attRows = mentees.map(p => ({
        circle_id: circle.id,
        participant_id: p.id,
        attended: circleAttend[p.id] ?? true,
      }))
      if (attRows.length > 0) {
        const { error: ae } = await supabase.from('mentor_circle_attendance').upsert(attRows, { onConflict: 'circle_id,participant_id' })
        if (ae) throw ae
      }

      toast.success('Circle session saved')
      setCircleForm(f => ({ ...f, session_date: '', notes: '', topics: [] }))
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSavingCircle(false) }
  }

  async function save1on1(e) {
    e.preventDefault()
    if (!form.participant_id || !form.session_date) { toast.error('Select mentee and date'); return }
    setSaving1on1(true)
    try {
      const { error } = await supabase.from('mentorship_sessions').insert({
        participant_id: form.participant_id,
        facilitator_id: facilitator.id,
        session_date: form.session_date,
        notes: form.notes || null,
        topics: form.topics.length > 0 ? form.topics : null,
      })
      if (error) throw error
      toast.success('Session logged')
      setForm({ participant_id: '', session_date: '', notes: '', topics: [] })
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving1on1(false) }
  }

  async function saveShadowing(e) {
    e.preventDefault()
    if (!shadowForm.participant_id || !shadowForm.shadow_date) { toast.error('Select mentee and date'); return }
    setSavingShadow(true)
    try {
      const { error } = await supabase.from('executive_shadowing').insert({
        participant_id: shadowForm.participant_id,
        facilitator_id: facilitator.id,
        shadow_date: shadowForm.shadow_date,
        engagement_type: shadowForm.engagement_type,
        notes: shadowForm.notes || null,
      })
      if (error) throw error
      toast.success('Shadowing session logged')
      setShadowForm({ participant_id: '', shadow_date: '', engagement_type: 'executive_meeting', notes: '' })
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSavingShadow(false) }
  }

  function toggleTopic(topic) {
    setForm(f => ({ ...f, topics: f.topics.includes(topic) ? f.topics.filter(t => t !== topic) : [...f.topics, topic] }))
  }
  function toggleCircleTopic(topic) {
    setCircleForm(f => ({ ...f, topics: f.topics.includes(topic) ? f.topics.filter(t => t !== topic) : [...f.topics, topic] }))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const TABS = isCoordinator
    ? [['overview', 'Overview'], ['circles', 'All Circles'], ['sessions', 'All 1:1s']]
    : [['mentees', 'Mentees'], ['circles', 'Circles'], ['sessions', '1:1 Sessions'], ['shadowing', 'Shadowing']]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isCoordinator ? 'Mentorship Programme' : 'My Mentorship'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isCoordinator
                ? `${allMentors.length} mentors · ${mentees.length} participants · Jul–Dec 2026`
                : mentees.length > 0
                  ? `Your mentees: ${mentees.map(m => m.name.split(' ')[0]).join(', ')}`
                  : 'No mentees assigned yet'}
            </p>
          </div>
          <Link to="/facilitator/mentors" className="flex items-center gap-1.5 text-xs font-semibold text-[#0F52BA] hover:text-[#0a3a9e] shrink-0">
            <Settings size={13} /> Manage Assignments
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── COORDINATOR: OVERVIEW ── */}
        {isCoordinator && tab === 'overview' && (
          <div className="space-y-6">
            {allMentors.map(mentor => {
              const theirMentees = mentees.filter(p => p.mentor_id === mentor.id)
              const theirCircles = allCircles.filter(c => c.facilitator_id === mentor.id)
              return (
                <div key={mentor.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{mentor.name}</p>
                      {mentor.focus_area && <p className="text-xs text-[#0F52BA] font-medium">{mentor.focus_area}</p>}
                    </div>
                    <span className="text-xs text-gray-400">{theirMentees.length} mentees · {theirCircles.length}/6 circles</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {theirMentees.map(p => (
                      <Link key={p.id} to={`/facilitator/participant/${p.id}`}
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 hover:border-[#0F52BA] transition-colors truncate">
                        {p.name.split(' ')[0]} {p.name.split(' ')[1]?.[0]}.
                      </Link>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {MONTHS.map((m, i) => {
                      const circle = theirCircles.find(c => c.month_number === i + 1)
                      return (
                        <div key={i} title={`${m} circle`}
                          className={`flex-1 h-1.5 rounded-full ${circle ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} />
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Monthly circles progress</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── COORDINATOR: ALL CIRCLES ── */}
        {isCoordinator && tab === 'circles' && (
          <div className="space-y-4">
            {allCircles.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">No circles logged yet.</div>
            ) : (
              allCircles.map(c => {
                const attended = (c.mentor_circle_attendance || []).filter(a => a.attended)
                const total    = (c.mentor_circle_attendance || []).length
                return (
                  <div key={c.id} className="card">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{MONTHS[c.month_number - 1]} 2026 Circle</p>
                        <p className="text-xs text-[#0F52BA] font-medium">{c.facilitators?.name}</p>
                        {c.session_date && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(c.session_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                        {attended.length}/{total} attended
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(c.mentor_circle_attendance || []).map(a => (
                        <span key={a.participant_id}
                          className={`text-xs px-2 py-0.5 rounded-full ${a.attended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {a.participants?.name?.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── COORDINATOR: ALL 1:1s ── */}
        {isCoordinator && tab === 'sessions' && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">All 1:1 Sessions ({allSessions.length})</h2>
            {allSessions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No sessions logged yet.</p>
            ) : (
              <div className="space-y-3">
                {allSessions.map(s => (
                  <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="font-semibold text-gray-900">{s.participants?.name}</span>
                        <span className="text-xs text-gray-400 ml-2">with {s.facilitators?.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {s.topics?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{s.topics.map(t => <span key={t} className="badge-blue">{t}</span>)}</div>}
                    {s.notes && <p className="text-sm text-gray-600 mt-1">{s.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MENTOR: MENTEES ── */}
        {!isCoordinator && tab === 'mentees' && (
          <div className="space-y-4">
            {mentees.length === 0 ? (
              <div className="card text-center py-10">
                <Users size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 mb-1">No mentees assigned yet.</p>
                <Link to="/facilitator/mentors" className="btn-primary inline-block mt-2">Manage Assignments</Link>
              </div>
            ) : (
              <>
                <div className="card">
                  <h2 className="font-semibold text-gray-900 mb-3">Your Mentee Group</h2>
                  <div className="space-y-3">
                    {mentees.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.department}</p>
                        </div>
                        <Link to={`/facilitator/participant/${p.id}`}
                          className="flex items-center gap-1 text-xs text-[#0F52BA] font-medium hover:underline">
                          <Eye size={13} /> View
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Circle progress summary */}
                <div className="card">
                  <h2 className="font-semibold text-gray-900 mb-3">Circle Progress</h2>
                  <div className="flex gap-1.5 mb-1">
                    {MONTHS.map((m, i) => {
                      const circle = circles.find(c => c.month_number === i + 1)
                      return <div key={i} className={`flex-1 h-2 rounded-full ${circle ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} title={`${m}: ${circle ? 'logged' : 'not logged'}`} />
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {MONTHS.map((m, i) => (
                      <span key={i} className="text-xs text-gray-400 flex-1 text-center">{m.slice(0, 3)}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{circles.length}/6 circles logged</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MENTOR: CIRCLES ── */}
        {!isCoordinator && tab === 'circles' && (
          <div className="space-y-5">
            {mentees.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">No mentees assigned yet.</div>
            ) : (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Log Monthly Circle Session</h2>
                <form onSubmit={saveCircle} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Month *</label>
                      <select className="input" value={circleForm.month_number}
                        onChange={e => setCircleForm(f => ({ ...f, month_number: parseInt(e.target.value) }))}>
                        {MONTHS.map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m} 2026</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Session Date *</label>
                      <input type="date" className="input" value={circleForm.session_date}
                        onChange={e => setCircleForm(f => ({ ...f, session_date: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="label">Attendance</label>
                    <div className="space-y-2">
                      {mentees.map(p => (
                        <button type="button" key={p.id}
                          onClick={() => setCircleAttend(a => ({ ...a, [p.id]: !a[p.id] }))}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${circleAttend[p.id] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          {circleAttend[p.id]
                            ? <CheckSquare size={16} className="text-green-600 shrink-0" />
                            : <Square size={16} className="text-gray-400 shrink-0" />}
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.department}</p>
                          </div>
                          <span className={`ml-auto text-xs font-semibold ${circleAttend[p.id] ? 'text-green-600' : 'text-gray-400'}`}>
                            {circleAttend[p.id] ? 'Present' : 'Absent'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Topics Covered</label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map(t => (
                        <button type="button" key={t} onClick={() => toggleCircleTopic(t)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${circleForm.topics.includes(t) ? 'bg-[#0F52BA] text-white border-[#0F52BA]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#0F52BA]'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Session Notes (optional)</label>
                    <textarea className="input" rows={3} value={circleForm.notes}
                      onChange={e => setCircleForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Key discussion points, themes, action items from the group session..." />
                  </div>

                  <button type="submit" disabled={savingCircle} className="btn-primary w-full">
                    {savingCircle ? 'Saving...' : 'Save Circle Session'}
                  </button>
                </form>
              </div>
            )}

            {circles.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Circle History ({circles.length})</h2>
                <div className="space-y-4">
                  {circles.map(c => {
                    const att = c.mentor_circle_attendance || []
                    const attended = att.filter(a => a.attended)
                    return (
                      <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{MONTHS[c.month_number - 1]} 2026 Circle</p>
                            {c.session_date && (
                              <p className="text-xs text-gray-400">
                                {new Date(c.session_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full shrink-0">
                            {attended.length}/{att.length} attended
                          </span>
                        </div>
                        {att.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {att.map(a => (
                              <span key={a.participant_id}
                                className={`text-xs px-2 py-0.5 rounded-full ${a.attended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {a.participants?.name?.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                        )}
                        {c.topics?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">{c.topics.map(t => <span key={t} className="badge-blue">{t}</span>)}</div>
                        )}
                        {c.notes && <p className="text-sm text-gray-600">{c.notes}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MENTOR: 1:1 SESSIONS ── */}
        {!isCoordinator && tab === 'sessions' && (
          <div className="space-y-5">
            {mentees.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Log 1:1 Coaching Session</h2>
                <form onSubmit={save1on1} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Mentee *</label>
                      <select className="input" value={form.participant_id}
                        onChange={e => setForm(f => ({ ...f, participant_id: e.target.value }))}>
                        <option value="">Select mentee...</option>
                        {mentees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Session Date *</label>
                      <input type="date" className="input" value={form.session_date}
                        onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Topics Covered</label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map(t => (
                        <button type="button" key={t} onClick={() => toggleTopic(t)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.topics.includes(t) ? 'bg-[#0F52BA] text-white border-[#0F52BA]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#0F52BA]'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Session Notes (optional)</label>
                    <textarea className="input" rows={4} value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Key discussion points, commitments made, follow-ups needed..." />
                  </div>
                  <button type="submit" disabled={saving1on1} className="btn-primary w-full">
                    {saving1on1 ? 'Saving...' : 'Log Session'}
                  </button>
                </form>
              </div>
            )}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Session History ({sessions.length})</h2>
              {sessions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No sessions logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{s.participants?.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {s.topics?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{s.topics.map(t => <span key={t} className="badge-blue">{t}</span>)}</div>}
                      {s.notes && <p className="text-sm text-gray-600 mt-2">{s.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MENTOR: SHADOWING ── */}
        {!isCoordinator && tab === 'shadowing' && (
          <div className="space-y-5">
            {mentees.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-1">Log Executive Shadowing</h2>
                <p className="text-xs text-gray-400 mb-4">Record when a mentee observes you in a significant leadership engagement</p>
                <form onSubmit={saveShadowing} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Mentee *</label>
                      <select className="input" value={shadowForm.participant_id}
                        onChange={e => setShadowForm(f => ({ ...f, participant_id: e.target.value }))}>
                        <option value="">Select mentee...</option>
                        {mentees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Date *</label>
                      <input type="date" className="input" value={shadowForm.shadow_date}
                        onChange={e => setShadowForm(f => ({ ...f, shadow_date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Engagement Type</label>
                    <select className="input" value={shadowForm.engagement_type}
                      onChange={e => setShadowForm(f => ({ ...f, engagement_type: e.target.value }))}>
                      {ENGAGEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Notes (optional)</label>
                    <textarea className="input" rows={3} value={shadowForm.notes}
                      onChange={e => setShadowForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="What did the mentee observe? Key takeaways or debrief notes..." />
                  </div>
                  <button type="submit" disabled={savingShadow} className="btn-primary w-full">
                    {savingShadow ? 'Saving...' : 'Log Shadowing Session'}
                  </button>
                </form>
              </div>
            )}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Shadowing Log ({shadowings.length})</h2>
              {shadowings.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No shadowing sessions logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {shadowings.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="font-semibold text-gray-900">{s.participants?.name}</span>
                          <span className="ml-2 text-xs text-[#0F52BA] font-medium">
                            {ENGAGEMENT_TYPES.find(t => t.value === s.engagement_type)?.label || s.engagement_type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(s.shadow_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {s.notes && <p className="text-sm text-gray-600 mt-1">{s.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
