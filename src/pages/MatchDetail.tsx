import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Radio, Pencil } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LiveBadge from '@/components/LiveBadge';
import DealBadge from '@/components/DealBadge';
import DealEditor from '@/components/DealEditor';
import LiveMatchPanel from '@/components/LiveMatchPanel';
import { useMatch } from '@/hooks/useMatches';
import { useLiveMatch } from '@/hooks/useLiveMatch';
import { useGameStore } from '@/store/useGameStore';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import FlagImage from '@/components/FlagImage';
import { cn, getEffectiveStatus } from '@/lib/utils';

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading } = useMatch(id!);

  const queryClient = useQueryClient();
  const isAdmin = useGameStore((s) => s.currentUser?.isAdmin || false);
  const [showDealEditor, setShowDealEditor] = useState(false);

  // Live data from Highlightly — must be before any early return (Rules of Hooks)
  const liveMatch = useLiveMatch({
    teamA: match?.team_a_name ?? '',
    teamB: match?.team_b_name ?? '',
    date: match?.date ?? '',
  });

  const handleSaveDeal = (deal: string, dealSide: 'A' | 'B') => {
    if (!match) return;
    api.updateMatch(match.id, { deal, deal_side: dealSide }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setShowDealEditor(false);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-[#141929] rounded animate-pulse" />
        <div className="h-64 bg-[#141929] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Match not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/schedule">Back to Schedule</Link>
        </Button>
      </div>
    );
  }

  const effectiveStatus = getEffectiveStatus(match.status, match.date, match.time);
  const isLive = effectiveStatus === 'live';
  const isFinished = effectiveStatus === 'finished';
  const isUpcoming = effectiveStatus === 'upcoming';
  const hasScore = match.score_a != null && match.score_b != null;

  // Pool calculation from actual picks
  const predictions = match.predictions || [];
  const picksA = predictions.filter((p: any) => p.pick === 'A').length;
  const picksB = predictions.filter((p: any) => p.pick === 'B').length;
  const totalPicks = picksA + picksB;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Match Detail"
        icon={<MapPin className="w-7 h-7 text-[#60E6F6]" />}
        description="Fixture detail, final score, and everyone’s picks in one place."
      />

      <Button asChild variant="ghost" className="-ml-3 text-white/65">
        <Link to="/schedule">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Schedule
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            {isLive && <LiveBadge />}
            {isFinished && <Badge variant="secondary">Finished</Badge>}
            {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
          </div>

          <p className="mb-4 text-center text-xs text-white/80">
            {match.stage} - {match.venue}
          </p>

          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <FlagImage
                code={match.team_a_code}
                size={160}
                className="w-16 h-11 rounded-sm object-cover shadow-lg"
              />
              <h2 className="font-display text-xl md:text-2xl text-white text-center truncate w-full">
                {match.team_a_name}
              </h2>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              {hasScore ? (
                <span className="font-display text-4xl md:text-5xl text-white tabular-nums">
                  {match.score_a} - {match.score_b}
                </span>
              ) : (
                <span className="font-display text-2xl text-white">{match.time}</span>
              )}
              <div className="flex items-center gap-1">
                <DealBadge
                  deal={match.deal}
                  dealSide={match.deal_side as 'A' | 'B'}
                  teamAName={match.team_a_name}
                />
                {isAdmin && (
                  <button
                    onClick={() => setShowDealEditor(true)}
                    className="text-white/26 transition-colors hover:text-accent"
                    title="Edit deal"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <FlagImage
                code={match.team_b_code}
                size={160}
                className="w-16 h-11 rounded-sm object-cover shadow-lg"
              />
              <h2 className="font-display text-xl md:text-2xl text-white text-center truncate w-full">
                {match.team_b_name}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-white/60">
            <Clock className="w-3 h-3 inline mr-1" />
            {match.date} · {match.time}
          </p>
        </CardContent>
      </Card>

      {/* ── Live Data + Predictions (2-col on desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Live Data Panel */}
        <div className="lg:col-span-3">
          {liveMatch.hlMatchId ? (
            <LiveMatchPanel
              detail={liveMatch.detail}
              lineups={liveMatch.lineups}
              stats={liveMatch.stats}
              isLive={isLive || liveMatch.isLive}
              isFetching={liveMatch.isFetching}
            />
          ) : !liveMatch.isLoading && (isLive || isUpcoming || isFinished) ? (
            <Card>
              <CardContent className="py-6 text-center">
                <Radio className="w-5 h-5 text-white/15 mx-auto mb-2" />
                <p className="text-xs text-white/30">
                  Live data will appear here when available from Highlightly.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Predictions sidebar */}
        <div className="lg:col-span-2">
          {predictions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-white font-display text-lg">
                  Who predicted what?
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pool breakdown */}
                {totalPicks > 0 && (
                  <div className="mb-4 app-panel-muted rounded-2xl p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white/60">
                        {match.team_a_name.slice(0, 3).toUpperCase()}
                      </span>
                      <span className="text-white/20">{totalPicks} picks</span>
                      <span className="text-white/60">
                        {match.team_b_name.slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-[#60E6F6] font-medium w-7 text-right">
                        {picksA}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5 flex">
                        <div
                          className="h-full bg-[#60E6F6]/60 transition-all"
                          style={{ width: `${totalPicks > 0 ? (picksA / totalPicks) * 100 : 50}%` }}
                        />
                        <div
                          className="h-full bg-[#F5A623]/60 transition-all"
                          style={{ width: `${totalPicks > 0 ? (picksB / totalPicks) * 100 : 50}%` }}
                        />
                      </div>
                      <span className="text-[#F5A623] font-medium w-7">{picksB}</span>
                    </div>
                    {isUpcoming && (
                      <>
                        <Separator className="my-2.5 bg-white/5" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-white/32">Pool if {match.team_a_name} wins</span>
                          <span className="text-[#60E6F6] font-medium">
                            {picksB * 5000 > 0
                              ? `${(picksB * 5000).toLocaleString()}đ`
                              : '0đ'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mt-1">
                          <span className="text-white/32">Pool if {match.team_b_name} wins</span>
                          <span className="text-[#F5A623] font-medium">
                            {picksA * 5000 > 0
                              ? `${(picksA * 5000).toLocaleString()}đ`
                              : '0đ'}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/20 mt-2">
                          {picksB > 0
                            ? `${picksB} loser${picksB > 1 ? 's' : ''} × 5,000đ`
                            : 'No losers'}{' '}
                          ~ {picksA > 0
                            ? `${picksA} loser${picksA > 1 ? 's' : ''} × 5,000đ`
                            : 'No losers'}
                        </p>
                      </>
                    )}
                    {isFinished && hasScore && match.dealInfo && (
                      <>
                        <Separator className="my-2.5 bg-white/5" />
                        <div className="flex items-center gap-2">
                          <FlagImage
                            code={
                              match.dealInfo.adjustedA > match.dealInfo.adjustedB
                                ? match.team_a_code
                                : match.dealInfo.adjustedB > match.dealInfo.adjustedA
                                  ? match.team_b_code
                                  : ''
                            }
                            size={40}
                            className="w-5 h-3.5 rounded-none object-cover"
                          />
                          <span className="text-xs text-white/80">
                            {match.dealInfo.result}
                          </span>
                        </div>
                        {match.deal !== '0' && (
                          <p className="text-[10px] text-white/25 mt-1">
                            Score {match.score_a}-{match.score_b}
                            {match.deal_side === 'A'
                              ? ` + ${match.deal} ${match.team_a_name}`
                              : ` + ${match.deal} ${match.team_b_name}`}
                            {' '}→ After deal: {match.dealInfo.adjustedA}-{match.dealInfo.adjustedB}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {predictions.map((pred: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border p-3',
                        pred.result === 'win' && 'border-[#60E6F6]/14 bg-[#60E6F6]/[0.05]',
                        pred.result === 'lose' && 'border-[#F5A623]/14 bg-[#F5A623]/[0.05]',
                        !pred.result && 'border-white/6 bg-white/[0.02]',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{pred.avatar}</span>
                        <Link
                          to={`/user/${pred.user_id}`}
                          className="text-sm text-white hover:underline"
                        >
                          {pred.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/45">
                          <FlagImage
                            code={pred.pick === 'A' ? match.team_a_code : match.team_b_code}
                            size={40}
                            className="w-6 h-4 rounded-none object-cover inline-block"
                          />
                        </span>
                        {pred.result && (
                          <Badge
                            className={cn(
                              pred.result === 'win' &&
                                'border-[#60E6F6]/20 bg-[#60E6F6]/10 text-[#9DEFF9]',
                              pred.result === 'lose' &&
                                'border-[#F5A623]/20 bg-[#F5A623]/10 text-[#FFD890]',
                              pred.result === 'draw' && 'border-white/12 bg-white/8 text-white/60',
                            )}
                          >
                            {pred.result === 'win' ? '+1' : pred.result === 'lose' ? '-1' : '0'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="py-8 text-center text-sm text-white/45">
              No predictions yet for this match.
            </p>
          )}
        </div>
      </div>

      {showDealEditor && (
        <DealEditor
          match={match}
          onSave={handleSaveDeal}
          onClose={() => setShowDealEditor(false)}
        />
      )}
    </div>
  );
}
