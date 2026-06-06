import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'

const AWARDS = [
  { type: 'emerging_leader',      label: '🌱 Emerging Leader',         desc: 'Most promising new leader in the cohort' },
  { type: 'most_improved',        label: '📈 Most Improved',            desc: 'Greatest growth from baseline to final' },
  { type: 'leadership_excellence',label: '🏆 Leadership Excellence',    desc: 'Outstanding overall leadership demonstration' },
  { type: 'best_mentor_mentee',   label: '🤝 Best Mentor-Mentee',       desc: 'Strongest mentorship relationship in the cohort' },
  { type: 'culture_champion',     label: '🌟 Culture Champion',         desc: 'Best embodiment of Sapphire values' },
]

export default function FacilitatorAwards() {
  const { facilitator } = useAuth()
  const [participants, setParticipants] = useState([])
  const [awards, setAwards] = useState({})
  const [selections, setSelections] = useState({})
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: parts }, { data: aw }] = await Promise.all([
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('awards').select('*, participants(name), facilitators(name)'),
    ])
    setParticipants(parts || [])
    const awMap = {}
    ;(aw || []).forEach(a => { awMap[a.award_type] = a })
    setAwards(awMap)
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
          participant_id: participantId, awarded_by: facilitator.id, notes: notes[awardType] || null
        }).eq('id', existing.id))
      } else {
        ({ error } = await supabase.from('awards').insert({
          award_type: awardType, participant_id: participantId,
          awarded_by: facilitator.id, notes: notes[awardType] || null
        }))
      }
      if (error) throw error
      toast.success('Award assigned!')
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Graduation Awards</h1>
        <p className="text-gray-500 text-sm mb-6">Assign one winner per award category for the graduation ceremony.</p>
        <div className="space-y-4">
          {AWARDS.map(award => {
            const existing = awards[award.type]
            return (
              <div key={award.type} className={`card ${existing ? 'border-2 border-amber-300' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{award.label}</h3>
                    <p className="text-sm text-gray-500">{award.desc}</p>
                  </div>
                  {existing && <span className="badge-yellow shrink-0">Assigned</span>}
                </div>
                {existing ? (
                  <div className="bg-amber-50 rounded-lg p-3 mb-3">
                    <p className="font-semibold text-amber-800">{existing.participants?.name}</p>
                    {existing.notes && <p className="text-sm text-amber-700 mt-1">{existing.notes}</p>}
                    <p className="text-xs text-amber-600 mt-1">Awarded by {existing.facilitators?.name}</p>
                  </div>
                ) : null}
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
                    {saving === award.type ? 'Saving...' : existing ? 'Update Award' : 'Assign Award'}
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
