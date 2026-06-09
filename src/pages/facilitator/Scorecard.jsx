import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'

const FIELDS = [
  { key: 'attendance_score',      label: 'Attendance',         max: 10, desc: 'Sessions attended out of 12' },
  { key: 'participation_score',   label: 'Participation',      max: 15, desc: 'EXCO rating of engagement and contribution' },
  { key: 'assignment_score',      label: 'Assignments',        max: 20, desc: 'Weekly assignment completion and quality' },
  { key: 'mentorship_score',      label: 'Mentorship',         max: 15, desc: 'Mentorship participation and engagement' },
  { key: 'peer_feedback_score',   label: 'Peer Feedback',      max: 10, desc: '360° rating from cohort peers' },
  { key: 'self_assessment_score', label: 'Self-Assessment',    max: 10, desc: 'Pre/post assessment growth score' },
  { key: 'manager_score',         label: 'Manager Assessment', max: 20, desc: 'Direct manager evaluation' },
]

export default function FacilitatorScorecard() {
  const [participants, setParticipants] = useState([])
  const [scorecards, setScorecards] = useState({})
  const [edits, setEdits] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [selected, setSelected] = useState(null)
  const [computed, setComputed] = useState({})

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
      attendance_score:      s.attendance_score      ?? 0,
      participation_score:   s.participation_score   ?? 0,
      assignment_score:      s.assignment_score      ?? 0,
      mentorship_score:      s.mentorship_score      ?? 0,
      peer_feedback_score:   s.peer_feedback_score   ?? 0,
      self_assessment_score: s.self_assessment_score ?? 0,
      manager_score:         s.manager_score         ?? 0,
    }
  }

  function updateEdit(participantId, field, value) {
    const max = FIELDS.find(f => f.key === field)?.max || 0
    const clamped = Math.min(max, Math.max(0, parseFloat(value) || 0))
    setEdits(e => ({ ...e, [participantId]: { ...getEdits(participantId), [field]: clamped } }))
  }

  useEffect(() => {
    if (!selected) { setComputed({}); return }
    loadComputed(selected)
  }, [selected])

  async function loadComputed(participantId) {
    const [{ data: peers }, { data: mgr }] = await Promise.all([
      supabase.from('peer_feedback').select('rating').eq('recipient_id', participantId),
      supabase.from('manager_assessments').select('leadership_growth, delegation_empowerment, communication_influence, accountability_execution, coaching_others').eq('participant_id', participantId).eq('submitted', true).single(),
    ])
    const result = {}
    if (peers?.length > 0) {
      const avg = peers.reduce((s, r) => s + r.rating, 0) / peers.length
      result.peer_feedback_score = parseFloat(((avg / 5) * 10).toFixed(1))
      result.peer_count = peers.length
    }
    if (mgr) {
      result.manager_score = (mgr.leadership_growth || 0) + (mgr.delegation_empowerment || 0) + (mgr.communication_influence || 0) + (mgr.accountability_execution || 0) + (mgr.coaching_others || 0)
    }
    setComputed(result)
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

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

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
              <th className="text-right py-2 text-gray-500 font-medium">Attend.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Partic.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Assign.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Mentor.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Peer</th>
              <th className="text-right py-2 text-gray-500 font-medium">Self</th>
              <th className="text-right py-2 text-gray-500 font-medium">Mgr.</th>
              <th className="text-right py-2 text-gray-500 font-medium">Total</th>
              <th className="text-right py-2 text-gray-500 font-medium">Status</th>
              <th className="py-2" />
            </tr></thead>
            <tbody>
              {participants.map(p => {
                const s = scorecards[p.id] || {}
                return (
                  <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selected === p.id ? 'bg-blue-50' : ''}`}>
                    <td className="py-2 font-medium">{p.name}<div className="text-xs text-gray-400">{p.department}</div></td>
                    <td className="py-2 text-right text-gray-600">{s.attendance_score      ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.participation_score   ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.assignment_score      ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.mentorship_score      ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.peer_feedback_score   ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.self_assessment_score ?? '—'}</td>
                    <td className="py-2 text-right text-gray-600">{s.manager_score         ?? '—'}</td>
                    <td className="py-2 text-right font-bold text-gray-900">{s.total_score ? s.total_score.toFixed(1) : '—'}</td>
                    <td className="py-2 text-right">
                      {s.total_score ? (
                        <span className={s.graduated ? 'badge-green' : 'badge-red'}>
                          {s.graduated ? 'Pass' : 'Below 75'}
                        </span>
                      ) : <span className="badge-gray">Not set</span>}
                    </td>
                    <td className="py-2 pl-2">
                      <button onClick={() => setSelected(selected === p.id ? null : p.id)} className="text-xs text-[#0F52BA] font-medium hover:underline">Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Edit panel */}
        {selected && selectedParticipant && (
          <div className="card border-2 border-[#0F52BA]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Editing: {selectedParticipant.name}</h2>
              <Link to="/facilitator/manager-assessments" className="text-xs text-[#0F52BA] font-semibold hover:underline">
                Manager Assessments →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {FIELDS.map(f => {
                const val = getEdits(selected)[f.key]
                const computedVal = computed[f.key]
                const isPeer = f.key === 'peer_feedback_score'
                const isMgr  = f.key === 'manager_score'
                return (
                  <div key={f.key}>
                    <div className="flex items-center justify-between">
                      <label className="label">{f.label} <span className="text-gray-400 font-normal">/ {f.max}</span></label>
                      {computedVal !== undefined && (
                        <button type="button"
                          onClick={() => updateEdit(selected, f.key, computedVal)}
                          className="text-xs text-[#0F52BA] font-semibold hover:underline mb-1">
                          Use {computedVal}{isPeer && computed.peer_count ? ` (${computed.peer_count} ratings)` : ''}
                        </button>
                      )}
                    </div>
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
