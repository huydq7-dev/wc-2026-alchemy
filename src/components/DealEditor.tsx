import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Match } from '@/types'

interface Props {
  match: Match
  onSave: (deal: string, dealSide: 'A' | 'B') => void
  onClose: () => void
}

const PRESETS = ['0', '+0.5', '+1', '+1.5', '+2', '+2.5', '+3']

export default function DealEditor({ match, onSave, onClose }: Props) {
  const [deal, setDeal] = useState(match.deal || '+0')
  const [dealSide, setDealSide] = useState<'A' | 'B'>(match.deal_side || 'A')
  const [custom, setCustom] = useState('')

  const applyCustom = () => {
    const num = parseFloat(custom)
    if (!isNaN(num)) {
      setDeal(num >= 0 ? `+${num}` : `${num}`)
      setCustom('')
    }
  }

  const isCustomActive = !PRESETS.includes(deal)

  const receiver = dealSide === 'A' ? match.team_a_name : match.team_b_name
  const value = parseFloat(deal)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="app-panel w-full max-w-sm rounded-none p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg tracking-[0.12em] text-white">Edit Handicap</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/45 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="mb-4 text-sm text-white/55">
          {match.team_a_name} vs {match.team_b_name}
        </p>

        {/* Which team receives the handicap */}
        <label className="mb-1.5 block text-[10px] uppercase tracking-[0.24em] text-white/40">
          Team receiving handicap (+ goals)
        </label>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-2xl border py-2.5 text-sm font-medium transition-all',
              dealSide === 'A'
                ? 'border-white/20 bg-white/12 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20',
            )}
            onClick={() => setDealSide('A')}
          >
            {match.team_a_name}
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-2xl border py-2.5 text-sm font-medium transition-all',
              dealSide === 'B'
                ? 'border-white/20 bg-white/12 text-white'
                : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20',
            )}
            onClick={() => setDealSide('B')}
          >
            {match.team_b_name}
          </button>
        </div>

        {/* Handicap value presets */}
        <label className="mb-1.5 block text-[10px] uppercase tracking-[0.24em] text-white/40">Handicap value</label>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {PRESETS.map(v => (
            <button
              key={v}
              type="button"
              className={cn(
                'rounded-2xl border py-2 text-sm font-bold font-display transition-colors',
                deal === v
                  ? 'border-white/20 bg-white text-slate-950'
                  : 'bg-white/[0.03] border-white/10 text-white/55 hover:border-white/20',
              )}
              onClick={() => setDeal(v)}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            className={cn(
              'rounded-2xl border py-2 text-sm font-bold font-display transition-colors',
              isCustomActive
                ? 'border-white/20 bg-white text-slate-950'
                : 'bg-white/[0.03] border-white/10 text-white/55 hover:border-white/20',
            )}
            onClick={() => {
              const num = parseFloat(custom)
              if (!isNaN(num)) setDeal(num >= 0 ? `+${num}` : `${num}`)
            }}
          >
            {isCustomActive ? deal : '...'}
          </button>
        </div>

        {/* Custom input */}
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            step="0.25"
            placeholder="Custom value..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyCustom() }}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/28 focus:border-white/20 focus:outline-none"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={applyCustom}
            className="border-white/10 text-white/60 hover:text-white"
          >
            Apply
          </Button>
        </div>

        <div className="app-panel-muted mb-4 rounded-2xl p-3">
          <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-white/40">Preview</p>
          <div className="flex items-center justify-between text-sm">
            <span className={dealSide === 'A' ? 'font-semibold text-white' : 'text-white/45'}>
              {match.team_a_name} {dealSide === 'A' ? `+${value}` : `-${value}`}
            </span>
            <span className="text-xs text-white/25">vs</span>
            <span className={dealSide === 'B' ? 'font-semibold text-white' : 'text-white/45'}>
              {match.team_b_name} {dealSide === 'B' ? `+${value}` : `-${value}`}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-white/38">
            {receiver} receives +{value} goals in final result
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => onSave(deal, dealSide)}
        >
          Save Handicap
        </Button>
      </div>
    </div>
  )
}
