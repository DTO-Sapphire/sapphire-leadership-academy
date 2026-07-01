import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Star, ShieldCheck, CheckCircle } from 'lucide-react'

const FACILITATORS = [
  {
    key: 'lola',
    name: 'Dr. Lola Matesun',
    session: 'Session 6 — Connection, Intuition & Empowerment',
  },
  {
    key: 'wale',
    name: 'Mrs. Wale Odufalu',
    session: 'Session 7 — Solid Ground, Sacrifice & Victory',
  },
  {
    key: 'adeleke',
    name: 'Adeleke Adekoya',
    session: 'Sessions 8 & 9 — Reproduction, Inner Circle, Explosive Growth & Big Mo',
  },
]

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none">
          <Star size={28}
            className={`transition-colors ${n <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
        </button>
      ))}
    </div>
  )
}

function doneKey(key) { return `sla_feedback_done_${key}` }

export default function FacilitatorFeedback() {
  const [selected, setSelected] = useState(0)
  const [ratings, setRatings] = useState({})
  const [fields, setFields] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(() => {
    const d = {}
    FACILITATORS.forEach(f => { d[f.key] = !!localStorage.getItem(doneKey(f.key)) })
    return d
  })

  const f = FACILITATORS[selected]

  function setField(facilitatorKey, field, value) {
    setFields(prev => ({
      ...prev,
      [facilitatorKey]: { ...prev[facilitatorKey], [field]: value },
    }))
  }

  async function submit() {
    const rating = ratings[f.key]
    const vals = fields[f.key] || {}
    if (!rating) { toast.error('Please select a star rating'); return }
    if (!vals.most_valuable?.trim()) { toast.error('Please fill in what you found most valuable'); return }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('facilitator_feedback').insert({
        facilitator_name: f.name,
        session_label: f.session,
        rating,
        most_valuable: vals.most_valuable?.trim() || null,
        to_improve: vals.to_improve?.trim() || null,
        additional: vals.additional?.trim() || null,
      })
      if (error) throw error

      localStorage.setItem(doneKey(f.key), '1')
      setDone(prev => ({ ...prev, [f.key]: true }))
      toast.success('Feedback submitted — thank you!')

      // Auto-advance to next incomplete
      const next = FACILITATORS.findIndex((fac, i) => i > selected && !localStorage.getItem(doneKey(fac.key)))
      if (next !== -1) setSelected(next)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const totalDone = Object.values(done).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Facilitator Feedback</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalDone}/3 submitted</p>
        </div>

        {/* Anonymity notice */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
          <ShieldCheck size={18} className="text-[#0F52BA] mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 leading-relaxed">
            Your feedback is <strong>completely anonymous</strong>. Your name is never recorded. Facilitators will only see ratings and written responses — no participant identities.
          </p>
        </div>

        {/* Facilitator tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {FACILITATORS.map((fac, i) => (
            <button key={fac.key} onClick={() => setSelected(i)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${
                i === selected
                  ? 'bg-[#0F52BA] text-white shadow'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0F52BA]'
              }`}>
              {done[fac.key] && <CheckCircle size={13} className={i === selected ? 'text-green-300' : 'text-green-500'} />}
              {fac.name.split(' ')[0]} {fac.name.split(' ')[1]}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">{f.session}</p>
            <h2 className="text-lg font-bold text-gray-900">{f.name}</h2>
          </div>

          {done[f.key] ? (
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-800 text-sm">Feedback submitted</p>
              <p className="text-green-600 text-xs mt-1">Thank you for sharing your honest thoughts.</p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Star rating */}
              <div>
                <label className="label mb-2">Overall rating *</label>
                <StarRating
                  value={ratings[f.key] || 0}
                  onChange={v => setRatings(prev => ({ ...prev, [f.key]: v }))} />
                <p className="text-xs text-gray-400 mt-1">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratings[f.key] || 0]}
                </p>
              </div>

              {/* Most valuable */}
              <div>
                <label className="label">What did you find most valuable about this session? *</label>
                <textarea className="input" rows={3}
                  value={fields[f.key]?.most_valuable || ''}
                  onChange={e => setField(f.key, 'most_valuable', e.target.value)}
                  placeholder="Be specific — a concept, a moment, a question that changed how you think..." />
              </div>

              {/* To improve */}
              <div>
                <label className="label">What could be improved for future sessions?</label>
                <textarea className="input" rows={3}
                  value={fields[f.key]?.to_improve || ''}
                  onChange={e => setField(f.key, 'to_improve', e.target.value)}
                  placeholder="Honest, constructive feedback helps facilitators grow too..." />
              </div>

              {/* Additional */}
              <div>
                <label className="label">Any other message for this facilitator?</label>
                <textarea className="input" rows={2}
                  value={fields[f.key]?.additional || ''}
                  onChange={e => setField(f.key, 'additional', e.target.value)}
                  placeholder="Anything else you want them to know..." />
              </div>

              <button onClick={submit} disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Submitting...' : 'Submit Feedback Anonymously'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
