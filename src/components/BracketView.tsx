import * as React from 'react';
import { Clock3, Trophy } from 'lucide-react';
import FlagImage from '@/components/FlagImage';
import { cn } from '@/lib/utils';
import type { BracketData, BracketMatch, BracketRound } from '@/types';

interface Props {
  data: BracketData;
}

const SIDE_ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final'] as const;

const WORLD_CUP_2026_EMBLEM =
  'https://png.pngtree.com/png-vector/20250923/ourmid/pngtree-the-fifa-world-cup-trophy-png-image_17551611.webp';

const COLUMN_WIDTH = 188;
const CONNECTOR_WIDTH = 36;
const CENTER_WIDTH = 196;
const LANE_HEIGHT = 84;
const CARD_HEIGHT = 68;
const ROUND_LABEL_HEIGHT = 20;
const TRACK_TOP_GAP = 8;
const CONNECTOR_CENTER_OFFSET = 4;

export default function BracketView({ data }: Props) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const dragStateRef = React.useRef({
    pointerId: null as number | null,
    startX: 0,
    startScrollLeft: 0,
    dragging: false,
  });

  if (!data.rounds || data.rounds.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">No knockout data yet.</p>;
  }

  const roundsByName = new Map(data.rounds.map((round) => [round.name, round]));
  const sideRounds = SIDE_ROUND_ORDER.map((name) => roundsByName.get(name)).filter(
    (round): round is BracketRound => Boolean(round),
  );

  const leftRounds = sideRounds
    .map((round) => ({
      ...round,
      matches: round.matches.slice(0, Math.ceil(round.matches.length / 2)),
    }))
    .filter((round) => round.matches.length > 0);

  const rightRounds = sideRounds
    .map((round) => ({
      ...round,
      matches: round.matches.slice(Math.ceil(round.matches.length / 2)),
    }))
    .filter((round) => round.matches.length > 0);

  const finalMatch = roundsByName.get('Final')?.matches[0] ?? null;
  const thirdPlaceMatch = roundsByName.get('Third Place')?.matches[0] ?? null;
  const bracketLaneCount = Math.max(
    leftRounds[0]?.matches.length ?? rightRounds[0]?.matches.length ?? 1,
    1,
  );
  const bracketTrackHeight = bracketLaneCount * LANE_HEIGHT;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollerRef.current;
    if (!container) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      dragging: true,
    };

    container.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollerRef.current;
    const dragState = dragStateRef.current;
    if (!container || !dragState.dragging) return;

    const deltaX = event.clientX - dragState.startX;
    container.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const endDrag = (event?: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollerRef.current;
    const pointerId = dragStateRef.current.pointerId;

    if (container && pointerId != null && event) {
      try {
        container.releasePointerCapture(pointerId);
      } catch {
        // no-op
      }
    }

    dragStateRef.current.dragging = false;
    dragStateRef.current.pointerId = null;
  };

  return (
    <section className="overflow-hidden border border-[#1A2A66] bg-[#07103A]">
      <div className="border-b border-[#17307C] px-4 py-4 sm:px-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Knockout Stage</p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-[0.18em] text-white sm:text-3xl">
              Road To The Final
            </h2>
            <p className="mt-1.5 text-sm text-white/50">
              FIFA-style bracket view with horizontal drag.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/70">
            Drag to explore
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="bg-[radial-gradient(circle_at_top,_rgba(25,188,255,0.10),_transparent_22%),linear-gradient(180deg,#08113E_0%,#09133F_100%)] px-5 py-6">
          <div className="mx-auto flex w-max min-w-max items-start gap-6">
            <BracketSide side="left" rounds={leftRounds} />
            <CenterColumn
              finalMatch={finalMatch}
              thirdPlaceMatch={thirdPlaceMatch}
              bracketTrackHeight={bracketTrackHeight}
            />
            <BracketSide side="right" rounds={rightRounds} />
          </div>
        </div>
      </div>
    </section>
  );
}

