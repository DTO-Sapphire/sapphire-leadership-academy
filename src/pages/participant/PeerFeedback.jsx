import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Users, CheckCircle } from 'lucide-react'

const RATING_LABELS = { 1: 'Needs development', 2: 'Some progress', 3: 'Good progress', 4: 'Strong leader', 5: 'Exceptional' }

export default function PeerFeedback() {
  const { participant } = useAuth()
  const [peers, setPeers] = useState([])
  const [ratings, setRatings] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!participant) return
    load()
  }, [participant])

  async function load() {
    const [{ data: setting }, { data: allParts }, { data: existing }] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'peer_feedback_open').single(),
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('peer_feedback').select('recipient_id, rating').eq('reviewer_id', participant.id),
    ])
    setOpen(setting?.value === 'true')
    setPeers((allParts || []).filter(p => p.id !== participant.id))
    if (existing?.length > 0) {
      const map = {}
      existing.forEach(r => { map[r.recipient_id] = r.rating })
      setRatings(map)
      setSubmitted(true)
    }
    setLoading(false)
  }

  async function submit() {
    const unrated = peers.filter(p => !ratings[p.id])
    if (unrated.length > 0) {
      toast.error(`Please rate all ${peers.length} peers before submitting.`)
      return
    }
    setSaving(true)
    try {
      const rows = peers.map(p => ({
        reviewer_id: participant.id,
        recipient_id: p.id,
        rating: ratings[p.id],
      }))
      const { error } = await supabase.from('peer_feedback').insert(rows)
      if (error) throw error
      setSubmitted(true)
      toast.success('Peer feedback submitted!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  if (!open && !submitted) return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card">
          <Users size={32} className="text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Peer Feedback Not Yet Open</h2>
          <p className="text-gray-500 text-sm">The facilitators will open peer feedback at the right time during the programme.</p>
        </div>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Peer Feedback</h1>
        <div className="card mb-6 bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">Your peer feedback has been submitted.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Your Ratings</h2>
          <div className="space-y-0">
            {peers.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between py-2.5 ${i < peers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-5 h-5 rounded-full ${ratings[p.id] >= n ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 w-20">{RATING_LABELS[ratings[p.id]]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const ratedCount = peers.filter(p => ratings[p.id]).length

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Peer Feedback</h1>
        <p className="text-sm text-gray-500 mb-6">Rate each of your cohort members on the leadership they demonstrated throughout the programme. Ratings are confidential — participants only see their aggregate score.</p>

        <div className="bg-[#0F52BA]/5 border border-[#0F52BA]/15 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-700 font-medium">{ratedCount} of {peers.length} peers rated</span>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div className="bg-[#0F52BA] h-2 rounded-full transition-all" style={{ width: `${(ratedCount / peers.length) * 100}%` }} />
          </div>
        </div>

        <div className="card mb-6">
          <div className="space-y-0">
            {peers.map((p, i) => {
              const val = ratings[p.id]
              return (
                <div key={p.id} className={`py-4 ${i < peers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.department}</p>
                    </div>
                    {val && <span className="text-xs font-medium text-[#0F52BA] shrink-0">{RATING_LABELS[val]}</span>}
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button"
                        onClick={() => setRatings(r => ({ ...r, [p.id]: n }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${val === n ? 'bg-[#0F52BA] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button onClick={submit} disabled={saving || ratedCount < peers.length}
          className="btn-primary w-full py-4 text-base">
          {saving ? 'Submitting...' : ratedCount < peers.length ? `Rate ${peers.length - ratedCount} more peer${peers.length - ratedCount !== 1 ? 's' : ''} to submit` : 'Submit Peer Feedback'}
        </button>
      </div>
    </div>
  )
}
