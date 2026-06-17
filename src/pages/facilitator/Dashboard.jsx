import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { cache } from '../../lib/cache'
import NavBar from '../../components/NavBar'
import { Users, CheckCircle, BookOpen, Star, TrendingUp, Award, Copy, Check, UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const REGISTER_URL = `${window.location.origin}/register`

const DEPARTMENTS = [
  'Finance', 'Retail Operations', 'Customer Support', 'Collections & Recovery',
  'Claims', 'Marketing', 'Digital Transformation Office', 'Human Resources',
  'Technology', 'Executive / Management', 'Other',
]
const EMPTY = { name: '', email: '', department: '', role: '', reporting_manager: '', phone: '' }

function AddParticipantModal({ onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/add-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_BROADCAST_SECRET}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add participant')
      toast.success(`${form.name} added — welcome email sent!`)
      setForm(EMPTY)
      onAdded()
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Add New Participant</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Adebayo Okafor" />
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="adebayo@sapphirevirtual.com" />
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Job Title</label>
              <input className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Senior Analyst" />
            </div>
            <div>
              <label className="label">Reporting Manager</label>
              <input className="input" value={form.reporting_manager} onChange={e => setForm(f => ({ ...f, reporting_manager: e.target.value }))} placeholder="Manager name" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08012345678" />
            </div>
          </div>
          <p className="text-xs text-gray-400">A welcome email with a login link will be sent automatically.</p>
          <button type="submit" disabled={saving} className="btn-primary w-full mt-1">
            {saving ? 'Adding...' : 'Add Participant & Send Welcome Email'}
          </button>
        </form>
      </div>
    </div>
  )
}

function CopyLinkBanner() {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(REGISTER_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <div className="card flex flex-col sm:flex-row sm:items-center gap-3 mb-8 bg-[#0F52BA]/5 border border-[#0F52BA]/15">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#0F52BA] uppercase tracking-wider mb-1">Registration link</p>
        <p className="text-sm text-gray-500 truncate">{REGISTER_URL}</p>
      </div>
      <button onClick={copy}
        className="flex items-center gap-2 bg-[#0F52BA] hover:bg-[#0a3a9e] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}

export default function FacilitatorDashboard() {
  const { facilitator } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const cached = cache.get('f-dash')
    if (cached) { setStats(cached); setLoading(false) }

    const [participants, sessions, attendance, reflections, assessments, scorecards, awards] = await Promise.all([
      supabase.from('participants').select('id, name, department'),
      supabase.from('sessions').select('id, session_number, title, session_date, is_open, reflections_open').order('session_number'),
      supabase.from('attendance').select('participant_id, session_id'),
      supabase.from('reflections').select('participant_id, session_id'),
      supabase.from('assessments').select('participant_id, type'),
      supabase.from('scorecard').select('participant_id, total_score, graduated'),
      supabase.from('awards').select('category, participant_id'),
    ])
    const pCount = participants.data?.length || 0
    const attPairs = attendance.data?.length || 0
    const openSessions = sessions.data?.filter(s => s.is_open) || []
    const baselines = assessments.data?.filter(a => a.type === 'baseline').length || 0
    const finals = assessments.data?.filter(a => a.type === 'final').length || 0
    const graduated = scorecards.data?.filter(s => s.graduated).length || 0
    const fresh = { participants: participants.data, pCount, sessions: sessions.data, openSessions, attPairs, reflections: reflections.data?.length || 0, baselines, finals, graduated, scorecards: scorecards.data, awards: awards.data }
    cache.set('f-dash', fresh)
    setStats(fresh)
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Facilitator Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome, {facilitator?.name} · {facilitator?.title}</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#0F52BA] hover:bg-[#0a3a9e] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0">
            <UserPlus size={15} /> Add Participant
          </button>
        </div>

        {showAddModal && <AddParticipantModal onClose={() => setShowAddModal(false)} onAdded={load} />}

        <CopyLinkBanner />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Participants', value: pCount, icon: <Users size={18} className="text-[#0F52BA]" /> },
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
            <p className="text-2xl font-bold text-[#0F52BA]">{baselines} / {pCount}</p>
            <div className="mt-2 bg-gray-100 rounded-full h-2">
              <div className="bg-[#0F52BA] h-2 rounded-full" style={{ width: `${pCount ? (baselines/pCount)*100 : 0}%` }} />
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
