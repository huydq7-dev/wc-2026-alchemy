import { useCountdown } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'

interface Props {
  date: string
  time: string
  label?: string
  className?: string
}

export default function CountdownTimer({ date, time, label, className }: Props) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(date, time)

  if (isExpired) {
    return (
      <div className={cn('text-center', className)}>
        <p className="text-gray-400 text-sm">{label || 'Match'}</p>
        <p className="font-display text-2xl text-[#C8102E]">LIVE</p>
      </div>
    )
  }

  const blocks = [
    { value: days, label: 'NGÀY' },
    { value: hours, label: 'GIỜ' },
    { value: minutes, label: 'PHÚT' },
    { value: seconds, label: 'GIÂY' },
  ]

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {label && <p className="text-gray-400 text-sm mb-2">{label}</p>}
      <div className="flex gap-2 md:gap-3">
        {blocks.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="bg-[#141929] border border-white/10 rounded-lg px-3 py-2 min-w-[56px] text-center">
              <span className="font-display text-2xl md:text-3xl text-white tabular-nums">
                {String(value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
