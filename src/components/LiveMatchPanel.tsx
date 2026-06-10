import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  Users,
  BarChart3,
  Shirt,
  ArrowUpDown,
} from "lucide-react";

interface MatchEvent {
  time: string;
  type: string;
  player: string;
  team: string;
  assist?: string;
  substituted?: string;
}

interface MatchStat {
  type: string;
  home: string;
  away: string;
}

interface LineupPlayer {
  name: string;
  number: number;
  position: string;
}

interface LineupData {
  home: { formation: string; starters: LineupPlayer[]; substitutes: LineupPlayer[]; coach: string };
  away: { formation: string; starters: LineupPlayer[]; substitutes: LineupPlayer[]; coach: string };
}

interface Props {
  detail: any;
  lineups: LineupData | null;
  isLive: boolean;
  isFetching: boolean;
}

type Tab = "events" | "lineups" | "stats";

const EVENT_ICONS: Record<string, string> = {
  Goal: "⚽",
  "Own Goal": "⚽",
  Penalty: "⚽",
  "Missed Penalty": "❌",
  "Yellow Card": "🟨",
  "Red Card": "🟥",
  Substitution: "🔄",
};

function eventIcon(type: string): string {
  for (const [key, icon] of Object.entries(EVENT_ICONS)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "📌";
}

function eventColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("goal") || t.includes("penalty")) return "text-[#4ADE80]";
  if (t.includes("red")) return "text-[#E63946]";
  if (t.includes("yellow")) return "text-[#F5A623]";
  if (t.includes("var")) return "text-[#60E6F6]";
  return "text-white/50";
}

const STAT_LABELS: Record<string, string> = {
  possession: "Possession %",
  shots_on_target: "Shots on Target",
  shots_off_target: "Shots off Target",
  corners: "Corners",
  fouls: "Fouls",
  yellow_cards: "Yellow Cards",
  red_cards: "Red Cards",
  offsides: "Offsides",
  passes: "Passes",
  pass_accuracy: "Pass Accuracy %",
  expected_goals: "Expected Goals (xG)",
  tackles: "Tackles",
  interceptions: "Interceptions",
  clearances: "Clearances",
};

function statLabel(type: string): string {
  const key = type.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return STAT_LABELS[key] ?? type;
}

function statBarWidth(home: string, away: string): [number, number] {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  if (h === 0 && a === 0) return [50, 50];
  const total = h + a;
  return [(h / total) * 100, (a / total) * 100];
}

