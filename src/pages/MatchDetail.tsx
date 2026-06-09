import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import LiveBadge from '@/components/LiveBadge'
import DealBadge from '@/components/DealBadge'
import { useMatch } from '@/hooks/useMatches'
import FlagImage from '@/components/FlagImage'
import { cn } from '@/lib/utils'

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: match, isLoading } = useMatch(id!)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-[#141929] rounded animate-pulse" />
        <div className="h-64 bg-[#141929] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Match not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/schedule">Back to Schedule</Link>
        </Button>
      </div>
    )
  }

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const hasScore = match.score_a != null && match.score_b != null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button asChild variant="ghost" className="text-gray-400 -ml-3">
        <Link to="/schedule"><ArrowLeft className="w-4 h-4 mr-1" />Schedule</Link>
      </Button>

      <Card className="bg-[#141929] border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            {isLive && <LiveBadge />}
            {isFinished && <Badge className="bg-white/5 text-gray-400">FINISHED</Badge>}
            {match.status === 'upcoming' && <Badge className="bg-white/5 text-gray-400">UPCOMING</Badge>}
          </div>

          <p className="text-center text-xs text-gray-500 mb-4">
            {match.stage} · <MapPin className="w-3 h-3 inline" /> {match.venue}
          </p>

          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className="flex flex-col items-center gap-2">
              <FlagImage code={match.team_a_code} size={160} className="w-16 h-11 rounded-sm object-cover shadow-lg" />
              <h2 className="font-display text-xl md:text-2xl text-white">{match.team_a_name}</h2>
            </div>

            <div className="flex flex-col items-center gap-2">
              {hasScore ? (
                <span className="font-display text-4xl md:text-5xl text-white tabular-nums">{match.score_a} - {match.score_b}</span>
              ) : (
                <span className="font-display text-2xl text-gray-400">{match.time}</span>
              )}
              <DealBadge deal={match.deal} dealSide={match.deal_side} teamName={match.deal_side === 'A' ? match.team_a_name : match.team_b_name} />
            </div>

            <div className="flex flex-col items-center gap-2">
              <FlagImage code={match.team_b_code} size={160} className="w-16 h-11 rounded-sm object-cover shadow-lg" />
              <h2 className="font-display text-xl md:text-2xl text-white">{match.team_b_name}</h2>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Clock className="w-3 h-3 inline mr-1" />{match.date} · {match.time}
          </p>
        </CardContent>
      </Card>

      {hasScore && match.dealInfo && (
        <Card className="bg-[#141929] border-white/5">
          <CardHeader>
            <CardTitle className="text-white font-display text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#F5A623]" />Deal Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm leading-relaxed">{match.dealInfo.summary}</p>
            <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{match.team_a_name} ({match.score_a}){match.deal_side === 'A' && ` + (${match.deal})`}</span>
                <span className="text-gray-400">{match.team_b_name} ({match.score_b}){match.deal_side === 'B' && ` + (${match.deal})`}</span>
              </div>
              <Separator className="my-2 bg-white/5" />
              <div className="flex justify-between text-sm">
                <span className="text-white font-semibold">{match.dealInfo.adjustedA}</span>
                <span className="text-gray-500">After Deal</span>
                <span className="text-white font-semibold">{match.dealInfo.adjustedB}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {match.predictions?.length > 0 && (
        <Card className="bg-[#141929] border-white/5">
          <CardHeader>
            <CardTitle className="text-white font-display text-lg">Who predicted what?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {match.predictions.map((pred: any, i: number) => (
                <div key={i} className={cn('flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5', pred.result === 'win' && 'border-green-500/10 bg-green-500/[0.02]', pred.result === 'lose' && 'border-red-500/10 bg-red-500/[0.02]')}>
                  <div className="flex items-center gap-2">
                    <span>{pred.avatar}</span>
                    <span className="text-sm text-white">{pred.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      <FlagImage code={pred.pick === 'A' ? match.team_a_code : match.team_b_code} size={40} className="w-6 h-4 rounded-none object-cover inline-block" />
                    </span>
                    {pred.result && (
                      <Badge className={cn('text-[10px]', pred.result === 'win' && 'bg-green-500/15 text-green-400', pred.result === 'lose' && 'bg-red-500/15 text-red-400', pred.result === 'draw' && 'bg-gray-500/15 text-gray-400')}>
                        {pred.result === 'win' ? '+1' : pred.result === 'lose' ? '-1' : '0'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!match.predictions || match.predictions.length === 0) && (
        <p className="text-center text-gray-500 text-sm py-8">No predictions yet for this match.</p>
      )}
    </div>
  )
}
