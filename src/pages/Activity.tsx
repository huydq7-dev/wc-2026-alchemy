import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Target, Edit3, RefreshCw, Flag } from 'lucide-react'
import { api } from '@/api/client'

const actionConfig: Record<string, { icon: any; label: string; color: string }> = {
  place_prediction: { icon: Target, label: 'Predicted', color: 'text-green-400' },
  change_prediction: { icon: Edit3, label: 'Changed Pick', color: 'text-yellow-400' },
  update_deal: { icon: Edit3, label: 'Edited Deal', color: 'text-orange-400' },
  update_result: { icon: Flag, label: 'Updated Result', color: 'text-[#C8102E]' },
  sync_matches: { icon: RefreshCw, label: 'Synced Data', color: 'text-blue-400' },
}

export default function Activity() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.getActivity(),
    refetchInterval: 30000,
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl text-white tracking-wider">
          Recent <span className="text-[#C8102E]">Activity</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track all predictions and changes in the group</p>
      </motion.div>

      {isLoading ? (
        <div className="text-gray-500 text-center py-20">Loading...</div>
      ) : !logs?.length ? (
        <div className="text-gray-500 text-center py-20">No activity yet</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any, i: number) => {
            const config = actionConfig[log.action] || { icon: Clock, label: log.action, color: 'text-gray-400' }
            const Icon = config.icon
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#141929] border border-white/5"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {log.user_name}
                    </span>
                    <span className={`text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
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
    </div>
  )
}
