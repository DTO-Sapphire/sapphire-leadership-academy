import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function FacilitatorLive() {
  const [sessions, setSessions] = useState([])
  const [participants, setParticipants] = useState([])
  const [attendance, setAttendance] = useState({})
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    const [{ data: sess }, { data: parts }, { data: att }] = await Promise.all([
      supabase.from('sessions').select('*').order('session_number'),
      supabase.from('participants').select('id, name, department').order('name'),
      supabase.from('attendance').select('participant_id, session_id'),
    ])
    setSessions(sess || [])
    setParticipants(parts || [])
    const attMap = {}
    ;(att || []).forEach(a => { attMap[`${a.participant_id}_${a.session_id}`] = true })
    setAttendance(attMap)
    if (!selectedSession && sess?.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const current = sess.filter(s => s.session_date <= today).at(-1) || sess[0]
      setSelectedSession(current.id)
    }
    setLoading(false)
  }

  const session = sessions.find(s => s.id === selectedSession)
  const present = participants.filter(p => attendance[`${p.id}_${selectedSession}`])
  const absent = participants.filter(p => !attendance[`${p.id}_${selectedSession}`])

  return (
    <div className="min-h-screen bg-[#0F52BA] text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Sapphire Leadership Academy</h1>
            <p className="text-blue-200 text-sm mt-1">Live Session View — Auto-refreshes every 15s</p>
          </div>
          <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
            value={selectedSession || ''}
            onChange={e => setSelectedSession(e.target.value)}>
            {sessions.map(s => <option key={s.id} value={s.id} className="text-gray-900 bg-white">
              Session {s.session_number}: {s.title}
            </option>)}
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* QR + Stats */}
          <div className="space-y-4">
            {session && (
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-blue-200 text-xs mb-3">Scan to check in</p>
                <div className="bg-white p-3 rounded-xl inline-block">
                  <QRCodeSVG value={`${APP_URL}/attend/${session.id}`} size={150} />
                </div>
                <p className="text-blue-200 text-xs mt-2">{session.title}</p>
              </div>
            )}
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-4xl font-bold text-green-300">{present.length}</p>
                  <p className="text-blue-200 text-xs">Present</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-red-300">{absent.length}</p>
                  <p className="text-blue-200 text-xs">Absent</p>
                </div>
              </div>
              <div className="mt-3 bg-white/10 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full transition-all"
                  style={{ width: `${participants.length ? (present.length / participants.length) * 100 : 0}%` }} />
              </div>
              <p className="text-center text-blue-200 text-xs mt-1">
                {participants.length ? Math.round((present.length / participants.length) * 100) : 0}% attendance
              </p>
            </div>
          </div>

          {/* Present */}
          <div className="bg-white/10 rounded-2xl p-4">
            <h2 className="font-semibold text-green-300 mb-3">Present ({present.length})</h2>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {present.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <span className="text-sm">{p.name}</span>
                  <span className="text-xs text-blue-300 ml-auto">{p.department}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Absent */}
          <div className="bg-white/10 rounded-2xl p-4">
            <h2 className="font-semibold text-red-300 mb-3">Not checked in ({absent.length})</h2>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {absent.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-red-400/50 shrink-0" />
                  <span className="text-sm text-white/70">{p.name}</span>
                  <span className="text-xs text-blue-300/50 ml-auto">{p.department}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
