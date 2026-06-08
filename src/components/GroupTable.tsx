import type { StandingRow } from '@/types'
import { getFlagUrl } from '@/lib/flags'
import { cn } from '@/lib/utils'

interface Props {
  group: string
  teams: StandingRow[]
}

export default function GroupTable({ group, teams }: Props) {
  return (
    <div className="bg-[#141929] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <h3 className="font-display text-sm text-gray-400 tracking-widest">
          BẢNG {group}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-white/5">
              <th className="text-left py-1.5 px-3 font-normal">Đội</th>
              <th className="text-center py-1.5 px-1 font-normal w-7">P</th>
              <th className="text-center py-1.5 px-1 font-normal w-7 hidden sm:table-cell">W</th>
              <th className="text-center py-1.5 px-1 font-normal w-7 hidden sm:table-cell">D</th>
              <th className="text-center py-1.5 px-1 font-normal w-7 hidden sm:table-cell">L</th>
              <th className="text-center py-1.5 px-1 font-normal w-7 hidden md:table-cell">GF</th>
              <th className="text-center py-1.5 px-1 font-normal w-7 hidden md:table-cell">GA</th>
              <th className="text-center py-1.5 px-1 font-normal w-8">GD</th>
              <th className="text-center py-1.5 px-2 font-normal w-9 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((row, i) => (
              <tr
                key={row.code}
                className={cn(
                  'border-b border-white/5 last:border-0',
                  i < 2 && 'bg-white/[0.01]',
                )}
              >
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <img src={getFlagUrl(row.code, 40)} alt="" className="w-5 h-3.5 rounded-none object-cover" />
                    <span className="text-white text-xs truncate max-w-[80px] sm:max-w-[100px]">{row.team}</span>
                  </div>
                </td>
                <td className="text-center py-1.5 px-1 text-gray-300 tabular-nums">{row.played}</td>
                <td className="text-center py-1.5 px-1 text-gray-300 tabular-nums hidden sm:table-cell">{row.won}</td>
                <td className="text-center py-1.5 px-1 text-gray-300 tabular-nums hidden sm:table-cell">{row.drawn}</td>
                <td className="text-center py-1.5 px-1 text-gray-300 tabular-nums hidden sm:table-cell">{row.lost}</td>
                <td className="text-center py-1.5 px-1 text-gray-300 tabular-nums hidden md:table-cell">{row.gf}</td>
                <td className="text-center py-1.5 px-1 text-gray-300 tabular-nums hidden md:table-cell">{row.ga}</td>
                <td className={cn(
                  'text-center py-1.5 px-1 tabular-nums font-medium',
                  row.gd > 0 && 'text-green-400',
                  row.gd < 0 && 'text-red-400',
                  row.gd === 0 && 'text-gray-400',
                )}>
                  {row.gd > 0 ? '+' : ''}{row.gd}
                </td>
                <td className="text-center py-1.5 px-2 tabular-nums text-white font-bold">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
