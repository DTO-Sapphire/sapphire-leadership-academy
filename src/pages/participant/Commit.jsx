import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Plus, ChevronDown, ChevronUp, Trash2, MessageCircle, Send } from 'lucide-react'

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
  const [partner, setPartner] = useState(null)
  const [partnerCommitments, setPartnerCommitments] = useState([])
  const [partnerUpdates, setPartnerUpdates] = useState({})
  const [commentsMap, setCommentsMap] = useState({})
  const [commentForms, setCommentForms] = useState({})
  const [submittingComment, setSubmittingComment] = useState(null)
  const [programmeWeek, setProgrammeWeek] = useState(1)
  const [activeTab, setActiveTab] = useState('mine')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [updateForms, setUpdateForms] = useState({})
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(null)

  useEffect(() => { if (participant) load() }, [participant])

  async function load() {
    const [{ data: me }, { data: settings }] = await Promise.all([
      supabase.from('participants').select('accountability_partner_id').eq('id', participant.id).single(),
      supabase.from('settings').select('key, value').eq('key', 'programme_week').single(),
    ])
    setProgrammeWeek(parseInt(settings?.value || '1'))

    const { data: myComms } = await supabase
      .from('commitments').select('*').eq('participant_id', participant.id).order('created_at')
    setCommitments(myComms || [])
    const myCommIds = (myComms || []).map(c => c.id)
    const partnerId = me?.accountability_partner_id

    const [myUpdsRes, partnerInfoRes, partnerCommsRes] = await Promise.all([
      myCommIds.length > 0
        ? supabase.from('commitment_updates').select('*').in('commitment_id', myCommIds).order('week_number')
        : Promise.resolve({ data: [] }),
      partnerId
        ? supabase.from('participants').select('id, name, department').eq('id', partnerId).single()
        : Promise.resolve({ data: null }),
      partnerId
        ? supabase.from('commitments').select('*').eq('participant_id', partnerId).order('created_at')
        : Promise.resolve({ data: [] }),
    ])

    const myUpds = myUpdsRes.data || []
    const partnerData = partnerInfoRes.data
    const partnerComms = partnerCommsRes.data || []
    const partnerCommIds = partnerComms.map(c => c.id)

    const updsMap = {}
    myUpds.forEach(u => {
      if (!updsMap[u.commitment_id]) updsMap[u.commitment_id] = []
      updsMap[u.commitment_id].push(u)
    })
    setUpdates(updsMap)
    setPartner(partnerData)
    setPartnerCommitments(partnerComms)

    const allCommIds = [...myCommIds, ...partnerCommIds]
    const [partnerUpdsRes, commentsRes] = await Promise.all([
      partnerCommIds.length > 0
        ? supabase.from('commitment_updates').select('*').in('commitment_id', partnerCommIds).order('week_number')
        : Promise.resolve({ data: [] }),
      allCommIds.length > 0
        ? supabase.from('commitment_comments').select('*, participants(name)').in('commitment_id', allCommIds).order('created_at')
        : Promise.resolve({ data: [] }),
    ])

    const pUpdsMap = {}
    ;(partnerUpdsRes.data || []).forEach(u => {
      if (!pUpdsMap[u.commitment_id]) pUpdsMap[u.commitment_id] = []
      pUpdsMap[u.commitment_id].push(u)
    })
    setPartnerUpdates(pUpdsMap)

    const cMap = {}
    ;(commentsRes.data || []).forEach(c => {
      if (!cMap[c.commitment_id]) cMap[c.commitment_id] = []
      cMap[c.commitment_id].push(c)
    })
    setCommentsMap(cMap)

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

  async function submitComment(commitmentId) {
    const text = commentForms[commitmentId]?.trim()
    if (!text) return
    setSubmittingComment(commitmentId)
    try {
      const { error } = await supabase.from('commitment_comments').insert({
        commitment_id: commitmentId,
        commenter_id: participant.id,
        comment: text,
      })
      if (error) throw error
      setCommentForms(f => ({ ...f, [commitmentId]: '' }))
      await load()
    } catch (err) { toast.error(err.message) }
    finally { setSubmittingComment(null) }
  }

  function getUpdateForm(commitmentId) {
    if (updateForms[commitmentId]) return updateForms[commitmentId]
    return { ...EMPTY_UPDATE, week_number: programmeWeek }
  }

  function setUF(commitmentId, field, value) {
    setUpdateForms(f => ({ ...f, [commitmentId]: { ...getUpdateForm(commitmentId), [field]: value } }))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const canAdd = commitments.length < 2

  function CommentThread({ commitmentId, canComment }) {
    const comments = commentsMap[commitmentId] || []
    return (
      <div className="mt-3 border-t border-gray-100 pt-3">
        {comments.length > 0 && (
          <div className="space-y-2 mb-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0F52BA]/10 flex items-center justify-center text-xs font-bold text-[#0F52BA] shrink-0 mt-0.5">
                  {c.participants?.name?.[0] || '?'}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">{c.participants?.name}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {canComment && (
          <div className="flex gap-2 items-end">
            <textarea
              rows={2}
              className="input text-sm flex-1 resize-none"
              placeholder="Leave a comment..."
              value={commentForms[commitmentId] || ''}
              onChange={e => setCommentForms(f => ({ ...f, [commitmentId]: e.target.value }))}
            />
            <button
              onClick={() => submitComment(commitmentId)}
              disabled={submittingComment === commitmentId || !commentForms[commitmentId]?.trim()}
              className="btn-primary p-2.5 shrink-0">
              <Send size={15} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leadership Commitments</h1>
            <p className="text-sm text-gray-500 mt-1">Select 1–2 behaviours to improve throughout the programme.</p>
          </div>
          {activeTab === 'mine' && canAdd && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2 shrink-0">
              <Plus size={15} /> Add
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button onClick={() => setActiveTab('mine')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            My Commitments
          </button>
          <button onClick={() => setActiveTab('partner')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'partner' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {partner ? `${partner.name.split(' ')[0]}'s Commitments` : 'Partner'}
          </button>
        </div>

        {/* MY COMMITMENTS TAB */}
        {activeTab === 'mine' && (
          <>
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

            {commitments.length === 0 && !showForm ? (
              <div className="card text-center py-10">
                <p className="font-semibold text-gray-700 mb-1">No commitments yet</p>
                <p className="text-sm text-gray-500 mb-4">Choose 1–2 leadership behaviours you want to improve.</p>
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
                  const myComments = commentsMap[c.id] || []

                  return (
                    <div key={c.id} className="card">
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

                      <div className="flex gap-1.5 mb-1">
                        {[1,2,3,4].map(w => {
                          const u = commUpdates.find(u => u.week_number === w)
                          return <div key={w} className={`flex-1 h-1.5 rounded-full ${u ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} title={`Week ${w}`} />
                        })}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{commUpdates.length}/4 weekly updates logged</p>

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
                          <button onClick={() => saveUpdate(c.id)} disabled={savingUpdate === c.id} className="btn-primary w-full text-sm py-2">
                            {savingUpdate === c.id ? 'Saving...' : 'Save Update'}
                          </button>
                        </div>
                      </div>

                      {/* Comments from partner */}
                      {(myComments.length > 0 || partner) && (
                        <div>
                          <div className="flex items-center gap-1.5 mt-3 mb-1">
                            <MessageCircle size={12} className="text-gray-400" />
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              {myComments.length > 0 ? `${myComments.length} comment${myComments.length !== 1 ? 's' : ''}` : 'Partner comments'}
                            </p>
                          </div>
                          <CommentThread commitmentId={c.id} canComment={!!partner} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {!canAdd && (
              <p className="text-xs text-center text-gray-400 mt-4">You've selected 2 commitments — the maximum for the programme.</p>
            )}
          </>
        )}

        {/* PARTNER TAB */}
        {activeTab === 'partner' && (
          <>
            {!partner ? (
              <div className="card text-center py-12">
                <MessageCircle size={32} className="text-gray-300 mx-auto mb-3" />
                <h2 className="font-bold text-gray-800 mb-1">No Accountability Partner Assigned</h2>
                <p className="text-sm text-gray-500">Your facilitator will assign your accountability partner soon.</p>
              </div>
            ) : partnerCommitments.length === 0 ? (
              <div className="card text-center py-12">
                <p className="font-semibold text-gray-700 mb-1">{partner.name} hasn't set commitments yet</p>
                <p className="text-sm text-gray-400">Check back once they've added their leadership commitments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-[#0F52BA]/10 flex items-center justify-center text-[#0F52BA] font-bold shrink-0">
                    {partner.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{partner.name}</p>
                    <p className="text-xs text-gray-400">{partner.department}</p>
                  </div>
                </div>

                {partnerCommitments.map(c => {
                  const commUpdates = partnerUpdates[c.id] || []
                  const latestUpdate = [...commUpdates].sort((a, b) => b.week_number - a.week_number)[0]
                  const threadComments = commentsMap[c.id] || []

                  return (
                    <div key={c.id} className="card">
                      <span className="inline-block bg-[#0F52BA]/10 text-[#0F52BA] text-xs font-bold px-2.5 py-1 rounded-full mb-3">{c.area}</span>
                      <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Success: </span>{c.success_definition}</p>
                      <p className="text-sm text-gray-700"><span className="font-semibold">Target: </span>{c.measurable_target}</p>

                      {/* Progress */}
                      <div className="flex gap-1.5 mt-3 mb-1">
                        {[1,2,3,4].map(w => {
                          const u = commUpdates.find(u => u.week_number === w)
                          return <div key={w} className={`flex-1 h-1.5 rounded-full ${u ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} title={`Week ${w}`} />
                        })}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{commUpdates.length}/4 weekly updates logged</p>

                      {latestUpdate && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-700 text-xs">Week {latestUpdate.week_number} update</span>
                            <span className="text-[#0F52BA] font-bold text-xs">{latestUpdate.rating}/5 · {RATING_LABELS[latestUpdate.rating]}</span>
                          </div>
                          <p className="text-gray-600 text-sm">{latestUpdate.progress_note}</p>
                          {latestUpdate.practical_example && (
                            <p className="text-gray-500 mt-1 text-xs italic">"{latestUpdate.practical_example}"</p>
                          )}
                        </div>
                      )}

                      {/* Comment thread */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageCircle size={12} className="text-gray-400" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {threadComments.length > 0 ? `${threadComments.length} comment${threadComments.length !== 1 ? 's' : ''}` : 'Add a comment'}
                        </p>
                      </div>
                      <CommentThread commitmentId={c.id} canComment={true} />
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
