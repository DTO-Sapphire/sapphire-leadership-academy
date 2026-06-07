import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import SapphireLogo from '../components/SapphireLogo'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0A3480 0%, #0F52BA 60%, #00C2CB 100%)' }}>
      {/* Top bar */}
      <div className="flex justify-end px-6 pt-4">
        <Link to="/facilitator/login" className="text-[#98DFEA] text-xs hover:text-white transition-colors">
          Facilitator login →
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-white px-4 py-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-4">
            <svg width="64" height="60" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="4,2 38,2 34,20 0,20" fill="white" opacity="0.95"/>
              <polygon points="14,24 44,24 40,44 10,44" fill="#00C2CB"/>
              <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center mb-1">
            Sapphire Leadership Academy
          </h1>
          <p className="text-[#98DFEA] text-lg font-medium mt-1">Building Leaders for Sapphire 4.0</p>
          <p className="text-white/60 text-sm mt-1">June 2026 Cohort · John Maxwell's 21 Laws of Leadership</p>
        </div>

        {/* Divider */}
        <div className="w-16 h-1 rounded-full bg-[#FFAF46] mb-8" />

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full max-w-sm">
          <Link to="/register"
            className="flex-1 bg-[#FFAF46] hover:bg-[#f09c2e] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-center text-base shadow-lg">
            Register Now
          </Link>
          <Link to="/login"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-xl transition-colors border-2 border-white/30 text-center text-base">
            Log In
          </Link>
        </div>

        {/* QR Code */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 flex flex-col items-center">
          <div className="bg-white p-3 rounded-xl mb-3 shadow">
            <QRCodeSVG value={`${APP_URL}/register`} size={148} fgColor="#0F52BA" />
          </div>
          <p className="text-[#98DFEA] text-sm">Scan to register on your phone</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-white/40 text-xs">
        Sapphire Virtual Networks Limited · Confidential
      </div>
    </div>
  )
}
