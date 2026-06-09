import { cn } from '@/lib/utils'

interface Props {
  deal: string
  dealSide: 'A' | 'B'
  teamAName: string
  teamBName: string
  className?: string
}

export default function DealBadge({ deal, dealSide, teamAName, teamBName, className }: Props) {
  const value = parseFloat(deal)
  const isEven = value === 0 || deal === '+0' || deal === '0'

  if (isEven) {
    return (
      <span className={cn('rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/48', className)}>
        Even
      </span>
    )
  }

  // Always show from Team A's perspective
  const teamAGets = dealSide === 'A'
  const labelA = teamAGets ? `+${value}` : `-${value}`

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn(
        'rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]',
        teamAGets ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400',
      )}>
        {labelA}
      </span>
      <span className="text-[11px] text-white/46">
        {teamAName}
        <span className="text-white/24"> vs {teamBName}</span>
      </span>
    </div>
  )
}
