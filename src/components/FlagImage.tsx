import { useState } from 'react'
import { getFlagUrl } from '@/lib/flags'

interface Props {
  code: string
  size?: number
  className?: string
  alt?: string
}

export default function FlagImage({ code, size = 80, className, alt = '' }: Props) {
  const [imgError, setImgError] = useState(false)
  const isTBD = !code || code === 'TBD'

  if (isTBD || imgError) {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1a1f2e', fontSize: size > 40 ? '1.2rem' : '0.7rem' }}
      >
        🏳️
      </span>
    )
  }

  return (
    <img
      src={getFlagUrl(code, size)}
      alt={alt}
      className={className}
      onError={() => setImgError(true)}
    />
  )
}
