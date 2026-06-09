import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Target, Edit3, RefreshCw, Flag, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/api/client'

const ACTIONS = [
  { key: '', label: 'All', icon: Clock, color: 'text-gray-400' },
  { key: 'place_prediction', label: 'Predicted', icon: Target, color: 'text-green-400' },
  { key: 'change_prediction', label: 'Changed', icon: Edit3, color: 'text-yellow-400' },
  { key: 'update_deal', label: 'Deal', icon: Edit3, color: 'text-orange-400' },
  { key: 'update_result', label: 'Result', icon: Flag, color: 'text-[#C8102E]' },
  { key: 'sync_matches', label: 'Sync', icon: RefreshCw, color: 'text-blue-400' },
  { key: 'sync_odds', label: 'Odds', icon: RefreshCw, color: 'text-purple-400' },
  { key: 'auto_loss', label: 'Auto-Loss', icon: AlertCircle, color: 'text-red-400' },
]

const LIMIT = 15

export default function Activity() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, filter],
    queryFn: () => api.getActivity({ page, limit: LIMIT, action: filter || undefined }),
    refetchInterval: 30000,
  })

  const logs = data?.logs || []
  const totalPages = data?.totalPages || 1

  const parseDetails = (details: any) => {
    if (!details) return null
    return typeof details === 'string' ? JSON.parse(details) : details
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl text-white tracking-wider">
          Recent <span className="text-[#C8102E]">Activity</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track all predictions and changes in the group</p>
      </motion.div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map(({ key, label, icon: Icon, color }) => {
          const active = filter === key
          return (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1) }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                active
                  ? 'bg-[#C8102E]/20 border border-[#C8102E]/40 text-white'
                  : 'bg-[#141929] border border-white/5 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className={`w-3 h-3 ${active ? color : ''}`} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Log List */}
      {isLoading ? (
        <div className="text-gray-500 text-center py-20">Loading...</div>
      ) : !logs.length ? (
        <div className="text-gray-500 text-center py-20">No activity yet</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any, i: number) => {
            const action = ACTIONS.find(a => a.key === log.action)
            const Icon = action?.icon || Clock
            const color = action?.color || 'text-gray-400'
            const label = action?.label || log.action
            const details = parseDetails(log.details)

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#141929] border border-white/5"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{log.user_name}</span>
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {details?.match || details?.matchId || ''}
                    {details?.team && ` → ${details.team}`}
                    {details?.status && ` (${details.status})`}
                    {details?.score_a != null && ` ${details.score_a}-${details.score_b}`}
                  </p>
                </div>

                <span className="text-[10px] text-gray-600 shrink-0">
                  {log.created_at?.slice(5, 16)?.replace(' ', ' ')}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
