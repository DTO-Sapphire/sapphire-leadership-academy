import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { Download } from 'lucide-react'

export default function FacilitatorExport() {
  const [loading, setLoading] = useState(false)

  async function exportAll() {
    setLoading(true)
    try {
      const [participants, attendance, assessments, reflections, submissions, scorecards, mentorship, awards] = await Promise.all([
        supabase.from('participants').select('name, department, role, reporting_manager, email, phone, created_at').order('name'),
        supabase.from('attendance').select('participants(name), sessions(session_number, title), attended, created_at'),
        supabase.from('assessments').select('participants(name), type, scores, submitted_at'),
        supabase.from('reflections').select('participants(name), sessions(session_number, title), what_i_learned, leadership_insight, action_before_next, expected_result, journal_prompt_response, submitted_at'),
        supabase.from('assignment_submissions').select('participants(name), weekly_assignments(week_number, title), content, submitted_at'),
        supabase.from('scorecard').select('participants(name), growth_score, attendance_score, reflection_score, assignment_score, facilitator_score, total_score, graduated, updated_at'),
        supabase.from('mentorship_sessions').select('participants(name), facilitators(name), session_date, topics, notes, created_at'),
        supabase.from('awards').select('category, participants(name), notes, updated_at'),
      ])

      const wb = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (participants.data || []).map(p => ({
          Name: p.name, Department: p.department, Role: p.role,
          'Reporting Manager': p.reporting_manager, Email: p.email,
          Phone: p.phone, 'Registered': p.created_at,
        }))
      ), 'Participants')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (scorecards.data || []).map(s => ({
          Participant: s.participants?.name,
          'Growth (30)': s.growth_score,
          'Attendance (20)': s.attendance_score,
          'Reflections (25)': s.reflection_score,
          'Assignments (15)': s.assignment_score,
          'Facilitator (10)': s.facilitator_score,
          Total: s.total_score,
          Graduated: s.graduated ? 'Yes' : 'No',
          Updated: s.updated_at,
        }))
      ), 'Scorecards')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (attendance.data || []).map(a => ({
          Participant: a.participants?.name,
          Session: `S${a.sessions?.session_number}: ${a.sessions?.title}`,
          Attended: a.attended ? 'Yes' : 'No',
          Recorded: a.created_at,
        }))
      ), 'Attendance')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (assessments.data || []).map(a => ({
          Participant: a.participants?.name,
          Type: a.type,
          Communication: a.scores?.communication,
          Delegation: a.scores?.delegation,
          Accountability: a.scores?.accountability,
          Planning: a.scores?.planning,
          'Emotional Intelligence': a.scores?.emotional_intelligence,
          'Coaching & Mentoring': a.scores?.coaching_mentoring,
          'Decision Making': a.scores?.decision_making,
          'Conflict Resolution': a.scores?.conflict_resolution,
          'Submitted': a.submitted_at,
        }))
      ), 'Assessments')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (reflections.data || []).map(r => ({
          Participant: r.participants?.name,
          Session: `S${r.sessions?.session_number}: ${r.sessions?.title}`,
          'What I Learned': r.what_i_learned,
          'Leadership Insight': r.leadership_insight,
          'Action Before Next Session': r.action_before_next,
          'Expected Result': r.expected_result,
          'Journal Response': r.journal_prompt_response || '',
          Submitted: r.submitted_at,
        }))
      ), 'Reflections')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (submissions.data || []).map(s => ({
          Participant: s.participants?.name,
          Week: s.weekly_assignments?.week_number,
          Assignment: s.weekly_assignments?.title,
          Response: s.content,
          Submitted: s.submitted_at,
        }))
      ), 'Assignments')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (mentorship.data || []).map(m => ({
          Participant: m.participants?.name,
          Facilitator: m.facilitators?.name,
          Date: m.session_date,
          Topics: (m.topics || []).join(', '),
          Notes: m.notes || '',
          Logged: m.created_at,
        }))
      ), 'Mentorship')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
        (awards.data || []).map(a => ({
          Category: a.category,
          Winner: a.participants?.name || '—',
          Notes: a.notes || '',
          Updated: a.updated_at,
        }))
      ), 'Awards')

      XLSX.writeFile(wb, `SLA_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Export downloaded')
    } catch (err) {
      toast.error('Export failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const SHEETS = [
    { name: 'Participants',  desc: 'All cohort member profiles' },
    { name: 'Scorecards',    desc: '100-point leadership scorecard per participant' },
    { name: 'Attendance',    desc: 'Session-by-session attendance records' },
    { name: 'Assessments',   desc: 'Baseline and final self-assessment scores' },
    { name: 'Reflections',   desc: 'All session reflection submissions' },
    { name: 'Assignments',   desc: 'Weekly assignment responses' },
    { name: 'Mentorship',    desc: '1-on-1 session logs' },
    { name: 'Awards',        desc: 'Graduation award winners' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Data Export</h1>
        <p className="text-gray-500 text-sm mb-6">Download all programme data as a single Excel workbook.</p>
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Included sheets</h2>
          <div className="space-y-2 mb-6">
            {SHEETS.map(s => (
              <div key={s.name} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-[#0F52BA] shrink-0" />
                <div>
                  <span className="font-medium text-sm text-gray-900">{s.name}</span>
                  <span className="text-gray-500 text-sm"> — {s.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={exportAll} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download size={18} />
            {loading ? 'Preparing export...' : 'Download Excel Workbook'}
          </button>
        </div>
      </div>
    </div>
  )
}
