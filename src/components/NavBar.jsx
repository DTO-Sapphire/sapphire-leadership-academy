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
    navigate(facilitatorMode ? '/facilitator/login' : '/')
  }

  const participantLinks = [
    { to: '/dashboard', label: 'Home' },
    { to: '/dashboard/assessment', label: 'Assessment' },
    { to: '/dashboard/reflect', label: 'Reflections' },
    { to: '/dashboard/assignments', label: 'Assignments' },
    { to: '/dashboard/exercises', label: 'Exercises' },
    { to: '/dashboard/group-exercise', label: 'Group' },
    { to: '/dashboard/commit', label: 'Commitments' },
    { to: '/dashboard/mentorship', label: 'Mentorship' },
    { to: '/dashboard/peer-feedback', label: 'Peer Feedback' },
    { to: '/dashboard/journal', label: 'Journal' },
    { to: '/dashboard/growth', label: 'Growth' },
  ]

  const facilitatorLinks = [
    { to: '/facilitator', label: 'Dashboard' },
    { to: '/facilitator/attend', label: 'Attendance' },
    { to: '/facilitator/sessions', label: 'Sessions' },
    { to: '/facilitator/scorecard', label: 'Scorecard' },
    { to: '/facilitator/mentorship', label: 'Mentorship' },
    { to: '/facilitator/mentors', label: 'Mentors' },
    { to: '/facilitator/partners', label: 'Partners' },
    { to: '/facilitator/insights', label: 'Insights' },
    { to: '/facilitator/commitments', label: 'Commitments' },
    { to: '/facilitator/awards', label: 'Awards' },
    { to: '/facilitator/export', label: 'Export' },
    { to: '/facilitator/broadcast', label: 'Broadcast' },
    { to: '/facilitator/groups', label: 'Groups' },
    { to: '/facilitator/live', label: 'Live' },
  ]

  const links = facilitatorMode ? facilitatorLinks : participantLinks
  const name = facilitatorMode ? facilitator?.name : participant?.name

  return (
    <nav style={{ background: 'linear-gradient(90deg, #0A3480 0%, #0F52BA 100%)' }} className="text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo mark */}
          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
            <Link to={facilitatorMode ? '/facilitator' : '/dashboard'} className="flex items-center shrink-0">
              <img src="/logo.png" alt="Sapphire" className="h-7 w-auto" />
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {links.map(l => {
                const active = location.pathname === l.to
                return (
                  <Link key={l.to} to={l.to} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
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
