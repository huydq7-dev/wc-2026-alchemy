import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { ArrowLeft, Users, Shirt, MapPin, LayoutGrid, List } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Player {
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  number: number;
  club?: string;
  age?: number;
  caps?: number;
}

// ── Position colors ──
const posColor: Record<string, string> = {
  GK: "#F5A623",
  DEF: "#60E6F6",
  MID: "#4ADE80",
  FWD: "#E63946",
};

const posBg: Record<string, string> = {
  GK: "bg-accent/12 border-accent/25 text-[#F5A623]",
  DEF: "bg-primary/10 border-primary/25 text-primary",
  MID: "bg-emerald-500/10 border-emerald-500/25 text-[#4ADE80]",
  FWD: "bg-danger/10 border-danger/25 text-danger",
};

// ── Formation layout helper ──
interface PositionedPlayer extends Player {
  x: number;
  y: number;
}

function layoutFormation(players: Player[], formation: string): PositionedPlayer[] {
  const lines = formation.split("-").map(Number);
  // lines e.g. [4,3,3] for 4-3-3 or [4,4,2] for 4-4-2

  const gk = players.filter(p => p.position === "GK");
  const def = players.filter(p => p.position === "DEF");
  const mid = players.filter(p => p.position === "MID");
  const fwd = players.filter(p => p.position === "FWD");

  // Take only starters (first N per line + GK)
  const starters: PositionedPlayer[] = [];

  // GK (1)
  gk.slice(0, 1).forEach(p => starters.push({ ...p, x: 50, y: 92 }));

  // Defenders (lines[0])
  def.slice(0, lines[0]).forEach((p, i) => {
    const total = Math.min(lines[0], def.length);
    const x = 50 + (i - (total - 1) / 2) * (60 / Math.max(total - 1, 1));
    starters.push({ ...p, x: Math.max(12, Math.min(88, x)), y: 68 });
  });

  // Midfielders - split into lines based on formation
  let midLines: number[];
  if (formation === "4-2-3-1") {
    midLines = [2, 3];
  } else if (lines.length === 3) {
    midLines = [lines[1]];
  } else if (lines.length === 4) {
    midLines = [lines[1], lines[2]];
  } else {
    midLines = [lines[1]];
  }

  let midIdx = 0;
  const midYs = [54, 42];

  for (let li = 0; li < midLines.length && li < midYs.length; li++) {
    const count = midLines[li];
    const segment = mid.slice(midIdx, midIdx + count);
    const y = midYs[li];
    segment.forEach((p, i) => {
      const x = 50 + (i - (count - 1) / 2) * (68 / Math.max(count - 1, 1));
      starters.push({ ...p, x: Math.max(8, Math.min(92, x)), y });
    });
    midIdx += count;
  }

  // Forwards (last number)
  const fwdCount = lines[lines.length - 1];
  fwd.slice(0, fwdCount).forEach((p, i) => {
    const x = 50 + (i - (fwdCount - 1) / 2) * (50 / Math.max(fwdCount - 1, 1));
    starters.push({ ...p, x: Math.max(16, Math.min(84, x)), y: 20 });
  });

  return starters;
}

// ── Sub-components ──

