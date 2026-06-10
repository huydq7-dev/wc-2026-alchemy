import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, HelpCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LiveBadge from "@/components/LiveBadge";
import DealBadge from "@/components/DealBadge";
import { useMatch } from "@/hooks/useMatches";
import FlagImage from "@/components/FlagImage";
import { cn } from "@/lib/utils";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: match, isLoading } = useMatch(id!);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-[#141929] rounded animate-pulse" />
        <div className="h-64 bg-[#141929] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Match not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/schedule">Back to Schedule</Link>
        </Button>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const hasScore = match.score_a != null && match.score_b != null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Match Detail"
        icon={<MapPin className="w-7 h-7 text-[#60E6F6]" />}
        description="Fixture detail, final score, deal explanation, and everyone’s picks in one place."
      />

      <Button asChild variant="ghost" className="-ml-3 text-white/65">
        <Link to="/schedule">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Schedule
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            {isLive && <LiveBadge />}
            {isFinished && <Badge variant="secondary">Finished</Badge>}
            {match.status === "upcoming" && (
              <Badge variant="secondary">Upcoming</Badge>
            )}
          </div>

          <p className="mb-4 text-center text-xs text-white/80">
            {match.stage} - {match.venue}
          </p>

          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <FlagImage
                code={match.team_a_code}
                size={160}
                className="w-16 h-11 rounded-sm object-cover shadow-lg"
              />
              <h2 className="font-display text-xl md:text-2xl text-white text-center truncate w-full">
                {match.team_a_name}
              </h2>
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              {hasScore ? (
                <span className="font-display text-4xl md:text-5xl text-white tabular-nums">
                  {match.score_a} - {match.score_b}
                </span>
              ) : (
                <span className="font-display text-2xl text-white">
                  {match.time}
                </span>
              )}
              <DealBadge
                deal={match.deal}
                dealSide={match.deal_side as "A" | "B"}
                teamAName={match.team_a_name}
              />
            </div>

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <FlagImage
                code={match.team_b_code}
                size={160}
                className="w-16 h-11 rounded-sm object-cover shadow-lg"
              />
              <h2 className="font-display text-xl md:text-2xl text-white text-center truncate w-full">
                {match.team_b_name}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-white/60">
            <Clock className="w-3 h-3 inline mr-1" />
            {match.date} · {match.time}
          </p>
        </CardContent>
      </Card>

      {hasScore && match.dealInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white font-display text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#60E6F6]" />
              Deal Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-white/62">
              {match.dealInfo.summary}
            </p>
            <div className="app-panel-muted mt-3 rounded-2xl p-3">
              <div className="flex justify-between text-sm">
                <span className="text-white">
                  {match.team_a_name} ({match.score_a})
                  {match.deal_side === "A" && ` + (${match.deal})`}
                </span>
                <span className="text-white">
                  {match.team_b_name} ({match.score_b})
                  {match.deal_side === "B" && ` + (${match.deal})`}
                </span>
              </div>
              <Separator className="my-2 bg-white/5" />
              <div className="flex justify-between text-sm">
                <span className="text-white font-semibold">
                  {match.dealInfo.adjustedA}
                </span>
                <span className="text-white/36">After Deal</span>
                <span className="text-white font-semibold">
                  {match.dealInfo.adjustedB}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {match.predictions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white font-display text-lg">
              Who predicted what?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {match.predictions.map((pred: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-3",
                    pred.result === "win" &&
                      "border-[#60E6F6]/14 bg-[#60E6F6]/[0.05]",
                    pred.result === "lose" &&
                      "border-[#F5A623]/14 bg-[#F5A623]/[0.05]",
                    !pred.result && "border-white/6 bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{pred.avatar}</span>
                    <Link
                      to={`/user/${pred.user_id}`}
                      className="text-sm text-white hover:underline"
                    >
                      {pred.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/45">
                      <FlagImage
                        code={
                          pred.pick === "A"
                            ? match.team_a_code
                            : match.team_b_code
                        }
                        size={40}
                        className="w-6 h-4 rounded-none object-cover inline-block"
                      />
                    </span>
                    {pred.result && (
                      <Badge
                        className={cn(
                          pred.result === "win" &&
                            "border-[#60E6F6]/20 bg-[#60E6F6]/10 text-[#9DEFF9]",
                          pred.result === "lose" &&
                            "border-[#F5A623]/20 bg-[#F5A623]/10 text-[#FFD890]",
                          pred.result === "draw" &&
                            "border-white/12 bg-white/8 text-white/60",
                        )}
                      >
                        {pred.result === "win"
                          ? "+1"
                          : pred.result === "lose"
                            ? "-1"
                            : "0"}
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
        <p className="py-8 text-center text-sm text-white/45">
          No predictions yet for this match.
        </p>
      )}
    </div>
  );
}
