import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Calendar, Filter } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMatches } from "@/hooks/useMatches";
import { usePredictions } from "@/hooks/usePredictions";
import { useGameStore } from "@/store/useGameStore";
import type { Match } from "@/types";

type FilterTab = "all" | "today" | "upcoming" | "finished";

export default function Schedule() {
  const currentUserId = useGameStore((s) => s.currentUser?.id || "");
  const { data: matches, isLoading } = useMatches();
  const { data: predictions } = usePredictions({ userId: currentUserId });
  const [filter, setFilter] = useState<FilterTab>("all");

  const predMap = new Map(
    (predictions || []).map((p: any) => [p.match_id, p.pick]),
  );

  const today = new Date().toISOString().split("T")[0];

  const filteredMatches = (matches || []).filter((m: Match) => {
    switch (filter) {
      case "today":
        return m.date === today;
      case "upcoming":
        return m.status === "upcoming";
      case "finished":
        return m.status === "finished";
      default:
        return true;
    }
  });

  const grouped = filteredMatches.reduce(
    (acc: Record<string, Match[]>, m: Match) => {
      if (!acc[m.date]) acc[m.date] = [];
      acc[m.date].push(m);
      return acc;
    },
    {} as Record<string, Match[]>,
  );

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule & Predict"
        icon={<Calendar className="w-7 h-7 text-primary" />}
        description="Browse fixtures by day, lock in picks quickly, and review finished matches without losing your place."
      />

      <Tabs
        value={filter}
        onValueChange={(v: string) => setFilter(v as FilterTab)}
      >
        <TabsList className="bg-bg-card border border-white/5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-bg-card p-4 h-48 animate-pulse"
            />
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No matches found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const dateMatches = grouped[date];
            const dateObj = new Date(date + "T00:00:00+07:00");
            const dateLabel = dateObj.toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <div key={date}>
                <h2 className="font-display text-lg text-white/58 mb-3 uppercase tracking-[0.18em]">
                  {dateLabel}
                  {date === today && (
                    <span className="ml-2 text-primary text-sm">· TODAY</span>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {dateMatches.map((match: Match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        userPick={predMap.get(match.id) || null}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
