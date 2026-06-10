import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { Users, CheckCircle, MessageCircle } from 'lucide-react'

const RATING_LABELS = { 1: 'Needs development', 2: 'Some progress', 3: 'Good progress', 4: 'Strong leader', 5: 'Exceptional' }

export default function PeerFeedback() {
  const { participant } = useAuth()
  const [partner, setPartner] = useState(null)
  const [myRating, setMyRating] = useState(null)
  const [receivedRating, setReceivedRating] = useState(null)
  const [rating, setRating] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (participant) load() }, [participant])

  async function load() {
    const [{ data: me }, { data: setting }] = await Promise.all([
      supabase.from('participants').select('accountability_partner_id').eq('id', participant.id).single(),
      supabase.from('settings').select('value').eq('key', 'peer_feedback_open').single(),
    ])
    setOpen(setting?.value === 'true')

    if (me?.accountability_partner_id) {
      const [{ data: partnerData }, { data: myFeedback }, { data: receivedFeedback }] = await Promise.all([
        supabase.from('participants').select('id, name, department').eq('id', me.accountability_partner_id).single(),
        supabase.from('peer_feedback').select('rating').eq('reviewer_id', participant.id).eq('recipient_id', me.accountability_partner_id).maybeSingle(),
        supabase.from('peer_feedback').select('rating').eq('reviewer_id', me.accountability_partner_id).eq('recipient_id', participant.id).maybeSingle(),
      ])
      setPartner(partnerData)
      if (myFeedback) { setMyRating(myFeedback.rating); setRating(myFeedback.rating) }
      if (receivedFeedback) setReceivedRating(receivedFeedback.rating)
    }
    setLoading(false)
  }

  async function submit() {
    if (!rating) { toast.error('Please select a rating'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('peer_feedback').upsert(
        { reviewer_id: participant.id, recipient_id: partner.id, rating },
        { onConflict: 'reviewer_id,recipient_id' }
      )
      if (error) throw error
      setMyRating(rating)
      toast.success('Feedback submitted!')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Peer Feedback</h1>
          <p className="text-gray-500 text-sm mt-0.5">Rate your accountability partner's leadership growth throughout the programme.</p>
        </div>

        {!partner ? (
          <div className="card text-center py-12">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <h2 className="font-bold text-gray-800 mb-1">No Accountability Partner Assigned</h2>
            <p className="text-sm text-gray-500">Your facilitator will assign your accountability partner soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Partner card */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Accountability Partner</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F52BA]/10 flex items-center justify-center text-[#0F52BA] font-bold shrink-0">
                  {partner.name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{partner.name}</p>
                  <p className="text-xs text-gray-400">{partner.department}</p>
                </div>
              </div>
            </div>

            {/* Feedback received */}
            {receivedRating && (
              <div className="card bg-green-50 border border-green-100">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-green-600" />
                  <p className="text-xs font-semibold text-green-700">Feedback from {partner.name}</p>
                </div>
                <div className="flex gap-1.5 mb-2">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`flex-1 h-2.5 rounded-full ${receivedRating >= n ? 'bg-[#0F52BA]' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-600 font-medium">{receivedRating}/5 · {RATING_LABELS[receivedRating]}</p>
              </div>
            )}

            {/* Give feedback */}
            {!open ? (
              <div className="card text-center py-8">
                <MessageCircle size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Peer feedback not yet open</p>
                <p className="text-xs text-gray-400 mt-1">Your facilitator will open this at the right time.</p>
              </div>
            ) : (
              <div className="card">
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {myRating ? 'Update your rating for' : 'Rate'} {partner.name}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  How well has {partner.name} demonstrated leadership throughout the programme?
                </p>
                <div className="flex gap-2 mb-3">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setRating(n)}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${rating === n ? 'bg-[#0F52BA] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-center text-gray-500 mb-4">{RATING_LABELS[rating]}</p>
                )}
                <button onClick={submit} disabled={saving || !rating} className="btn-primary w-full">
                  {saving ? 'Submitting...' : myRating ? 'Update Rating' : 'Submit Feedback'}
                </button>
                {myRating && (
                  <p className="text-xs text-center text-gray-400 mt-2">
                    Previously submitted: {myRating}/5 · {RATING_LABELS[myRating]}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
