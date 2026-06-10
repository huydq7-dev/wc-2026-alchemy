import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LiveBadge from "./LiveBadge";
import DealBadge from "./DealBadge";
import DealEditor from "./DealEditor";
import { useGameStore } from "@/store/useGameStore";
import { usePlacePrediction } from "@/hooks/usePredictions";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import FlagImage from "@/components/FlagImage";
import { cn } from "@/lib/utils";
import type { Match } from "@/types";

interface Props {
  match: Match;
  userPick?: "A" | "B" | null;
  showPickButtons?: boolean;
}

export default function MatchCard({
  match,
  userPick,
  showPickButtons = true,
}: Readonly<Props>) {
  const currentUserId = useGameStore((s) => s.currentUser?.id || "");
  const isAdmin = useGameStore((s) => s.currentUser?.isAdmin || false);
  const placePrediction = usePlacePrediction();
  const queryClient = useQueryClient();
  const isPicked = !!userPick;
  const [showDealEditor, setShowDealEditor] = useState(false);

  const handleSaveDeal = async (deal: string, dealSide: "A" | "B") => {
    await api.updateMatch(match.id, { deal, deal_side: dealSide });
    await queryClient.invalidateQueries({ queryKey: ["matches"] });
    setShowDealEditor(false);
  };

  const isUpcoming = match.status === "upcoming";
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
