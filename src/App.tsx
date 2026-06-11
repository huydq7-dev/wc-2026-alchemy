import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useGameStore } from '@/store/useGameStore'
import { useUsers } from '@/hooks/useUsers'

// Lazy-loaded pages — split into separate chunks
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Schedule = lazy(() => import('@/pages/Schedule'))
const Leaderboard = lazy(() => import('@/pages/Leaderboard'))
const MatchDetail = lazy(() => import('@/pages/MatchDetail'))
const Rules = lazy(() => import('@/pages/Rules'))
const Fund = lazy(() => import('@/pages/Fund'))
const Standings = lazy(() => import('@/pages/Standings'))
const Activity = lazy(() => import('@/pages/Activity'))
const UserProfile = lazy(() => import('@/pages/UserProfile'))
const Squad = lazy(() => import('@/pages/Squad'))

function PageLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-[#141929] rounded" />
      <div className="h-64 bg-[#141929] rounded-xl" />
    </div>
  )
}

function ProtectedRoutes() {
  const isLoggedIn = useGameStore(s => s.isLoggedIn)
  const currentUser = useGameStore(s => s.currentUser)
  const login = useGameStore(s => s.login)

  // Fetch user list once (30min stale) and keep current user in sync with API
  const { data: users } = useUsers()

  useEffect(() => {
    if (users && currentUser) {
      const fresh = users.find((u: any) => u.id === currentUser.id)
      if (fresh) {
        const updated = {
          id: fresh.id,
          name: fresh.name,
          avatar: fresh.avatar,
          isAdmin: fresh.is_admin || fresh.isAdmin || false,
          pinChanged: currentUser.pinChanged,
        }
        if (updated.name !== currentUser.name || updated.avatar !== currentUser.avatar || updated.isAdmin !== currentUser.isAdmin) {
          login(updated)
        }
      }
    }
  }, [users, currentUser?.id])

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/fund" element={<Fund />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/squad/:teamCode" element={<Squad />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}
