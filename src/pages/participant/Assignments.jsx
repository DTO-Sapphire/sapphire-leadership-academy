import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Calendar } from 'lucide-react'

export default function Assignments() {
  const { participant } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [responses, setResponses] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participant) return
    load()
  }, [participant])

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
    const response = responses[assignment.id]
    if (!response || response.trim().length < 20) { toast.error('Please write a response of at least 20 characters'); return }
    setSubmitting(assignment.id)
    try {
      const { error } = await supabase.from('assignment_submissions').insert({
        participant_id: participant.id, assignment_id: assignment.id, content: response.trim()
      })
      if (error) throw error
      toast.success('Assignment submitted!')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(null)
    }
  }

  function getStatus(assignment) {
    if (submissions[assignment.id]) return 'submitted'
    const due = new Date(assignment.due_date + 'T23:59:59')
    if (due < new Date()) return 'overdue'
    return 'open'
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Weekly Assignments</h1>
        <p className="text-gray-500 text-sm mb-6">Practical leadership challenges — one per week.</p>
        <div className="space-y-4">
          {assignments.map(a => {
            const status = getStatus(a)
            const sub = submissions[a.id]
            const due = new Date(a.due_date + 'T00:00:00')
            return (
              <div key={a.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-blue">Week {a.week_number}</span>
                      <span className={status === 'submitted' ? 'badge-green' : status === 'overdue' ? 'badge-red' : 'badge-yellow'}>
                        {status === 'submitted' ? 'Submitted' : status === 'overdue' ? 'Overdue' : 'Open'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">{a.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <Calendar size={12} />
                    <span>Due {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{a.description}</p>
                {status === 'submitted' ? (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">Your Submission</p>
                    <p className="text-sm text-gray-700">{sub.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="label">Your Response *</label>
                    <textarea className="input" rows={5}
                      value={responses[a.id] || ''}
                      onChange={e => setResponses(r => ({ ...r, [a.id]: e.target.value }))}
                      placeholder="Write your response here. Be specific and honest about what you did, what you observed, and what you learned..." />
                    <button onClick={() => submitAssignment(a)} disabled={submitting === a.id}
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
