import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ParticipantRoute() {
  const { user, participant, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!participant) return <Navigate to="/register" replace />
  return <Outlet />
}
