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
      <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-gray-400 border border-white/5', className)}>
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
        'px-2 py-0.5 rounded-full text-[11px] font-bold font-display border',
        teamAGets ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20',
      )}>
        {labelA}
      </span>
      <span className="text-[11px] text-gray-400">
        {teamAName}
        <span className="text-gray-600"> vs {teamBName}</span>
      </span>
    </div>
  )
}
