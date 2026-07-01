import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { CheckCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react'

export default function GroupExercise() {
  const { participant } = useAuth()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [exercises, setExercises] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [responses, setResponses] = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exerciseIndex, setExerciseIndex] = useState(0)

  useEffect(() => { if (participant) load() }, [participant])

  async function load() {
    // Find this participant's team
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, is_leader, teams(id, name)')
      .eq('participant_id', participant.id)
      .single()

    if (!membership) { setLoading(false); return }

    const teamData = membership.teams
    setTeam({ ...teamData, isLeader: membership.is_leader })

    const [{ data: memberRows }, { data: exRows }, { data: subRows }] = await Promise.all([
      supabase
        .from('team_members')
        .select('is_leader, participants(id, name)')
        .eq('team_id', teamData.id),
      supabase
        .from('group_exercises')
        .select('*')
        .eq('team_id', teamData.id)
        .order('created_at'),
      supabase
        .from('group_exercise_submissions')
        .select('*')
        .eq('team_id', teamData.id),
    ])

    setMembers(memberRows || [])
    setExercises(exRows || [])

    const subMap = {}
    ;(subRows || []).forEach(s => { subMap[s.exercise_id] = s })
    setSubmissions(subMap)
    setLoading(false)
  }

  async function submit(exercise) {
    const content = responses[exercise.id]?.trim()
    if (!content || content.length < 30) {
      toast.error('Please write at least 30 characters')
      return
    }
    setSubmitting(exercise.id)
    try {
      const { error } = await supabase
        .from('group_exercise_submissions')
        .upsert({
          exercise_id: exercise.id,
          team_id: team.id,
          submitted_by: participant.id,
          response: content,
        }, { onConflict: 'exercise_id,team_id' })
      if (error) throw error
      await load()
      toast.success('Group response submitted!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  if (!team) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="card py-12">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">You have not been assigned to a team yet.</p>
          <p className="text-gray-400 text-xs mt-1">Please check with your facilitator.</p>
        </div>
      </div>
    </div>
  )

  const current = exercises[exerciseIndex]
  const doneSub = current ? submissions[current.id] : null
  const totalDone = Object.keys(submissions).length
  const isFirst = exerciseIndex === 0
  const isLast = exerciseIndex === exercises.length - 1

  const leader = members.find(m => m.is_leader)
  const others = members.filter(m => !m.is_leader)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Team header */}
        <div className="card mb-5 bg-gradient-to-br from-[#0A3480] to-[#0F52BA] text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-widest font-semibold mb-0.5">Your Team</p>
              <h1 className="text-xl font-bold">{team.name}</h1>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
              <p className="text-2xl font-bold">{totalDone}/{exercises.length}</p>
              <p className="text-xs text-white/70">submitted</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {leader && (
              <span className="flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/30 text-yellow-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                ★ {leader.participants?.name}
              </span>
            )}
            {others.map(m => (
              <span key={m.participants?.id} className="bg-white/10 text-white/80 text-xs font-medium px-2.5 py-1 rounded-full">
                {m.participants?.name}
              </span>
            ))}
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="card text-center py-12 text-gray-400 text-sm">
            No group exercises yet — check back soon.
          </div>
        ) : (
          <>
            {/* Step dots */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                Exercise {exerciseIndex + 1} of {exercises.length}
              </p>
              <div className="flex items-center gap-2">
                {exercises.map((ex, i) => (
                  <button key={ex.id} onClick={() => setExerciseIndex(i)}
                    className={`rounded-full transition-all ${
                      i === exerciseIndex
                        ? 'w-6 h-2.5 bg-[#0F52BA]'
                        : submissions[ex.id]
                        ? 'w-2.5 h-2.5 bg-green-400'
                        : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                    }`} />
                ))}
              </div>
            </div>

            {current && (
              <div className="card">
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {doneSub
                      ? <span className="badge-green">Submitted</span>
                      : <span className="badge-yellow">Open</span>
                    }
                  </div>
                  <h2 className="font-bold text-gray-900 text-base leading-snug">{current.title}</h2>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{current.description}</p>
                </div>

                {doneSub ? (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle size={13} className="text-green-600" />
                      <p className="text-xs font-semibold text-green-700">Team Response Submitted</p>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{doneSub.response}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(doneSub.submitted_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <button
                      onClick={() => setResponses(r => ({ ...r, [current.id]: doneSub.response }))}
                      className="text-xs text-[#0F52BA] hover:underline mt-2 block">
                      Edit response
                    </button>
                  </div>
                ) : responses[current.id] !== undefined && doneSub === null ? (
                  <div>
                    <label className="label">Team Response *</label>
                    <p className="text-xs text-gray-400 mb-2">
                      Discuss as a group first, then record your collective answer below. Any team member can submit.
                    </p>
                    <textarea className="input" rows={7}
                      value={responses[current.id] || ''}
                      onChange={e => setResponses(r => ({ ...r, [current.id]: e.target.value }))}
                      placeholder="Record your group's collective response here — address the scenario and your commitments specifically..." />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setResponses(r => { const n = { ...r }; delete n[current.id]; return n })}
                        className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">
                        Cancel
                      </button>
                      <button onClick={() => submit(current)} disabled={!!submitting}
                        className="flex-1 btn-primary">
                        {submitting === current.id ? 'Submitting...' : 'Submit Response'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResponses(r => ({ ...r, [current.id]: '' }))}
                    className="btn-primary w-full">
                    Write Team Response
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setExerciseIndex(i => i - 1)} disabled={isFirst}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isFirst ? 'invisible' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#0F52BA]'
                }`}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button onClick={() => setExerciseIndex(i => i + 1)} disabled={isLast}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isLast ? 'invisible' : 'bg-[#0F52BA] text-white hover:bg-[#0a3a9e]'
                }`}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
