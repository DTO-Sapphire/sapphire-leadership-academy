import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email')
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

  const sendOtp = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setStep('otp')
      toast.success('OTP sent! Check your email.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
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

  const verifyOtp = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      if (error) throw error
      const { facilitator: fac, participant: par } = await loadProfile(data.session.user)
      if (fac && !par) navigate('/facilitator')
      else navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F52BA] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <svg width="44" height="42" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="4,2 38,2 34,20 0,20" fill="#0F52BA"/>
              <polygon points="14,24 44,24 40,44 10,44" fill="#00C2CB"/>
              <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0F52BA] mt-1">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sapphire Leadership Academy</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@sapphirevirtualnetworks.com" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send OTP Code'}
            </button>
            <p className="text-center text-sm text-gray-500">
              New participant? <Link to="/register" className="text-[#0F52BA] font-medium">Register here</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-gray-600 text-sm text-center">Code sent to <strong>{email}</strong></p>
            <div>
              <label className="label">6-Digit OTP Code</label>
              <input className="input text-center text-2xl tracking-widest" maxLength={6} required
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                autoFocus />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Log In'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setOtp('') }} className="btn-secondary w-full">
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
