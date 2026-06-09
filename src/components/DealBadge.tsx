import { cn } from '@/lib/utils'

interface Props {
  deal: string
  teamName: string
  otherTeamName?: string
  className?: string
}

export default function DealBadge({ deal, teamName, otherTeamName, className }: Props) {
  const value = parseFloat(deal)
  const isEven = value === 0 || deal === '+0' || deal === '0'

  if (isEven) {
    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-gray-400 border border-white/5', className)}>
        Even
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-display bg-green-500/10 text-green-400 border border-green-500/20">
        +{value}
      </span>
      <span className="text-[11px] text-gray-400">
        {teamName}
        {otherTeamName && <span className="text-gray-600"> vs {otherTeamName}</span>}
      </span>
    </div>
  )
}
