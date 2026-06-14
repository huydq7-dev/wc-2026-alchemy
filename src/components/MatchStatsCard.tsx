import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { FreeStatsData } from '@/types';

interface Props {
  matchId: string;
  isLive?: boolean;
}

const STAT_LABELS: Record<string, string> = {
  possession: 'Possession',
  shots: 'Total Shots',
  shotsOnTarget: 'Shots on Target',
  passes: 'Passes',
  passAccuracy: 'Pass Accuracy',
  xg: 'Expected Goals',
};

export default function MatchStatsCard({ matchId, isLive }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['freeStats', matchId],
    queryFn: () => api.getFreeStats(matchId),
    staleTime: isLive ? 60_000 : 86_400_000,
    refetchInterval: isLive ? 60_000 : undefined,
  });

  if (isLoading) {
    return <div className="app-panel-muted rounded-2xl p-4 animate-pulse h-48" />;
  }

  if (!data?.data) return null;

  const stats: FreeStatsData = data.data;
  const { home, away, events } = stats;

  const rows: { key: string; home: number; away: number; suffix?: string }[] = [
    { key: 'possession', home: home.possession, away: away.possession, suffix: '%' },
    { key: 'shots', home: home.shots, away: away.shots },
    { key: 'shotsOnTarget', home: home.shotsOnTarget, away: away.shotsOnTarget },
    { key: 'passes', home: home.passes, away: away.passes },
    { key: 'passAccuracy', home: home.passAccuracy, away: away.passAccuracy, suffix: '%' },
    { key: 'xg', home: home.xg, away: home.xg > 0 ? away.xg : 0 },
  ];

  return (
    <div className="app-panel-muted p-4 space-y-4">
      <h3 className="font-display text-white text-sm uppercase tracking-[0.18em]">Match Stats</h3>

      {/* Stat bars */}
      <div className="space-y-3">
        {rows.map((row) => {
          const total = row.home + row.away;
          const homePct = total > 0 ? (row.home / total) * 100 : 50;
          const awayPct = total > 0 ? (row.away / total) * 100 : 50;

          return (
            <div key={row.key}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[#60E6F6] font-medium tabular-nums w-10 text-right">
                  {row.home}
                  {row.suffix || ''}
                </span>
                <span className="text-white/35 text-[10px] uppercase tracking-wider">
                  {STAT_LABELS[row.key] || row.key}
                </span>
                <span className="text-[#F5A623] font-medium tabular-nums w-10">
                  {row.away}
                  {row.suffix || ''}
                </span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
                <div
                  className="h-full bg-[#60E6F6]/60 transition-all"
                  style={{ width: `${homePct}%` }}
                />
                <div
                  className="h-full bg-[#F5A623]/60 transition-all"
                  style={{ width: `${awayPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Events */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-white/6">
        <EventBadge label="Goals" value={events.goals} color="text-white" />
        <EventBadge label="Yellow" value={events.yellowCards} color="text-[#F5A623]" />
        <EventBadge label="Red" value={events.redCards} color="text-[#E63946]" />
        <EventBadge label="Subs" value={events.substitutions} color="text-white/60" />
      </div>

      <p className="text-[9px] text-white/20 text-center">Source: FIFA Match Centre / Opta</p>
    </div>
  );
}

function EventBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`text-sm font-display tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-white/35">{label}</span>
    </div>
  );
}