function BracketSide({ side, rounds }: { side: 'left' | 'right'; rounds: BracketRound[] }) {
  const firstRoundCount = rounds[0]?.matches.length ?? 0;
  const trackHeight = Math.max(firstRoundCount, 1) * LANE_HEIGHT;

  return (
    <div className="shrink-0">
      <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.24em] text-white/38">
        {side === 'left' ? 'Left Bracket' : 'Right Bracket'}
      </div>

      <div className={cn('flex items-start', side === 'right' && 'flex-row-reverse')}>
        {rounds.map((round, index) => {
          const nextRound = rounds[index + 1];
          return (
            <div key={`${side}-${round.name}`} className="flex items-start">
              {side === 'right' && nextRound && (
                <div
                  className="flex items-start"
                  style={{
                    width: CONNECTOR_WIDTH,
                    paddingTop: ROUND_LABEL_HEIGHT + TRACK_TOP_GAP,
                    height: trackHeight + ROUND_LABEL_HEIGHT + TRACK_TOP_GAP,
                  }}
                >
                  <Connector toCount={nextRound.matches.length} totalCount={firstRoundCount} flip />
                </div>
              )}

              <RoundColumn
                round={round}
                align={side === 'left' ? 'left' : 'right'}
                side={side}
                firstRoundCount={firstRoundCount}
                trackHeight={trackHeight}
              />

              {side === 'left' && nextRound && (
                <div
                  className="flex items-start"
                  style={{
                    width: CONNECTOR_WIDTH,
                    paddingTop: ROUND_LABEL_HEIGHT + TRACK_TOP_GAP,
                    height: trackHeight + ROUND_LABEL_HEIGHT + TRACK_TOP_GAP,
                  }}
                >
                  <Connector toCount={nextRound.matches.length} totalCount={firstRoundCount} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoundColumn({
  round,
  align,
  side,
  firstRoundCount,
  trackHeight,
}: {
  round: BracketRound;
  align: 'left' | 'right';
  side: 'left' | 'right';
  firstRoundCount: number;
  trackHeight: number;
}) {
  const groupSize = firstRoundCount / round.matches.length;

  return (
    <div
      className="relative"
      style={{
        width: COLUMN_WIDTH,
        height: trackHeight + ROUND_LABEL_HEIGHT + TRACK_TOP_GAP,
      }}
    >
      <div
        className={cn(
          'flex h-5 items-center px-1 text-[10px] uppercase tracking-[0.24em]',
          side === 'left' ? 'text-white/40' : 'text-cyan-300/75',
          align === 'right' && 'justify-end text-right',
        )}
        style={{ height: ROUND_LABEL_HEIGHT }}
      >
        <span>{roundLabel(round.name)}</span>
      </div>
      <div
        className="relative"
        style={{
          marginTop: TRACK_TOP_GAP,
          height: trackHeight,
        }}
      >
        {round.matches.map((match, index) => {
          const centerY = (index * groupSize + groupSize / 2) * LANE_HEIGHT;
          const top = centerY - CARD_HEIGHT / 2;

          return (
            <div
              key={match.id}
              className="absolute left-0 right-0"
              style={{ top, height: CARD_HEIGHT }}
            >
              <MatchCard match={match} side={side} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchCard({ match, side }: { match: BracketMatch; side: 'left' | 'right' }) {
  const hasScore = match.score_a != null && match.score_b != null;
  const teamAWon = hasScore && match.score_a! > match.score_b!;
  const teamBWon = hasScore && match.score_b! > match.score_a!;
  const cardTone =
    side === 'left'
      ? 'border-[#9FAEB6] bg-[#B6C0C4] text-[#09112B]'
      : 'border-[#14B9E6] bg-[#1BB7DF] text-[#041633]';

  return (
    <article className={cn('h-full border shadow-[0_0_0_1px_rgba(255,255,255,0.02)]', cardTone)}>
      <TeamLine team={match.team_a} score={match.score_a} isWinner={teamAWon} side={side} />
      <div className="h-px bg-black/10" />
      <TeamLine team={match.team_b} score={match.score_b} isWinner={teamBWon} side={side} />
      <div className="flex items-center justify-between border-t border-black/10 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-black/55">
        <span>
          {match.status === 'finished' ? 'Finished' : match.status === 'live' ? 'Live' : 'Upcoming'}
        </span>
        <span className="flex items-center gap-1">
          <Clock3 className="h-2.5 w-2.5" />
          {match.time || '--:--'}
        </span>
      </div>
    </article>
  );
}

function TeamLine({
  team,
  score,
  isWinner,
  side,
}: {
  team: BracketMatch['team_a'];
  score: number | null;
  isWinner: boolean;
  side: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-2',
        isWinner && (side === 'left' ? 'bg-white/30' : 'bg-white/18'),
      )}
    >
      <FlagImage code={team.code} size={48} alt={team.name} className="h-4 w-6 object-cover" />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[12px] font-medium uppercase',
          isWinner && 'font-semibold',
        )}
      >
        {slotLabel(team.name)}
      </span>
      <span className="text-[12px] font-semibold tabular-nums">{score ?? '-'}</span>
    </div>
  );
}

function CenterColumn({
  finalMatch,
  thirdPlaceMatch,
  bracketTrackHeight,
}: {
  finalMatch: BracketMatch | null;
  thirdPlaceMatch: BracketMatch | null;
  bracketTrackHeight: number;
}) {
  return (
    <div
      className="shrink-0 flex flex-col justify-center gap-4"
      style={{
        width: CENTER_WIDTH,
        minHeight: bracketTrackHeight + ROUND_LABEL_HEIGHT + TRACK_TOP_GAP,
      }}
    >
      <div className="text-center">
        <p className="text-[10px] tracking-[0.32em] text-white/82">ROAD TO</p>
        <div className="mt-2.5 flex justify-center">
          <img
            src={WORLD_CUP_2026_EMBLEM}
            alt="2026 FIFA World Cup emblem"
            className="h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="border border-[#2A3F84] bg-[#111A48] p-3 text-white">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">Final</span>
          <Trophy className="h-3.5 w-3.5 text-[#F5A623]" />
        </div>
        {finalMatch ? (
          <FinalCard match={finalMatch} />
        ) : (
          <div className="border border-dashed border-white/15 px-3 py-5 text-center text-xs text-white/45">
            Awaiting finalists
          </div>
        )}
      </div>

      {thirdPlaceMatch && (
        <div className="border border-[#233772] bg-[#0D163F] p-3 text-white">
          <div className="mb-2.5 text-[10px] uppercase tracking-[0.22em] text-white/45">
            Third Place
          </div>
          <FinalCard match={thirdPlaceMatch} compact />
        </div>
      )}
    </div>
  );
}

function FinalCard({ match, compact = false }: { match: BracketMatch; compact?: boolean }) {
  return (
    <div className={cn('space-y-1.5', compact && 'space-y-1')}>
      <CenterTeam team={match.team_a} score={match.score_a} />
      <CenterTeam team={match.team_b} score={match.score_b} />
      <div className="pt-1 text-center text-[9px] uppercase tracking-[0.14em] text-white/45">
        {match.date} {match.time}
      </div>
    </div>
  );
}

function CenterTeam({ team, score }: { team: BracketMatch['team_a']; score: number | null }) {
  return (
    <div className="flex items-center gap-2 border border-[#30437F] bg-[#0A1235] px-2 py-2">
      <FlagImage code={team.code} size={56} alt={team.name} className="h-4 w-6.5 object-cover" />
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white uppercase">
        {slotLabel(team.name)}
      </span>
      <span className="text-[12px] font-semibold tabular-nums text-white">{score ?? '-'}</span>
    </div>
  );
}

function Connector({
  toCount,
  totalCount,
  flip = false,
}: {
  toCount: number;
  totalCount: number;
  flip?: boolean;
}) {
  const height = Math.max(totalCount, 1) * LANE_HEIGHT;

  return (
    <svg
      className={cn('h-full w-full overflow-visible', flip && '-scale-x-100')}
      preserveAspectRatio="none"
      viewBox={`0 0 ${CONNECTOR_WIDTH} ${height}`}
    >
      {Array.from({ length: toCount }).map((_, index) => {
        const groupSize = totalCount / toCount;
        const startIndex = index * groupSize;
        const endIndex = startIndex + groupSize - 1;
        const y1 = (startIndex + 0.5) * LANE_HEIGHT + CONNECTOR_CENTER_OFFSET;
        const y2 = (endIndex + 0.5) * LANE_HEIGHT + CONNECTOR_CENTER_OFFSET;
        const midY = (y1 + y2) / 2;

        return (
          <g key={`${totalCount}-${toCount}-${index}`}>
            <line x1={0} y1={y1} x2={16} y2={y1} stroke="#60E6F6" strokeWidth={1.6} />
            <line x1={0} y1={y2} x2={16} y2={y2} stroke="#60E6F6" strokeWidth={1.6} />
            <line x1={16} y1={y1} x2={16} y2={y2} stroke="#60E6F6" strokeWidth={1.6} />
            <line
              x1={16}
              y1={midY}
              x2={CONNECTOR_WIDTH}
              y2={midY}
              stroke="#60E6F6"
              strokeWidth={1.6}
            />
          </g>
        );
      })}
    </svg>
  );
}

function roundLabel(name: string): string {
  const map: Record<string, string> = {
    'Round of 32': 'R32',
    'Round of 16': 'R16',
    'Quarter-final': 'QF',
    'Semi-final': 'SF',
    Final: 'Final',
  };

  return map[name] || name;
}

function isSlotCode(name: string): boolean {
  return /^[WRL]\d+$/.test(name) || /^\d[A-Z]$/.test(name);
}

function slotLabel(name: string): string {
  if (/^\d[A-Z]$/.test(name)) return `Runner-up ${name[1]}`;
  if (/^W\d+$/.test(name)) return `Winner Match ${name.slice(1)}`;
  if (/^L\d+$/.test(name)) return `Loser Match ${name.slice(1)}`;
  if (/^R\d+$/.test(name)) return `Runner-up ${name.slice(1)}`;
  if (isSlotCode(name)) return name;
  return name;
}
