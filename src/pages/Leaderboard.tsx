import { BarChart3, Trophy, Target } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Card, CardContent } from "@/components/ui/card";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function LeaderboardPage() {
  const { data, isLoading } = useLeaderboard();
  const entries = data?.entries || [];
  const maxPoints = data?.maxPoints || 1;

  const totalWins = entries.reduce((s: number, e: any) => s + e.wins, 0);
  const totalPredictions = entries.reduce(
    (s: number, e: any) => s + e.totalBets,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        icon={<BarChart3 className="w-7 h-7 text-[#60E6F6]" />}
        description="See who is leading the pool, who is on a streak, and who needs a comeback."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#60E6F6]" />
            <div>
              <p className="app-meta">Leader</p>
              <p className="font-display text-lg text-white">
                {entries[0]?.name || "---"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Target className="w-8 h-8 text-[#F5A623]" />
            <div>
              <p className="app-meta">Total Wins</p>
              <p className="font-display text-lg text-white">{totalWins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-white/72" />
            <div>
              <p className="app-meta">Total Predictions</p>
              <p className="font-display text-lg text-white">
                {totalPredictions}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="app-tile p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <LeaderboardTable entries={entries} maxPoints={maxPoints} />
      )}
    </div>
  );
}
