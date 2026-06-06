import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function FacilitatorRoute() {
  const { user, facilitator, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
    </div>
  )

  if (!user || !facilitator) return <Navigate to="/facilitator/login" replace />
  return <Outlet />
}
