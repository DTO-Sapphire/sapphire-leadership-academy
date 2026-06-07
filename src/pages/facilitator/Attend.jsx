import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'

export default function FacilitatorAttend() {
  const [sessions, setSessions] = useState([])
  const [participants, setParticipants] = useState([])
  const [attendance, setAttendance] = useState({})
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: sess }, { data: parts }, { data: att }] = await Promise.all([
      supabase.from('sessions').select('*').order('session_number'),
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('attendance').select('participant_id, session_id, attended'),
    ])
    setSessions(sess || [])
    setParticipants(parts || [])
    const attMap = {}
    ;(att || []).forEach(a => { attMap[`${a.participant_id}_${a.session_id}`] = a.attended })
    setAttendance(attMap)
    if (sess?.length > 0 && !selectedSession) setSelectedSession(sess[0].id)
    setLoading(false)
  }

  async function toggleAttendance(participantId, sessionId, current) {
    const key = `${participantId}_${sessionId}`
    setSaving(key)
    if (current !== undefined) {
      const { error } = await supabase.from('attendance')
        .update({ attended: !current })
        .eq('participant_id', participantId).eq('session_id', sessionId)
      if (error) { toast.error(error.message); setSaving(null); return }
      setAttendance(a => ({ ...a, [key]: !current }))
    } else {
      const { error } = await supabase.from('attendance')
        .insert({ participant_id: participantId, session_id: sessionId, attended: true })
      if (error) { toast.error(error.message); setSaving(null); return }
      setAttendance(a => ({ ...a, [key]: true }))
    }
    setSaving(null)
  }

  async function markAll(present) {
    if (!selectedSession) return
    setSaving('all')
    const toUpsert = participants.map(p => ({
      participant_id: p.id, session_id: selectedSession, attended: present
    }))
    const { error } = await supabase.from('attendance').upsert(toUpsert, { onConflict: 'participant_id,session_id' })
    if (error) toast.error(error.message)
    else {
      toast.success(present ? 'All marked present' : 'All marked absent')
      const newAtt = { ...attendance }
      participants.forEach(p => { newAtt[`${p.id}_${selectedSession}`] = present })
      setAttendance(newAtt)
    }
    setSaving(null)
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  const session = sessions.find(s => s.id === selectedSession)
  const presentCount = participants.filter(p => attendance[`${p.id}_${selectedSession}`]).length

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mark Attendance</h1>

        <div className="card mb-6">
          <label className="label">Select Session</label>
          <select className="input" value={selectedSession || ''} onChange={e => setSelectedSession(e.target.value)}>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                Session {s.session_number}: {s.title} — {new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </option>
            ))}
          </select>
          {selectedSession && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{presentCount} / {participants.length} present</span>
              <div className="flex gap-2">
                <button disabled={saving === 'all'} onClick={() => markAll(true)} className="btn-primary text-xs px-3 py-1.5">Mark All Present</button>
                <button disabled={saving === 'all'} onClick={() => markAll(false)} className="btn-secondary text-xs px-3 py-1.5">Clear All</button>
              </div>
            </div>
          )}
        </div>

        {selectedSession && (
          <div className="card">
            <div className="grid gap-2">
              {participants.map(p => {
                const key = `${p.id}_${selectedSession}`
                const present = attendance[key]
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.department}</p>
                    </div>
                    <button
                      disabled={saving === key}
                      onClick={() => toggleAttendance(p.id, selectedSession, present)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${present ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {present ? 'Present' : 'Absent'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
