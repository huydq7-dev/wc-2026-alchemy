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
        <BookOpen className="w-7 h-7 text-[#C8102E]" />
        Luật chơi
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
            <AccordionItem
              key={rule.id}
              value={rule.id}
              className="bg-[#141929] border border-white/5 rounded-xl px-4 data-[state=open]:border-[#C8102E]/20"
            >
              <AccordionTrigger className="text-white font-semibold text-sm hover:no-underline py-4">
                <span className="flex items-center gap-3">
                  <span className="font-display text-lg text-[#C8102E] w-8 text-left">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {rule.title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 text-sm leading-relaxed pb-4 pl-11">
                {rule.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Example Section */}
      <div className="bg-[#141929] border border-white/5 rounded-xl p-6">
        <h3 className="font-display text-lg text-white mb-4">Ví dụ minh họa</h3>
        <div className="space-y-4 text-sm text-gray-400">
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-white font-semibold mb-2">Deal -1 (Đội A chấp 1 trái)</p>
            <p>Đội A thắng 1-0 → Hòa Deal → <span className="text-gray-400">0 điểm</span></p>
            <p>Đội A thắng 2-0 → Đội A thắng Deal → <span className="text-green-400">Người chọn A: +1 điểm</span></p>
            <p>Đội A thắng 2-1 → Hòa Deal → <span className="text-gray-400">0 điểm</span></p>
            <p>Hòa 1-1 → Đội B thắng Deal → <span className="text-green-400">Người chọn B: +1 điểm</span></p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-white font-semibold mb-2">Deal +0.5 (Đội A được cộng 0.5)</p>
            <p>Đội A thắng → Đội A thắng Deal → <span className="text-green-400">Người chọn A: +1 điểm</span></p>
            <p>Hòa → Đội A thắng Deal (0.5 &gt; 0) → <span className="text-green-400">Người chọn A: +1 điểm</span></p>
            <p>Đội A thua 0-1 → Đội A thắng Deal (0.5 &gt; 0) → <span className="text-green-400">Người chọn A: +1 điểm</span></p>
            <p>Đội A thua 0-2 → Đội B thắng Deal (0.5 &lt; 2) → <span className="text-green-400">Người chọn B: +1 điểm</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
