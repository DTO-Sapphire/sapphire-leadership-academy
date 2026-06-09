import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const BEHAVIOURS = [
  'Delegation', 'Communication', 'Accountability', 'Coaching',
  'Strategic Thinking', 'Time Management', 'Conflict Resolution', 'Team Development',
]

const RATING_LABELS = { 1: 'No progress', 2: 'Slight progress', 3: 'Good progress', 4: 'Strong progress', 5: 'Excellent progress' }

const EMPTY_FORM = { area: '', success_definition: '', measurable_target: '' }
const EMPTY_UPDATE = { week_number: 1, progress_note: '', practical_example: '', rating: 0 }

export default function Commit() {
  const { participant } = useAuth()
  const [commitments, setCommitments] = useState([])
  const [updates, setUpdates] = useState({})
  const [programmeWeek, setProgrammeWeek] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [updateForms, setUpdateForms] = useState({})
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(null)

  useEffect(() => { if (participant) load() }, [participant])

  async function load() {
    const [{ data: comms }, { data: upds }, { data: settings }] = await Promise.all([
      supabase.from('commitments').select('*').eq('participant_id', participant.id).order('created_at'),
      supabase.from('commitment_updates').select('*').in(
        'commitment_id',
        (await supabase.from('commitments').select('id').eq('participant_id', participant.id)).data?.map(c => c.id) || []
      ).order('week_number'),
      supabase.from('settings').select('key, value').eq('key', 'programme_week').single(),
    ])
    setCommitments(comms || [])
    const updsMap = {}
    ;(upds || []).forEach(u => {
      if (!updsMap[u.commitment_id]) updsMap[u.commitment_id] = []
      updsMap[u.commitment_id].push(u)
    })
    setUpdates(updsMap)
    setProgrammeWeek(parseInt(settings?.data?.value || '1'))
    setLoading(false)
  }

  async function addCommitment(e) {
    e.preventDefault()
    if (!form.area) { toast.error('Select a behaviour'); return }
    if (!form.success_definition.trim()) { toast.error('Define what success looks like'); return }
    if (!form.measurable_target.trim()) { toast.error('Set a measurable target'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('commitments').insert({ participant_id: participant.id, ...form })
      if (error) throw error
      toast.success('Commitment added')
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function removeCommitment(id) {
    const { error } = await supabase.from('commitments').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Removed'); await load() }
  }

  async function saveUpdate(commitmentId) {
    const uf = updateForms[commitmentId]
    if (!uf?.progress_note?.trim()) { toast.error('Add a progress note'); return }
    if (!uf?.rating) { toast.error('Rate your progress'); return }
    setSavingUpdate(commitmentId)
    try {
      const { error } = await supabase.from('commitment_updates').upsert({
        commitment_id: commitmentId,
        week_number: uf.week_number,
        progress_note: uf.progress_note,
        practical_example: uf.practical_example || null,
        rating: uf.rating,
      }, { onConflict: 'commitment_id,week_number' })
      if (error) throw error
      toast.success('Update saved')
      setUpdateForms(f => { const n = { ...f }; delete n[commitmentId]; return n })
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSavingUpdate(null) }
  }

  function getUpdateForm(commitmentId) {
    if (updateForms[commitmentId]) return updateForms[commitmentId]
    const existingWeeks = (updates[commitmentId] || []).map(u => u.week_number)
    const week = existingWeeks.includes(programmeWeek) ? programmeWeek : programmeWeek
    return { ...EMPTY_UPDATE, week_number: week }
  }

  function setUF(commitmentId, field, value) {
    setUpdateForms(f => ({ ...f, [commitmentId]: { ...getUpdateForm(commitmentId), [field]: value } }))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div>
    </div>
  )

  const canAdd = commitments.length < 2

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leadership Commitments</h1>
            <p className="text-sm text-gray-500 mt-1">Select 1–2 behaviours to improve throughout the programme. Log your progress weekly.</p>
          </div>
          {canAdd && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2 shrink-0">
              <Plus size={15} /> Add
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="card mb-6 border-2 border-[#0F52BA]/20">
            <h2 className="font-semibold text-gray-900 mb-4">New Leadership Commitment</h2>
            <form onSubmit={addCommitment} className="space-y-4">
              <div>
                <label className="label">Leadership Behaviour *</label>
                <select className="input" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}>
                  <option value="">Select a behaviour...</option>
                  {BEHAVIOURS.filter(b => !commitments.find(c => c.area === b)).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">What does success look like? *</label>
                <textarea className="input" rows={2} value={form.success_definition}
                  onChange={e => setForm(f => ({ ...f, success_definition: e.target.value }))}
                  placeholder="e.g. My team feels trusted to deliver without me micromanaging every task." />
              </div>
              <div>
                <label className="label">Measurable target *</label>
                <textarea className="input" rows={2} value={form.measurable_target}
                  onChange={e => setForm(f => ({ ...f, measurable_target: e.target.value }))}
                  placeholder="e.g. Delegate at least 2 tasks per week without following up more than once." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Commitment'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Commitment cards */}
        {commitments.length === 0 && !showForm ? (
          <div className="card text-center py-10">
            <p className="font-semibold text-gray-700 mb-1">No commitments yet</p>
            <p className="text-sm text-gray-500 mb-4">Choose 1–2 leadership behaviours you want to improve during this programme.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mx-auto flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Add your first commitment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {commitments.map(c => {
              const commUpdates = updates[c.id] || []
              const isExpanded = expanded[c.id]
              const uf = getUpdateForm(c.id)
              const thisWeekUpdate = commUpdates.find(u => u.week_number === programmeWeek)

              return (
                <div key={c.id} className="card">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block bg-[#0F52BA]/10 text-[#0F52BA] text-xs font-bold px-2.5 py-1 rounded-full mb-2">{c.area}</span>
                      <p className="text-sm text-gray-700"><span className="font-semibold">Success: </span>{c.success_definition}</p>
                      <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Target: </span>{c.measurable_target}</p>
                    </div>
                    <button onClick={() => removeCommitment(c.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-3 shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="flex gap-1.5 mb-3">
                    {[1,2,3,4].map(w => {
                      const u = commUpdates.find(u => u.week_number === w)
                      return (
                        <div key={w} className={`flex-1 h-1.5 rounded-full ${u ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} title={`Week ${w}`} />
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{commUpdates.length}/4 weekly updates logged</p>

                  {/* Toggle updates */}
                  <button onClick={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0F52BA] hover:underline mb-3">
                    {isExpanded ? <><ChevronUp size={13} /> Hide updates</> : <><ChevronDown size={13} /> View updates</>}
                  </button>

                  {isExpanded && commUpdates.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {commUpdates.map(u => (
                        <div key={u.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-700">Week {u.week_number}</span>
                            <span className="text-[#0F52BA] font-bold text-xs">{u.rating}/5 · {RATING_LABELS[u.rating]}</span>
                          </div>
                          <p className="text-gray-600">{u.progress_note}</p>
                          {u.practical_example && <p className="text-gray-500 mt-1 text-xs italic">"{u.practical_example}"</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Weekly update form */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      {thisWeekUpdate ? `Update Week ${programmeWeek} (already logged — overwrite)` : `Log Week ${programmeWeek} Update`}
                    </p>
                    <div className="space-y-2">
                      <select className="input text-sm py-1.5" value={uf.week_number}
                        onChange={e => setUF(c.id, 'week_number', parseInt(e.target.value))}>
                        {[1,2,3,4].map(w => <option key={w} value={w}>Week {w}</option>)}
                      </select>
                      <textarea className="input text-sm" rows={2} value={uf.progress_note || ''}
                        onChange={e => setUF(c.id, 'progress_note', e.target.value)}
                        placeholder="How are you progressing on this behaviour?" />
                      <textarea className="input text-sm" rows={2} value={uf.practical_example || ''}
                        onChange={e => setUF(c.id, 'practical_example', e.target.value)}
                        placeholder="Describe a specific situation where you applied this (optional)" />
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => setUF(c.id, 'rating', n)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${uf.rating === n ? 'bg-[#0F52BA] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                      {uf.rating > 0 && <p className="text-xs text-center text-gray-500">{RATING_LABELS[uf.rating]}</p>}
                      <button onClick={() => saveUpdate(c.id)} disabled={savingUpdate === c.id}
                        className="btn-primary w-full text-sm py-2">
                        {savingUpdate === c.id ? 'Saving...' : 'Save Update'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!canAdd && (
          <p className="text-xs text-center text-gray-400 mt-4">You've selected 2 commitments — the maximum for the programme.</p>
        )}
      </div>
    </div>
  )
}
