import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Pencil, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LiveBadge from "./LiveBadge";
import DealBadge from "./DealBadge";
import DealEditor from "./DealEditor";
import { useGameStore } from "@/store/useGameStore";
import { usePlacePrediction } from "@/hooks/usePredictions";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import FlagImage from "@/components/FlagImage";
import { cn } from "@/lib/utils";
import type { Match } from "@/types";

interface Props {
  match: Match;
  userPick?: "A" | "B" | null;
  showPickButtons?: boolean;
  showOdds?: boolean;
  pickStats?: { a: number; b: number; total: number; aPct: number; bPct: number } | null;
}

export default function MatchCard({
  match,
  userPick,
  showPickButtons = true,
  showOdds = false,
  pickStats,
}: Readonly<Props>) {
  const currentUserId = useGameStore((s) => s.currentUser?.id || "");
  const isAdmin = useGameStore((s) => s.currentUser?.isAdmin || false);
  const placePrediction = usePlacePrediction();
  const queryClient = useQueryClient();
  const isUpcoming = match.status === "upcoming";
  const isPicked = !!userPick;
  const [showDealEditor, setShowDealEditor] = useState(false);

  // Win probabilities from Highlightly — only fetch for upcoming (pre-match only)
  const liveMatch = useLiveMatch({
    teamA: (showOdds && isUpcoming) ? match.team_a_name : "",
    teamB: (showOdds && isUpcoming) ? match.team_b_name : "",
    date: (showOdds && isUpcoming) ? match.date : "",
  });
  const odds = liveMatch.detail?.predictions ?? null;
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  const handlePick = (pick: "A" | "B") => {
    if (!isUpcoming) return;
    placePrediction.mutate({ userId: currentUserId, matchId: match.id, pick });
  };

  const scoreDisplay =
    match.score_a !== null && match.score_b !== null
      ? `${match.score_a} - ${match.score_b}`
      : match.time;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "app-panel relative rounded-none p-4 transition-all",
        isLive && "border-[#17307C] shadow-lg shadow-primary/10",
        isFinished && "border-white/5 opacity-80",
        isUpcoming && "border-white/10 hover:border-white/20",
        isPicked && "ring-1 ring-primary/25",
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        {isLive && <LiveBadge />}
        {isFinished && <Badge variant="secondary">FT</Badge>}
        {isUpcoming && (
          <Badge
            variant="secondary"
            className="border-[#17307C] bg-[#0B1543] text-white/78"
          >
            {match.date} {match.time}
          </Badge>
        )}
      </div>

      {/* Stage */}
      <p className="mb-3 flex items-center text-[10px] uppercase tracking-[0.18em] text-white/42">
        {match.stage} -{" "}
        {match.venue && (
          <span className="ml-1 inline-flex items-center gap-1 text-white/30 normal-case tracking-normal">
            {match.venue}
          </span>
        )}
      </p>

      {/* Teams & Score */}
      <Link to={`/match/${match.id}`} className="block">
        <div className="flex items-center justify-between gap-3">
          {/* Team A */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <FlagImage
              code={match.team_a_code}
              size={160}
              alt={match.team_a_name}
              className="w-10 h-7 object-cover shadow-sm"
            />
            <span className="text-sm font-semibold text-white text-center truncate w-full">
              {match.team_a_name}
            </span>
          </div>

          {/* Center: Deal + Score */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1">
              <DealBadge
                deal={match.deal}
                dealSide={match.deal_side as "A" | "B"}
                teamAName={match.team_a_name}
              />
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDealEditor(true);
                  }}
                  className="text-white/26 transition-colors hover:text-accent"
                  title="Edit deal"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="font-display text-2xl tracking-wider text-white">
              {scoreDisplay}
            </span>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <FlagImage
              code={match.team_b_code}
              size={160}
              alt={match.team_b_name}
              className="w-10 h-7 object-cover shadow-sm"
            />
            <span className="text-sm font-semibold text-white text-center truncate w-full">
              {match.team_b_name}
            </span>
          </div>
        </div>

        {/* View details link */}
        <div className="flex justify-center mt-3">
          <span className="inline-flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-[#60E6F6]">
            Detail
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </Link>

      {/* Community Pick % */}
      {pickStats && pickStats.total > 0 && isUpcoming && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3 text-white/20" />
            <span className="text-[10px] text-white/30">Community</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-[#60E6F6] font-medium w-8 text-right">{pickStats.aPct}%</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5 flex">
              <div
                className="h-full bg-[#60E6F6]/60 transition-all"
                style={{ width: `${pickStats.aPct}%` }}
              />
              <div
                className="h-full bg-[#F5A623]/60 transition-all"
                style={{ width: `${pickStats.bPct}%` }}
              />
            </div>
            <span className="text-[#F5A623] font-medium w-8">{pickStats.bPct}%</span>
          </div>
        </div>
      )}

      {/* Win Probabilities (Highlightly) */}
      {odds && isUpcoming && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3 h-3 text-white/20" />
            <span className="text-[10px] text-white/30">Win Probability</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-white/50 w-8 text-right">{odds.home}%</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5 flex">
              <div
                className="h-full bg-[#60E6F6]/60"
                style={{ width: `${odds.home}%` }}
              />
              <div
                className="h-full bg-white/15"
                style={{ width: `${odds.draw}%` }}
              />
              <div
                className="h-full bg-[#F5A623]/60"
                style={{ width: `${odds.away}%` }}
              />
            </div>
            <span className="text-white/50 w-8">{odds.away}%</span>
          </div>
          <div className="flex justify-between text-[9px] text-white/20 mt-0.5 px-9">
            <span>{match.team_a_name.slice(0, 3).toUpperCase()}</span>
            <span>D {odds.draw}%</span>
            <span>{match.team_b_name.slice(0, 3).toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Pick Buttons */}
      {showPickButtons && isUpcoming && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex gap-2">
            <Button
              variant={userPick === "A" ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-1 text-xs font-semibold",
                userPick === "A" && "bg-white text-[#09112B] hover:bg-white/92",
                userPick !== "A" &&
                  "border-white/10 text-white/55 hover:text-white",
              )}
              disabled={placePrediction.isPending}
              onClick={() => handlePick("A")}
            >
              <FlagImage
                code={match.team_a_code}
                size={40}
                className="w-4 h-3 inline-block"
              />{" "}
              {match.team_a_name}
              {userPick === "A" && " ✓"}
            </Button>
            <Button
              variant={userPick === "B" ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-1 text-xs font-semibold",
                userPick === "B" && "bg-white text-[#09112B] hover:bg-white/92",
                userPick !== "B" &&
                  "border-white/10 text-white/55 hover:text-white",
              )}
              disabled={placePrediction.isPending}
              onClick={() => handlePick("B")}
            >
              <FlagImage
                code={match.team_b_code}
                size={40}
                className="w-4 h-3 inline-block"
              />{" "}
              {match.team_b_name}
              {userPick === "B" && " ✓"}
            </Button>
          </div>
        </div>
      )}

      {/* Finished: show pick result */}
      {isFinished && userPick && (
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/5">
          <span className="flex items-center justify-center gap-1 text-xs text-white/38">
            <FlagImage
              code={userPick === "A" ? match.team_a_code : match.team_b_code}
              size={40}
              className="w-4 h-3 inline-block"
            />
          </span>
        </div>
      )}

      {/* Deal Editor Modal */}
      {showDealEditor && (
        <DealEditor
          match={match}
          onSave={handleSaveDeal}
          onClose={() => setShowDealEditor(false)}
        />
      )}
    </motion.div>
  );
}
