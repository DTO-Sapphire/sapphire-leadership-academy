import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1F4E79] flex flex-col items-center justify-center text-white px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <span className="text-3xl">💎</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
            Sapphire Leadership Academy
          </h1>
          <p className="text-blue-200 text-lg mt-2">Building Leaders for Sapphire 4.0</p>
          <p className="text-blue-300 text-sm mt-1">June 2026 Cohort · John Maxwell's 21 Laws</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link to="/register"
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-center">
            Register Now
          </Link>
          <Link to="/login"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition-colors border border-white/20 text-center">
            Log In
          </Link>
        </div>

        <div className="bg-white/10 rounded-2xl p-6 inline-block">
          <div className="bg-white p-3 rounded-xl inline-block mb-3">
            <QRCodeSVG value={`${APP_URL}/register`} size={140} />
          </div>
          <p className="text-blue-200 text-sm">Scan to register on your phone</p>
        </div>

        <div className="mt-8 text-blue-300 text-xs">
          <Link to="/facilitator/login" className="hover:text-white transition-colors">
            Facilitator login →
          </Link>
        </div>
      </div>
    </div>
  )
}