export default function LiveMatchPanel({ detail, lineups, isLive, isFetching }: Props) {
  const [tab, setTab] = useState<Tab>("events");

  const events: MatchEvent[] = detail?.events ?? [];
  const stats: MatchStat[] = detail?.statistics ?? [];

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E63946]" />
          </span>
          <span className="text-xs text-[#E63946] font-medium tracking-wider uppercase">
            Live{isFetching ? "" : ""}
          </span>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="border-[#17307C] bg-[#0B1543]/58">
          <TabsTrigger value="events">
            <Activity className="w-3.5 h-3.5 mr-1.5" />Events
          </TabsTrigger>
          <TabsTrigger value="lineups">
            <Users className="w-3.5 h-3.5 mr-1.5" />Lineups
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Stats
          </TabsTrigger>
        </TabsList>

        {/* ── EVENTS TAB ── */}
        {tab === "events" && (
          <div className="mt-4">
            {events.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-white/40">
                  No match events yet.
                  {isLive && " Events will appear as the match progresses."}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    {events.map((evt, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl border border-white/5 bg-white/[0.01]"
                      >
                        <span className="text-xs font-mono text-white/30 w-8 shrink-0">
                          {evt.time}&apos;
                        </span>
                        <span className="text-base shrink-0">{eventIcon(evt.type)}</span>
                        <div className="min-w-0 flex-1">
                          <span className={cn("text-sm font-medium", eventColor(evt.type))}>
                            {evt.player}
                          </span>
                          {evt.assist && (
                            <span className="text-xs text-white/30 ml-1">(assist: {evt.assist})</span>
                          )}
                          {evt.substituted && (
                            <span className="text-xs text-white/30 ml-1">
                              <ArrowUpDown className="w-3 h-3 inline" /> {evt.substituted}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/20 uppercase tracking-wider shrink-0">
                          {evt.team}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── LINEUPS TAB ── */}
        {tab === "lineups" && (
          <div className="mt-4 space-y-4">
            {lineups ? (
              <>
                {/* Home team */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                      <Shirt className="w-4 h-4" />
                      {detail?.home ?? "Home"} — {lineups.home.formation}
                      <span className="text-xs text-white/30 ml-auto">{lineups.home.coach}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-1">
                      {lineups.home.starters.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm py-1 px-2 rounded-lg border border-white/5 bg-white/[0.01]">
                          <span className="w-6 text-center font-bold text-white/30 text-xs">{p.number}</span>
                          <span className="flex-1 text-white/80 truncate">{p.name}</span>
                          <span className="text-[10px] text-white/25 uppercase">{p.position}</span>
                        </div>
                      ))}
                    </div>
                    {lineups.home.substitutes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-white/25 uppercase mb-1">Substitutes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {lineups.home.substitutes.map((p, i) => (
                            <span key={i} className="text-xs text-white/40 bg-white/[0.02] border border-white/5 rounded-full px-2 py-0.5">
                              {p.number}. {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Away team */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                      <Shirt className="w-4 h-4" />
                      {detail?.away ?? "Away"} — {lineups.away.formation}
                      <span className="text-xs text-white/30 ml-auto">{lineups.away.coach}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-1">
                      {lineups.away.starters.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm py-1 px-2 rounded-lg border border-white/5 bg-white/[0.01]">
                          <span className="w-6 text-center font-bold text-white/30 text-xs">{p.number}</span>
                          <span className="flex-1 text-white/80 truncate">{p.name}</span>
                          <span className="text-[10px] text-white/25 uppercase">{p.position}</span>
                        </div>
                      ))}
                    </div>
                    {lineups.away.substitutes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-white/25 uppercase mb-1">Substitutes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {lineups.away.substitutes.map((p, i) => (
                            <span key={i} className="text-xs text-white/40 bg-white/[0.02] border border-white/5 rounded-full px-2 py-0.5">
                              {p.number}. {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-white/40">
                  Lineups not available yet. They are usually announced 1 hour before kickoff.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div className="mt-4">
            {stats.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-white/40">
                  No statistics available yet.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4 text-[10px] text-white/30 uppercase tracking-wider">
                    <span className="w-20 text-right">{detail?.home ?? "Home"}</span>
                    <span />
                    <span>{detail?.away ?? "Away"}</span>
                  </div>
                  <div className="space-y-3">
                    {stats.map((s, i) => {
                      const [hPct, aPct] = statBarWidth(s.home, s.away);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white/70 font-medium tabular-nums w-10 text-right">{s.home}</span>
                            <span className="text-[10px] text-white/35">{statLabel(s.type)}</span>
                            <span className="text-white/70 font-medium tabular-nums w-10">{s.away}</span>
                          </div>
                          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
                            <div
                              className="h-full rounded-full bg-[#60E6F6]/60 transition-all duration-500"
                              style={{ width: `${hPct}%` }}
                            />
                            <div className="w-0.5 bg-[#09112B]" />
                            <div
                              className="h-full rounded-full bg-[#F5A623]/60 transition-all duration-500"
                              style={{ width: `${aPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Match predictions ── */}
        {detail?.predictions && (
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-white/60">Win Probabilities</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-white/40">{detail.home}</p>
                    <p className="font-display text-lg text-[#60E6F6]">{detail.predictions.home}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/20">Draw</p>
                    <p className="font-display text-lg text-white/30">{detail.predictions.draw}%</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-white/40">{detail.away}</p>
                    <p className="font-display text-lg text-[#F5A623]">{detail.predictions.away}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  );
}
