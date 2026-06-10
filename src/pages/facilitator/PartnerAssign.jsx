import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Users } from 'lucide-react'

export default function PartnerAssign() {
  const [participants, setParticipants] = useState([])
  const [partners, setPartners] = useState({})
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: parts } = await supabase
      .from('participants')
      .select('id, name, department, accountability_partner_id')
      .order('name')
    setParticipants(parts || [])
    const map = {}
    ;(parts || []).forEach(p => { map[p.id] = p.accountability_partner_id || '' })
    setPartners(map)
    setLoading(false)
  }

  async function assign(participantId, partnerId) {
    setSaving(participantId)
    const { error } = await supabase
      .from('participants')
      .update({ accountability_partner_id: partnerId || null })
      .eq('id', participantId)
    if (error) toast.error(error.message)
    else {
      setPartners(p => ({ ...p, [participantId]: partnerId }))
      toast.success('Partner assigned')
    }
    setSaving(null)
  }

  const pairedCount = Object.values(partners).filter(Boolean).length

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Accountability Partners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign each participant their accountability partner. Partners can see and comment on each other's commitments and give peer feedback.
          </p>
        </div>

        <div className="card mb-6 flex items-center gap-3">
          <Users size={20} className="text-[#0F52BA] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {pairedCount} of {participants.length} participants have a partner assigned
            </p>
            <p className="text-xs text-gray-400">Set both sides of each pair — A → B and B → A</p>
          </div>
        </div>

        <div className="card">
          <div className="space-y-0">
            {participants.map((p, i) => {
              const partnerName = participants.find(op => op.id === partners[p.id])?.name
              return (
                <div key={p.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 ${i < participants.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#0F52BA]/10 flex items-center justify-center text-xs font-bold text-[#0F52BA] shrink-0">
                      {p.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {saving === p.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0F52BA]" />
                    )}
                    <select
                      className="input text-sm py-1.5 w-full sm:w-auto sm:min-w-[200px]"
                      value={partners[p.id] || ''}
                      disabled={saving === p.id}
                      onChange={e => assign(p.id, e.target.value)}>
                      <option value="">— No partner —</option>
                      {participants.filter(op => op.id !== p.id).map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pairs summary */}
        {pairedCount > 0 && (
          <div className="card mt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Current Pairs</p>
            <div className="space-y-1.5">
              {participants.filter(p => partners[p.id]).map(p => {
                const partnerName = participants.find(op => op.id === partners[p.id])?.name
                return (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-800 font-medium w-40 truncate">{p.name}</span>
                    <span className="text-gray-400 text-xs">↔</span>
                    <span className="text-gray-600">{partnerName || '—'}</span>
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
