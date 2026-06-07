import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import Login from './pages/Login'
import ParticipantRoute from './components/ParticipantRoute'
import FacilitatorRoute from './components/FacilitatorRoute'
import Dashboard from './pages/participant/Dashboard'
import Assessment from './pages/participant/Assessment'
import Reflect from './pages/participant/Reflect'
import Journal from './pages/participant/Journal'
import Commit from './pages/participant/Commit'
import Assignments from './pages/participant/Assignments'
import Growth from './pages/participant/Growth'
import PublicAttend from './pages/Attend'
import FacilitatorLogin from './pages/facilitator/Login'
import FacilitatorDashboard from './pages/facilitator/Dashboard'
import FacilitatorLive from './pages/facilitator/Live'
import FacilitatorSessions from './pages/facilitator/Sessions'
import FacilitatorAttend from './pages/facilitator/Attend'
import FacilitatorScorecard from './pages/facilitator/Scorecard'
import FacilitatorMentorship from './pages/facilitator/Mentorship'
import FacilitatorAwards from './pages/facilitator/Awards'
import FacilitatorExport from './pages/facilitator/Export'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/attend/:sessionId" element={<PublicAttend />} />

      <Route element={<ParticipantRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/assessment" element={<Assessment />} />
        <Route path="/dashboard/reflect" element={<Reflect />} />
        <Route path="/dashboard/journal" element={<Journal />} />
        <Route path="/dashboard/commit" element={<Commit />} />
        <Route path="/dashboard/assignments" element={<Assignments />} />
        <Route path="/dashboard/growth" element={<Growth />} />
      </Route>

      <Route path="/facilitator/login" element={<FacilitatorLogin />} />
      <Route element={<FacilitatorRoute />}>
        <Route path="/facilitator" element={<FacilitatorDashboard />} />
        <Route path="/facilitator/live" element={<FacilitatorLive />} />
        <Route path="/facilitator/sessions" element={<FacilitatorSessions />} />
        <Route path="/facilitator/attend" element={<FacilitatorAttend />} />
        <Route path="/facilitator/scorecard" element={<FacilitatorScorecard />} />
        <Route path="/facilitator/mentorship" element={<FacilitatorMentorship />} />
        <Route path="/facilitator/awards" element={<FacilitatorAwards />} />
        <Route path="/facilitator/export" element={<FacilitatorExport />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
