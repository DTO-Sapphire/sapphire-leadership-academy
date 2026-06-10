import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ParticipantRoute from './components/ParticipantRoute'
import FacilitatorRoute from './components/FacilitatorRoute'

const Landing                   = lazy(() => import('./pages/Landing'))
const NotFound                  = lazy(() => import('./pages/NotFound'))
const Register                  = lazy(() => import('./pages/Register'))
const Login                     = lazy(() => import('./pages/Login'))
const PublicAttend               = lazy(() => import('./pages/Attend'))
const ManagerAssess              = lazy(() => import('./pages/ManagerAssess'))

const Dashboard                  = lazy(() => import('./pages/participant/Dashboard'))
const Assessment                 = lazy(() => import('./pages/participant/Assessment'))
const Reflect                    = lazy(() => import('./pages/participant/Reflect'))
const Journal                    = lazy(() => import('./pages/participant/Journal'))
const Commit                     = lazy(() => import('./pages/participant/Commit'))
const Assignments                = lazy(() => import('./pages/participant/Assignments'))
const Growth                     = lazy(() => import('./pages/participant/Growth'))
const ParticipantMentorship      = lazy(() => import('./pages/participant/Mentorship'))
const PeerFeedback               = lazy(() => import('./pages/participant/PeerFeedback'))
const SessionExercises           = lazy(() => import('./pages/participant/SessionExercises'))

const FacilitatorLogin           = lazy(() => import('./pages/facilitator/Login'))
const FacilitatorDashboard       = lazy(() => import('./pages/facilitator/Dashboard'))
const FacilitatorLive            = lazy(() => import('./pages/facilitator/Live'))
const FacilitatorSessions        = lazy(() => import('./pages/facilitator/Sessions'))
const FacilitatorAttend          = lazy(() => import('./pages/facilitator/Attend'))
const FacilitatorScorecard       = lazy(() => import('./pages/facilitator/Scorecard'))
const FacilitatorMentorship      = lazy(() => import('./pages/facilitator/Mentorship'))
const FacilitatorMentorAssign    = lazy(() => import('./pages/facilitator/MentorAssign'))
const FacilitatorManagerAssessments = lazy(() => import('./pages/facilitator/ManagerAssessments'))
const FacilitatorAwards          = lazy(() => import('./pages/facilitator/Awards'))
const FacilitatorExport          = lazy(() => import('./pages/facilitator/Export'))
const FacilitatorBroadcast       = lazy(() => import('./pages/facilitator/Broadcast'))
const FacilitatorInsights        = lazy(() => import('./pages/facilitator/Insights'))
const FacilitatorCommitments     = lazy(() => import('./pages/facilitator/Commitments'))
const FacilitatorPartnerAssign   = lazy(() => import('./pages/facilitator/PartnerAssign'))
const ParticipantProfile         = lazy(() => import('./pages/facilitator/ParticipantProfile'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F52BA]" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/attend/:sessionId" element={<PublicAttend />} />
        <Route path="/manager-assess/:token" element={<ManagerAssess />} />

        <Route element={<ParticipantRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/assessment" element={<Assessment />} />
          <Route path="/dashboard/reflect" element={<Reflect />} />
          <Route path="/dashboard/journal" element={<Journal />} />
          <Route path="/dashboard/commit" element={<Commit />} />
          <Route path="/dashboard/assignments" element={<Assignments />} />
          <Route path="/dashboard/growth" element={<Growth />} />
          <Route path="/dashboard/mentorship" element={<ParticipantMentorship />} />
          <Route path="/dashboard/peer-feedback" element={<PeerFeedback />} />
          <Route path="/dashboard/exercises" element={<SessionExercises />} />
        </Route>

        <Route path="/facilitator/login" element={<FacilitatorLogin />} />
        <Route element={<FacilitatorRoute />}>
          <Route path="/facilitator" element={<FacilitatorDashboard />} />
          <Route path="/facilitator/live" element={<FacilitatorLive />} />
          <Route path="/facilitator/sessions" element={<FacilitatorSessions />} />
          <Route path="/facilitator/attend" element={<FacilitatorAttend />} />
          <Route path="/facilitator/scorecard" element={<FacilitatorScorecard />} />
          <Route path="/facilitator/mentorship" element={<FacilitatorMentorship />} />
          <Route path="/facilitator/mentors" element={<FacilitatorMentorAssign />} />
          <Route path="/facilitator/manager-assessments" element={<FacilitatorManagerAssessments />} />
          <Route path="/facilitator/awards" element={<FacilitatorAwards />} />
          <Route path="/facilitator/export" element={<FacilitatorExport />} />
          <Route path="/facilitator/broadcast" element={<FacilitatorBroadcast />} />
          <Route path="/facilitator/insights" element={<FacilitatorInsights />} />
          <Route path="/facilitator/commitments" element={<FacilitatorCommitments />} />
          <Route path="/facilitator/partners" element={<FacilitatorPartnerAssign />} />
          <Route path="/facilitator/participant/:id" element={<ParticipantProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
