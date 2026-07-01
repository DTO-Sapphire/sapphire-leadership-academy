import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { CheckCircle, Clock, Users } from 'lucide-react'

export default function FacilitatorGroups() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: teamRows } = await supabase
      .from('teams')
      .select(`
        id, name,
        team_members(is_leader, participants(id, name)),
        group_exercises(id, title, group_exercise_submissions(id, response, submitted_at, participants(name)))
      `)
      .order('name')

    setTeams(teamRows || [])
    if (teamRows?.length && !selectedTeam) setSelectedTeam(teamRows[0].id)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const active = teams.find(t => t.id === selectedTeam)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Group Assessments</h1>
          <p className="text-gray-500 text-sm mt-0.5">Graduation presentation submissions by team</p>
        </div>

        {/* Team tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {teams.map(t => {
            const done = t.group_exercises?.filter(ex => ex.group_exercise_submissions?.length > 0).length || 0
            const total = t.group_exercises?.length || 0
            const active = t.id === selectedTeam
            return (
              <button key={t.id} onClick={() => setSelectedTeam(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${
                  active ? 'bg-[#0F52BA] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0F52BA]'
                }`}>
                {t.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : done === total && total > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{done}/{total}</span>
              </button>
            )
          })}
        </div>

        {active && (
          <div className="space-y-4">
            {/* Team members */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-[#0F52BA]" />
                <p className="text-sm font-semibold text-gray-700">Members</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {active.team_members?.map(m => (
                  <span key={m.participants?.id}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      m.is_leader
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                    {m.is_leader ? '★ ' : ''}{m.participants?.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Exercises and submissions */}
            {active.group_exercises?.length === 0 ? (
              <div className="card text-center py-10 text-gray-400 text-sm">No exercises assigned to this team.</div>
            ) : (
              active.group_exercises?.map(ex => {
                const sub = ex.group_exercise_submissions?.[0]
                return (
                  <div key={ex.id} className="card">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {sub
                            ? <span className="badge-green flex items-center gap-1"><CheckCircle size={11} /> Submitted</span>
                            : <span className="badge-yellow flex items-center gap-1"><Clock size={11} /> Pending</span>
                          }
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">{ex.title}</h3>
                      </div>
                      {sub && (
                        <p className="text-xs text-gray-400 shrink-0">
                          {new Date(sub.submitted_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>

                    {sub ? (
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-1.5">
                          Submitted by {sub.participants?.name}
                        </p>
                        <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{sub.response}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No response submitted yet.</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
