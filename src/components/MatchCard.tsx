import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ChevronRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LiveBadge from './LiveBadge'
import DealBadge from './DealBadge'
import DealEditor from './DealEditor'
import { useGameStore } from '@/store/useGameStore'
import { usePlacePrediction } from '@/hooks/usePredictions'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { getFlagUrl } from '@/lib/flags'
import { cn } from '@/lib/utils'
import type { Match } from '@/types'

interface Props {
  match: Match
  userPick?: 'A' | 'B' | null
  showPickButtons?: boolean
}

export default function MatchCard({ match, userPick, showPickButtons = true }: Readonly<Props>) {
  const currentUserId = useGameStore(s => s.currentUser?.id || '')
  const placePrediction = usePlacePrediction()
  const queryClient = useQueryClient()
  const isPicked = !!userPick
  const [showDealEditor, setShowDealEditor] = useState(false)

  const handleSaveDeal = async (deal: string, dealSide: 'A' | 'B') => {
    await api.updateMatch(match.id, { deal, deal_side: dealSide })
    await queryClient.invalidateQueries({queryKey: ['matches']})
    setShowDealEditor(false)
  }

  const isUpcoming = match.status === 'upcoming'
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  const handlePick = (pick: 'A' | 'B') => {
    if (!isUpcoming) return
    placePrediction.mutate({ userId: currentUserId, matchId: match.id, pick })
  }

  const scoreDisplay = match.score_a !== null && match.score_b !== null
    ? `${match.score_a} - ${match.score_b}`
    : match.time

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-xl border bg-[#141929] p-4 transition-all',
        isLive && 'border-[#C8102E]/40 shadow-lg shadow-[#C8102E]/5',
        isFinished && 'border-white/5 opacity-80',
        isUpcoming && 'border-white/10 hover:border-white/20',
        isPicked && 'ring-1 ring-[#F5A623]/30'
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        {isLive && <LiveBadge />}
        {isFinished && (
          <Badge variant="secondary" className="text-[10px] bg-white/5 text-gray-400">
            FT
          </Badge>
        )}
        {isUpcoming && (
          <Badge variant="secondary" className="text-[10px] bg-white/5 text-gray-400">
            {match.date} {match.time}
          </Badge>
        )}
      </div>

      {/* Stage */}
      <p className="text-[11px] text-gray-500 mb-3 flex items-center">{match.stage}  - {match.venue && <span className="inline-flex items-center gap-1 ml-1">{match.venue}</span>}</p>

      {/* Teams & Score */}
      <Link to={`/match/${match.id}`} className="block">
        <div className="flex items-center justify-between gap-3">
          {/* Team A */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <img src={getFlagUrl(match.team_a_code, 160)} alt={match.team_a_name} className="w-10 h-7 rounded-sm object-cover shadow-sm" />
            <span className="text-sm font-semibold text-white text-center truncate w-full">
              {match.team_a_name}
            </span>
          </div>

          {/* Center: Deal + Score */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1">
              <DealBadge
                deal={match.deal}
                dealSide={match.deal_side}
                teamName={match.deal_side === 'A' ? match.team_a_name : match.team_b_name}
              />
              {isUpcoming && (
                <button
                  onClick={(e) => { e.preventDefault(); setShowDealEditor(true) }}
                  className="text-gray-600 hover:text-[#F5A623] transition-colors"
                  title="Sửa deal"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className={cn(
              'font-display text-2xl tracking-wider',
              isFinished || isLive ? 'text-white' : 'text-gray-400'
            )}>
              {scoreDisplay}
            </span>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <img src={getFlagUrl(match.team_b_code, 160)} alt={match.team_b_name} className="w-10 h-7 rounded-sm object-cover shadow-sm" />
            <span className="text-sm font-semibold text-white text-center truncate w-full">
              {match.team_b_name}
            </span>
          </div>
        </div>

        {/* View details link */}
        <div className="flex justify-center mt-3">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#C8102E] transition-colors">
            <Clock className="w-3 h-3" />
            Chi tiết
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </Link>

      {/* Pick Buttons */}
      {showPickButtons && isUpcoming && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex gap-2">
            <Button
              variant={userPick === 'A' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 text-xs font-semibold',
                userPick === 'A' && 'bg-[#C8102E] hover:bg-[#C8102E]/80',
                userPick !== 'A' && 'border-white/10 text-gray-400 hover:text-white'
              )}
              disabled={placePrediction.isPending}
              onClick={() => handlePick('A')}
            >
              <img src={getFlagUrl(match.team_a_code, 40)} alt="" className="w-4 h-3 rounded-sm inline-block" /> {match.team_a_name}
              {userPick === 'A' && ' ✓'}
            </Button>
            <Button
              variant={userPick === 'B' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 text-xs font-semibold',
                userPick === 'B' && 'bg-[#C8102E] hover:bg-[#C8102E]/80',
                userPick !== 'B' && 'border-white/10 text-gray-400 hover:text-white'
              )}
              disabled={placePrediction.isPending}
              onClick={() => handlePick('B')}
            >
              <img src={getFlagUrl(match.team_b_code, 40)} alt="" className="w-4 h-3 rounded-sm inline-block" /> {match.team_b_name}
              {userPick === 'B' && ' ✓'}
            </Button>
          </div>
        </div>
      )}

      {/* Finished: show pick result */}
      {isFinished && userPick && (
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/5">
          <span className="text-xs text-gray-500 flex items-center gap-1 justify-center">
            Bạn chọn{' '}
            <img
              src={getFlagUrl(userPick === 'A' ? match.team_a_code : match.team_b_code, 40)}
              alt=""
              className="w-4 h-3 rounded-sm inline-block"
            />
          </span>
        </div>
      )}

      {/* Deal Editor Modal */}
      {showDealEditor && (
        <DealEditor
          match={match}
          onSave={handleSaveDeal}
          onClose={() => setShowDealEditor(false)}
        />
      )}
    </motion.div>
  )
}
