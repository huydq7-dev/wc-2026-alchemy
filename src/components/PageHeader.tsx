import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  icon?: ReactNode
  description?: string
  actions?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  icon,
  description,
  actions,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div>
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="font-display text-3xl tracking-[0.12em] text-white sm:text-4xl">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
            {description}
          </p>
        )}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
