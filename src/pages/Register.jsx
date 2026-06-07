import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const DEPARTMENTS = [
  'Finance', 'Retail Operations', 'Customer Support', 'Collections & Recovery',
  'Claims', 'Marketing', 'Digital Transformation Office', 'Human Resources',
  'Technology', 'Executive / Management', 'Other',
]

export default function Register() {
  const [step, setStep] = useState('form') // form | otp
  const [form, setForm] = useState({ name: '', department: '', role: '', reporting_manager: '', email: '', phone: '' })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { loadProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (step === 'otp') setCountdown(60)
  }, [step])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email.toLowerCase().endsWith('@sapphirevirtual.com')) {
      toast.error('Registration is for Sapphire Virtual Networks employees only. Please use your @sapphirevirtual.com email address.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: form.email, options: { shouldCreateUser: true } })
      if (error) throw error
      setStep('otp')
      toast.success('Check your email for the 6-digit code!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: form.email, options: { shouldCreateUser: true } })
      if (error) throw error
      setOtp('')
      setCountdown(60)
      toast.success('New code sent!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOtp = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: form.email, token: otp, type: 'email' })
      if (error) throw error
      const user = data.session?.user
      if (!user) throw new Error('Login failed')

      const { data: existing } = await supabase.from('participants').select('id').eq('user_id', user.id).single()
      if (!existing) {
        const { error: insertErr } = await supabase.from('participants').insert({ ...form, user_id: user.id })
        if (insertErr) {
          if (insertErr.code === '23505') {
            toast.error('This email is already registered. Please log in instead.')
            navigate('/login')
            return
          }
          throw insertErr
        }
      }

      await loadProfile(user)
      toast.success('Welcome to Sapphire Leadership Academy!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F52BA] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <svg width="44" height="42" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="4,2 38,2 34,20 0,20" fill="#0F52BA"/>
              <polygon points="14,24 44,24 40,44 10,44" fill="#00C2CB"/>
              <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0F52BA] mt-1">Join the Academy</h1>
          <p className="text-gray-500 text-sm">Sapphire Leadership Academy · June 2026</p>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Adebayo Okafor" />
            </div>
            <div>
              <label className="label">Department *</label>
              <select className="input" required value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Job Title / Role *</label>
              <input className="input" required value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Senior Analyst" />
            </div>
            <div>
              <label className="label">Reporting Manager *</label>
              <input className="input" required value={form.reporting_manager}
                onChange={e => setForm(f => ({ ...f, reporting_manager: e.target.value }))} placeholder="Manager's name" />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input className="input" type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@sapphirevirtualnetworks.com" />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input className="input" required value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08012345678" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Sending code...' : 'Register & Get OTP'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already registered? <Link to="/login" className="text-[#0F52BA] font-medium">Log in</Link>
            </p>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtp} className="space-y-4">
            <p className="text-gray-600 text-sm text-center">
              A 6-digit code was sent to <strong>{form.email}</strong>
            </p>
            <div>
              <label className="label">Enter OTP Code</label>
              <input className="input text-center text-2xl tracking-widest" maxLength={6} required
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                autoFocus />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button type="button" onClick={() => { setStep('form'); setOtp('') }} className="btn-secondary w-full">
              Back
            </button>
            <div className="text-center text-sm pt-1">
              {countdown > 0 ? (
                <p className="text-gray-400">
                  Resend code in <span className="font-semibold text-gray-600">{countdown}s</span>
                </p>
              ) : (
                <button type="button" onClick={resendOtp} disabled={loading}
                  className="text-[#0F52BA] font-semibold hover:underline disabled:opacity-50">
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
