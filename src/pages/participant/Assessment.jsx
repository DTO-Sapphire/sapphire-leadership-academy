import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'

const COMPETENCIES = [
  { key: 'communication',          label: 'Communication',         description: 'How clearly and effectively you share information and listen to others' },
  { key: 'delegation',             label: 'Delegation',            description: 'How well you assign tasks and trust your team to deliver' },
  { key: 'accountability',         label: 'Accountability',        description: 'How consistently you take ownership of outcomes and commitments' },
  { key: 'planning',               label: 'Planning',              description: 'How effectively you set priorities and organise work toward goals' },
  { key: 'emotional_intelligence', label: 'Emotional Intelligence',description: 'How well you understand and manage your emotions and those of others' },
  { key: 'coaching_mentoring',     label: 'Coaching & Mentoring',  description: 'How actively you develop the people around you' },
  { key: 'decision_making',        label: 'Decision Making',       description: 'How confidently and effectively you make decisions under pressure' },
  { key: 'conflict_resolution',    label: 'Conflict Resolution',   description: 'How constructively you handle disagreements and tensions' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
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
      const shuffled = shuffle(COMPETENCIES.map(c => c.key))
      setOrder(shuffled)
    }
    setLoading(false)
  }

  function saveDraft(ratings, currentIndex, order) {
    localStorage.setItem(`assessment_draft_${participant.id}_${type}`, JSON.stringify({ ratings, currentIndex, order }))
  }

  function rate(val) {
    const key = order[currentIndex]
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
    if (Object.keys(ratings).length < 8) { toast.error('Please rate all competencies'); return }
    setSubmitting(true)
    try {
      const payload = { participant_id: participant.id, type, scores: ratings }
      const { error } = await supabase.from('assessments').insert(payload)
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

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  if (baseline && final) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Both Assessments Complete</h2>
          <p className="text-gray-500 mb-4">You've completed your baseline and final assessments.</p>
          <a href="/dashboard/growth" className="btn-primary inline-block">View Growth Index</a>
        </div>
      </div>
    </div>
  )

  if (type === 'final' && !finalOpen) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Final Assessment Not Yet Open</h2>
          <p className="text-gray-500">The facilitators will open this at the right time.</p>
        </div>
      </div>
    </div>
  )

  const currentKey = order[currentIndex]
  const comp = COMPETENCIES.find(c => c.key === currentKey)
  const progress = Math.round((Object.keys(ratings).length / 8) * 100)
  const allRated = Object.keys(ratings).length === 8

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
            <div className="grid grid-cols-10 gap-1.5 mb-6">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => rate(n)}
                  className={`h-12 rounded-lg font-bold text-sm transition-all ${ratings[currentKey] === n ? 'bg-[#0F52BA] text-white scale-105 shadow' : 'bg-gray-100 hover:bg-blue-100 text-gray-700'}`}>
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
                : <button onClick={submit} disabled={!allRated || submitting} className="btn-primary flex-1">
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
              }
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {order.map((k, i) => {
            const c = COMPETENCIES.find(c => c.key === k)
            return (
              <button key={k} onClick={() => setCurrentIndex(i)}
                className={`p-2 rounded-lg text-xs text-center transition-all ${i === currentIndex ? 'bg-[#0F52BA] text-white' : ratings[k] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c?.label.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
