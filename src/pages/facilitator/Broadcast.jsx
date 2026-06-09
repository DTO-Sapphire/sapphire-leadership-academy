import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Send, Users, Eye, EyeOff } from 'lucide-react'

const TYPES = [
  { key: 'all',                label: 'All participants' },
  { key: 'session_attended',   label: 'Attended a session' },
  { key: 'missing_reflection', label: 'Missing reflection for a session' },
  { key: 'missing_assignment', label: 'Missing assignment for a week' },
]

export default function Broadcast() {
  const [type, setType] = useState('all')
  const [sessions, setSessions] = useState([])
  const [weeks, setWeeks] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [weekId, setWeekId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipients, setRecipients] = useState([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [showList, setShowList] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    supabase.from('sessions').select('id, session_number, title, session_date').order('session_number')
      .then(({ data }) => setSessions(data || []))
    supabase.from('weekly_assignments').select('id, week_number, title').order('week_number')
      .then(({ data }) => setWeeks(data || []))
  }, [])

  useEffect(() => {
    setRecipients([])
    setResult(null)
    if (type === 'all') loadAll()
    else if (type === 'session_attended' && sessionId) loadSessionAttended()
    else if (type === 'missing_reflection' && sessionId) loadMissingReflection()
    else if (type === 'missing_assignment' && weekId) loadMissingAssignment()
  }, [type, sessionId, weekId])

  async function loadAll() {
    setLoadingRecipients(true)
    const { data } = await supabase.from('participants').select('id, name, email').order('name')
    setRecipients((data || []).filter(p => p.email))
    setLoadingRecipients(false)
  }

  async function loadSessionAttended() {
    setLoadingRecipients(true)
    const { data: att } = await supabase.from('attendance').select('participant_id, participants(id, name, email)').eq('session_id', sessionId)
    setRecipients((att || []).map(a => a.participants).filter(p => p?.email))
    setLoadingRecipients(false)
  }

  async function loadMissingReflection() {
    setLoadingRecipients(true)
    const [{ data: all }, { data: reflected }] = await Promise.all([
      supabase.from('participants').select('id, name, email').order('name'),
      supabase.from('reflections').select('participant_id').eq('session_id', sessionId),
    ])
    const reflectedIds = new Set((reflected || []).map(r => r.participant_id))
    setRecipients((all || []).filter(p => p.email && !reflectedIds.has(p.id)))
    setLoadingRecipients(false)
  }

  async function loadMissingAssignment() {
    setLoadingRecipients(true)
    const [{ data: all }, { data: submitted }] = await Promise.all([
      supabase.from('participants').select('id, name, email').order('name'),
      supabase.from('assignment_submissions').select('participant_id').eq('assignment_id', weekId),
    ])
    const submittedIds = new Set((submitted || []).map(s => s.participant_id))
    setRecipients((all || []).filter(p => p.email && !submittedIds.has(p.id)))
    setLoadingRecipients(false)
  }

  async function send() {
    if (!subject.trim()) { toast.error('Subject is required'); return }
    if (!body.trim()) { toast.error('Message body is required'); return }
    if (!recipients.length) { toast.error('No recipients selected'); return }

    setSending(true)
    setResult(null)
    try {
      const secret = import.meta.env.VITE_BROADCAST_SECRET
      const resp = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
        body: JSON.stringify({ recipients, subject, body }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Failed to send')
      setResult(data)
      toast.success(`Sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const needsSession = type === 'session_attended' || type === 'missing_reflection'
  const needsWeek = type === 'missing_assignment'
  const ready = recipients.length > 0 && subject.trim() && body.trim()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Broadcast Email</h1>
          <p className="text-sm text-gray-500 mt-1">Send an email to a group of participants. Replies go to sapphire.leadership.academy1@gmail.com.</p>
        </div>

        {/* Recipients */}
        <div className="card mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Who are you emailing?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {TYPES.map(t => (
              <button key={t.key} onClick={() => { setType(t.key); setSessionId(''); setWeekId('') }}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${type === t.key ? 'border-[#0F52BA] bg-[#0F52BA]/5 text-[#0F52BA]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {needsSession && (
            <select className="input text-sm" value={sessionId} onChange={e => setSessionId(e.target.value)}>
              <option value="">— Select a session —</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>Session {s.session_number} · {s.title}</option>
              ))}
            </select>
          )}

          {needsWeek && (
            <select className="input text-sm" value={weekId} onChange={e => setWeekId(e.target.value)}>
              <option value="">— Select a week —</option>
              {weeks.map(w => (
                <option key={w.id} value={w.id}>Week {w.week_number} · {w.title}</option>
              ))}
            </select>
          )}

          {!loadingRecipients && recipients.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={15} />
                <span><strong className="text-gray-900">{recipients.length}</strong> recipient{recipients.length !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={() => setShowList(v => !v)}
                className="flex items-center gap-1.5 text-xs text-[#0F52BA] font-semibold hover:underline">
                {showList ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Preview list</>}
              </button>
            </div>
          )}
          {loadingRecipients && <p className="mt-3 text-xs text-gray-400">Loading recipients...</p>}
          {!loadingRecipients && (type === 'all' || (needsSession && sessionId) || (needsWeek && weekId)) && recipients.length === 0 && (
            <p className="mt-3 text-xs text-amber-600 font-medium">No recipients found for this selection.</p>
          )}

          {showList && recipients.length > 0 && (
            <div className="mt-3 border border-gray-100 rounded-lg overflow-hidden">
              {recipients.map((r, i) => (
                <div key={r.id} className={`flex items-center justify-between px-3 py-2 text-sm ${i < recipients.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className="font-medium text-gray-900">{r.name}</span>
                  <span className="text-gray-400 text-xs">{r.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="card mb-4">
          <label className="label">Subject</label>
          <input className="input" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Well done on Session 1 — Sapphire Leadership Academy" />
        </div>

        {/* Body */}
        <div className="card mb-6">
          <label className="label">Message</label>
          <p className="text-xs text-gray-400 mb-2">Start after "Hi [Name]," — that greeting is added automatically for each recipient.</p>
          <textarea className="input" rows={10} value={body} onChange={e => setBody(e.target.value)}
            placeholder={`Congratulations on completing the first session of the Sapphire Leadership Academy. It was great to have you in the room today.\n\nAs a next step, please log in to the portal and submit your reflection for Session 1.\n\nSee you at the next session.`} />
        </div>

        {result && (
          <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium ${result.failed === 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
            {result.sent} email{result.sent !== 1 ? 's' : ''} sent successfully{result.failed > 0 ? `, ${result.failed} failed` : ''}.
          </div>
        )}

        <button onClick={send} disabled={sending || !ready}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
          <Send size={16} />
          {sending ? 'Sending...' : !ready ? 'Complete the form above to send' : `Send to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`}
        </button>

      </div>
    </div>
  )
}
