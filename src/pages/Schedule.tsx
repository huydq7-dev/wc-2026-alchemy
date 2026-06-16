import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Calendar, Filter } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import PageHeader from '@/components/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMatches } from '@/hooks/useMatches';
import { usePredictions, usePickStats } from '@/hooks/usePredictions';
import { useGameStore } from '@/store/useGameStore';
import { getEffectiveStatus } from '@/lib/utils';
import type { Match } from '@/types';

type FilterTab = 'all' | 'today' | 'upcoming' | 'finished';

export default function Schedule() {
  const currentUserId = useGameStore((s) => s.currentUser?.id || '');
  const { data: matches, isLoading } = useMatches();
  const { data: predictions } = usePredictions({ userId: currentUserId });
  const [filter, setFilter] = useState<FilterTab>('upcoming');

  const predMap = new Map(
    (predictions || []).map((p: any) => [p.match_id, { pick: p.pick, result: p.result }]),
  );

  // Match dates are in ICT (UTC+7); en-CA locale gives YYYY-MM-DD
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

  const filteredMatches = (matches || []).filter((m: Match) => {
    const s = getEffectiveStatus(m.status, m.date, m.time);
    switch (filter) {
      case 'today':
        return m.date === today;
      case 'upcoming':
        return s === 'upcoming';
      case 'finished':
        return s === 'finished';
      default:
        return true;
    }
  });

  // Fetch community pick stats for upcoming matches
  const upcomingMatchIds = filteredMatches
    .filter((m: Match) => getEffectiveStatus(m.status, m.date, m.time) === 'upcoming')
    .map((m: Match) => m.id);
  const { data: pickStats } = usePickStats(upcomingMatchIds);

  const grouped = filteredMatches.reduce(
    (acc: Record<string, Match[]>, m: Match) => {
      if (!acc[m.date]) acc[m.date] = [];
      acc[m.date].push(m);
      return acc;
    },
    {} as Record<string, Match[]>,
  );

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule & Predict"
        icon={<Calendar className="w-7 h-7 text-[#60E6F6]" />}
        description="Browse fixtures by day, lock in picks quickly, and review finished matches without losing your place."
      />

      <Tabs value={filter} onValueChange={(v: string) => setFilter(v as FilterTab)}>
        <TabsList className="border-white/8 bg-white/[0.03]">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="app-panel h-48 rounded-none p-4 animate-pulse" />
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="app-panel-muted py-20 text-center">
          <Filter className="mx-auto mb-4 h-12 w-12 text-white/24" />
          <p className="text-white/45">No matches found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const dateMatches = grouped[date];
            const dateObj = new Date(date + 'T00:00:00+07:00');
            const dateLabel = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div key={date}>
                <h2 className="mb-3 font-display text-lg uppercase tracking-[0.18em] text-white/58">
                  {dateLabel}
                  {date === today && <span className="ml-2 text-sm text-[#60E6F6]">· TODAY</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {dateMatches.map((match: Match) => {
                      const pred = predMap.get(match.id);
                      return (
                        <MatchCard
                          key={match.id}
                          match={match}
                          userPick={pred?.pick ?? null}
                          userResult={pred?.result ?? null}
                          pickStats={pickStats?.[match.id] ?? null}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
