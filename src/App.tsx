import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Schedule from '@/pages/Schedule'
import Leaderboard from '@/pages/Leaderboard'
import MatchDetail from '@/pages/MatchDetail'
import Rules from '@/pages/Rules'
import Fund from '@/pages/Fund'
import Standings from '@/pages/Standings'
import Activity from '@/pages/Activity'
import UserProfile from '@/pages/UserProfile'
import Squad from '@/pages/Squad'
import Login from '@/pages/Login'
import { useGameStore } from '@/store/useGameStore'
import { useUsers } from '@/hooks/useUsers'

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
        // Only update if something changed
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
