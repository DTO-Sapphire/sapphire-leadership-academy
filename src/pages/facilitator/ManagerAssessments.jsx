import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Copy, Check, CheckCircle, Clock } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function ManagerAssessments() {
  const [participants, setParticipants] = useState([])
  const [assessments, setAssessments] = useState({})
  const [editing, setEditing] = useState({})
  const [saving, setSaving] = useState(null)
  const [copied, setCopied] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: parts }, { data: asmts }] = await Promise.all([
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('manager_assessments').select('*'),
    ])
    setParticipants(parts || [])
    const map = {}
    ;(asmts || []).forEach(a => { map[a.participant_id] = a })
    setAssessments(map)
    setLoading(false)
  }

  function getScore(a) {
    if (!a?.submitted) return null
    return (a.leadership_growth || 0) + (a.delegation_empowerment || 0) + (a.communication_influence || 0) + (a.accountability_execution || 0) + (a.coaching_others || 0)
  }

  async function save(participantId) {
    const form = editing[participantId]
    if (!form?.manager_name) { toast.error('Manager name is required'); return }
    setSaving(participantId)
    try {
      const { error } = await supabase.from('manager_assessments')
        .upsert({ participant_id: participantId, manager_name: form.manager_name, manager_email: form.manager_email || null }, { onConflict: 'participant_id' })
      if (error) throw error
      toast.success('Saved')
      setEditing(e => { const n = { ...e }; delete n[participantId]; return n })
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(null)
    }
  }

  async function applyToScorecard(participantId, score) {
    const existing = await supabase.from('scorecard').select('id').eq('participant_id', participantId).single()
    let error
    if (existing.data) {
      ({ error } = await supabase.from('scorecard').update({ manager_score: score }).eq('participant_id', participantId))
    } else {
      ({ error } = await supabase.from('scorecard').insert({ participant_id: participantId, manager_score: score }))
    }
    if (error) toast.error(error.message)
    else toast.success(`Manager score (${score}/20) applied to scorecard`)
  }

  function copyLink(token) {
    const url = `${APP_URL}/manager-assess/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token)
      setTimeout(() => setCopied(null), 2500)
    })
  }

  const submitted = participants.filter(p => assessments[p.id]?.submitted).length

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
          <h1 className="text-2xl font-bold text-gray-900">Manager Assessments</h1>
          <p className="text-sm text-gray-500 mt-1">Set each participant's manager, copy their unique assessment link, and apply submitted scores to scorecards.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="font-bold text-lg text-green-700">{submitted} / {participants.length}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <Clock size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="font-bold text-lg text-amber-600">{participants.length - submitted}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="space-y-0">
            {participants.map((p, i) => {
              const a = assessments[p.id]
              const isEditing = !!editing[p.id]
              const score = getScore(a)
              const form = editing[p.id] || {}

              return (
                <div key={p.id} className={`py-4 ${i < participants.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                        {a?.submitted
                          ? <span className="badge-green">Submitted · {score}/20</span>
                          : a ? <span className="badge-gray">Link sent</span>
                          : <span className="text-xs text-amber-600 font-medium">No manager set</span>}
                      </div>
                      <p className="text-xs text-gray-400">{p.department}</p>

                      {!isEditing && a && !a.submitted && (
                        <p className="text-xs text-gray-500 mt-1">Manager: {a.manager_name}{a.manager_email ? ` · ${a.manager_email}` : ''}</p>
                      )}

                      {a?.submitted && (
                        <button onClick={() => applyToScorecard(p.id, score)}
                          className="mt-2 text-xs text-[#0F52BA] font-semibold hover:underline">
                          Apply {score}/20 to scorecard →
                        </button>
                      )}

                      {isEditing && (
                        <div className="mt-2 grid sm:grid-cols-2 gap-2">
                          <input className="input text-sm py-1.5" placeholder="Manager name *" value={form.manager_name || ''}
                            onChange={e => setEditing(ed => ({ ...ed, [p.id]: { ...ed[p.id], manager_name: e.target.value } }))} />
                          <input className="input text-sm py-1.5" placeholder="Manager email (optional)" value={form.manager_email || ''}
                            onChange={e => setEditing(ed => ({ ...ed, [p.id]: { ...ed[p.id], manager_email: e.target.value } }))} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {a && !isEditing && (
                        <button onClick={() => copyLink(a.token)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#0F52BA] transition-colors px-2.5 py-1.5 border border-gray-200 rounded-lg hover:border-[#0F52BA]">
                          {copied === a.token ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Link</>}
                        </button>
                      )}
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(e => { const n = { ...e }; delete n[p.id]; return n })}
                            className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                          <button onClick={() => save(p.id)} disabled={saving === p.id}
                            className="btn-primary text-xs px-3 py-1.5">
                            {saving === p.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing(e => ({ ...e, [p.id]: { manager_name: a?.manager_name || '', manager_email: a?.manager_email || '' } }))}
                          className="text-xs text-[#0F52BA] font-semibold hover:underline">
                          {a ? 'Edit' : 'Set Manager'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
