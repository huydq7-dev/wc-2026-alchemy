import { cn } from '@/lib/utils'
import FlagImage from '@/components/FlagImage'
import type { BracketData, BracketMatch } from '@/types'

interface Props {
  data: BracketData
}

export default function BracketView({ data }: Props) {
  if (!data.rounds || data.rounds.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">No knockout data yet.</p>
  }

  const allRounds = data.rounds

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-0 min-w-max">
        {allRounds.map((round, ri) => (
          <div key={round.name} className="flex items-stretch">
            {/* Match column */}
            <div className={cn(
              'flex flex-col justify-around py-4',
              round.matches.length <= 2 ? 'w-52' : round.matches.length <= 4 ? 'w-44' : 'w-40',
            )}>
              {/* Round header */}
              <div className="text-center mb-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  {roundLabel(round.name)}
                </span>
              </div>
              {round.matches.map((match) => (
                <BracketSlot key={match.id} match={match} />
              ))}
            </div>
            {/* Connector column (between rounds) */}
            {ri < allRounds.length - 1 && (
              <div className="w-6 flex-shrink-0 flex items-center">
                <ConnectorLines matchCount={round.matches.length} nextCount={allRounds[ri + 1].matches.length} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketSlot({ match }: { match: BracketMatch }) {
  const hasScore = match.score_a != null && match.score_b != null
  const teamAWon = hasScore && match.score_a! > match.score_b!
  const teamBWon = hasScore && match.score_b! > match.score_a!

  return (
    <div className={cn(
      'rounded-lg border p-2 mx-1 my-1',
      match.status === 'finished' ? 'border-white/5 bg-white/[0.01]' : 'border-white/5 hover:border-white/10',
    )}>
      <div className={cn(
        'flex items-center justify-between gap-1 text-xs py-0.5 px-1 rounded',
        teamAWon && 'bg-green-500/10 text-white',
      )}>
        <FlagImage code={match.team_a.code} size={40} className="w-4 h-3 rounded-sm object-cover" />
        <span className="truncate flex-1 text-xs">{isSlotCode(match.team_a.name) ? slotLabel(match.team_a.name) : match.team_a.name}</span>
        {hasScore && <span className="tabular-nums font-bold text-white">{match.score_a}</span>}
      </div>
      <div className={cn(
        'flex items-center justify-between gap-1 text-xs py-0.5 px-1 rounded mt-0.5',
        teamBWon && 'bg-green-500/10 text-white',
      )}>
        <FlagImage code={match.team_b.code} size={40} className="w-4 h-3 rounded-sm object-cover" />
        <span className="truncate flex-1 text-xs">{isSlotCode(match.team_b.name) ? slotLabel(match.team_b.name) : match.team_b.name}</span>
        {hasScore && <span className="tabular-nums font-bold text-white">{match.score_b}</span>}
      </div>
      {match.status === 'finished' && !hasScore && (
        <div className="text-[10px] text-gray-500 text-center mt-1">FT</div>
      )}
      {match.date && !hasScore && (
        <div className="text-[10px] text-gray-600 text-center mt-1">{match.date} {match.time}</div>
      )}
    </div>
  )
}

function ConnectorLines({ matchCount, nextCount }: { matchCount: number; nextCount: number }) {
  return (
    <svg className="w-full h-full min-h-[200px]" preserveAspectRatio="none" viewBox={`0 0 24 ${matchCount * 60}`}>
      {Array.from({ length: nextCount }).map((_, i) => {
        const topIdx = i * (matchCount / nextCount)
        const bottomIdx = topIdx + (matchCount / nextCount) - 1
        const y1 = (topIdx + 0.5) * (60)
        const y2 = (bottomIdx + 0.5) * (60)
        const midY = (y1 + y2) / 2
        return (
          <g key={i}>
            <line x1={0} y1={y1} x2={12} y2={y1} stroke="#1e293b" strokeWidth={1} />
            <line x1={0} y1={y2} x2={12} y2={y2} stroke="#1e293b" strokeWidth={1} />
            <line x1={12} y1={y1} x2={12} y2={y2} stroke="#1e293b" strokeWidth={1} />
            <line x1={12} y1={midY} x2={24} y2={midY} stroke="#1e293b" strokeWidth={1} />
          </g>
        );
      })}
    </svg>
  )
}

function roundLabel(name: string): string {
  const map: Record<string, string> = {
    'Round of 32': 'Round of 32',
    'Round of 16': 'Round of 16',
    'Quarter-final': 'Quarter-finals',
    'Semi-final': 'Semi-finals',
    'Third Place': 'Third Place',
    'Final': 'Final',
  }
  return map[name] || name
}

function isSlotCode(name: string): boolean {
  return /^[WRL]\d+$/.test(name) || /^\d[A-Z]$/.test(name)
}

function slotLabel(name: string): string {
  if (/^\d[A-Z]$/.test(name)) return `2nd ${name[1]}`
  if (/^W\d+$/.test(name)) return `Winner ${name.slice(1)}`
  if (/^L\d+$/.test(name)) return `Loser ${name.slice(1)}`
  if (/^R\d+$/.test(name)) return `2nd ${name.slice(1)}`
  return name
}
