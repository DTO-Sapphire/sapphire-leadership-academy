import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Calendar, CheckCircle, Loader } from 'lucide-react'

async function gradeSubmission(content, description) {
  const res = await fetch('/api/grade-submission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_BROADCAST_SECRET}`,
    },
    body: JSON.stringify({ content, description }),
  })
  if (!res.ok) return null
  return res.json()
}

export default function SessionExercises() {
  const { participant } = useAuth()
  const [exercises, setExercises] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [responses, setResponses] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [grading, setGrading] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (participant) load() }, [participant])

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
    const content = responses[exercise.id]?.trim()
    if (!content || content.length < 20) { toast.error('Please write at least 20 characters'); return }
    setSubmitting(exercise.id)
    try {
      const { data: sub, error } = await supabase
        .from('session_exercise_submissions')
        .insert({ participant_id: participant.id, exercise_id: exercise.id, content })
        .select().single()
      if (error) throw error

      setGrading(exercise.id)
      toast('Submitted! Grading your response...', { icon: '⏳' })

      const grade = await gradeSubmission(content, exercise.description)
      if (grade?.score) {
        await supabase.from('session_exercise_submissions')
          .update({ ai_score: grade.score, ai_feedback: grade.feedback })
          .eq('id', sub.id)
      }

      await load()
      toast.success(grade?.score ? `Graded: ${grade.score}/10` : 'Exercise submitted!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(null)
      setGrading(null)
    }
  }

  function getStatus(ex) {
    if (submissions[ex.id]) return 'submitted'
    if (new Date(ex.due_date + 'T23:59:59') < new Date()) return 'overdue'
    return 'open'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
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

  const totalDone = Object.values(submissions).length
  const totalEx = exercises.length

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Class Exercises</h1>
          <p className="text-gray-500 text-sm mt-0.5">Practical exercises from each session · {totalDone}/{totalEx} completed</p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="card text-center py-12 text-gray-400 text-sm">No exercises yet — check back after your next session.</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort((a, b) => Number(a[0]) - Number(b[0])).map(([sessionNum, exList]) => {
              const done = exList.filter(e => submissions[e.id]).length
              return (
                <div key={sessionNum}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-[#0F52BA] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      S{sessionNum}
                    </div>
                    <h2 className="font-bold text-gray-800 text-sm">Session {sessionNum}</h2>
                    <span className="text-xs text-gray-400">{done}/{exList.length} done</span>
                  </div>
                  <div className="space-y-4">
                    {exList.map(ex => {
                      const status = getStatus(ex)
                      const sub = submissions[ex.id]
                      const isGrading = grading === ex.id
                      const due = new Date(ex.due_date + 'T00:00:00')
                      return (
                        <div key={ex.id} className="card">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <span className={status === 'submitted' ? 'badge-green' : status === 'overdue' ? 'badge-red' : 'badge-yellow'}>
                                  {status === 'submitted' ? 'Submitted' : status === 'overdue' ? 'Overdue' : 'Open'}
                                </span>
                                {sub?.ai_score && (
                                  <span className="bg-[#0F52BA] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {sub.ai_score}/10
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-gray-900 text-sm leading-snug">{ex.title}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                              <Calendar size={11} />
                              <span>{due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-4 leading-relaxed whitespace-pre-line">{ex.description}</p>

                          {isGrading ? (
                            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-center gap-2">
                              <Loader size={16} className="animate-spin text-[#0F52BA]" />
                              <p className="text-sm text-blue-700 font-medium">Grading your response...</p>
                            </div>
                          ) : status === 'submitted' ? (
                            <div className="bg-green-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle size={13} className="text-green-600" />
                                  <p className="text-xs font-semibold text-green-700">Your Submission</p>
                                </div>
                                {sub.ai_score && (
                                  <span className="text-xs text-green-700 font-bold">{sub.ai_score}/10 pts</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{sub.content}</p>
                              {sub.ai_feedback && (
                                <p className="text-xs text-[#0F52BA] bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3 leading-relaxed">
                                  💡 {sub.ai_feedback}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <label className="label">Your Response *</label>
                              <textarea className="input" rows={6}
                                value={responses[ex.id] || ''}
                                onChange={e => setResponses(r => ({ ...r, [ex.id]: e.target.value }))}
                                placeholder="Address each part specifically. Be honest and apply it to your real work context..." />
                              <button onClick={() => submit(ex)} disabled={!!submitting}
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
