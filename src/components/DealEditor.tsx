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

const DEAL_VALUES = ['+0', '+0.5', '+1', '+1.5', '+2', '-0.5', '-1', '-1.5', '-2']

export default function DealEditor({ match, onSave, onClose }: Props) {
  const [deal, setDeal] = useState(match.deal || '+0')
  const [dealSide, setDealSide] = useState<'A' | 'B'>(match.deal_side || 'A')

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
          <h3 className="font-display text-lg text-white">Sửa Deal</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {match.team_a_name} vs {match.team_b_name}
        </p>

        {/* Deal Value */}
        <label className="text-xs text-gray-500 mb-1.5 block">Giá trị Deal</label>
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {DEAL_VALUES.map(v => (
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
        </div>

        {/* Deal Side */}
        <label className="text-xs text-gray-500 mb-1.5 block">Đội nhận Deal</label>
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors',
              dealSide === 'A'
                ? 'bg-[#C8102E]/10 border-[#C8102E]/40 text-white'
                : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20',
            )}
            onClick={() => setDealSide('A')}
          >
            {match.team_a_name}
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors',
              dealSide === 'B'
                ? 'bg-[#C8102E]/10 border-[#C8102E]/40 text-white'
                : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20',
            )}
            onClick={() => setDealSide('B')}
          >
            {match.team_b_name}
          </button>
        </div>

        <Button
          className="w-full bg-[#C8102E] hover:bg-[#C8102E]/80"
          onClick={() => onSave(deal, dealSide)}
        >
          Lưu Deal
        </Button>
      </div>
    </div>
  )
}
