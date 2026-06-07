import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'

const FIELDS = [
  { key: 'what_i_learned',       label: 'What did you learn in this session?',                          min: 30 },
  { key: 'leadership_insight',   label: 'What leadership insight stood out most to you?',               min: 30 },
  { key: 'action_before_next',   label: 'What specific action will you take before the next session?',  min: 30 },
  { key: 'expected_result',      label: 'What result do you expect from that action?',                  min: 20 },
]

export default function Reflect() {
  const { participant } = useAuth()
  const [sessions, setSessions] = useState([])
  const [reflections, setReflections] = useState({})
  const [forms, setForms] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState(null)

  useEffect(() => {
    if (!participant) return
    load()
  }, [participant])

  async function load() {
    const [{ data: sess }, { data: refs }] = await Promise.all([
      supabase.from('sessions').select('*, facilitators(name), session_laws(laws(name, journal_prompt))').eq('reflections_open', true).order('session_number'),
      supabase.from('reflections').select('*').eq('participant_id', participant.id),
    ])
    setSessions(sess || [])
    const refMap = {}
    ;(refs || []).forEach(r => { refMap[r.session_id] = r })
    setReflections(refMap)
    if (sess?.length > 0) {
      const firstOpen = sess.find(s => !refMap[s.id])
      setExpandedSession(firstOpen?.id || sess[0].id)
    }
    setLoading(false)
  }

  function updateForm(sessionId, key, val) {
    setForms(f => ({ ...f, [sessionId]: { ...(f[sessionId] || {}), [key]: val } }))
  }

  async function submit(session) {
    const form = forms[session.id] || {}
    for (const f of FIELDS) {
      if (!form[f.key] || form[f.key].length < f.min) {
        toast.error(`"${f.label}" must be at least ${f.min} characters`)
        return
      }
    }
    setSubmitting(session.id)
    try {
      const { error } = await supabase.from('reflections').insert({
        participant_id: participant.id,
        session_id: session.id,
        what_i_learned: form.what_i_learned,
        leadership_insight: form.leadership_insight,
        action_before_next: form.action_before_next,
        expected_result: form.expected_result,
        journal_prompt_response: form.journal_prompt_response || null,
      })
      if (error) throw error
      toast.success('Reflection submitted!')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Reflections</h1>
        <p className="text-gray-500 text-sm mb-6">Record your reflection after each session.</p>

        {sessions.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p>No sessions are open for reflection yet. Check back after the first session.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => {
              const done = !!reflections[session.id]
              const laws = session.session_laws?.map(sl => sl.laws?.name).filter(Boolean)
              const prompts = session.session_laws?.map(sl => sl.laws?.journal_prompt).filter(Boolean)
              const isExpanded = expandedSession === session.id
              return (
                <div key={session.id} className="card">
                  <button className="w-full flex items-center justify-between" onClick={() => setExpandedSession(isExpanded ? null : session.id)}>
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {session.session_number}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{session.title}</p>
                        {laws?.length > 0 && <p className="text-xs text-gray-500">{laws.join(' · ')}</p>}
                      </div>
                    </div>
                    <span className={done ? 'badge-green' : 'badge-yellow'}>{done ? 'Submitted' : 'Open'}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {done ? (
                        <div className="space-y-3">
                          {FIELDS.map(f => (
                            <div key={f.key}>
                              <p className="text-xs font-medium text-gray-500 mb-1">{f.label}</p>
                              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{reflections[session.id][f.key]}</p>
                            </div>
                          ))}
                          {reflections[session.id].journal_prompt_response && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Journal Prompt Response</p>
                              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{reflections[session.id].journal_prompt_response}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={e => { e.preventDefault(); submit(session) }} className="space-y-4">
                          {FIELDS.map(f => {
                            const val = forms[session.id]?.[f.key] || ''
                            return (
                              <div key={f.key}>
                                <label className="label">{f.label} *</label>
                                <textarea className="input" rows={3} minLength={f.min} value={val}
                                  onChange={e => updateForm(session.id, f.key, e.target.value)}
                                  placeholder={`At least ${f.min} characters...`} />
                                <p className="text-xs text-gray-400 mt-1">{val.length}/{f.min}+ chars</p>
                              </div>
                            )
                          })}
                          {prompts?.length > 0 && (
                            <div>
                              <label className="label">
                                Journal Prompt (optional): <em className="text-gray-500 font-normal">{prompts.join(' / ')}</em>
                              </label>
                              <textarea className="input" rows={3}
                                value={forms[session.id]?.journal_prompt_response || ''}
                                onChange={e => updateForm(session.id, 'journal_prompt_response', e.target.value)}
                                placeholder="Your personal reflection on this journal prompt..." />
                            </div>
                          )}
                          <button type="submit" disabled={submitting === session.id} className="btn-primary w-full">
                            {submitting === session.id ? 'Submitting...' : 'Submit Reflection'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
