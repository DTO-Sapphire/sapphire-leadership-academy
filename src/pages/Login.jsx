import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const { loadProfile } = useAuth()
  const navigate = useNavigate()

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

  const verifyOtp = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      if (error) throw error
      await loadProfile(data.session.user)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1F4E79] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <span className="text-3xl">💎</span>
          <h1 className="text-2xl font-bold text-[#1F4E79] mt-2">Welcome Back</h1>
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
              New participant? <Link to="/register" className="text-[#1F4E79] font-medium">Register here</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-gray-600 text-sm text-center">Code sent to <strong>{email}</strong></p>
            <div>
              <label className="label">6-Digit OTP Code</label>
              <input className="input text-center text-2xl tracking-widest" maxLength={6} required
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Log In'}
            </button>
            <button type="button" onClick={() => setStep('email')} className="btn-secondary w-full">Back</button>
          </form>
        )}
      </div>
    </div>
  )
}
