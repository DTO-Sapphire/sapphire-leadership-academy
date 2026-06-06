import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function NavBar({ facilitatorMode = false }) {
  const { participant, facilitator, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate(facilitatorMode ? '/facilitator/login' : '/login')
  }

  const participantLinks = [
    { to: '/dashboard', label: 'Home' },
    { to: '/dashboard/assessment', label: 'Assessment' },
    { to: '/dashboard/reflect', label: 'Reflections' },
    { to: '/dashboard/assignments', label: 'Assignments' },
    { to: '/dashboard/commit', label: 'Commitments' },
    { to: '/dashboard/journal', label: 'Journal' },
    { to: '/dashboard/growth', label: 'Growth' },
  ]

  const facilitatorLinks = [
    { to: '/facilitator', label: 'Dashboard' },
    { to: '/facilitator/attend', label: 'Attendance' },
    { to: '/facilitator/sessions', label: 'Sessions' },
    { to: '/facilitator/scorecard', label: 'Scorecard' },
    { to: '/facilitator/mentorship', label: 'Mentorship' },
    { to: '/facilitator/awards', label: 'Awards' },
    { to: '/facilitator/export', label: 'Export' },
    { to: '/facilitator/live', label: 'Live' },
  ]

  const links = facilitatorMode ? facilitatorLinks : participantLinks
  const name = facilitatorMode ? facilitator?.name : participant?.name

  return (
    <nav style={{ background: 'linear-gradient(90deg, #0A3480 0%, #0F52BA 100%)' }} className="text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo mark */}
          <div className="flex items-center gap-5">
            <Link to={facilitatorMode ? '/facilitator' : '/dashboard'} className="flex items-center gap-2 shrink-0">
              <svg width="28" height="26" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="4,2 38,2 34,20 0,20" fill="white" opacity="0.9"/>
                <polygon points="14,24 44,24 40,44 10,44" fill="#98DFEA"/>
                <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
              </svg>
              <span className="font-bold text-sm tracking-wide hidden sm:block">SLA</span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map(l => {
                const active = location.pathname === l.to
                return (
                  <Link key={l.to} to={l.to}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                    {l.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {name && <span className="hidden sm:block text-xs text-[#98DFEA] font-medium">{name}</span>}
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors font-semibold">
              <LogOut size={14} /> Sign out
            </button>
            <button className="md:hidden text-white/80 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${location.pathname === l.to ? 'bg-white/20' : 'text-white/80 hover:bg-white/10'}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
