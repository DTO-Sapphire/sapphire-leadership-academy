import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function PublicAttend() {
  const { sessionId } = useParams()
  const { user, participant, loading } = useAuth()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('idle') // idle | done | error
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    supabase.from('sessions').select('*, facilitators(name)').eq('id', sessionId).single()
      .then(({ data }) => { setSession(data); setFetching(false) })
  }, [sessionId])

  useEffect(() => {
    if (!user || !participant || !session) return
    checkIn()
  }, [user, participant, session])

  async function checkIn() {
    const { error } = await supabase.from('attendance').upsert(
      { participant_id: participant.id, session_id: sessionId, attended: true },
      { onConflict: 'participant_id,session_id' }
    )
    if (error) { setStatus('error'); toast.error(error.message) }
    else { setStatus('done'); toast.success('Attendance marked!') }
  }

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1F4E79]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1F4E79] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        {!session ? (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800">Session not found</h2>
            <Link to="/" className="btn-primary mt-4 inline-block">Go Home</Link>
          </>
        ) : !user ? (
          <>
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-xl font-bold text-[#1F4E79] mb-2">{session.title}</h2>
            <p className="text-gray-500 text-sm mb-6">Log in to mark your attendance</p>
            <Link to={`/login`} className="btn-primary inline-block w-full">Log In to Check In</Link>
          </>
        ) : status === 'done' ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-green-700 mb-1">Attendance Marked!</h2>
            <p className="text-gray-600 text-sm mb-2">{session.title}</p>
            <p className="text-gray-500 text-xs mb-6">Welcome, {participant?.name}</p>
            <Link to="/dashboard" className="btn-primary inline-block w-full">Go to Dashboard</Link>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-500">Marking your attendance...</p>
          </>
        )}
      </div>
    </div>
  )
}
