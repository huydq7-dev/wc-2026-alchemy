import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Schedule from '@/pages/Schedule'
import Leaderboard from '@/pages/Leaderboard'
import MatchDetail from '@/pages/MatchDetail'
import Rules from '@/pages/Rules'
import Fund from '@/pages/Fund'
import Standings from '@/pages/Standings'
import Login from '@/pages/Login'
import { useGameStore } from '@/store/useGameStore'

function ProtectedRoutes() {
  const isLoggedIn = useGameStore(s => s.isLoggedIn)

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
