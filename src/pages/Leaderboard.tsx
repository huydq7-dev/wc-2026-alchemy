import { BarChart3, Trophy, Target } from 'lucide-react'
import LeaderboardTable from '@/components/LeaderboardTable'
import { Card, CardContent } from '@/components/ui/card'
import { useLeaderboard } from '@/hooks/useLeaderboard'

export default function LeaderboardPage() {
  const { data, isLoading } = useLeaderboard()
  const entries = data?.entries || []
  const maxPoints = data?.maxPoints || 1

  const totalWins = entries.reduce((s: number, e: any) => s + e.wins, 0)
  const totalBets = entries.reduce((s: number, e: any) => s + e.totalBets, 0)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-white tracking-wider flex items-center gap-2">
        <BarChart3 className="w-7 h-7 text-[#C8102E]" />
        Bảng Xếp Hạng
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-[#141929] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#F5A623]" />
            <div>
              <p className="text-xs text-gray-500">Người dẫn đầu</p>
              <p className="font-display text-lg text-white">
                {entries[0]?.name || '---'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141929] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Target className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-xs text-gray-500">Tổng lượt thắng</p>
              <p className="font-display text-lg text-white">{totalWins}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141929] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-xs text-gray-500">Tổng lượt cược</p>
              <p className="font-display text-lg text-white">{totalBets}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-xl border border-white/5 bg-[#141929] p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <LeaderboardTable entries={entries} maxPoints={maxPoints} />
      )}
    </div>
  )
}
