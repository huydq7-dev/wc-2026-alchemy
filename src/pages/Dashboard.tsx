import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Trophy, Flame, ArrowRight, RefreshCw } from 'lucide-react'
import CountdownTimer from '@/components/CountdownTimer'
import LiveBadge from '@/components/LiveBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNextMatch, useMatches } from '@/hooks/useMatches'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { usePredictions } from '@/hooks/usePredictions'
import { useGameStore } from '@/store/useGameStore'
import { api } from '@/api/client'
import FlagImage from '@/components/FlagImage'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const currentUserId = useGameStore(s => s.currentUser?.id || '')
  const isAdmin = useGameStore(s => s.currentUser?.isAdmin || false)
  const { data: nextMatch } = useNextMatch()
  const { data: matches } = useMatches()
  const { data: leaderboardData } = useLeaderboard()
  const { data: predictions } = usePredictions({ userId: currentUserId })

  const liveMatch = matches?.find((m: any) => m.status === 'live')
  const top3 = leaderboardData?.entries?.slice(0, 3) || []
  const userPreds = predictions || []

  const [syncing, setSyncing] = useState(false)
  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.syncMatches()
      window.location.reload()
    } catch {
      // silently fail
    } finally {
      setSyncing(false)
    }
  }

  const stats = {
    totalMatches: matches?.length || 0,
    finishedMatches: matches?.filter((m: any) => m.status === 'finished').length || 0,
    myPredictions: userPreds.length,
    pendingPredictions: userPreds.filter((p: any) => p.result === null).length,
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#C8102E]/20 via-[#141929] to-[#003087]/20 border border-white/5 p-6 md:p-10"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-[#F5A623]" />
            <h1 className="font-display text-3xl md:text-5xl text-white tracking-wider">
              WORLD CUP <span className="text-[#C8102E]">2026</span>
            </h1>
          </div>
          <p className="text-gray-400 max-w-lg mb-6">
            Predict World Cup 2026 results with the Alchemy crew. Make predictions, climb the ranks, win prizes!
          </p>

          {nextMatch && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">NEXT MATCH</p>
              <div className="flex items-center gap-4 mb-4">
                <FlagImage code={nextMatch.team_a_code} size={80} className="w-8 h-5.5 rounded-sm object-cover" />
                <span className="font-display text-2xl text-white">{nextMatch.team_a_name}</span>
                <span className="text-gray-500 text-sm">vs</span>
                <span className="font-display text-2xl text-white">{nextMatch.team_b_name}</span>
                <FlagImage code={nextMatch.team_b_code} size={80} className="w-8 h-5.5 rounded-sm object-cover" />
              </div>
              <CountdownTimer date={nextMatch.date} time={nextMatch.time} label="Starts in" />
            </div>
          )}

          <div className="flex gap-3">
            <Button asChild className="bg-[#C8102E] hover:bg-[#C8102E]/80 font-semibold">
              <Link to="/schedule">
                <Calendar className="w-4 h-4 mr-2" />Predict Now
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <Link to="/leaderboard">
                <Trophy className="w-4 h-4 mr-2" />Leaderboard
              </Link>
            </Button>
            {isAdmin && (
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-300" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={cn('w-4 h-4 mr-1', syncing && 'animate-spin')} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Live Match Banner */}
      {liveMatch && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border-2 border-[#C8102E]/40 bg-[#C8102E]/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <LiveBadge />
            <span className="text-sm text-gray-400">{liveMatch.stage}</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <FlagImage code={liveMatch.team_a_code} size={80} className="w-8 h-5.5 rounded-sm object-cover" />
            <span className="font-display text-2xl text-white">{liveMatch.team_a_name}</span>
            <span className="font-display text-3xl text-white tabular-nums">
              {liveMatch.score_a} - {liveMatch.score_b}
            </span>
            <span className="font-display text-2xl text-white">{liveMatch.team_b_name}</span>
            <FlagImage code={liveMatch.team_b_code} size={80} className="w-8 h-5.5 rounded-sm object-cover" />
          </div>
          <div className="flex justify-center mt-3">
            <Button asChild variant="link" size="sm" className="text-[#C8102E]">
              <Link to={`/match/${liveMatch.id}`}>View Details <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Total Matches" value={stats.totalMatches} />
        <StatCard icon={Flame} label="Completed" value={stats.finishedMatches} color="text-green-400" />
        <StatCard icon={Trophy} label="Predictions" value={stats.myPredictions} color="text-[#F5A623]" />
        <StatCard icon={Calendar} label="Awaiting Result" value={stats.pendingPredictions} color="text-blue-400" />
      </div>

      {/* Mini Leaderboard */}
      <Card className="bg-[#141929] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white font-display text-lg tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F5A623]" />Top 3 Leaderboard
          </CardTitle>
          <Button asChild variant="link" size="sm" className="text-[#C8102E]">
            <Link to="/leaderboard">View All <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {top3.map((entry: any, i: number) => (
              <div key={entry.userId} className={cn('flex items-center justify-between p-3 rounded-lg', i === 0 && 'bg-[#F5A623]/5 border border-[#F5A623]/10')}>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <span className="text-2xl">{entry.avatar}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{entry.name}</p>
                    <p className="text-xs text-gray-500">{entry.wins}W - {entry.losses}L - {entry.draws}D</p>
                  </div>
                </div>
                <span className={cn('font-display text-xl font-bold', entry.totalPoints > 0 && 'text-green-400')}>
                  {entry.totalPoints > 0 ? '+' : ''}{entry.totalPoints}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className="bg-[#141929] border border-white/5 rounded-xl p-4">
      <Icon className={cn('w-5 h-5 mb-2', color || 'text-gray-400')} />
      <p className="font-display text-2xl text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
