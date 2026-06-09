import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'

const COMPETENCIES = [
  { key: 'leadership_awareness',    label: 'Leadership Awareness',    description: 'How clearly do you understand your own leadership style, strengths, and blind spots?' },
  { key: 'delegation',              label: 'Delegation',              description: 'How well do you assign tasks and trust your team to deliver?' },
  { key: 'communication',           label: 'Communication',           description: 'How clearly and effectively do you share information and listen to others?' },
  { key: 'decision_making',         label: 'Decision Making',         description: 'How confidently and effectively do you make decisions under pressure?' },
  { key: 'accountability',          label: 'Accountability',          description: 'How consistently do you take ownership of outcomes and commitments?' },
  { key: 'stakeholder_management',  label: 'Stakeholder Management',  description: 'How effectively do you identify, engage, and manage the expectations of key stakeholders?' },
  { key: 'team_development',        label: 'Team Development',        description: 'How intentionally do you build, develop, and grow the people on your team?' },
  { key: 'coaching',                label: 'Coaching',                description: 'How actively do you coach and develop the people around you to reach their potential?' },
  { key: 'influence',               label: 'Influence',               description: 'How effectively do you lead through influence rather than authority?' },
  { key: 'execution_excellence',    label: 'Execution Excellence',    description: 'How consistently do you translate plans into results and drive initiatives to completion?' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function RatingRow({ compKey, value, onChange }) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onClick={() => onChange(compKey, n)}
          className={`h-10 rounded-lg font-bold text-sm transition-all ${value === n ? 'bg-[#0F52BA] text-white scale-105 shadow' : 'bg-gray-100 hover:bg-blue-100 text-gray-700'}`}>
          {n}
        </button>
      ))}
    </div>
  )
}

