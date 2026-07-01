import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import toast from 'react-hot-toast'
import { ShieldCheck, CheckCircle, Star } from 'lucide-react'

const STORAGE_KEY = 'sla_sapphire_feedback_done'

export default function FacilitatorFeedback() {
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [form, setForm] = useState({
    doing_well: '',
    needs_change: '',
    leadership_behaviour: '',
    direct_message: '',
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit() {
    if (!rating) { toast.error('Please give an overall rating'); return }
    if (!form.doing_well.trim()) { toast.error('Please fill in what Sapphire is doing well'); return }
    if (!form.needs_change.trim()) { toast.error('Please fill in what needs to change'); return }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('facilitator_feedback').insert({
        facilitator_name: 'Sapphire Leadership',
        session_label: 'Organisational Leadership Feedback — SLA 2026',
        rating,
        most_valuable: form.doing_well.trim(),
        to_improve: form.needs_change.trim(),
        additional: [
          form.leadership_behaviour.trim() ? `Leadership behaviour: ${form.leadership_behaviour.trim()}` : '',
          form.direct_message.trim() ? `Direct message: ${form.direct_message.trim()}` : '',
        ].filter(Boolean).join('\n\n') || null,
      })
      if (error) throw error
      localStorage.setItem(STORAGE_KEY, '1')
      setSubmitted(true)
      toast.success('Feedback submitted — thank you for your honesty.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Sapphire Leadership Feedback</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your voice as a trained leader</p>
        </div>

        {/* Context banner */}
        <div className="card mb-5 bg-gradient-to-br from-[#0A3480] to-[#0F52BA] text-white">
          <p className="text-sm font-semibold mb-1">Who will read this?</p>
          <p className="text-white/80 text-sm leading-relaxed">
            Your feedback goes directly to <strong className="text-white">MD — Dimeji Matesun</strong> and <strong className="text-white">PLM — Dr. Lola Matesun</strong>. It will be read seriously and used to shape how Sapphire leads.
          </p>
          <p className="text-white/60 text-xs mt-2">
            You have been trained in the 21 Laws of Leadership. This is your opportunity to apply them — speak honestly about what you see, what you respect, and what you believe needs to change.
          </p>
        </div>

        {/* Anonymity notice */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
          <ShieldCheck size={18} className="text-[#0F52BA] mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 leading-relaxed">
            Your response is <strong>completely anonymous</strong>. Your name is never stored. Speak freely.
          </p>
        </div>

        {submitted ? (
          <div className="card text-center py-12">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-bold text-gray-900 text-base">Feedback submitted</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Thank you for leading up. Your honesty is a gift to Sapphire.
            </p>
          </div>
        ) : (
          <div className="card space-y-6">

            {/* Rating */}
            <div>
              <label className="label mb-2">How would you rate Sapphire's current leadership culture overall? *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)}
                    className="focus:outline-none">
                    <Star size={30}
                      className={`transition-colors ${n <= (hovered || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {['', 'Needs significant work', 'Below expectations', 'Making progress', 'Strong — with room to grow', 'Excellent leadership culture'][rating]}
                </p>
              )}
            </div>

            {/* What's working */}
            <div>
              <label className="label">
                What is Sapphire's leadership doing well that should be continued and celebrated? *
              </label>
              <p className="text-xs text-gray-400 mb-1.5">Be specific — name the behaviour, the culture, or the decision you respect.</p>
              <textarea className="input" rows={4}
                value={form.doing_well}
                onChange={e => set('doing_well', e.target.value)}
                placeholder="e.g. investing in our development through this programme..." />
            </div>

            {/* What needs to change */}
            <div>
              <label className="label">
                As a trained leader, what is one thing you believe needs to change in how Sapphire leads its people? *
              </label>
              <p className="text-xs text-gray-400 mb-1.5">Apply the laws. Be honest, be constructive.</p>
              <textarea className="input" rows={4}
                value={form.needs_change}
                onChange={e => set('needs_change', e.target.value)}
                placeholder="e.g. communication from leadership to the team..." />
            </div>

            {/* Leadership behaviour */}
            <div>
              <label className="label">
                What leadership behaviour would you like to see modelled more consistently from Sapphire's top leadership?
              </label>
              <textarea className="input" rows={3}
                value={form.leadership_behaviour}
                onChange={e => set('leadership_behaviour', e.target.value)}
                placeholder="e.g. acknowledging wins publicly, connecting with people beyond targets..." />
            </div>

            {/* Direct message */}
            <div>
              <label className="label">
                If you could say one thing directly to the MD or PLM, what would it be?
              </label>
              <p className="text-xs text-gray-400 mb-1.5">This is your safe space. Say what you mean.</p>
              <textarea className="input" rows={3}
                value={form.direct_message}
                onChange={e => set('direct_message', e.target.value)}
                placeholder="Speak as a leader — clear, honest, and with good intent..." />
            </div>

            <button onClick={submit} disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Feedback Anonymously'}
            </button>

          </div>
        )}
      </div>
    </div>
  )
}
