import { useState } from 'react'
import { Trophy, LayoutGrid } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/api/client'
import GroupTable from '@/components/GroupTable'
import BracketView from '@/components/BracketView'
import type { StandingsData, BracketData } from '@/types'
import PageHeader from '@/components/PageHeader'

type Tab = 'groups' | 'bracket'

export default function Standings() {
  const [tab, setTab] = useState<Tab>('groups')
  const { data: standings, isLoading: standingsLoading } = useQuery<StandingsData>({
    queryKey: ['standings'],
    queryFn: () => api.getStandings(),
    staleTime: 15 * 60 * 1000, // 15min
  })
  const { data: bracket, isLoading: bracketLoading } = useQuery<BracketData>({
    queryKey: ['bracket'],
    queryFn: () => api.getBracket(),
    staleTime: 15 * 60 * 1000,
  })

  const groupKeys = standings?.groups ? Object.keys(standings.groups).sort() : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standings & Bracket"
        icon={<Trophy className="w-7 h-7 text-[#60E6F6]" />}
        description="Switch between the group race and the knockout tree without changing the underlying tournament logic."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="border-[#17307C] bg-[#0B1543]/58">
          <TabsTrigger value="groups"><LayoutGrid className="w-3.5 h-3.5 mr-1.5" />Groups</TabsTrigger>
          <TabsTrigger value="bracket"><Trophy className="w-3.5 h-3.5 mr-1.5" />Bracket</TabsTrigger>
        </TabsList>

        {tab === 'groups' && (
        <div className="mt-4">
          {standingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="app-panel h-48 rounded-none animate-pulse" />
              ))}
            </div>
          ) : groupKeys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupKeys.map((grp) => (
                <GroupTable key={grp} group={grp} teams={standings!.groups[grp]} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-white/45">No group data yet. Sync data first.</p>
          )}
        </div>
        )}

        {tab === 'bracket' && (
        <div className="relative left-1/2 mt-4 w-screen -translate-x-1/2 px-4 sm:px-6">
          {bracketLoading ? (
            <div className="app-panel h-64 rounded-none animate-pulse" />
          ) : bracket ? (
            <BracketView data={bracket} />
          ) : (
            <p className="py-8 text-center text-sm text-white/45">No bracket data yet.</p>
          )}
        </div>
        )}
      </Tabs>
    </div>
  )
}
