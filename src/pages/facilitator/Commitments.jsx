import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'

const RATING_LABELS = { 1: 'No progress', 2: 'Slight progress', 3: 'Good progress', 4: 'Strong progress', 5: 'Excellent progress' }

export default function FacilitatorCommitments() {
  const [data, setData] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: parts }, { data: comms }, { data: upds }] = await Promise.all([
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('commitments').select('*').order('created_at'),
      supabase.from('commitment_updates').select('*').order('week_number'),
    ])

    const updsMap = {}
    ;(upds || []).forEach(u => {
      if (!updsMap[u.commitment_id]) updsMap[u.commitment_id] = []
      updsMap[u.commitment_id].push(u)
    })

    const commsByPart = {}
    ;(comms || []).forEach(c => {
      if (!commsByPart[c.participant_id]) commsByPart[c.participant_id] = []
      commsByPart[c.participant_id].push({ ...c, updates: updsMap[c.id] || [] })
    })

    setData((parts || []).map(p => ({ ...p, commitments: commsByPart[p.id] || [] })))
    setLoading(false)
  }

  // Unique behaviours across all commitments
  const allBehaviours = [...new Set(data.flatMap(p => p.commitments.map(c => c.area)))].sort()

  const filtered = filter === 'all' ? data
    : filter === 'none' ? data.filter(p => p.commitments.length === 0)
    : data.filter(p => p.commitments.some(c => c.area === filter))

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div>
    </div>
  )

  const withCommitment = data.filter(p => p.commitments.length > 0).length
  const totalUpdates = data.reduce((s, p) => s + p.commitments.reduce((ss, c) => ss + c.updates.length, 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leadership Commitments</h1>
          <p className="text-sm text-gray-500 mt-1">Cohort-wide view of leadership behaviour commitments and weekly progress.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Commitments Set</p>
            <p className="text-2xl font-bold text-gray-900">{withCommitment}<span className="text-sm text-gray-400">/{data.length}</span></p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Total Commitments</p>
            <p className="text-2xl font-bold text-gray-900">{data.reduce((s, p) => s + p.commitments.length, 0)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">Weekly Updates</p>
            <p className="text-2xl font-bold text-gray-900">{totalUpdates}</p>
          </div>
        </div>

        {/* Behaviour breakdown */}
        {allBehaviours.length > 0 && (
          <div className="card mb-6">
            <p className="font-semibold text-gray-900 mb-3">Behaviour Distribution</p>
            <div className="flex flex-wrap gap-2">
              {allBehaviours.map(b => {
                const count = data.filter(p => p.commitments.some(c => c.area === b)).length
                return (
                  <button key={b} onClick={() => setFilter(f => f === b ? 'all' : b)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === b ? 'bg-[#0F52BA] text-white border-[#0F52BA]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0F52BA]'}`}>
                    {b} <span className={`${filter === b ? 'bg-white/20' : 'bg-gray-200'} px-1.5 py-0.5 rounded-full`}>{count}</span>
                  </button>
                )
              })}
              <button onClick={() => setFilter('none')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === 'none' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400'}`}>
                No commitment set <span className={`${filter === 'none' ? 'bg-white/20' : 'bg-amber-100'} px-1.5 py-0.5 rounded-full`}>{data.length - withCommitment}</span>
              </button>
            </div>
          </div>
        )}

        {/* Participant list */}
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.department}</p>
                </div>
                <Link to={`/facilitator/participant/${p.id}`} className="text-xs text-[#0F52BA] font-semibold hover:underline">Profile →</Link>
              </div>

              {p.commitments.length === 0 ? (
                <p className="text-xs text-amber-600 font-medium">No leadership commitment set yet.</p>
              ) : (
                <div className="space-y-3">
                  {p.commitments.map(c => {
                    const avgRating = c.updates.length ? c.updates.reduce((s, u) => s + u.rating, 0) / c.updates.length : null
                    return (
                      <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="bg-[#0F52BA]/10 text-[#0F52BA] text-xs font-bold px-2 py-0.5 rounded-full">{c.area}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{c.updates.length}/4 updates</span>
                            {avgRating != null && <span className="font-semibold text-[#0F52BA]">Avg {avgRating.toFixed(1)}/5</span>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1"><strong>Target:</strong> {c.measurable_target}</p>

                        {/* Week progress dots */}
                        <div className="flex gap-1.5 mt-2">
                          {[1,2,3,4].map(w => {
                            const u = c.updates.find(u => u.week_number === w)
                            return (
                              <div key={w} title={u ? `Week ${w}: ${RATING_LABELS[u.rating]}` : `Week ${w}: not logged`}
                                className={`flex-1 h-1.5 rounded-full ${u ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} />
                            )
                          })}
                        </div>

                        {/* Latest update */}
                        {c.updates.length > 0 && (() => {
                          const latest = [...c.updates].sort((a, b) => b.week_number - a.week_number)[0]
                          return (
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">Week {latest.week_number}:</span> {latest.progress_note}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
