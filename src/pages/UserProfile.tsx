import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Swords,
  Flame,
  Percent,
  Star,
  ArrowUpRight,
  ChevronLeft,
  Medal,
  Zap,
  Eye,
} from 'lucide-react';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { UserProfile as UserProfileType } from '@/types';
import PageHeader from '@/components/PageHeader';
import FlagImage from '@/components/FlagImage';
import { Badge } from '@/components/ui/badge';

function StatTile({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-none border border-white/6 bg-white/[0.02] p-3.5">
      {Icon && <Icon className="w-5 h-5 text-white/16" />}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">{label}</p>
        <p className={cn('font-display text-xl mt-0.5', color || 'text-white')}>{value}</p>
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-none border border-white/6 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/28" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/36">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: () => api.getUserProfile(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="app-panel p-6 space-y-3">
          <div className="h-16 w-16 bg-white/5 rounded-full mx-auto" />
          <div className="h-6 w-32 bg-white/5 rounded mx-auto" />
          <div className="h-4 w-24 bg-white/5 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center text-white/45">
        <p className="text-lg">User not found</p>
        <Link
          to="/leaderboard"
          className="text-[#60E6F6] text-sm mt-2 inline-block hover:underline"
        >
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const profile = data as UserProfileType;
  const {
    user,
    stats,
    recentForm,
    streak,
    favoriteTeam,
    underdogRate,
    bestStage,
    clutchRate,
    biggestWin,
  } = profile;

  const rankMedal =
    stats.rank === 1 ? '🥇' : stats.rank === 2 ? '🥈' : stats.rank === 3 ? '🥉' : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-1 text-xs text-white/36 hover:text-white/70 mb-3 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Leaderboard
        </Link>
        <PageHeader
          title={user.name}
          icon={<Trophy className="w-7 h-7 text-[#60E6F6]" />}
          description="Player profile and stats"
        />
      </motion.div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="app-panel p-6 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#60E6F6]/5 to-transparent pointer-events-none" />
        <div className="relative">
          <span className="text-7xl">{user.avatar}</span>
          {rankMedal && <span className="absolute -top-1 ml-3 text-2xl">{rankMedal}</span>}

          <h1 className="font-display text-2xl tracking-[0.12em] text-white mt-3">{user.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-white/40">
              <Medal className="w-3 h-3" />
              Rank #{stats.rank}
            </span>
            {user.created_at && (
              <span className="text-xs text-white/28">Joined {user.created_at.slice(0, 10)}</span>
            )}
            {user.paid && (
              <Badge className="bg-[#60E6F6]/12 text-[#60E6F6] border-0 text-[10px]">Settled</Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        <StatTile
          icon={Trophy}
          label="Points"
          value={`${stats.totalPoints > 0 ? '+' : ''}${stats.totalPoints}`}
          color={stats.totalPoints >= 0 ? 'text-[#60E6F6]' : 'text-[#FFD890]'}
        />
        <StatTile
          icon={Percent}
          label="Win Rate"
          value={`${stats.winRate}%`}
          color="text-[#9DEFF9]"
        />
        <StatTile
          icon={Swords}
          label="W / L / D"
          value={`${stats.wins} / ${stats.losses} / ${stats.draws}`}
        />
        <StatTile icon={Target} label="Total Bets" value={stats.totalBets} />
        <StatTile icon={Eye} label="Pending" value={stats.pendingBets} color="text-white/55" />
        <StatTile
          icon={Zap}
          label="Debt"
          value={stats.debtPaid ? 'Settled' : `${stats.debt.toLocaleString()} pts`}
          color={stats.debtPaid ? 'text-[#60E6F6]' : 'text-[#FFD890]'}
        />
      </motion.div>

      {/* Form Strip + Streak */}
      {recentForm.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="app-panel p-4 flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/36 mr-1">Form</span>
            {recentForm.map((r, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                  r === 'W' && 'bg-[#60E6F6]/15 text-[#60E6F6]',
                  r === 'L' && 'bg-[#FFD890]/15 text-[#FFD890]',
                  r === 'D' && 'bg-white/8 text-white/40',
                )}
              >
                {r}
              </span>
            ))}
          </div>
          {streak !== 0 && (
            <div className="flex items-center gap-1.5">
              <Flame className={cn('w-4 h-4', streak > 0 ? 'text-[#FFD890]' : 'text-white/28')} />
              <span
                className={cn(
                  'text-xs font-medium',
                  streak > 0 ? 'text-[#FFD890]' : 'text-white/40',
                )}
              >
                {streak > 0
                  ? `On a ${streak}-win streak!`
                  : `${Math.abs(streak)} loss${streak < -1 ? 'es' : ''} in a row`}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Insights Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <InsightCard icon={Star} title="Favorite Team">
          {favoriteTeam ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{favoriteTeam.flag}</span>
              <span className="text-sm font-medium text-white">{favoriteTeam.name}</span>
              <span className="text-xs text-white/32 ml-auto">{favoriteTeam.count} bets</span>
            </div>
          ) : (
            <p className="text-xs text-white/32">No data yet</p>
          )}
        </InsightCard>

        <InsightCard icon={Swords} title="Underdog Picker">
          <p className="text-sm text-white">
            <span className="font-display text-xl text-[#FFD890]">{underdogRate}%</span>
            <span className="text-xs text-white/36 ml-1">underdog picks</span>
          </p>
          <p className="text-[10px] text-white/28 mt-0.5">
            {underdogRate > 60
              ? 'Loves the risky side'
              : underdogRate > 40
                ? 'Balanced picker'
                : 'Plays it safe'}
          </p>
        </InsightCard>

        <InsightCard icon={Target} title="Best Stage">
          {bestStage ? (
            <p className="text-sm font-medium text-white">{bestStage}</p>
          ) : (
            <p className="text-xs text-white/32">Not enough data</p>
          )}
        </InsightCard>

        <InsightCard icon={Flame} title="Clutch Rate">
          <p className="text-sm text-white">
            <span className="font-display text-xl text-[#60E6F6]">{clutchRate}%</span>
            <span className="text-xs text-white/36 ml-1">minority wins</span>
          </p>
          <p className="text-[10px] text-white/28 mt-0.5">
            {clutchRate > 60
              ? 'Thrives against the crowd'
              : clutchRate > 30
                ? 'Goes with the flow'
                : 'Follows the herd'}
          </p>
        </InsightCard>
      </motion.div>

      {/* Biggest Win */}
      {biggestWin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Link to={`/match/${biggestWin.matchId}`} className="block group">
            <div className="app-panel p-4 border-[#60E6F6]/10 hover:border-[#60E6F6]/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-[#FFD890]" />
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/36">Biggest Win</p>
                <ArrowUpRight className="w-3 h-3 text-white/20 ml-auto group-hover:text-[#60E6F6] transition-colors" />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-lg">{biggestWin.team_a_flag}</span>
                <span className="text-sm text-white/70">
                  {biggestWin.team_a_name} vs {biggestWin.team_b_name}
                </span>
                <span className="text-lg">{biggestWin.team_b_flag}</span>
              </div>
              <p className="text-xs text-white/36 mt-2">
                Picked{' '}
                <span className="text-white/70">
                  {biggestWin.pickedFlag} {biggestWin.pickedTeam}
                </span>{' '}
                when only{' '}
                <span className="text-[#60E6F6] font-medium">{biggestWin.minorityPercent}%</span> of
                the pool agreed
                <span className="mx-2 text-white/16">·</span>
                {biggestWin.stage}
              </p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Prediction History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="app-panel p-4"
      >
        <h3 className="font-display text-lg tracking-[0.12em] text-white mb-4">
          Prediction History
        </h3>
        <UserPredictionList userId={id!} />
      </motion.div>
    </div>
  );
}

function UserPredictionList({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['predictions', 'history', userId],
    queryFn: () => api.getUserHistory(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.predictions?.length) {
    return <p className="text-sm text-white/32 py-4">No predictions yet.</p>;
  }

  return (
    <div className="space-y-1.5 max-h-96 overflow-y-auto">
      {data.predictions.map((pred: any) => (
        <Link
          key={pred.match_id}
          to={`/match/${pred.match_id}`}
          className="flex items-center justify-between rounded-none border border-white/5 bg-white/[0.02] p-3 hover:border-white/10 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FlagImage
              code={pred.team_a_code}
              size={40}
              className="w-5 h-4 object-cover shrink-0"
            />
            <span className="text-xs text-white/48 truncate">
              {pred.team_a_name} vs {pred.team_b_name}
            </span>
            <FlagImage
              code={pred.team_b_code}
              size={40}
              className="w-5 h-4 object-cover shrink-0"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <FlagImage
              code={pred.pick === 'A' ? pred.team_a_code : pred.team_b_code}
              size={40}
              className="w-4 h-3 object-cover"
            />
            {pred.result && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  pred.result === 'win' && 'border-[#60E6F6]/20 text-[#9DEFF9]',
                  pred.result === 'lose' && 'border-[#F5A623]/20 text-[#FFD890]',
                  pred.result === 'draw' && 'border-white/12 text-white/55',
                )}
              >
                {pred.result === 'win' ? '+1' : pred.result === 'lose' ? '-1' : '0'}
              </Badge>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
