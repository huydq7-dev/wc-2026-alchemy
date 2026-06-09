import { useState } from 'react'
import { Trophy, LayoutGrid } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/api/client'
import GroupTable from '@/components/GroupTable'
import BracketView from '@/components/BracketView'
import type { StandingsData, BracketData } from '@/types'

type Tab = 'groups' | 'bracket'

export default function Standings() {
  const [tab, setTab] = useState<Tab>('groups')
  const { data: standings, isLoading: standingsLoading } = useQuery<StandingsData>({
    queryKey: ['standings'],
    queryFn: () => api.getStandings(),
  })
  const { data: bracket, isLoading: bracketLoading } = useQuery<BracketData>({
    queryKey: ['bracket'],
    queryFn: () => api.getBracket(),
  })

  const groupKeys = standings?.groups ? Object.keys(standings.groups).sort() : []

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-white tracking-wider flex items-center gap-2">
        <Trophy className="w-7 h-7 text-[#F5A623]" />Standings & Bracket
      </h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="bg-[#141929] border border-white/5">
          <TabsTrigger value="groups"><LayoutGrid className="w-3.5 h-3.5 mr-1.5" />Groups</TabsTrigger>
          <TabsTrigger value="bracket"><Trophy className="w-3.5 h-3.5 mr-1.5" />Bracket</TabsTrigger>
        </TabsList>

        {tab === 'groups' && (
        <div className="mt-4">
          {standingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-[#141929] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : groupKeys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupKeys.map((grp) => (
                <GroupTable key={grp} group={grp} teams={standings!.groups[grp]} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No group data yet. Sync data first.</p>
          )}
        </div>
        )}

        {tab === 'bracket' && (
        <div className="mt-4">
          {bracketLoading ? (
            <div className="h-64 bg-[#141929] rounded-xl animate-pulse" />
          ) : bracket ? (
            <BracketView data={bracket} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No bracket data yet.</p>
          )}
        </div>
        )}
      </Tabs>
    </div>
  )
}
