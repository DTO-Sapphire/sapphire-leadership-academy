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

export default function Assignments() {
  const { participant } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [responses, setResponses] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [grading, setGrading] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (participant) load() }, [participant])

  async function load() {
    const [{ data: assigns }, { data: subs }] = await Promise.all([
      supabase.from('weekly_assignments').select('*').order('week_number'),
      supabase.from('assignment_submissions').select('*').eq('participant_id', participant.id),
    ])
    setAssignments(assigns || [])
    const subMap = {}
    ;(subs || []).forEach(s => { subMap[s.assignment_id] = s })
    setSubmissions(subMap)
    setLoading(false)
  }

  async function submitAssignment(assignment) {
    const content = responses[assignment.id]?.trim()
    if (!content || content.length < 20) { toast.error('Please write at least 20 characters'); return }
    setSubmitting(assignment.id)
    try {
      const { data: sub, error } = await supabase
        .from('assignment_submissions')
        .insert({ participant_id: participant.id, assignment_id: assignment.id, content })
        .select().single()
      if (error) throw error

      setGrading(assignment.id)
      toast('Submitted! Grading your response...', { icon: '⏳' })

      const grade = await gradeSubmission(content, assignment.description)
      if (grade?.score) {
        await supabase.from('assignment_submissions')
          .update({ ai_score: grade.score, ai_feedback: grade.feedback })
          .eq('id', sub.id)
      }

      await load()
      toast.success(grade?.score ? `Graded: ${grade.score}/10` : 'Assignment submitted!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(null)
      setGrading(null)
    }
  }

  function getStatus(assignment) {
    if (submissions[assignment.id]) return 'submitted'
    if (new Date(assignment.due_date + 'T23:59:59') < new Date()) return 'overdue'
    return 'open'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Weekly Assignments</h1>
          <p className="text-gray-500 text-sm mt-0.5">One assignment per week covering all laws from that week's sessions.</p>
        </div>
        <div className="space-y-4">
          {assignments.length === 0 && (
            <div className="card text-center py-12 text-gray-400 text-sm">No assignments yet.</div>
          )}
          {assignments.map(a => {
            const status = getStatus(a)
            const sub = submissions[a.id]
            const due = new Date(a.due_date + 'T00:00:00')
            const isGrading = grading === a.id
            return (
              <div key={a.id} className="card">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="badge-blue">Week {a.week_number}</span>
                      <span className={status === 'submitted' ? 'badge-green' : status === 'overdue' ? 'badge-red' : 'badge-yellow'}>
                        {status === 'submitted' ? 'Submitted' : status === 'overdue' ? 'Overdue' : 'Open'}
                      </span>
                      {sub?.ai_score && (
                        <span className="bg-[#0F52BA] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {sub.ai_score}/10
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">{a.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <Calendar size={11} />
                    <span>{due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed whitespace-pre-line">{a.description}</p>

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
                    <p className="text-sm text-gray-700 leading-relaxed">{sub.content}</p>
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
                      value={responses[a.id] || ''}
                      onChange={e => setResponses(r => ({ ...r, [a.id]: e.target.value }))}
                      placeholder="Write your response here. Be specific and apply it to your real work context..." />
                    <button onClick={() => submitAssignment(a)} disabled={!!submitting}
                      className="btn-primary w-full mt-3">
                      {submitting === a.id ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
