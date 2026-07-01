import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { Star, MessageSquare, Copy, Check } from 'lucide-react'

function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={14}
          className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

export default function FeedbackView() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('facilitator_feedback')
      .select('*')
      .eq('facilitator_name', 'Sapphire Leadership')
      .order('submitted_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  function copySummary() {
    const avg = rows.length
      ? (rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(1)
      : '—'

    const lines = [
      `SAPPHIRE LEADERSHIP FEEDBACK SUMMARY`,
      `SLA Graduation 2026 — Anonymous Participant Responses`,
      `Total responses: ${rows.length} | Average rating: ${avg}/5`,
      ``,
      ...rows.map((r, i) => [
        `─────────────────────────────`,
        `Response ${i + 1} — ${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}`,
        r.most_valuable ? `\nWhat's working:\n${r.most_valuable}` : '',
        r.to_improve ? `\nNeeds to change:\n${r.to_improve}` : '',
        r.additional ? `\n${r.additional}` : '',
      ].filter(Boolean).join('\n')),
      `─────────────────────────────`,
    ].join('\n')

    navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const avg = rows.length
    ? (rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(1)
    : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sapphire Leadership Feedback</h1>
            <p className="text-gray-500 text-sm mt-0.5">Anonymous feedback from SLA 2026 participants → for MD & PLM</p>
          </div>
          {rows.length > 0 && (
            <button onClick={copySummary}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-[#0F52BA] transition-colors shrink-0">
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
          )}
        </div>

        {/* Summary card */}
        <div className="card mb-6 bg-gradient-to-br from-[#0A3480] to-[#0F52BA] text-white">
          <p className="text-xs text-white/60 uppercase tracking-widest font-semibold mb-3">
            SLA 2026 — Organisational Leadership Feedback
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold">{rows.length}</p>
              <p className="text-xs text-white/60 mt-0.5">responses</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{avg}</p>
              <p className="text-xs text-white/60 mt-0.5">avg rating / 5</p>
            </div>
            {avg !== '—' && (
              <div className="flex items-end pb-1">
                <Stars value={Math.round(Number(avg))} />
              </div>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No responses yet. Share the platform link with participants.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r, i) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <Stars value={r.rating} />
                  <p className="text-xs text-gray-400">
                    {new Date(r.submitted_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>

                {r.most_valuable && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#0F52BA] uppercase tracking-wide mb-1.5">
                      What Sapphire is doing well
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{r.most_valuable}</p>
                  </div>
                )}
                {r.to_improve && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1.5">
                      What needs to change
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{r.to_improve}</p>
                  </div>
                )}
                {r.additional && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      Additional
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{r.additional}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
