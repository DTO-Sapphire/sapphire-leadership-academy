import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { Star, MessageSquare } from 'lucide-react'

const FACILITATORS = [
  { name: 'Dr. Lola Matesun', session: 'Session 6 — Connection, Intuition & Empowerment' },
  { name: 'Mrs. Wale Odufalu', session: 'Session 7 — Solid Ground, Sacrifice & Victory' },
  { name: 'Adeleke Adekoya', session: 'Sessions 8 & 9 — Reproduction, Inner Circle, Explosive Growth & Big Mo' },
]

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
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('facilitator_feedback')
      .select('*')
      .order('submitted_at', { ascending: false })
    setFeedback(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  const f = FACILITATORS[selected]
  const rows = feedback.filter(r => r.facilitator_name === f.name)
  const avg = rows.length
    ? (rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(1)
    : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Facilitator Feedback</h1>
          <p className="text-gray-500 text-sm mt-0.5">Anonymous responses from participants</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FACILITATORS.map((fac, i) => {
            const count = feedback.filter(r => r.facilitator_name === fac.name).length
            return (
              <button key={fac.name} onClick={() => setSelected(i)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${
                  i === selected
                    ? 'bg-[#0F52BA] text-white shadow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0F52BA]'
                }`}>
                {fac.name.split(' ')[0]} {fac.name.split(' ')[1]}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  i === selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Summary card */}
        <div className="card mb-5 bg-gradient-to-br from-[#0A3480] to-[#0F52BA] text-white">
          <p className="text-xs text-white/60 uppercase tracking-widest font-semibold mb-0.5">{f.session}</p>
          <h2 className="text-lg font-bold mb-4">{f.name}</h2>
          <div className="flex gap-6">
            <div>
              <p className="text-3xl font-bold">{avg}</p>
              <p className="text-xs text-white/60 mt-0.5">avg rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{rows.length}</p>
              <p className="text-xs text-white/60 mt-0.5">responses</p>
            </div>
            <div className="flex items-end pb-1">
              {avg !== '—' && <Stars value={Math.round(Number(avg))} />}
            </div>
          </div>
        </div>

        {/* Responses */}
        {rows.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No responses yet for this facilitator.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r, i) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <Stars value={r.rating} />
                  <p className="text-xs text-gray-400">
                    {new Date(r.submitted_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>

                {r.most_valuable && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Most Valuable</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{r.most_valuable}</p>
                  </div>
                )}
                {r.to_improve && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">To Improve</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{r.to_improve}</p>
                  </div>
                )}
                {r.additional && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Additional</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{r.additional}</p>
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
