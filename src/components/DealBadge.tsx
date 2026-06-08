import { cn } from '@/lib/utils'

interface Props {
  deal: string
  dealSide: 'A' | 'B'
  teamName: string
  className?: string
}

export default function DealBadge({ deal, dealSide, teamName, className }: Props) {
  const isNegative = deal.startsWith('-')
  const isPositive = deal.startsWith('+')
  const isEven = deal === '0'

  return (
    <div className={cn('flex flex-col items-center gap-0.5', className)}>
      <span className={cn(
        'px-3 py-1 rounded-full text-sm font-bold font-display tracking-wider',
        isNegative && 'bg-red-500/10 text-red-400 border border-red-500/20',
        isPositive && 'bg-green-500/10 text-green-400 border border-green-500/20',
        isEven && 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
      )}>
        {deal}
      </span>
      <span className="text-[10px] text-gray-500">
        {dealSide === 'A' ? teamName : teamName}
      </span>
    </div>
  )
}