export default function Assessment() {
  const { participant } = useAuth()
  const navigate = useNavigate()
  const [baseline, setBaseline] = useState(null)
  const [final, setFinal] = useState(null)
  const [finalOpen, setFinalOpen] = useState(false)
  const [order, setOrder] = useState([])
  const [ratings, setRatings] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewing, setReviewing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState('baseline')

  useEffect(() => {
    if (!participant) return
    loadState()
  }, [participant])

  async function loadState() {
    const [{ data: b }, { data: f }, { data: s }] = await Promise.all([
      supabase.from('assessments').select('*').eq('participant_id', participant.id).eq('type', 'baseline').single(),
      supabase.from('assessments').select('*').eq('participant_id', participant.id).eq('type', 'final').single(),
      supabase.from('settings').select('*').eq('key', 'final_assessment_open').single(),
    ])
    setBaseline(b)
    setFinal(f)
    setFinalOpen(s?.value === 'true')
    const t = !b ? 'baseline' : 'final'
    setType(t)
    const draft = localStorage.getItem(`assessment_draft_${participant.id}_${t}`)
    if (draft) {
      const parsed = JSON.parse(draft)
      setOrder(parsed.order)
      setRatings(parsed.ratings)
      setCurrentIndex(parsed.currentIndex)
    } else {
      setOrder(shuffle(COMPETENCIES.map(c => c.key)))
    }
    setLoading(false)
  }

  function saveDraft(r, idx, ord) {
    localStorage.setItem(`assessment_draft_${participant.id}_${type}`, JSON.stringify({ ratings: r, currentIndex: idx, order: ord }))
  }

  function rate(val) {
    const key = order[currentIndex]
    const newRatings = { ...ratings, [key]: val }
    setRatings(newRatings)
    saveDraft(newRatings, currentIndex, order)
  }

  function rateInReview(key, val) {
    const newRatings = { ...ratings, [key]: val }
    setRatings(newRatings)
    saveDraft(newRatings, currentIndex, order)
  }

  function next() {
    const newIdx = currentIndex + 1
    setCurrentIndex(newIdx)
    saveDraft(ratings, newIdx, order)
  }

  function prev() {
    const newIdx = currentIndex - 1
    setCurrentIndex(newIdx)
    saveDraft(ratings, newIdx, order)
  }

  async function submit() {
    if (Object.keys(ratings).length < 10) { toast.error('Please rate all competencies before submitting'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('assessments').insert({ participant_id: participant.id, type, scores: ratings })
      if (error) throw error
      localStorage.removeItem(`assessment_draft_${participant.id}_${type}`)
      toast.success(`${type === 'baseline' ? 'Baseline' : 'Final'} assessment submitted!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  if (baseline && final) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Both Assessments Complete</h2>
          <p className="text-gray-500 mb-4">You have completed your baseline and final assessments.</p>
          <a href="/dashboard/growth" className="btn-primary inline-block">View Growth Index</a>
        </div>
      </div>
    </div>
  )

  if (type === 'final' && !finalOpen) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <h2 className="text-xl font-bold mb-2">Final Assessment Not Yet Open</h2>
          <p className="text-gray-500">The facilitators will open this at the right time.</p>
        </div>
      </div>
    </div>
  )

  const allRated = COMPETENCIES.every(c => ratings[c.key])

  // ── Review screen ──────────────────────────────────────────
  if (reviewing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <button onClick={() => setReviewing(false)}
              className="text-sm text-[#0F52BA] hover:underline mb-3 block">
              ← Back to questions
            </button>
            <h2 className="text-xl font-bold text-gray-900">Review your answers</h2>
            <p className="text-gray-500 text-sm mt-1">
              You can change any rating below. When you are happy with all your answers, click Submit.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {order.map((key, i) => {
              const comp = COMPETENCIES.find(c => c.key === key)
              const val = ratings[key]
              return (
                <div key={key} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-[#FFAF46]">0{i + 1}</span>
                      <h3 className="font-bold text-gray-900 text-base">{comp.label}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{comp.description}</p>
                    </div>
                    {val && (
                      <span className="text-2xl font-bold text-[#0F52BA] ml-4 shrink-0">{val}<span className="text-sm text-gray-400 font-normal">/10</span></span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Needs development</span>
                    <span>Highly effective</span>
                  </div>
                  <RatingRow compKey={key} value={val} onChange={rateInReview} />
                </div>
              )
            })}
          </div>

          <div className="card bg-[#0F52BA]/5 border border-[#0F52BA]/15 mb-4">
            <p className="text-sm text-gray-600 text-center">
              {allRated
                ? 'All 10 competencies rated. Ready to submit.'
                : `${COMPETENCIES.filter(c => !ratings[c.key]).length} competency(s) still need a rating.`
              }
            </p>
          </div>

          <button onClick={submit} disabled={!allRated || submitting}
            className="btn-primary w-full py-4 text-base">
            {submitting ? 'Submitting...' : `Submit ${type === 'baseline' ? 'Baseline' : 'Final'} Assessment`}
          </button>
        </div>
      </div>
    )
  }

  // ── Question screen ────────────────────────────────────────
  const currentKey = order[currentIndex]
  const comp = COMPETENCIES.find(c => c.key === currentKey)
  const ratedCount = COMPETENCIES.filter(c => ratings[c.key]).length
  const progress = Math.round((ratedCount / 10) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-[#0F52BA]">
              {type === 'baseline' ? 'Baseline Assessment' : 'Final Assessment'}
            </span>
            <span className="text-sm text-gray-500">{currentIndex + 1} of {order.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#0F52BA] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {comp && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{comp.label}</h2>
            <p className="text-gray-500 text-sm mb-6">{comp.description}</p>
            <div className="flex justify-between text-xs text-gray-400 mb-3">
              <span>Needs development</span>
              <span>Highly effective</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-6">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => rate(n)}
                  className={`h-10 sm:h-12 rounded-lg font-bold text-sm transition-all ${ratings[currentKey] === n ? 'bg-[#0F52BA] text-white scale-105 shadow' : 'bg-gray-100 hover:bg-blue-100 text-gray-700'}`}>
                  {n}
                </button>
              ))}
            </div>
            {ratings[currentKey] && (
              <p className="text-center text-sm text-gray-600 mb-4">
                You rated: <strong className="text-[#0F52BA]">{ratings[currentKey]}/10</strong>
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={prev} disabled={currentIndex === 0} className="btn-secondary flex-1">← Back</button>
              {currentIndex < order.length - 1
                ? <button onClick={next} disabled={!ratings[currentKey]} className="btn-primary flex-1">Next →</button>
                : <button onClick={() => setReviewing(true)} disabled={!ratings[currentKey]} className="btn-primary flex-1">
                    Review Answers →
                  </button>
              }
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {order.map((k, i) => {
            const c = COMPETENCIES.find(c => c.key === k)
            return (
              <button key={k} onClick={() => { setReviewing(false); setCurrentIndex(i) }}
                className={`p-2 rounded-lg text-xs text-center transition-all ${i === currentIndex ? 'bg-[#0F52BA] text-white' : ratings[k] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c?.label.split(' ')[0]}
              </button>
            )
          })}
        </div>

        {allRated && (
          <button onClick={() => setReviewing(true)}
            className="mt-4 w-full text-center text-sm text-[#0F52BA] font-semibold hover:underline">
            All questions answered. Review and submit →
          </button>
        )}
      </div>
    </div>
  )
}
