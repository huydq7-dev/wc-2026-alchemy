import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Flame, ArrowRight, RefreshCw } from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import LiveBadge from '@/components/LiveBadge';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNextMatch, useMatches } from '@/hooks/useMatches';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePredictions } from '@/hooks/usePredictions';
import { useGameStore } from '@/store/useGameStore';
import { api } from '@/api/client';
import FlagImage from '@/components/FlagImage';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const currentUserId = useGameStore((s) => s.currentUser?.id || '');
  const isAdmin = useGameStore((s) => s.currentUser?.isAdmin || false);
  const { data: nextMatch } = useNextMatch();
  const { data: matches } = useMatches();
  const { data: leaderboardData } = useLeaderboard();
  const { data: predictions } = usePredictions({ userId: currentUserId });

  const liveMatch = matches?.find((m: any) => m.status === 'live');
  const top3 = leaderboardData?.entries?.slice(0, 3) || [];
  const userPreds = predictions || [];

  const [syncing, setSyncing] = useState(false);
  const [syncingOdds, setSyncingOdds] = useState(false);
  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncMatches();
      window.location.reload();
    } catch {
      // silently fail
    } finally {
      setSyncing(false);
    }
  };
  const handleSyncOdds = async () => {
    setSyncingOdds(true);
    try {
      const res = await api.syncOdds();
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Failed to sync odds');
    } finally {
      setSyncingOdds(false);
    }
  };

  const stats = {
    totalMatches: matches?.length || 0,
    finishedMatches: matches?.filter((m: any) => m.status === 'finished').length || 0,
    myPredictions: userPreds.length,
    pendingPredictions: userPreds.filter((p: any) => p.result === null).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="World Cup 2026"
        icon={<Trophy className="w-7 h-7 text-primary" />}
        description="Predict match results, track the live table, and keep the whole office pool moving."
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-panel relative overflow-hidden rounded-none bg-[radial-gradient(circle_at_top_left,rgba(96,230,246,0.12),transparent_26%),linear-gradient(135deg,rgba(17,26,72,0.98),rgba(10,14,26,0.98)_58%,rgba(0,48,135,0.2))] p-6 md:p-10"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="app-panel-muted flex h-14 w-14 items-center justify-center rounded-2xl">
              <img src="https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill&quality=75" />
            </div>
            <div>
              <p className="app-kicker">Matchday Center</p>
              <h2 className="font-display text-3xl tracking-[0.18em] text-white md:text-5xl">
                WORLD CUP <span className="text-primary">2026</span>
              </h2>
            </div>
          </div>
          <p className="text-white/58 max-w-lg mb-6">
            Predict World Cup 2026 results with the Alchemy crew. Make predictions, climb the ranks,
            win prizes!
          </p>

          {nextMatch && (
            <div className="mb-6 rounded-none border border-[#17307C] bg-[#0B1543]/68 p-4">
              <p className="app-kicker mb-3">Next Match</p>
              <div className="flex items-center gap-4 mb-4">
                <FlagImage
                  code={nextMatch.team_a_code}
                  size={80}
                  className="w-8 h-5.5 rounded-sm object-cover"
                />
                <span className="font-display text-2xl text-white">{nextMatch.team_a_name}</span>
                <span className="text-white/30 text-sm">vs</span>
                <span className="font-display text-2xl text-white">{nextMatch.team_b_name}</span>
                <FlagImage
                  code={nextMatch.team_b_code}
                  size={80}
                  className="w-8 h-5.5 rounded-sm object-cover"
                />
              </div>
              <CountdownTimer date={nextMatch.date} time={nextMatch.time} label="Starts in" />
            </div>
          )}

          <div className="flex gap-3">
            <Button asChild className="font-semibold">
              <Link to="/schedule">
                <Calendar className="w-4 h-4 mr-2" />
                Predict Now
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/leaderboard">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Link>
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/45 hover:text-white"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={cn('w-4 h-5 mr-1', syncing && 'animate-spin')} />
                  {syncing ? 'Syncing...' : 'Sync Data'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/45 hover:text-white"
                  onClick={handleSyncOdds}
                  disabled={syncingOdds}
                >
                  <RefreshCw className={cn('w-4 h-4 mr-1', syncingOdds && 'animate-spin')} />
                  {syncingOdds ? 'Fetching...' : 'Sync Odds'}
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Live Match Banner */}
      {liveMatch && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="app-panel rounded-none border-[#17307C] bg-[linear-gradient(135deg,rgba(96,230,246,0.10),rgba(20,25,41,0.94))] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <LiveBadge />
            <span className="app-meta">{liveMatch.stage}</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <FlagImage
              code={liveMatch.team_a_code}
              size={80}
              className="w-8 h-5.5 rounded-sm object-cover"
            />
            <span className="font-display text-2xl text-white">{liveMatch.team_a_name}</span>
            <span className="font-display text-3xl text-white tabular-nums">
              {liveMatch.score_a} - {liveMatch.score_b}
            </span>
            <span className="font-display text-2xl text-white">{liveMatch.team_b_name}</span>
            <FlagImage
              code={liveMatch.team_b_code}
              size={80}
              className="w-8 h-5.5 rounded-sm object-cover"
            />
          </div>
          <div className="flex justify-center mt-3">
            <Button asChild variant="link" size="sm">
              <Link to={`/match/${liveMatch.id}`}>
                View Details <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Total Matches" value={stats.totalMatches} />
        <StatCard
          icon={Flame}
          label="Completed"
          value={stats.finishedMatches}
          color="text-primary"
        />
        <StatCard
          icon={Trophy}
          label="Predictions"
          value={stats.myPredictions}
          color="text-[#F5A623]"
        />
        <StatCard
          icon={Calendar}
          label="Awaiting Result"
          value={stats.pendingPredictions}
          color="text-white/70"
        />
      </div>

      {/* Mini Leaderboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white font-display text-lg tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Top 3 Leaderboard
          </CardTitle>
          <Button asChild variant="link" size="sm">
            <Link to="/leaderboard">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {top3.map((entry: any, i: number) => (
              <div
                key={entry.userId}
                className={cn(
                  'app-panel-muted flex items-center justify-between p-3',
                  i === 0 && 'border-[#17307C] bg-[#0B1543]/70',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl w-8 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="text-2xl">{entry.avatar}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{entry.name}</p>
                    <p className="text-xs text-white/36">
                      {entry.wins}W - {entry.losses}L - {entry.draws}D
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-display text-xl font-bold',
                    entry.totalPoints > 0 && 'text-primary',
                  )}
                >
                  {entry.totalPoints > 0 ? '+' : ''}
                  {entry.totalPoints}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="app-tile p-4">
      <Icon className={cn('w-5 h-5 mb-2', color || 'text-gray-400')} />
      <p className="font-display text-2xl text-white">{value}</p>
      <p className="app-meta">{label}</p>
    </div>
  );
}
