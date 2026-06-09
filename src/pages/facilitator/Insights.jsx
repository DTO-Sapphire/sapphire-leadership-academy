import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { AlertTriangle, TrendingUp, BarChart2, Building2 } from 'lucide-react'

const COMPETENCIES = [
  { key: 'leadership_awareness', label: 'Leadership Awareness' },
  { key: 'delegation', label: 'Delegation' },
  { key: 'communication', label: 'Communication' },
  { key: 'decision_making', label: 'Decision Making' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'stakeholder_management', label: 'Stakeholder Management' },
  { key: 'team_development', label: 'Team Development' },
  { key: 'coaching', label: 'Coaching' },
  { key: 'influence', label: 'Influence' },
  { key: 'execution_excellence', label: 'Execution Excellence' },
]

function avg(scores) {
  if (!scores) return null
  const vals = Object.values(scores).map(Number).filter(v => !isNaN(v) && v > 0)
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
}

function fmt(n) { return n != null ? n.toFixed(1) : '—' }

export default function Insights() {
  const [tab, setTab] = useState('growth')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [parts, assessments, attendance, reflections, sessions, commitments] = await Promise.all([
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('assessments').select('participant_id, type, scores'),
      supabase.from('attendance').select('participant_id, session_id'),
      supabase.from('reflections').select('participant_id'),
      supabase.from('sessions').select('id, session_date'),
      supabase.from('commitments').select('participant_id'),
    ])

    const today = new Date()
    const heldSessions = (sessions.data || []).filter(s => new Date(s.session_date) <= today)
    const totalHeld = heldSessions.length
    const heldIds = new Set(heldSessions.map(s => s.id))

    const participants = (parts.data || []).map(p => {
      const baseline = (assessments.data || []).find(a => a.participant_id === p.id && a.type === 'baseline')
      const final = (assessments.data || []).find(a => a.participant_id === p.id && a.type === 'final')
      const baselineAvg = avg(baseline?.scores)
      const finalAvg = avg(final?.scores)
      const growth = baselineAvg != null && finalAvg != null ? finalAvg - baselineAvg : null
      const attended = (attendance.data || []).filter(a => a.participant_id === p.id && heldIds.has(a.session_id)).length
      const reflected = (reflections.data || []).filter(r => r.participant_id === p.id).length
      const hasCommitment = (commitments.data || []).some(c => c.participant_id === p.id)
      return { ...p, baselineAvg, finalAvg, growth, attended, reflected, hasCommitment }
    })

    // Cohort stats
    const withGrowth = participants.filter(p => p.growth != null)
    const cohortGrowth = withGrowth.length ? withGrowth.reduce((s, p) => s + p.growth, 0) / withGrowth.length : null
    const cohortBaseline = participants.filter(p => p.baselineAvg != null)
    const avgBaseline = cohortBaseline.length ? cohortBaseline.reduce((s, p) => s + p.baselineAvg, 0) / cohortBaseline.length : null

    // Department stats
    const depts = {}
    participants.forEach(p => {
      if (!depts[p.department]) depts[p.department] = []
      depts[p.department].push(p)
    })

    // Competency heatmap
    const heatmap = COMPETENCIES.map(c => {
      const bVals = (assessments.data || []).filter(a => a.type === 'baseline' && a.scores?.[c.key]).map(a => Number(a.scores[c.key]))
      const fVals = (assessments.data || []).filter(a => a.type === 'final' && a.scores?.[c.key]).map(a => Number(a.scores[c.key]))
      const bAvg = bVals.length ? bVals.reduce((s, v) => s + v, 0) / bVals.length : null
      const fAvg = fVals.length ? fVals.reduce((s, v) => s + v, 0) / fVals.length : null
      return { ...c, baseline: bAvg, final: fAvg, delta: bAvg != null && fAvg != null ? fAvg - bAvg : null }
    })

    setData({ participants, cohortGrowth, avgBaseline, totalHeld, depts, heatmap, withGrowth })
    setLoading(false)
  }

  const TABS = [
    { key: 'growth', label: 'Growth Index', icon: <TrendingUp size={15} /> },
    { key: 'heatmap', label: 'Competency Heatmap', icon: <BarChart2 size={15} /> },
    { key: 'dept', label: 'Department Intel', icon: <Building2 size={15} /> },
    { key: 'alerts', label: 'Alerts', icon: <AlertTriangle size={15} /> },
  ]

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div>
    </div>
  )

  const { participants, cohortGrowth, avgBaseline, totalHeld, depts, heatmap, withGrowth } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leadership Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Growth measurement, competency analysis, and participant insights.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${tab === t.key ? 'bg-white text-[#0F52BA] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Growth Index tab */}
        {tab === 'growth' && (
          <div>
            {/* Cohort summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="card text-center">
                <p className="text-xs text-gray-500 mb-1">Cohort Avg Baseline</p>
                <p className="text-3xl font-bold text-gray-900">{fmt(avgBaseline)}<span className="text-sm text-gray-400">/10</span></p>
              </div>
              <div className="card text-center">
                <p className="text-xs text-gray-500 mb-1">Cohort Growth Index</p>
                <p className={`text-3xl font-bold ${cohortGrowth != null ? (cohortGrowth >= 0 ? 'text-green-600' : 'text-red-500') : 'text-gray-400'}`}>
                  {cohortGrowth != null ? `${cohortGrowth >= 0 ? '+' : ''}${fmt(cohortGrowth)}` : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{withGrowth.length} final assessments in</p>
              </div>
              <div className="card text-center col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500 mb-1">Baselines Submitted</p>
                <p className="text-3xl font-bold text-gray-900">{participants.filter(p => p.baselineAvg != null).length}<span className="text-sm text-gray-400">/{participants.length}</span></p>
              </div>
            </div>

            {/* Individual table */}
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 font-semibold text-gray-600 pr-4">Participant</th>
                    <th className="text-center py-2.5 font-semibold text-gray-600 px-3">Baseline</th>
                    <th className="text-center py-2.5 font-semibold text-gray-600 px-3">Final</th>
                    <th className="text-center py-2.5 font-semibold text-gray-600 px-3">Growth</th>
                    <th className="text-right py-2.5 font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...participants].sort((a, b) => (b.growth ?? -99) - (a.growth ?? -99)).map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.department}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-700">{fmt(p.baselineAvg)}</td>
                      <td className="py-2.5 px-3 text-center text-gray-700">{fmt(p.finalAvg)}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {p.growth != null
                          ? <span className={p.growth >= 0 ? 'text-green-600' : 'text-red-500'}>{p.growth >= 0 ? '+' : ''}{fmt(p.growth)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link to={`/facilitator/participant/${p.id}`} className="text-xs text-[#0F52BA] font-semibold hover:underline">Profile →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Competency Heatmap tab */}
        {tab === 'heatmap' && (
          <div>
            <div className="card overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-900">Cohort Competency Averages</p>
                <p className="text-xs text-gray-400">Scores out of 10</p>
              </div>
              {heatmap.every(c => c.baseline == null) ? (
                <p className="text-sm text-gray-500 py-4 text-center">No baseline assessments submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...heatmap].sort((a, b) => (b.baseline ?? 0) - (a.baseline ?? 0)).map(c => {
                    const bPct = c.baseline ? (c.baseline / 10) * 100 : 0
                    const fPct = c.final ? (c.final / 10) * 100 : 0
                    const deltaColor = c.delta == null ? '' : c.delta >= 1 ? 'text-green-600' : c.delta >= 0 ? 'text-amber-600' : 'text-red-500'
                    return (
                      <div key={c.key}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-700">{c.label}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-500">B: <strong>{fmt(c.baseline)}</strong></span>
                            {c.final != null && <span className="text-gray-500">F: <strong>{fmt(c.final)}</strong></span>}
                            {c.delta != null && <span className={`font-bold ${deltaColor}`}>{c.delta >= 0 ? '+' : ''}{fmt(c.delta)}</span>}
                          </div>
                        </div>
                        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gray-300 rounded-full transition-all" style={{ width: `${bPct}%` }} />
                          {c.final != null && <div className="absolute inset-y-0 left-0 bg-[#0F52BA] rounded-full opacity-70 transition-all" style={{ width: `${fPct}%` }} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-300" />Baseline</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#0F52BA] opacity-70" />Final</div>
              </div>
            </div>
          </div>
        )}

        {/* Department Intelligence tab */}
        {tab === 'dept' && (
          <div className="space-y-4">
            {Object.entries(depts).sort((a, b) => a[0].localeCompare(b[0])).map(([dept, members]) => {
              const attRate = totalHeld > 0 ? members.reduce((s, p) => s + p.attended, 0) / (members.length * totalHeld) * 100 : null
              const reflRate = totalHeld > 0 ? members.reduce((s, p) => s + p.reflected, 0) / (members.length * totalHeld) * 100 : null
              const deptGrowth = members.filter(p => p.growth != null)
              const avgGrowth = deptGrowth.length ? deptGrowth.reduce((s, p) => s + p.growth, 0) / deptGrowth.length : null
              const avgBase = members.filter(p => p.baselineAvg != null)
              const deptBaseline = avgBase.length ? avgBase.reduce((s, p) => s + p.baselineAvg, 0) / avgBase.length : null
              const commitRate = members.filter(p => p.hasCommitment).length / members.length * 100

              return (
                <div key={dept} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{dept}</h3>
                      <p className="text-xs text-gray-400">{members.length} participant{members.length !== 1 ? 's' : ''}</p>
                    </div>
                    {avgGrowth != null && (
                      <span className={`text-sm font-bold ${avgGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {avgGrowth >= 0 ? '+' : ''}{fmt(avgGrowth)} growth
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Attendance Rate', value: attRate != null ? `${attRate.toFixed(0)}%` : '—' },
                      { label: 'Reflection Rate', value: reflRate != null ? `${reflRate.toFixed(0)}%` : '—' },
                      { label: 'Avg Baseline', value: deptBaseline != null ? `${fmt(deptBaseline)}/10` : '—' },
                      { label: 'Commitment Rate', value: `${commitRate.toFixed(0)}%` },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className="font-bold text-gray-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {members.map(p => (
                      <Link key={p.id} to={`/facilitator/participant/${p.id}`}
                        className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-[#0F52BA] hover:text-[#0F52BA] transition-colors">
                        {p.name.split(' ')[0]}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Intervention Alerts tab */}
        {tab === 'alerts' && (
          <div>
            {(() => {
              const alerts = participants.map(p => {
                const issues = []
                if (totalHeld > 0 && p.attended / totalHeld < 0.5) issues.push(`Attended ${p.attended}/${totalHeld} sessions (${((p.attended/totalHeld)*100).toFixed(0)}%)`)
                if (p.reflected === 0 && totalHeld > 0) issues.push('No reflections submitted')
                if (!p.hasCommitment) issues.push('No leadership commitment set')
                if (p.baselineAvg == null) issues.push('Baseline assessment not submitted')
                return { ...p, issues }
              }).filter(p => p.issues.length > 0)

              return alerts.length === 0 ? (
                <div className="card text-center py-10">
                  <p className="font-semibold text-green-700 mb-1">No alerts — cohort is on track</p>
                  <p className="text-sm text-gray-500">All participants are meeting participation expectations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-2">{alerts.length} participant{alerts.length !== 1 ? 's' : ''} may need support.</p>
                  {alerts.sort((a, b) => b.issues.length - a.issues.length).map(p => (
                    <div key={p.id} className="card border-l-4 border-amber-400">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400 mb-2">{p.department}</p>
                          <ul className="space-y-1">
                            {p.issues.map((issue, i) => (
                              <li key={i} className="text-sm text-amber-700 flex items-center gap-1.5">
                                <AlertTriangle size={12} className="shrink-0" />{issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Link to={`/facilitator/participant/${p.id}`}
                          className="text-xs text-[#0F52BA] font-semibold hover:underline shrink-0 ml-4">
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
