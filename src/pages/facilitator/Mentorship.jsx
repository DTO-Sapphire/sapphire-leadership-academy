import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Calendar, Users } from 'lucide-react'

const TOPICS = [
  'Goal Setting', 'Career Development', 'Leadership Skills', 'Performance Issues',
  'Team Dynamics', 'Conflict Resolution', 'Communication', 'Strategic Thinking',
  'Work-Life Balance', 'Other',
]

export default function FacilitatorMentorship() {
  const { facilitator } = useAuth()
  const [participants, setParticipants] = useState([])
  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState({ participant_id: '', session_date: '', notes: '', topics: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: parts }, { data: sess }] = await Promise.all([
      supabase.from('participants').select('id, name, department, mentor_id').order('name'),
      supabase.from('mentorship_sessions').select('*, participants(name), facilitators(name)').order('session_date', { ascending: false }),
    ])
    setParticipants(parts || [])
    setSessions(sess || [])
    setLoading(false)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.participant_id || !form.session_date) { toast.error('Select participant and date'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('mentorship_sessions').insert({
        participant_id: form.participant_id,
        facilitator_id: facilitator.id,
        session_date: form.session_date,
        notes: form.notes || null,
        topics: form.topics.length > 0 ? form.topics : null,
      })
      if (error) throw error
      toast.success('Mentorship session logged')
      setForm({ participant_id: '', session_date: '', notes: '', topics: [] })
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleTopic(topic) {
    setForm(f => ({
      ...f, topics: f.topics.includes(topic)
        ? f.topics.filter(t => t !== topic)
        : [...f.topics, topic]
    }))
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mentorship Sessions</h1>

        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Log a 1-on-1 Session</h2>
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Participant *</label>
                <select className="input" value={form.participant_id}
                  onChange={e => setForm(f => ({ ...f, participant_id: e.target.value }))}>
                  <option value="">Select participant...</option>
                  {participants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.department})</option>)}
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
                  <button type="button" key={t}
                    onClick={() => toggleTopic(t)}
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
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Log Session'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Session History ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No sessions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#0F52BA]" />
                      <span className="font-semibold text-gray-900">{s.participants?.name}</span>
                      <span className="text-xs text-gray-400">with {s.facilitators?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Calendar size={12} />
                      <span>{new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
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
      </div>
    </div>
  )
}
