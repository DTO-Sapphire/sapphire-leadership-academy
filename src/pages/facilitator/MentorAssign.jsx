import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { UserCheck, AlertCircle } from 'lucide-react'

export default function MentorAssign() {
  const [participants, setParticipants] = useState([])
  const [facilitators, setFacilitators] = useState([])
  const [assignments, setAssignments] = useState({})
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: parts }, { data: facs }] = await Promise.all([
      supabase.from('participants').select('id, name, department, mentor_id').order('name'),
      supabase.from('facilitators').select('id, name, role').order('name'),
    ])
    setParticipants(parts || [])
    setFacilitators((facs || []).filter(f => f.role !== 'coordinator'))
    const map = {}
    ;(parts || []).forEach(p => { map[p.id] = p.mentor_id || '' })
    setAssignments(map)
    setLoading(false)
  }

  async function assign(participantId, facilitatorId) {
    setSaving(participantId)
    const { error } = await supabase
      .from('participants')
      .update({ mentor_id: facilitatorId || null })
      .eq('id', participantId)
    if (error) {
      toast.error(error.message)
    } else {
      setAssignments(a => ({ ...a, [participantId]: facilitatorId }))
      toast.success('Assignment saved')
    }
    setSaving(null)
  }

  const assignedCount = Object.values(assignments).filter(Boolean).length
  const unassignedCount = participants.length - assignedCount

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mentor Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Assign each participant to an EXCO mentor for their monthly 1-on-1s. Changes save immediately.</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card flex items-center gap-3">
            <UserCheck size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Assigned</p>
              <p className="font-bold text-lg text-green-700">{assignedCount} / {participants.length}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <AlertCircle size={20} className={unassignedCount > 0 ? 'text-amber-500 shrink-0' : 'text-gray-300 shrink-0'} />
            <div>
              <p className="text-xs text-gray-500">Unassigned</p>
              <p className={`font-bold text-lg ${unassignedCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{unassignedCount}</p>
            </div>
          </div>
        </div>

        {/* Mentor load */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Mentor Load</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {facilitators.map(f => {
              const count = Object.values(assignments).filter(mid => mid === f.id).length
              return (
                <div key={f.id} className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800">{f.name}</span>
                  <span className={`text-sm font-bold ${count > 0 ? 'text-[#0F52BA]' : 'text-gray-400'}`}>
                    {count} mentee{count !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Assignment list */}
        <div className="card">
          <div className="space-y-0">
            {participants.map((p, i) => (
              <div
                key={p.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 ${i < participants.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#0F52BA]/10 flex items-center justify-center text-xs font-bold text-[#0F52BA] shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saving === p.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0F52BA]" />
                  )}
                  <select
                    className="input text-sm py-1.5 w-full sm:w-auto sm:max-w-[210px]"
                    value={assignments[p.id] || ''}
                    disabled={saving === p.id}
                    onChange={e => assign(p.id, e.target.value)}
                  >
                    <option value="">— Unassigned —</option>
                    {facilitators.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