function PitchView({ players, formation }: { players: Player[]; formation: string }) {
  const starters = useMemo(() => layoutFormation(players, formation), [players, formation]);

  return (
    <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[480px]">
      {/* Pitch */}
      <svg
        viewBox="0 0 100 100"
        className="w-full rounded-2xl border border-white/8 shadow-lg"
        style={{ background: "linear-gradient(180deg, #0d8c2e 0%, #0a7025 50%, #0d8c2e 100%)" }}
      >
        {/* Grass texture lines */}
        <defs>
          <pattern id="grass" patternUnits="userSpaceOnUse" width="100" height="8">
            <rect width="100" height="8" fill="transparent" />
            <line x1="0" y1="4" x2="100" y2="4" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </pattern>
          <radialGradient id="spotlight" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="url(#grass)" />
        <rect width="100" height="100" fill="url(#spotlight)" />

        {/* Outer border */}
        <rect x="3" y="2" width="94" height="96" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" rx="1" />

        {/* Halfway line */}
        <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.5)" />

        {/* Top penalty area */}
        <rect x="22" y="2" width="56" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.25" />
        <rect x="34" y="2" width="32" height="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.25" />

        {/* Bottom penalty area */}
        <rect x="22" y="82" width="56" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.25" />
        <rect x="34" y="92" width="32" height="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.25" />

        {/* Goals */}
        <rect x="44" y="0" width="12" height="2.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
        <rect x="44" y="97.5" width="12" height="2.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />

        {/* Corner arcs */}
        {[[3, 2], [97, 2], [3, 98], [97, 98]].map(([cx, cy], i) => (
          <path
            key={i}
            d={`M ${cx} ${cy} A 2 2 0 0 ${i < 2 ? 1 : 0} ${i % 2 === 0 ? cx + 2 : cx - 2} ${i < 2 ? cy + 2 : cy - 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.2"
          />
        ))}

        {/* Player positions */}
        {starters.map((p, i) => (
          <g key={i}>
            {/* Glow ring */}
            <circle
              cx={p.x}
              cy={p.y}
              r="3.8"
              fill="none"
              stroke={posColor[p.position]}
              strokeWidth="0.6"
              opacity="0.5"
            />
            {/* Player circle */}
            <circle
              cx={p.x}
              cy={p.y}
              r="3.2"
              fill="rgba(8,17,62,0.9)"
              stroke={posColor[p.position]}
              strokeWidth="0.8"
            />
            {/* Number */}
            <text
              x={p.x}
              y={p.y + 0.8}
              textAnchor="middle"
              fill="white"
              fontSize="2.6"
              fontWeight="700"
              fontFamily="Archivo, sans-serif"
            >
              {p.number}
            </text>
          </g>
        ))}

        {/* Formation label */}
        <rect x="38" y="47.5" width="24" height="5" rx="2.5" fill="rgba(8,17,62,0.85)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.25" />
        <text x="50" y="50.9" textAnchor="middle" fill="white" fontSize="2.4" fontWeight="700" fontFamily="Archivo, sans-serif">
          {formation}
        </text>
      </svg>

      {/* Bench */}
      <div className="mt-4 rounded-2xl border border-white/6 bg-[#0B1543]/60 p-4">
        <p className="app-kicker mb-3">Substitutes</p>
        <div className="flex flex-wrap gap-2">
          {players.slice(11).map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs"
            >
              <span className="font-bold text-white/50 w-4 text-center">{p.number}</span>
              <span className="text-white/70 truncate max-w-[80px]">{p.name}</span>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: posColor[p.position] }}>
                {p.position}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListView({ players }: { players: Player[] }) {
  const positions = ["GK", "DEF", "MID", "FWD"] as const;
  const posLabel: Record<string, string> = {
    GK: "Goalkeepers",
    DEF: "Defenders",
    MID: "Midfielders",
    FWD: "Forwards",
  };

  return (
    <div className="space-y-4">
      {positions.map(pos => {
        const group = players.filter(p => p.position === pos);
        if (group.length === 0) return null;
        return (
          <div key={pos}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: posColor[pos] }}
              />
              <span className="app-kicker text-xs">{posLabel[pos]}</span>
              <span className="text-[10px] text-white/30">{group.length} players</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {group.map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-white/[0.02]",
                    posBg[pos],
                  )}
                >
                  <span className="font-display text-xl w-8 text-center font-bold">
                    {p.number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{p.name}</p>
                    {p.club && (
                      <p className="text-[10px] text-white/36 truncate flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {p.club}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──

export default function Squad() {
  const { teamCode } = useParams<{ teamCode: string }>();
  const [view, setView] = useState<"pitch" | "list">("pitch");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["squad", teamCode],
    queryFn: () => api.getSquad(teamCode!),
    enabled: !!teamCode,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-bg-card rounded animate-pulse" />
        <div className="h-64 bg-bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !data?.squad) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/40">Squad not found</p>
        <Link
          to="/standings"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Standings
        </Link>
      </div>
    );
  }

  const { squad } = data;
  const formation = squad.formation;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        to="/standings"
        className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Standings
      </Link>

      {/* Team Header */}
      <div className="flex items-center gap-4">
        <span className="text-5xl">{squad.flag}</span>
        <div>
          <p className="app-kicker">Group {squad.group} · {squad.coach}</p>
          <h1 className="font-display text-3xl text-white tracking-wide">{squad.teamName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Users className="w-3.5 h-3.5" />
              {squad.players.length} players
            </span>
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Shirt className="w-3.5 h-3.5" />
              {formation}
            </span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "pitch" | "list")}>
        <TabsList className="border-[#17307C] bg-[#0B1543]/58">
          <TabsTrigger value="pitch"><LayoutGrid className="w-3.5 h-3.5 mr-1.5" />Pitch View</TabsTrigger>
          <TabsTrigger value="list"><List className="w-3.5 h-3.5 mr-1.5" />List View</TabsTrigger>
        </TabsList>

        {view === "pitch" && (
          <>
            <PitchView players={squad.players} formation={formation} />
            {/* Starting XI legend */}
            <div className="flex flex-wrap items-center gap-3 justify-center text-xs text-white/40">
              {(["GK", "DEF", "MID", "FWD"] as const).map(pos => (
                <span key={pos} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: posColor[pos] }} />
                  {pos}
                </span>
              ))}
            </div>
          </>
        )}

        {view === "list" && (
          <ListView players={squad.players} />
        )}
      </Tabs>
    </div>
  );
}

