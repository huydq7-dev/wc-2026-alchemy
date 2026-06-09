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
        <p className="text-sm text-white/45">{label || 'Match'}</p>
        <p className="font-display text-2xl tracking-[0.2em] text-[#F87171]">LIVE</p>
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
      {label && <p className="mb-3 text-sm text-white/45">{label}</p>}
      <div className="flex gap-2 md:gap-3">
        {blocks.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="app-panel min-w-[56px] rounded-2xl px-3 py-2 text-center">
              <span className="font-display text-2xl tabular-nums text-white md:text-3xl">
                {String(value).padStart(2, '0')}
              </span>
            </div>
            <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/35">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
