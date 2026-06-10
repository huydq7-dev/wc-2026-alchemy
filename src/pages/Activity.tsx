import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Clock,
  Target,
  Edit3,
  RefreshCw,
  Flag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useUsers } from "@/hooks/useUsers";
import PageHeader from "@/components/PageHeader";

const ACTIONS = [
  { key: "", label: "All", icon: Clock, color: "text-white/55" },
  {
    key: "place_prediction",
    label: "Predicted",
    icon: Target,
    color: "text-white/55",
  },
  {
    key: "change_prediction",
    label: "Changed",
    icon: Edit3,
    color: "text-white/55",
  },
  { key: "update_deal", label: "Deal", icon: Edit3, color: "text-white/55" },
  { key: "update_result", label: "Result", icon: Flag, color: "text-white/55" },
  {
    key: "sync_matches",
    label: "Sync",
    icon: RefreshCw,
    color: "text-white/55",
  },
  { key: "sync_odds", label: "Odds", icon: RefreshCw, color: "text-white/55" },
  {
    key: "auto_loss",
    label: "Auto-Loss",
    icon: AlertCircle,
    color: "text-white/55",
  },
];

const LIMIT = 15;

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

function formatActivityTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return TIME_FMT.format(new Date(iso));
  } catch {
    return iso.slice(5, 16);
  }
}

export default function Activity() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [userId, setUserId] = useState("");

  const { data: users } = useUsers();

  const { data, isLoading } = useQuery({
    queryKey: ["activity", page, filter, userId],
    queryFn: () =>
      api.getActivity({
        page,
        limit: LIMIT,
        action: filter || undefined,
        userId: userId || undefined,
      }),
    refetchInterval: 30000,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  const parseDetails = (details: any) => {
    if (!details) return null;
    return typeof details === "string" ? JSON.parse(details) : details;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PageHeader
          title="Recent Activity"
          icon={<Clock className="w-7 h-7 text-[#60E6F6]" />}
          description="A live feed of predictions, result updates, deal changes, and sync actions across the pool."
        />
      </motion.div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Action filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {ACTIONS.map(({ key, label, icon: Icon }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1 rounded-none border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] transition-all ${
                  active
                    ? "border-white bg-white text-[#09112B]"
                    : "border-white/8 bg-white/[0.025] text-white/48 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>

        {/* User filter dropdown */}
        {users && users.length > 0 && (
          <select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setPage(1);
            }}
            className="app-panel rounded-none px-3 py-1.5 text-xs text-white/70 border border-white/8 bg-[#0B1543]/58 focus:outline-none focus:border-white/20"
          >
            <option value="">All Players</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Log List */}
      {isLoading ? (
        <div className="py-20 text-center text-white/45">Loading...</div>
      ) : !logs.length ? (
        <div className="py-20 text-center text-white/45">No activity yet</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any, i: number) => {
            const action = ACTIONS.find((a) => a.key === log.action);
            const Icon = action?.icon || Clock;
            const color = action?.color || "text-gray-400";
            const label = action?.label || log.action;
            const details = parseDetails(log.details);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="app-panel flex items-center gap-3 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/5">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/user/${log.user_id}`}
                      className="text-sm font-semibold text-white hover:underline"
                    >
                      {log.user_name}
                    </Link>
                    <span className={`app-meta ${color}`}>{label}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/36">
                    {details?.match || details?.matchId || ""}
                    {details?.team && ` → ${details.team}`}
                    {details?.status && ` (${details.status})`}
                    {details?.score_a != null &&
                      ` ${details.score_a}-${details.score_b}`}
                  </p>
                </div>

                <span className="shrink-0 text-right text-[10px] text-white/28 leading-tight">
                  {formatActivityTime(log.created_at)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-white/10 p-1.5 text-white/45 transition-all hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/45">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border border-white/10 p-1.5 text-white/45 transition-all hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
