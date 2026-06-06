import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { Users, CheckCircle, BookOpen, Star, TrendingUp, Award } from 'lucide-react'

export default function FacilitatorDashboard() {
  const { facilitator } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [participants, sessions, attendance, reflections, assessments, scorecards, awards] = await Promise.all([
      supabase.from('participants').select('id, name, department'),
      supabase.from('sessions').select('id, session_number, title, session_date, is_open, reflections_open').order('session_number'),
      supabase.from('attendance').select('participant_id, session_id'),
      supabase.from('reflections').select('participant_id, session_id'),
      supabase.from('assessments').select('participant_id, type'),
      supabase.from('scorecard').select('participant_id, total_score, graduated'),
      supabase.from('awards').select('award_type, participant_id'),
    ])
    const pCount = participants.data?.length || 0
    const attPairs = attendance.data?.length || 0
    const openSessions = sessions.data?.filter(s => s.is_open) || []
    const baselines = assessments.data?.filter(a => a.type === 'baseline').length || 0
    const finals = assessments.data?.filter(a => a.type === 'final').length || 0
    const graduated = scorecards.data?.filter(s => s.graduated).length || 0
    setStats({ participants: participants.data, pCount, sessions: sessions.data, openSessions, attPairs, reflections: reflections.data?.length || 0, baselines, finals, graduated, scorecards: scorecards.data, awards: awards.data })
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F4E79]" /></div></div>

  const { pCount, openSessions, attPairs, reflections, baselines, finals, graduated, sessions, participants } = stats

  const quickLinks = [
    { to: '/facilitator/attend', label: 'Mark Attendance', icon: <CheckCircle size={20} />, color: 'bg-green-50 text-green-700' },
    { to: '/facilitator/scorecard', label: 'View Scorecards', icon: <Star size={20} />, color: 'bg-amber-50 text-amber-700' },
    { to: '/facilitator/sessions', label: 'Manage Sessions', icon: <BookOpen size={20} />, color: 'bg-blue-50 text-blue-700' },
    { to: '/facilitator/mentorship', label: 'Log Mentorship', icon: <Users size={20} />, color: 'bg-purple-50 text-purple-700' },
    { to: '/facilitator/awards', label: 'Assign Awards', icon: <Award size={20} />, color: 'bg-red-50 text-red-700' },
    { to: '/facilitator/export', label: 'Export Data', icon: <TrendingUp size={20} />, color: 'bg-gray-50 text-gray-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Facilitator Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {facilitator?.name} · {facilitator?.title}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Participants', value: pCount, icon: <Users size={18} className="text-[#1F4E79]" /> },
            { label: 'Total Attendance', value: attPairs, icon: <CheckCircle size={18} className="text-green-600" /> },
            { label: 'Reflections In', value: reflections, icon: <BookOpen size={18} className="text-blue-600" /> },
            { label: 'Graduated (≥75)', value: graduated, icon: <Star size={18} className="text-amber-500" /> },
          ].map((s, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Assessments progress */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500 mb-2">Baseline Assessments</p>
            <p className="text-2xl font-bold text-[#1F4E79]">{baselines} / {pCount}</p>
            <div className="mt-2 bg-gray-100 rounded-full h-2">
              <div className="bg-[#1F4E79] h-2 rounded-full" style={{ width: `${pCount ? (baselines/pCount)*100 : 0}%` }} />
            </div>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-2">Final Assessments</p>
            <p className="text-2xl font-bold text-green-600">{finals} / {pCount}</p>
            <div className="mt-2 bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pCount ? (finals/pCount)*100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {quickLinks.map(l => (
            <Link key={l.to} to={l.to} className={`card flex items-center gap-3 hover:shadow-md transition-shadow ${l.color}`}>
              {l.icon}
              <span className="font-semibold text-sm">{l.label}</span>
            </Link>
          ))}
        </div>

        {/* Sessions overview */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Sessions Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">#</th>
                <th className="text-left py-2 text-gray-500 font-medium">Title</th>
                <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 text-gray-500 font-medium">Reflections</th>
              </tr></thead>
              <tbody>
                {(sessions || []).map(s => {
                  const date = new Date(s.session_date + 'T00:00:00')
                  const attCount = stats.attPairs
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 font-medium">{s.session_number}</td>
                      <td className="py-2">{s.title}</td>
                      <td className="py-2 text-gray-500">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                      <td className="py-2"><span className={s.is_open ? 'badge-green' : 'badge-gray'}>{s.is_open ? 'Open' : 'Closed'}</span></td>
                      <td className="py-2"><span className={s.reflections_open ? 'badge-blue' : 'badge-gray'}>{s.reflections_open ? 'Open' : 'Closed'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
