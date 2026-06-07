import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const COMPETENCIES = [
  { key: 'communication',          label: 'Communication' },
  { key: 'delegation',             label: 'Delegation' },
  { key: 'accountability',         label: 'Accountability' },
  { key: 'planning',               label: 'Planning' },
  { key: 'emotional_intelligence', label: 'EQ' },
  { key: 'coaching_mentoring',     label: 'Coaching' },
  { key: 'decision_making',        label: 'Decisions' },
  { key: 'conflict_resolution',    label: 'Conflict' },
]

export default function Growth() {
  const { participant } = useAuth()
  const [baseline, setBaseline] = useState(null)
  const [final, setFinal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participant) return
    Promise.all([
      supabase.from('assessments').select('*').eq('participant_id', participant.id).eq('type', 'baseline').single(),
      supabase.from('assessments').select('*').eq('participant_id', participant.id).eq('type', 'final').single(),
    ]).then(([{ data: b }, { data: f }]) => { setBaseline(b); setFinal(f); setLoading(false) })
  }, [participant])

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  if (!baseline) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <p className="text-gray-600">Complete your baseline assessment first to see your growth index.</p>
        </div>
      </div>
    </div>
  )

  if (!final) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <p className="text-gray-600">Your growth index will be available once you complete the final assessment.</p>
        </div>
      </div>
    </div>
  )

  const scores = k => ({ b: baseline.scores?.[k] ?? 0, f: final.scores?.[k] ?? 0 })

  const radarData = COMPETENCIES.map(c => ({
    subject: c.label,
    Baseline: scores(c.key).b,
    Final: scores(c.key).f,
    fullMark: 10,
  }))

  const baselineAvg = COMPETENCIES.reduce((sum, c) => sum + scores(c.key).b, 0) / 8
  const finalAvg   = COMPETENCIES.reduce((sum, c) => sum + scores(c.key).f, 0) / 8
  const growthPct  = baselineAvg > 0 ? ((finalAvg - baselineAvg) / baselineAvg * 100).toFixed(1) : '0.0'
  const isPositive = finalAvg >= baselineAvg

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Leadership Growth Index</h1>
        <p className="text-gray-500 text-sm mb-6">Self-assessed leadership development across the programme.</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-500">{baselineAvg.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-1">Baseline avg</p>
          </div>
          <div className="card text-center bg-[#0F52BA] text-white">
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
              {isPositive ? '+' : ''}{growthPct}%
            </p>
            <p className="text-xs text-blue-200 mt-1">Growth</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-[#0F52BA]">{finalAvg.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-1">Final avg</p>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-center">Leadership Radar</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar name="Baseline" dataKey="Baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
              <Radar name="Final" dataKey="Final" stroke="#0F52BA" fill="#0F52BA" fillOpacity={0.4} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#94a3b8]" /> Baseline</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#0F52BA]" /> Final</div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Competency Breakdown</h2>
          <div className="space-y-3">
            {COMPETENCIES.map(c => {
              const { b, f } = scores(c.key)
              const diff = f - b
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-600 shrink-0">{c.label}</div>
                  <div className="flex-1 relative h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-gray-300 rounded-full" style={{ width: `${b * 10}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-[#0F52BA] rounded-full opacity-70" style={{ width: `${f * 10}%` }} />
                  </div>
                  <div className="text-xs w-20 text-right shrink-0">
                    <span className="text-gray-500">{b}</span>
                    <span className="mx-1">→</span>
                    <span className="font-semibold text-[#0F52BA]">{f}</span>
                    <span className={`ml-1 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      ({diff > 0 ? '+' : ''}{diff})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
