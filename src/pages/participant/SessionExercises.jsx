import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Calendar, CheckCircle } from 'lucide-react'

export default function SessionExercises() {
  const { participant } = useAuth()
  const [exercises, setExercises] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [responses, setResponses] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participant) return
    load()
  }, [participant])

  async function load() {
    const [{ data: exs }, { data: subs }] = await Promise.all([
      supabase.from('session_exercises').select('*').order('session_number').order('created_at'),
      supabase.from('session_exercise_submissions').select('*').eq('participant_id', participant.id),
    ])
    setExercises(exs || [])
    const subMap = {}
    ;(subs || []).forEach(s => { subMap[s.exercise_id] = s })
    setSubmissions(subMap)
    setLoading(false)
  }

  async function submit(exercise) {
    const content = responses[exercise.id]
    if (!content || content.trim().length < 20) {
      toast.error('Please write a response of at least 20 characters')
      return
    }
    setSubmitting(exercise.id)
    try {
      const { error } = await supabase.from('session_exercise_submissions').insert({
        participant_id: participant.id,
        exercise_id: exercise.id,
        content: content.trim(),
      })
      if (error) throw error
      toast.success('Exercise submitted!')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(null)
    }
  }

  function getStatus(exercise) {
    if (submissions[exercise.id]) return 'submitted'
    if (new Date(exercise.due_date + 'T23:59:59') < new Date()) return 'overdue'
    return 'open'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const grouped = exercises.reduce((acc, e) => {
    if (!acc[e.session_number]) acc[e.session_number] = []
    acc[e.session_number].push(e)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Class Exercises</h1>
        <p className="text-gray-500 text-sm mb-6">Practical exercises from each session — complete after each class.</p>

        {Object.keys(grouped).length === 0 ? (
          <div className="card text-center py-12 text-gray-400">No exercises available yet.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).sort((a, b) => Number(a[0]) - Number(b[0])).map(([sessionNum, exList]) => (
              <div key={sessionNum}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#0F52BA] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    S{sessionNum}
                  </div>
                  <h2 className="font-bold text-gray-800">Session {sessionNum} Exercises</h2>
                  <span className="text-xs text-gray-400">{exList.filter(e => submissions[e.id]).length}/{exList.length} done</span>
                </div>
                <div className="space-y-4">
                  {exList.map(ex => {
                    const status = getStatus(ex)
                    const sub = submissions[ex.id]
                    const due = new Date(ex.due_date + 'T00:00:00')
                    return (
                      <div key={ex.id} className="card">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={status === 'submitted' ? 'badge-green' : status === 'overdue' ? 'badge-red' : 'badge-yellow'}>
                                {status === 'submitted' ? 'Submitted' : status === 'overdue' ? 'Overdue' : 'Open'}
                              </span>
                            </div>
                            <h3 className="font-bold text-gray-900">{ex.title}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                            <Calendar size={12} />
                            <span>Due {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 leading-relaxed whitespace-pre-line">{ex.description}</p>

                        {status === 'submitted' ? (
                          <div className="bg-green-50 rounded-xl p-4">
                            <div className="flex items-center gap-1.5 mb-2">
                              <CheckCircle size={14} className="text-green-600" />
                              <p className="text-xs font-semibold text-green-700">Your Submission</p>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{sub.content}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Submitted {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <label className="label">Your Response *</label>
                            <textarea className="input" rows={7}
                              value={responses[ex.id] || ''}
                              onChange={e => setResponses(r => ({ ...r, [ex.id]: e.target.value }))}
                              placeholder="Write your response here. Address each part of the exercise specifically and honestly..." />
                            <button onClick={() => submit(ex)} disabled={submitting === ex.id}
                              className="btn-primary w-full mt-3">
                              {submitting === ex.id ? 'Submitting...' : 'Submit Exercise'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
