import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'

const FIELDS = [
  { key: 'growth_score',      label: 'Growth',            max: 30, desc: 'Pre/post assessment improvement' },
  { key: 'attendance_score',  label: 'Attendance',        max: 20, desc: 'Sessions attended' },
  { key: 'reflections_score', label: 'Reflections',       max: 25, desc: 'Quality of session reflections' },
  { key: 'assignments_score', label: 'Assignments',       max: 15, desc: 'Weekly assignment completion' },
  { key: 'facilitator_rating',label: 'Facilitator Rating',max: 10, desc: 'EXCO subjective rating' },
]

export default function FacilitatorScorecard() {
  const [participants, setParticipants] = useState([])
  const [scorecards, setScorecards] = useState({})
  const [edits, setEdits] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: parts }, { data: scores }] = await Promise.all([
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('scorecard').select('*'),
    ])
    setParticipants(parts || [])
    const scoreMap = {}
    ;(scores || []).forEach(s => { scoreMap[s.participant_id] = s })
    setScorecards(scoreMap)
    setLoading(false)
  }

  function getEdits(participantId) {
    const s = scorecards[participantId] || {}
    return edits[participantId] || {
      growth_score: s.growth_score ?? 0,
      attendance_score: s.attendance_score ?? 0,
      reflections_score: s.reflections_score ?? 0,
      assignments_score: s.assignments_score ?? 0,
      facilitator_rating: s.facilitator_rating ?? 0,
    }
  }

  function updateEdit(participantId, field, value) {
    const max = FIELDS.find(f => f.key === field)?.max || 0
    const clamped = Math.min(max, Math.max(0, parseFloat(value) || 0))
    setEdits(e => ({ ...e, [participantId]: { ...getEdits(participantId), [field]: clamped } }))
  }

  async function save(participantId) {
    setSaving(participantId)
    const data = getEdits(participantId)
    const existing = scorecards[participantId]
    let error
    if (existing) {
      ({ error } = await supabase.from('scorecard').update({ ...data, updated_at: new Date().toISOString() }).eq('participant_id', participantId))
    } else {
      ({ error } = await supabase.from('scorecard').insert({ participant_id: participantId, ...data }))
    }
    if (error) toast.error(error.message)
    else { toast.success('Scorecard saved!'); await load(); setEdits(e => { const n = { ...e }; delete n[participantId]; return n }) }
    setSaving(null)
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F4E79]" /></div></div>

  const selectedParticipant = participants.find(p => p.id === selected)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Leadership Scorecards</h1>

        {/* Summary table */}
        <div className="card mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">Participant</th>
              <th className="text-right py-2 text-gray-500 font-medium">Growth</th>
              <th className="text-right py-2 text-gray-500 font-medium">Attend.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Reflect.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Assign.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Fac.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Total</th>
              <th className="text-right py-2 text-gray-500 font-medium">Status</th>
              <th className="py-2" />
            </tr></thead>
            <tbody>
              {participants.map(p => {
                const s = scorecards[p.id] || {}
                const total = (s.total_score || 0)
                return (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selected === p.id ? 'bg-blue-50' : ''}`}>
                    <td className="py-2 font-medium">{p.name}<div className="text-xs text-gray-400">{p.department}</div></td>
                    <td className="py-2 text-right text-gray-600">{s.growth_score ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.attendance_score ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.reflections_score ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.assignments_score ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.facilitator_rating ?? '—'}</td>
                    <td className="py-2 text-right font-bold text-gray-900">{s.total_score ? s.total_score.toFixed(1) : '—'}</td>
                    <td className="py-2 text-right">
                      {s.total_score ? (
                        <span className={s.graduated ? 'badge-green' : 'badge-red'}>
                          {s.graduated ? 'Pass' : 'Below 75'}
                        </span>
                      ) : <span className="badge-gray">Not set</span>}
                    </td>
                    <td className="py-2 pl-2">
                      <button onClick={() => setSelected(selected === p.id ? null : p.id)} className="text-xs text-[#1F4E79] font-medium hover:underline">Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Edit panel */}
        {selected && selectedParticipant && (
          <div className="card border-2 border-[#1F4E79]">
            <h2 className="font-bold text-gray-900 mb-4">Editing: {selectedParticipant.name}</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {FIELDS.map(f => {
                const val = getEdits(selected)[f.key]
                return (
                  <div key={f.key}>
                    <label className="label">{f.label} <span className="text-gray-400 font-normal">/ {f.max}</span></label>
                    <p className="text-xs text-gray-400 mb-1">{f.desc}</p>
                    <input type="number" className="input" min={0} max={f.max} step="0.5" value={val}
                      onChange={e => updateEdit(selected, f.key, e.target.value)} />
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Projected Total: </span>
                <span className="font-bold text-gray-900">
                  {FIELDS.reduce((sum, f) => sum + (parseFloat(getEdits(selected)[f.key]) || 0), 0).toFixed(1)} / 100
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => save(selected)} disabled={saving === selected} className="btn-primary">
                  {saving === selected ? 'Saving...' : 'Save Scorecard'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
