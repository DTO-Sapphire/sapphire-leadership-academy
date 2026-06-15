import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { User, Calendar, BookOpen, Briefcase, Users } from 'lucide-react'

const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December']

const JOURNAL_PROMPTS = [
  { key: 'lessons_learned',        label: 'Lessons Learned',              placeholder: 'What leadership lessons did you learn this month?' },
  { key: 'leadership_challenges',  label: 'Leadership Challenges',        placeholder: 'What leadership challenges did you face?' },
  { key: 'leadership_successes',   label: 'Leadership Successes',         placeholder: 'What leadership wins did you celebrate?' },
  { key: 'mistakes_insights',      label: 'Mistakes & Insights',          placeholder: 'What mistakes did you make and what did they teach you?' },
  { key: 'next_month_commitments', label: 'Commitments for Next Month',   placeholder: 'What will you commit to applying or changing next month?' },
]
const EMPTY_JOURNAL = { lessons_learned: '', leadership_challenges: '', leadership_successes: '', mistakes_insights: '', next_month_commitments: '' }

const ENGAGEMENT_LABELS = {
  executive_meeting: 'Executive Meeting', strategy_session: 'Strategy Session',
  partner_engagement: 'Partner Engagement', planning_meeting: 'Planning Meeting',
  problem_solving: 'Problem Solving', other: 'Other',
}
const STATUS_COLORS  = { planning: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' }
const STATUS_LABELS  = { planning: 'Planning', in_progress: 'In Progress', completed: 'Completed' }

function currentProgrammeMonth() {
  const now = new Date()
  const diff = (now.getFullYear() - 2026) * 12 + (now.getMonth() - 6)
  return Math.max(1, Math.min(6, diff + 1))
}

export default function ParticipantMentorship() {
  const { participant } = useAuth()
  const [tab, setTab]           = useState('programme')
  const [mentor, setMentor]     = useState(null)
  const [circles, setCircles]   = useState([])
  const [attendance, setAttendance] = useState({})
  const [sessions, setSessions] = useState([])
  const [shadowing, setShadowing] = useState([])
  const [journals, setJournals] = useState({})
  const [project, setProject]   = useState(null)
  const [loading, setLoading]   = useState(true)

  const [journalMonth, setJournalMonth] = useState(currentProgrammeMonth())
  const [journalForm, setJournalForm]   = useState(EMPTY_JOURNAL)
  const [savingJournal, setSavingJournal] = useState(false)

  const [projectForm, setProjectForm]       = useState({ title: '', area_of_responsibility: '', description: '', status: 'planning', outcomes: '' })
  const [editingProject, setEditingProject] = useState(false)
  const [savingProject, setSavingProject]   = useState(false)

  useEffect(() => { if (participant) load() }, [participant])

  async function load() {
    let mentorData = null
    if (participant.mentor_id) {
      const { data } = await supabase.from('facilitators').select('id, name, focus_area').eq('id', participant.mentor_id).single()
      mentorData = data
    }
    setMentor(mentorData)

    const [circlesRes, attRes, sessRes, shadowRes, journalRes, projRes] = await Promise.all([
      mentorData
        ? supabase.from('mentor_circles').select('*').eq('facilitator_id', mentorData.id).order('month_number')
        : Promise.resolve({ data: [] }),
      supabase.from('mentor_circle_attendance').select('*').eq('participant_id', participant.id),
      supabase.from('mentorship_sessions').select('*').eq('participant_id', participant.id).order('session_date', { ascending: false }),
      supabase.from('executive_shadowing').select('*').eq('participant_id', participant.id).order('shadow_date', { ascending: false }),
      supabase.from('mentorship_journals').select('*').eq('participant_id', participant.id),
      supabase.from('leadership_projects').select('*').eq('participant_id', participant.id).maybeSingle(),
    ])

    setCircles(circlesRes.data || [])
    const attMap = {}
    ;(attRes.data || []).forEach(a => { attMap[a.circle_id] = a })
    setAttendance(attMap)
    setSessions(sessRes.data || [])
    setShadowing(shadowRes.data || [])

    const jMap = {}
    ;(journalRes.data || []).forEach(j => { jMap[j.month_number] = j })
    setJournals(jMap)

    const proj = projRes.data
    setProject(proj)
    if (proj) setProjectForm({ title: proj.title || '', area_of_responsibility: proj.area_of_responsibility || '', description: proj.description || '', status: proj.status || 'planning', outcomes: proj.outcomes || '' })
    setLoading(false)
  }

  useEffect(() => {
    const j = journals[journalMonth]
    setJournalForm(j ? { lessons_learned: j.lessons_learned || '', leadership_challenges: j.leadership_challenges || '', leadership_successes: j.leadership_successes || '', mistakes_insights: j.mistakes_insights || '', next_month_commitments: j.next_month_commitments || '' } : EMPTY_JOURNAL)
  }, [journalMonth, journals])

  async function saveJournal() {
    if (!Object.values(journalForm).some(v => v.trim())) { toast.error('Write at least one entry'); return }
    setSavingJournal(true)
    try {
      const { error } = await supabase.from('mentorship_journals').upsert(
        { participant_id: participant.id, month_number: journalMonth, ...journalForm, submitted_at: new Date().toISOString() },
        { onConflict: 'participant_id,month_number' }
      )
      if (error) throw error
      toast.success('Journal saved')
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSavingJournal(false) }
  }

  async function saveProject() {
    if (!projectForm.title.trim()) { toast.error('Add a project title'); return }
    setSavingProject(true)
    try {
      const payload = { ...projectForm, submitted_at: projectForm.status === 'completed' ? new Date().toISOString() : null }
      if (project) {
        const { error } = await supabase.from('leadership_projects').update(payload).eq('id', project.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('leadership_projects').insert({ participant_id: participant.id, ...payload })
        if (error) throw error
      }
      toast.success('Project saved')
      setEditingProject(false)
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSavingProject(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const circleByMonth = {}
  circles.forEach(c => { circleByMonth[c.month_number] = c })
  const circlesAttended = circles.filter(c => attendance[c.id]?.attended).length
  const journalCount   = Object.keys(journals).length

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mentorship Programme</h1>
        <p className="text-sm text-gray-500 mb-6">July – December 2026 · 6-month leadership development</p>

        {/* Mentor card */}
        <div className={`rounded-2xl p-5 mb-5 ${mentor ? 'bg-[#0A3480] text-white' : 'bg-gray-100'}`}>
          {mentor ? (
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <User size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide mb-0.5">Your EXCO Mentor</p>
                <p className="text-lg font-bold">{mentor.name}</p>
                {mentor.focus_area && <p className="text-blue-200 text-sm mt-0.5">{mentor.focus_area}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Mentor not yet assigned.</p>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Users size={16} className="text-[#0F52BA]" />,    label: 'Circle Sessions', value: `${circlesAttended}/6` },
            { icon: <Calendar size={16} className="text-[#0F52BA]" />, label: '1:1 Sessions',    value: sessions.length },
            { icon: <BookOpen size={16} className="text-[#0F52BA]" />, label: 'Journal Entries', value: `${journalCount}/6` },
          ].map(s => (
            <div key={s.label} className="card py-3 text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {[['programme', 'Programme'], ['journal', 'Journal'], ['project', 'Project']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── PROGRAMME TAB ── */}
        {tab === 'programme' && (
          <div className="space-y-5">
            {/* Monthly circles */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-1">Monthly Mentor Circles</h2>
              <p className="text-xs text-gray-400 mb-4">90-minute group sessions with your mentor and circle members</p>
              <div className="space-y-0">
                {MONTHS.map((m, i) => {
                  const mn = i + 1
                  const circle = circleByMonth[mn]
                  const att = circle ? attendance[circle.id] : null
                  const attended = att?.attended
                  const logged = !!circle
                  return (
                    <div key={mn} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${attended ? 'bg-green-100 text-green-700' : logged ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                        {mn}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{m} 2026</p>
                        {circle?.session_date && (
                          <p className="text-xs text-gray-400">
                            {new Date(circle.session_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${attended ? 'bg-green-100 text-green-700' : logged ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                        {attended ? 'Attended' : logged ? 'Missed' : 'Upcoming'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 1:1 sessions */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-1">
                Quarterly 1:1 Coaching <span className="text-gray-400 font-normal">({sessions.length})</span>
              </h2>
              <p className="text-xs text-gray-400 mb-4">Individual sessions focused on your personal leadership growth</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No 1:1 sessions logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={13} className="text-[#0F52BA]" />
                        <span className="text-sm font-semibold text-gray-800">
                          {new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      {s.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {s.topics.map(t => <span key={t} className="badge-blue">{t}</span>)}
                        </div>
                      )}
                      {s.notes && <p className="text-sm text-gray-600">{s.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Executive shadowing */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-1">Executive Shadowing</h2>
              <p className="text-xs text-gray-400 mb-4">Observe your mentor in significant leadership engagements</p>
              {shadowing.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No shadowing sessions logged yet. Your mentor will record these as they happen.</p>
              ) : (
                <div className="space-y-3">
                  {shadowing.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{ENGAGEMENT_LABELS[s.engagement_type] || 'Shadowing Session'}</span>
                        <span className="text-xs text-gray-400">
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

        {/* ── JOURNAL TAB ── */}
        {tab === 'journal' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Write your monthly leadership journal. Be honest and reflective — this is your personal development record.</p>
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {MONTHS.map((m, i) => {
                const mn = i + 1
                const has = !!journals[mn]
                const active = journalMonth === mn
                return (
                  <button key={mn} onClick={() => setJournalMonth(mn)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${active ? 'bg-[#0F52BA] text-white' : has ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0F52BA]'}`}>
                    {m.slice(0, 3)}{has && !active ? ' ✓' : ''}
                  </button>
                )
              })}
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">{MONTHS[journalMonth - 1]} 2026</h2>
                {journals[journalMonth] && (
                  <span className="text-xs text-gray-400">
                    Saved {new Date(journals[journalMonth].submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {JOURNAL_PROMPTS.map(p => (
                  <div key={p.key}>
                    <label className="label">{p.label}</label>
                    <textarea className="input" rows={3}
                      value={journalForm[p.key] || ''}
                      onChange={e => setJournalForm(f => ({ ...f, [p.key]: e.target.value }))}
                      placeholder={p.placeholder} />
                  </div>
                ))}
                <button onClick={saveJournal} disabled={savingJournal} className="btn-primary w-full">
                  {savingJournal ? 'Saving...' : journals[journalMonth] ? 'Update Journal Entry' : 'Save Journal Entry'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PROJECT TAB ── */}
        {tab === 'project' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Undertake a practical leadership project within your area of responsibility. You will present outcomes at the end of the mentorship cycle.
            </p>

            {(!project || editingProject) ? (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">{project ? 'Update Project' : 'Define Your Leadership Project'}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Project Title *</label>
                    <input className="input" value={projectForm.title}
                      onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Redesign team communication process" />
                  </div>
                  <div>
                    <label className="label">Area of Responsibility</label>
                    <input className="input" value={projectForm.area_of_responsibility}
                      onChange={e => setProjectForm(f => ({ ...f, area_of_responsibility: e.target.value }))}
                      placeholder="e.g. Sales, Digital Transformation, HR" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input" rows={3} value={projectForm.description}
                      onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="What problem are you solving? What does success look like?" />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={projectForm.status}
                      onChange={e => setProjectForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="planning">Planning</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  {(projectForm.status === 'completed') && (
                    <div>
                      <label className="label">Outcomes & Results</label>
                      <textarea className="input" rows={4} value={projectForm.outcomes}
                        onChange={e => setProjectForm(f => ({ ...f, outcomes: e.target.value }))}
                        placeholder="What did you achieve? What impact did it have? What did you learn?" />
                    </div>
                  )}
                  <div className="flex gap-3">
                    {editingProject && (
                      <button type="button" onClick={() => setEditingProject(false)} className="btn-secondary flex-1">Cancel</button>
                    )}
                    <button onClick={saveProject} disabled={savingProject} className="btn-primary flex-1">
                      {savingProject ? 'Saving...' : 'Save Project'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${STATUS_COLORS[project.status]}`}>
                      {STATUS_LABELS[project.status]}
                    </span>
                    <h2 className="font-bold text-gray-900 text-lg">{project.title}</h2>
                    {project.area_of_responsibility && (
                      <p className="text-sm text-gray-500 mt-0.5">{project.area_of_responsibility}</p>
                    )}
                  </div>
                  <button onClick={() => setEditingProject(true)} className="text-xs text-[#0F52BA] font-semibold hover:underline ml-3 shrink-0">Edit</button>
                </div>
                {project.description && <p className="text-sm text-gray-700 leading-relaxed mb-3">{project.description}</p>}
                {project.outcomes && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 mt-2">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Outcomes & Results</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{project.outcomes}</p>
                  </div>
                )}
                {project.submitted_at && (
                  <p className="text-xs text-gray-400 mt-3">
                    Completed {new Date(project.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
