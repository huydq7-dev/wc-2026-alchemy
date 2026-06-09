import type { StandingRow } from '@/types'
import FlagImage from '@/components/FlagImage'
import { cn } from '@/lib/utils'

interface Props {
  group: string
  teams: StandingRow[]
}

export default function GroupTable({ group, teams }: Props) {
  return (
    <div className="app-panel overflow-hidden rounded-none">
      <div className="border-b border-[#17307C]/45 bg-[#0B1543]/62 px-4 py-3">
        <h3 className="font-display text-sm tracking-[0.24em] text-[#9DEFF9]">
          GROUP {group}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/6 text-white/36">
              <th className="text-left py-2 px-3 font-normal">Team</th>
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
                  i < 2 && 'bg-[#60E6F6]/[0.045]',
                )}
              >
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <FlagImage code={row.code} size={40} className="w-5 h-3.5 rounded-none object-cover" />
                    <span className="text-white text-xs truncate max-w-[80px] sm:max-w-[100px]">{row.team}</span>
                  </div>
                </td>
                <td className="text-center py-1.5 px-1 text-white/70 tabular-nums">{row.played}</td>
                <td className="text-center py-1.5 px-1 text-white/70 tabular-nums hidden sm:table-cell">{row.won}</td>
                <td className="text-center py-1.5 px-1 text-white/70 tabular-nums hidden sm:table-cell">{row.drawn}</td>
                <td className="text-center py-1.5 px-1 text-white/70 tabular-nums hidden sm:table-cell">{row.lost}</td>
                <td className="text-center py-1.5 px-1 text-white/70 tabular-nums hidden md:table-cell">{row.gf}</td>
                <td className="text-center py-1.5 px-1 text-white/70 tabular-nums hidden md:table-cell">{row.ga}</td>
                <td className={cn(
                  'text-center py-1.5 px-1 tabular-nums font-medium',
                  row.gd > 0 && 'text-[#60E6F6]',
                  row.gd < 0 && 'text-[#FFD890]',
                  row.gd === 0 && 'text-white/42',
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
