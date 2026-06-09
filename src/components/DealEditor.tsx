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
        className="bg-[#141929] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-white">Edit Handicap</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {match.team_a_name} vs {match.team_b_name}
        </p>

        {/* Which team receives the handicap */}
        <label className="text-xs text-gray-500 mb-1.5 block">
          Team receiving handicap (+ goals)
        </label>
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all',
              dealSide === 'A'
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20',
            )}
            onClick={() => setDealSide('A')}
          >
            {match.team_a_name}
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all',
              dealSide === 'B'
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20',
            )}
            onClick={() => setDealSide('B')}
          >
            {match.team_b_name}
          </button>
        </div>

        {/* Handicap value presets */}
        <label className="text-xs text-gray-500 mb-1.5 block">Handicap value</label>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {PRESETS.map(v => (
            <button
              key={v}
              type="button"
              className={cn(
                'py-2 rounded-lg text-sm font-bold font-display border transition-colors',
                deal === v
                  ? 'bg-[#C8102E] border-[#C8102E] text-white'
                  : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20',
              )}
              onClick={() => setDeal(v)}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            className={cn(
              'py-2 rounded-lg text-sm font-bold font-display border transition-colors',
              isCustomActive
                ? 'bg-[#C8102E] border-[#C8102E] text-white'
                : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20',
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
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#F5A623] focus:outline-none"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={applyCustom}
            className="border-white/10 text-gray-400 hover:text-white"
          >
            Apply
          </Button>
        </div>

        {/* Live preview */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 mb-4">
          <p className="text-xs text-gray-500 mb-1">Preview</p>
          <div className="flex items-center justify-between text-sm">
            <span className={dealSide === 'A' ? 'text-green-400 font-semibold' : 'text-gray-400'}>
              {match.team_a_name} {dealSide === 'A' ? `+${value}` : `-${value}`}
            </span>
            <span className="text-gray-600 text-xs">vs</span>
            <span className={dealSide === 'B' ? 'text-green-400 font-semibold' : 'text-gray-400'}>
              {match.team_b_name} {dealSide === 'B' ? `+${value}` : `-${value}`}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            {receiver} receives +{value} goals in final result
          </p>
        </div>

        <Button
          className="w-full bg-[#C8102E] hover:bg-[#C8102E]/80"
          onClick={() => onSave(deal, dealSide)}
        >
          Save Handicap
        </Button>
      </div>
    </div>
  )
}
