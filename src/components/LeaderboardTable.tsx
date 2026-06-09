import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserHistory } from "@/hooks/usePredictions";
import { cn } from "@/lib/utils";
import FlagImage from "@/components/FlagImage";
import type { LeaderboardEntry } from "@/types";

interface Props {
  entries: LeaderboardEntry[];
  maxPoints: number;
}

export default function LeaderboardTable({ entries }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div>
      {/* Desktop Table */}
      <div className="app-panel overflow-x-auto rounded-[24px] p-2 hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left py-3 px-4 w-12">#</th>
              <th className="text-left py-3 px-4">Player</th>
              <th className="text-center py-3 px-4">Points</th>
              <th className="text-center py-3 px-4">Wins</th>
              <th className="text-center py-3 px-4">Losses</th>
              <th className="text-center py-3 px-4">Draws</th>
              <th className="text-center py-3 px-4">Pending</th>
              <th className="text-center py-3 px-4">Win Rate</th>
              <th className="text-center py-3 px-4">Debt</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <motion.tr
                key={entry.userId}
                layout
                className={cn(
              "border-b border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors",
                  entry.rank === 1 && "bg-[#F5A623]/[0.06]",
                )}
                onClick={() => setSelectedUserId(entry.userId)}
              >
                <td className="py-3 px-4">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{entry.avatar}</span>
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {entry.name}
                      </p>
                      <div className="mt-1 w-24">
                        <Progress
                          value={entry.progressPercent}
                          className="h-1"
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={cn(
                      "font-display text-xl font-bold",
                      entry.totalPoints > 0 && "text-green-400",
                      entry.totalPoints < 0 && "text-red-400",
                      entry.totalPoints === 0 && "text-gray-400",
                    )}
                  >
                    {entry.totalPoints > 0 ? "+" : ""}
                    {entry.totalPoints}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-green-400 text-sm">
                  {entry.wins}
                </td>
                <td className="py-3 px-4 text-center text-red-400 text-sm">
                  {entry.losses}
                </td>
                <td className="py-3 px-4 text-center text-gray-500 text-sm">
                  {entry.draws}
                </td>
                <td className="py-3 px-4 text-center text-[#F5A623] text-sm">
                  {entry.pendingBets}
                </td>
                <td className="py-3 px-4 text-center text-gray-400 text-sm">
                  {entry.winRate}%
                </td>
                <td className="py-3 px-4 text-center">
                  {entry.debt > 0 ? (
                    <Badge
                      variant="outline"
                      className={
                        entry.debtPaid
                          ? "text-[10px] border-green-500/30 text-green-400"
                          : "text-[10px] border-red-500/30 text-red-400"
                      }
                    >
                      {entry.debtPaid
                        ? "Done"
                        : `${entry.debt.toLocaleString()}đ`}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-white/5 text-gray-500"
                    >
                      ---
                    </Badge>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {entries.map((entry) => (
          <motion.div
            key={entry.userId}
            layout
            className={cn(
              "app-panel rounded-[24px] p-4 cursor-pointer",
              entry.rank === 1 ? "border-[#F5A623]/30" : "border-white/5",
            )}
            onClick={() => setSelectedUserId(entry.userId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RankBadge rank={entry.rank} />
                <span className="text-2xl">{entry.avatar}</span>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {entry.name}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="text-green-400">{entry.wins}W</span>
                    <span className="text-red-400">{entry.losses}L</span>
                    <span>{entry.draws}D</span>
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  "font-display text-xl font-bold",
                  entry.totalPoints > 0 && "text-green-400",
                  entry.totalPoints < 0 && "text-red-400",
                  entry.totalPoints === 0 && "text-gray-400",
                )}
              >
                {entry.totalPoints > 0 ? "+" : ""}
                {entry.totalPoints}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={entry.progressPercent} className="h-1" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* User History Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <UserHistoryModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="font-display text-xl text-[#F5A623]">🥇</span>;
  if (rank === 2)
    return <span className="font-display text-xl text-gray-300">🥈</span>;
  if (rank === 3)
    return <span className="font-display text-xl text-amber-700">🥉</span>;
  return <span className="text-sm text-gray-500 font-medium">{rank}</span>;
}

function UserHistoryModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useUserHistory(userId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="app-panel w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-[28px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-white">
            Prediction History
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : data?.predictions && data.predictions.length > 0 ? (
          <>
            {/* Stats */}
            {data.stats && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <StatBox label="Total" value={data.stats.total} />
                <StatBox
                  label="Wins"
                  value={data.stats.wins}
                  color="text-green-400"
                />
                <StatBox
                  label="Losses"
                  value={data.stats.losses}
                  color="text-red-400"
                />
                <StatBox
                  label="Points"
                  value={`${data.stats.totalPoints > 0 ? "+" : ""}${data.stats.totalPoints}`}
                  color={
                    data.stats.totalPoints >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              {data.predictions.map((pred: any) => (
                <div
                  key={pred.match_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <FlagImage
                      code={pred.team_a_code}
                      size={40}
                      className="w-4 h-3 rounded-sm object-cover"
                    />
                    <span className="text-xs text-gray-400">
                      {pred.team_a_name} vs {pred.team_b_name}
                    </span>
                    <FlagImage
                      code={pred.team_b_code}
                      size={40}
                      className="w-4 h-3 rounded-sm object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Pick:{" "}
                      <FlagImage
                        code={
                          pred.pick === "A"
                            ? pred.team_a_code
                            : pred.team_b_code
                        }
                        size={40}
                        className="w-4 h-3 rounded-sm object-cover inline-block"
                      />
                    </span>
                    {pred.result && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          pred.result === "win" &&
                            "border-green-500/30 text-green-400",
                          pred.result === "lose" &&
                            "border-red-500/30 text-red-400",
                          pred.result === "draw" &&
                            "border-gray-500/30 text-gray-400",
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
          </>
        ) : (
          <p className="text-gray-400 text-sm">No prediction history yet.</p>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="text-center p-2 rounded-lg bg-white/[0.02]">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={cn("font-display text-lg", color || "text-white")}>
        {value}
      </p>
    </div>
  );
}
