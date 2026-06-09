import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Lightbulb } from 'lucide-react'

function avg(scores) {
  if (!scores) return null
  const vals = Object.values(scores).map(Number).filter(v => !isNaN(v) && v > 0)
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
}

const AWARDS = [
  { type: 'emerging_leader',       label: 'Emerging Leader',         desc: 'Most promising new leader in the cohort' },
  { type: 'most_improved',         label: 'Most Improved',            desc: 'Greatest growth from baseline to final assessment' },
  { type: 'leadership_excellence', label: 'Leadership Excellence',    desc: 'Outstanding overall leadership during the programme' },
  { type: 'best_mentor_mentee',    label: 'Best Mentor–Mentee',       desc: 'Strongest mentorship relationship in the cohort' },
  { type: 'culture_champion',      label: 'Culture Champion',         desc: 'Best embodiment of Sapphire values' },
]

export default function FacilitatorAwards() {
  const [participants, setParticipants] = useState([])
  const [awards, setAwards] = useState({})
  const [selections, setSelections] = useState({})
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)
  const [suggestions, setSuggestions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: parts }, { data: aw }, { data: assessments }, { data: attendance }, { data: reflections }, { data: sessions }] = await Promise.all([
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('awards').select('*, participants(name)'),
      supabase.from('assessments').select('participant_id, type, scores'),
      supabase.from('attendance').select('participant_id, session_id'),
      supabase.from('reflections').select('participant_id'),
      supabase.from('sessions').select('id, session_date'),
    ])
    setParticipants(parts || [])
    const awMap = {}
    ;(aw || []).forEach(a => { awMap[a.category] = a })
    setAwards(awMap)

    const today = new Date()
    const heldIds = new Set((sessions || []).filter(s => new Date(s.session_date) <= today).map(s => s.id))
    const totalHeld = heldIds.size
    const stats = (parts || []).map(p => {
      const baseline = (assessments || []).find(a => a.participant_id === p.id && a.type === 'baseline')
      const final = (assessments || []).find(a => a.participant_id === p.id && a.type === 'final')
      const bAvg = avg(baseline?.scores); const fAvg = avg(final?.scores)
      const growth = bAvg != null && fAvg != null ? fAvg - bAvg : null
      const attended = (attendance || []).filter(a => a.participant_id === p.id && heldIds.has(a.session_id)).length
      const reflected = (reflections || []).filter(r => r.participant_id === p.id).length
      return { ...p, growth, attended, reflected }
    })
    const sugg = {}
    const topGrowth = [...stats].filter(p => p.growth != null).sort((a, b) => b.growth - a.growth)[0]
    if (topGrowth) sugg.most_improved = { name: topGrowth.name, reason: `Growth Index +${topGrowth.growth.toFixed(1)}` }
    const topAtt = [...stats].sort((a, b) => b.attended - a.attended)[0]
    if (topAtt && totalHeld > 0) sugg.emerging_leader = { name: topAtt.name, reason: `${topAtt.attended}/${totalHeld} sessions attended` }
    const topConsistent = [...stats].sort((a, b) => (b.attended + b.reflected) - (a.attended + a.reflected))[0]
    if (topConsistent) sugg.leadership_excellence = { name: topConsistent.name, reason: `${topConsistent.attended} sessions + ${topConsistent.reflected} reflections` }
    setSuggestions(sugg)
    setLoading(false)
  }

  async function saveAward(awardType) {
    const participantId = selections[awardType]
    if (!participantId) { toast.error('Select a participant first'); return }
    setSaving(awardType)
    try {
      const existing = awards[awardType]
      let error
      if (existing) {
        ({ error } = await supabase.from('awards').update({
          participant_id: participantId, notes: notes[awardType] || null
        }).eq('id', existing.id))
      } else {
        ({ error } = await supabase.from('awards').insert({
          category: awardType, participant_id: participantId,
          notes: notes[awardType] || null
        }))
      }
      if (error) throw error
      toast.success('Award saved')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Graduation Awards</h1>
        <p className="text-gray-500 text-sm mb-6">Assign one winner per category for the graduation ceremony.</p>

        {Object.keys(suggestions).length > 0 && (
          <div className="card mb-6 bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-amber-600" />
              <p className="font-semibold text-amber-800 text-sm">Data-Driven Suggestions</p>
            </div>
            <div className="space-y-2">
              {Object.entries(suggestions).map(([type, s]) => {
                const award = AWARDS.find(a => a.type === type)
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-amber-700"><strong>{award?.label}:</strong> {s.name}</span>
                    <span className="text-amber-600 text-xs">{s.reason}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-amber-600 mt-3">These are data-driven suggestions only — you decide the final winners.</p>
          </div>
        )}

        <div className="space-y-4">
          {AWARDS.map(award => {
            const existing = awards[award.type]
            const assigned = existing?.participant_id
            return (
              <div key={award.type} className={`card ${assigned ? 'border-2 border-amber-300' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{award.label}</h3>
                    <p className="text-sm text-gray-500">{award.desc}</p>
                  </div>
                  {assigned && <span className="badge-yellow shrink-0">Assigned</span>}
                </div>
                {assigned && (
                  <div className="bg-amber-50 rounded-lg p-3 mb-3">
                    <p className="font-semibold text-amber-800">{existing.participants?.name}</p>
                    {existing.notes && <p className="text-sm text-amber-700 mt-1">{existing.notes}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <select className="input" value={selections[award.type] || existing?.participant_id || ''}
                    onChange={e => setSelections(s => ({ ...s, [award.type]: e.target.value }))}>
                    <option value="">Select winner...</option>
                    {participants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.department})</option>)}
                  </select>
                  <textarea className="input" rows={2} placeholder="Notes (optional)"
                    value={notes[award.type] !== undefined ? notes[award.type] : (existing?.notes || '')}
                    onChange={e => setNotes(n => ({ ...n, [award.type]: e.target.value }))} />
                  <button onClick={() => saveAward(award.type)} disabled={saving === award.type} className="btn-gold w-full">
                    {saving === award.type ? 'Saving...' : assigned ? 'Update Award' : 'Assign Award'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
