import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/NavBar'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function FacilitatorSessions() {
  const [sessions, setSessions] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [qrSession, setQrSession] = useState(null)
  const [saving, setSaving] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: sess }, { data: set }] = await Promise.all([
      supabase.from('sessions').select('*, facilitators(name)').order('session_number'),
      supabase.from('settings').select('*'),
    ])
    setSessions(sess || [])
    setSettings(Object.fromEntries((set || []).map(s => [s.key, s.value])))
    setLoading(false)
  }

  async function toggleFlag(sessionId, field, current) {
    setSaving(`${sessionId}_${field}`)
    const { error } = await supabase.from('sessions').update({ [field]: !current }).eq('id', sessionId)
    if (error) toast.error(error.message)
    else { toast.success('Updated'); await load() }
    setSaving(null)
  }

  async function updateSetting(key, value) {
    const { error } = await supabase.from('settings').update({ value: String(value) }).eq('key', key)
    if (error) toast.error(error.message)
    else { toast.success('Setting updated'); await load() }
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><NavBar facilitatorMode /><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar facilitatorMode />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Sessions</h1>

        {/* Global settings */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Programme Settings</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Programme Week (1–4)</label>
              <select className="input" value={settings.programme_week || '1'}
                onChange={e => updateSetting('programme_week', e.target.value)}>
                {[1,2,3,4].map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => updateSetting('final_assessment_open', settings.final_assessment_open === 'true' ? 'false' : 'true')}
                className={settings.final_assessment_open === 'true' ? 'btn-danger' : 'btn-primary'}>
                {settings.final_assessment_open === 'true' ? '🔒 Close Final Assessment' : '🔓 Open Final Assessment'}
              </button>
            </div>
          </div>
        </div>

        {/* QR modal */}
        {qrSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrSession(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 mb-1">{qrSession.title}</h3>
              <p className="text-sm text-gray-500 mb-4">Scan to self check-in</p>
              <div className="flex justify-center mb-3">
                <QRCodeSVG value={`${APP_URL}/attend/${qrSession.id}`} size={200} />
              </div>
              <p className="text-xs text-gray-400 break-all mb-4">{APP_URL}/attend/{qrSession.id}</p>
              <button onClick={() => setQrSession(null)} className="btn-secondary w-full">Close</button>
            </div>
          </div>
        )}

        {/* Sessions table */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">All Sessions</h2>
          <div className="space-y-3">
            {sessions.map(s => {
              const date = new Date(s.session_date + 'T00:00:00')
              return (
                <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F52BA]">S{s.session_number}</span>
                        <span className="font-semibold text-gray-900">{s.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.session_time} · {s.facilitators?.name}
                      </p>
                    </div>
                    <button onClick={() => setQrSession(s)} className="btn-secondary text-xs px-2 py-1">QR Code</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={saving === `${s.id}_is_open`}
                      onClick={() => toggleFlag(s.id, 'is_open', s.is_open)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.is_open ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {s.is_open ? '✓ Session Open' : '○ Session Closed'}
                    </button>
                    <button
                      disabled={saving === `${s.id}_reflections_open`}
                      onClick={() => toggleFlag(s.id, 'reflections_open', s.reflections_open)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.reflections_open ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {s.reflections_open ? '✓ Reflections Open' : '○ Reflections Closed'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
