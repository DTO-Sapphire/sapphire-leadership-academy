import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function NavBar({ facilitatorMode = false }) {
  const { participant, facilitator, signOut } = useAuth()
  const navigate = useNavigate()
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
    { to: '/facilitator/live', label: 'Live View' },
  ]

  const links = facilitatorMode ? facilitatorLinks : participantLinks
  const name = facilitatorMode ? facilitator?.name : participant?.name

  return (
    <nav className="bg-[#1F4E79] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-sm tracking-wide">SLA</span>
            <div className="hidden md:flex items-center gap-1">
              {links.map(l => (
                <Link key={l.to} to={l.to}
                  className="px-3 py-1.5 rounded text-xs font-medium hover:bg-white/10 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {name && <span className="hidden sm:block text-xs text-blue-200">{name}</span>}
            <button onClick={handleSignOut}
              className="flex items-center gap-1 text-xs hover:bg-white/10 px-2 py-1.5 rounded transition-colors">
              <LogOut size={14} /> Sign out
            </button>
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden px-4 pb-3 flex flex-col gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded text-sm hover:bg-white/10 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
