import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const DIMENSIONS = [
  { key: 'leadership_growth',           label: 'Leadership Growth',           desc: 'Has this person shown noticeable improvement in their leadership presence and behaviour?' },
  { key: 'delegation_empowerment',      label: 'Delegation & Empowerment',    desc: 'Do they delegate effectively and trust others to deliver rather than doing everything themselves?' },
  { key: 'communication_influence',     label: 'Communication & Influence',   desc: 'Do they communicate clearly and positively influence those around them?' },
  { key: 'accountability_execution',    label: 'Accountability & Execution',  desc: 'Do they take ownership of commitments and consistently follow through to results?' },
  { key: 'coaching_others',             label: 'Coaching Others',             desc: 'Do they actively invest time in developing and coaching the people they work with?' },
]

const SCORE_LABELS = {
  1: 'Not observed / No change',
  2: 'Slight improvement',
  3: 'Clear improvement',
  4: 'Significant transformation',
}

export default function ManagerAssess() {
  const { token } = useParams()
  const [record, setRecord] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [ratings, setRatings] = useState({})
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('loading')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [token])

  async function load() {
    const { data, error } = await supabase
      .from('manager_assessments')
      .select('*, participants(name, department)')
      .eq('token', token)
      .single()
    if (error || !data) { setStatus('invalid'); return }
    if (data.submitted) { setStatus('submitted'); setRecord(data); return }
    setRecord(data)
    setParticipant(data.participants)
    setStatus('open')
  }

  async function submit() {
    const missing = DIMENSIONS.filter(d => !ratings[d.key])
    if (missing.length > 0) { toast.error('Please rate all dimensions before submitting.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('manager_assessments').update({
        ...ratings,
        overall_comment: comment || null,
        submitted: true,
        submitted_at: new Date().toISOString(),
      }).eq('token', token)
      if (error) throw error
      setStatus('submitted')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
    </div>
  )

  if (status === 'invalid') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="font-bold text-gray-900 mb-2">Invalid Link</p>
        <p className="text-sm text-gray-500">This assessment link is invalid or has expired. Please contact the programme coordinator.</p>
      </div>
    </div>
  )

  if (status === 'submitted') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-gray-900 mb-2">Assessment Submitted</p>
        <p className="text-sm text-gray-500">Thank you. Your evaluation has been received and will contribute to the participant's leadership scorecard.</p>
      </div>
    </div>
  )

  const allRated = DIMENSIONS.every(d => ratings[d.key])
  const total = DIMENSIONS.reduce((s, d) => s + (ratings[d.key] || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: 'linear-gradient(90deg, #0A3480 0%, #0F52BA 100%)' }} className="px-4 py-4 text-white text-center">
        <p className="font-bold text-sm tracking-wide">SAPPHIRE LEADERSHIP ACADEMY</p>
        <p className="text-blue-200 text-xs">Manager Assessment Form</p>
      </div>
      <div className="max-w-xl mx-auto px-4 py-8">

        <div className="card mb-6">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Participant</p>
          <p className="text-xl font-bold text-gray-900">{participant?.name}</p>
          <p className="text-sm text-gray-500">{participant?.department}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-blue-800">
            This participant has completed the Sapphire Leadership Academy — a 4-week, 12-session programme focused on developing leadership capacity. Your evaluation reflects observable changes in their leadership behaviour over this period.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {DIMENSIONS.map(d => {
            const val = ratings[d.key]
            return (
              <div key={d.key} className="card">
                <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
                <p className="text-xs text-gray-500 mb-3">{d.desc}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1,2,3,4].map(n => (
                    <button key={n} type="button"
                      onClick={() => setRatings(r => ({ ...r, [d.key]: n }))}
                      className={`px-2 py-2.5 rounded-lg text-xs font-medium text-center transition-all border ${val === n ? 'bg-[#0F52BA] text-white border-[#0F52BA] shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0F52BA]'}`}>
                      <span className="block font-bold text-sm mb-0.5">{n}</span>
                      {SCORE_LABELS[n]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="card mb-6">
          <label className="label">Overall Comments (optional)</label>
          <textarea className="input" rows={4} value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Any additional observations about this person's leadership growth during the programme..." />
        </div>

        {allRated && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 flex justify-between">
            <span className="text-sm text-gray-600">Your total score</span>
            <span className="font-bold text-gray-900">{total} / 20</span>
          </div>
        )}

        <button onClick={submit} disabled={saving || !allRated}
          className="btn-primary w-full py-4 text-base">
          {saving ? 'Submitting...' : !allRated ? `Rate ${DIMENSIONS.filter(d => !ratings[d.key]).length} more dimension(s) to submit` : 'Submit Assessment'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">Your responses are confidential and will be used solely for the participant's leadership scorecard.</p>
      </div>
    </div>
  )
}
