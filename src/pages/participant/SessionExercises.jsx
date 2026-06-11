import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { CheckCircle, Loader, ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [selectedSession, setSelectedSession] = useState(null)
  const [exerciseIndex, setExerciseIndex] = useState(0)

  useEffect(() => { if (participant) load() }, [participant])

  async function load() {
    const [{ data: exs }, { data: subs }] = await Promise.all([
      supabase.from('session_exercises').select('*').order('session_number').order('created_at'),
      supabase.from('session_exercise_submissions').select('*').eq('participant_id', participant.id),
    ])
    const allExs = exs || []
    const subMap = {}
    ;(subs || []).forEach(s => { subMap[s.exercise_id] = s })
    setExercises(allExs)
    setSubmissions(subMap)

    if (allExs.length > 0) {
      setSelectedSession(prev => {
        if (prev) return prev
        const grouped = groupExercises(allExs)
        const sessions = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
        const firstIncomplete = sessions.find(sn => grouped[sn].some(e => !subMap[e.id])) || sessions[0]
        return Number(firstIncomplete)
      })
    }
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const grouped = groupExercises(exercises)
  const sessionNums = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
  const totalDone = Object.values(submissions).length

  const currentList = grouped[selectedSession] || []
  const safeIndex = Math.min(exerciseIndex, Math.max(0, currentList.length - 1))
  const current = currentList[safeIndex]

  const currentSessionIdx = sessionNums.indexOf(String(selectedSession))
  const isFirst = safeIndex === 0 && currentSessionIdx === 0
  const isLast = safeIndex === currentList.length - 1 && currentSessionIdx === sessionNums.length - 1

  function selectSession(sn) {
    setSelectedSession(Number(sn))
    setExerciseIndex(0)
  }

  function goNext() {
    if (safeIndex < currentList.length - 1) {
      setExerciseIndex(safeIndex + 1)
    } else if (currentSessionIdx < sessionNums.length - 1) {
      setSelectedSession(Number(sessionNums[currentSessionIdx + 1]))
      setExerciseIndex(0)
    }
  }

  function goPrev() {
    if (safeIndex > 0) {
      setExerciseIndex(safeIndex - 1)
    } else if (currentSessionIdx > 0) {
      const prevSn = Number(sessionNums[currentSessionIdx - 1])
      setSelectedSession(prevSn)
      setExerciseIndex((grouped[prevSn]?.length || 1) - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Class Exercises</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalDone}/{exercises.length} completed</p>
        </div>

        {exercises.length === 0 ? (
          <div className="card text-center py-12 text-gray-400 text-sm">
            No exercises yet — check back after your next session.
          </div>
        ) : (
          <>
            {/* Session tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {sessionNums.map(sn => {
                const list = grouped[sn]
                const done = list.filter(e => submissions[e.id]).length
                const allDone = done === list.length
                const active = Number(sn) === selectedSession
                return (
                  <button key={sn} onClick={() => selectSession(sn)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${
                      active ? 'bg-[#0F52BA] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0F52BA]'
                    }`}>
                    Session {sn}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-white/20 text-white' : allDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{done}/{list.length}</span>
                  </button>
                )
              })}
            </div>

            {current && (
              <>
                {/* Step dots */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    Exercise {safeIndex + 1} of {currentList.length}
                  </p>
                  <div className="flex items-center gap-2">
                    {currentList.map((ex, i) => (
                      <button key={ex.id} onClick={() => setExerciseIndex(i)}
                        className={`rounded-full transition-all ${
                          i === safeIndex
                            ? 'w-6 h-2.5 bg-[#0F52BA]'
                            : submissions[ex.id]
                            ? 'w-2.5 h-2.5 bg-green-400'
                            : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                        }`} />
                    ))}
                  </div>
                </div>

                {/* Exercise card */}
                <div className="card">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {(() => {
                          const sub = submissions[current.id]
                          const overdue = new Date(current.due_date + 'T23:59:59') < new Date()
                          return (
                            <>
                              <span className={sub ? 'badge-green' : overdue ? 'badge-red' : 'badge-yellow'}>
                                {sub ? 'Submitted' : overdue ? 'Overdue' : 'Open'}
                              </span>
                              {sub?.ai_score && (
                                <span className="bg-[#0F52BA] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {sub.ai_score}/10
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug">{current.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      Due {new Date(current.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 leading-relaxed whitespace-pre-line">{current.description}</p>

                  {grading === current.id ? (
                    <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin text-[#0F52BA]" />
                      <p className="text-sm text-blue-700 font-medium">Grading your response...</p>
                    </div>
                  ) : submissions[current.id] ? (
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={13} className="text-green-600" />
                          <p className="text-xs font-semibold text-green-700">Your Submission</p>
                        </div>
                        {submissions[current.id].ai_score && (
                          <span className="text-xs text-green-700 font-bold">{submissions[current.id].ai_score}/10 pts</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{submissions[current.id].content}</p>
                      {submissions[current.id].ai_feedback && (
                        <p className="text-xs text-[#0F52BA] bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3 leading-relaxed">
                          💡 {submissions[current.id].ai_feedback}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(submissions[current.id].submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="label">Your Response *</label>
                      <textarea className="input" rows={6}
                        value={responses[current.id] || ''}
                        onChange={e => setResponses(r => ({ ...r, [current.id]: e.target.value }))}
                        placeholder="Address each part specifically. Be honest and apply it to your real work context..." />
                      <button onClick={() => submit(current)} disabled={!!submitting}
                        className="btn-primary w-full mt-3">
                        {submitting === current.id ? 'Submitting...' : 'Submit Exercise'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Prev / Next navigation */}
                <div className="flex items-center justify-between mt-4">
                  <button onClick={goPrev} disabled={isFirst}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isFirst ? 'invisible' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#0F52BA]'
                    }`}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button onClick={goNext} disabled={isLast}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isLast ? 'invisible' : 'bg-[#0F52BA] text-white hover:bg-[#0a3a9e]'
                    }`}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function groupExercises(exs) {
  return exs.reduce((acc, e) => {
    if (!acc[e.session_number]) acc[e.session_number] = []
    acc[e.session_number].push(e)
    return acc
  }, {})
}
