import { BookOpen } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export default function Rules() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => api.getRules(),
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-white tracking-wider flex items-center gap-2">
        <BookOpen className="w-7 h-7 text-[#C8102E]" />Rules
      </h1>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-[#141929] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {rules?.map((rule: any, i: number) => (
            <AccordionItem key={rule.id} value={rule.id} className="bg-[#141929] border border-white/5 rounded-xl px-4 data-[state=open]:border-[#C8102E]/20">
              <AccordionTrigger className="text-white font-semibold text-sm hover:no-underline py-4">
                <span className="flex items-center gap-3">
                  <span className="font-display text-lg text-[#C8102E] w-8 text-left">{String(i + 1).padStart(2, '0')}</span>
                  {rule.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm leading-relaxed pb-4 pl-11">{rule.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="bg-[#141929] border border-white/5 rounded-xl p-6">
        <h3 className="font-display text-lg text-white mb-4">Examples</h3>
        <div className="space-y-4 text-sm text-gray-400">
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-white font-semibold mb-2">Deal -1 (Team A gives 1 goal handicap)</p>
            <p>Team A wins 1-0 → Deal Draw → <span className="text-gray-400">0 pts</span></p>
            <p>Team A wins 2-0 → Team A wins Deal → <span className="text-green-400">Picked A: +1 pt</span></p>
            <p>Team A wins 2-1 → Deal Draw → <span className="text-gray-400">0 pts</span></p>
            <p>Draw 1-1 → Team B wins Deal → <span className="text-green-400">Picked B: +1 pt</span></p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-white font-semibold mb-2">Deal +0.5 (Team A gets +0.5 added)</p>
            <p>Team A wins → Team A wins Deal → <span className="text-green-400">Picked A: +1 pt</span></p>
            <p>Draw → Team A wins Deal (0.5 &gt; 0) → <span className="text-green-400">Picked A: +1 pt</span></p>
            <p>Team A loses 0-1 → Team A wins Deal (0.5 &gt; 0) → <span className="text-green-400">Picked A: +1 pt</span></p>
            <p>Team A loses 0-2 → Team B wins Deal (0.5 &lt; 2) → <span className="text-green-400">Picked B: +1 pt</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
