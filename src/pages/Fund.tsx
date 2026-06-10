import {
  Wallet,
  Check,
  AlertTriangle,
  PiggyBank,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { toast } from "sonner";

export default function Fund() {
  const queryClient = useQueryClient();
  const { data: fund, isLoading } = useQuery({
    queryKey: ["fund"],
    queryFn: () => api.getFund(),
  });

  const handleTogglePaid = async (userId: string, currentPaid: boolean) => {
    try {
      await api.updateFundUser(userId, !currentPaid);
      queryClient.invalidateQueries({ queryKey: ["fund"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-8 w-40 bg-bg-card rounded animate-pulse" />
        <div className="h-64 bg-bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Prize Pool"
        icon={<Wallet className="w-7 h-7 text-primary" />}
        description="Track the pool size, unpaid losses, and the current prize split at a glance."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <PiggyBank className="mb-2 h-5 w-5 text-primary" />
            <p className="font-display text-2xl text-white">
              {(fund?.totalFund || 0).toLocaleString()} đ
            </p>
            <p className="app-meta">Est. Total Pool</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Banknote className="mb-2 h-5 w-5 text-accent" />
            <p className="font-display text-2xl text-white">
              {(fund?.betAmount || 5000).toLocaleString()} đ
            </p>
            <p className="app-meta">Per Prediction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white font-display text-lg flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Individual Debts
            <span className="ml-auto text-xs font-normal text-white/40">
              Each loss = {(fund?.betAmount || 5000).toLocaleString()} đ
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fund?.paidUsers?.length > 0 && (
            <div className="space-y-1">
              {fund.paidUsers.map((user: any) => (
                <div
                  key={user.userId}
                  className="app-panel-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{user.avatar}</span>
                    <div className="min-w-0">
                      <span className="text-sm text-white truncate block">{user.name}</span>
                      <p className="app-meta">{user.losses} losses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <span className="text-sm font-medium text-white/60 shrink-0">
                      {user.debt.toLocaleString()} đ
                    </span>
                    <Badge className="rounded-none border-primary/20 bg-primary/10 text-primary-light shrink-0">
                      <Check className="w-3 h-3 mr-0.5" />
                      Paid
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-white/48 shrink-0"
                      onClick={() => handleTogglePaid(user.userId, true)}
                    >
                      Undo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fund?.unpaidUsers?.length > 0 && (
            <>
              {fund.paidUsers?.length > 0 && (
                <Separator className="my-3 bg-white/5" />
              )}
              <div className="space-y-1">
                {fund.unpaidUsers.map((user: any) => (
                  <div
                    key={user.userId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-none border border-accent/18 bg-accent/6 p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{user.avatar}</span>
                      <div className="min-w-0">
                        <span className="text-sm text-white truncate block">{user.name}</span>
                        <p className="app-meta text-[#FFD890]">
                          {user.losses} losses
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <span className="text-sm font-semibold text-[#FFD890] shrink-0">
                        {user.debt.toLocaleString()} đ
                      </span>
                      <Badge className="rounded-none border-accent/20 bg-accent/10 text-[#FFD890] shrink-0">
                        <AlertTriangle className="w-3 h-3 mr-0.5" />
                        Unpaid
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary shrink-0"
                        onClick={() => handleTogglePaid(user.userId, false)}
                      >
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {fund?.paidUsers?.length === 0 && fund?.unpaidUsers?.length === 0 && (
            <p className="py-4 text-center text-sm text-white/45">
              No debt data yet. Start predicting!
            </p>
          )}
        </CardContent>
      </Card>

      {fund?.totalFund > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white font-display text-lg flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-primary" />
              Prize Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fund?.prizes?.map((prize: any) => (
                <div
                  key={prize.rank}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-3",
                    prize.rank === 1 && "border-[#17307C] bg-[#0B1543]/72",
                    prize.rank !== 1 && "app-panel-muted",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl w-8 text-center">
                      {prize.rank === 1
                        ? "🥇"
                        : prize.rank === 2
                          ? "🥈"
                          : prize.rank === 3
                            ? "🥉"
                            : `#${prize.rank}`}
                    </span>
                    <div>
                      <p className="text-sm text-white font-semibold">
                        {prize.user?.name || "TBD"}
                      </p>
                      {prize.user && (
                        <p className="text-xs text-white/36">
                          {prize.user.totalPoints > 0 ? "+" : ""}
                          {prize.user.totalPoints} pts
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-primary">
                      {prize.amount.toLocaleString()} đ
                    </p>
                    <p className="text-[10px] text-white/36">
                      {prize.percentage}% of pool
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-white/36">
              * Estimated based on current leaderboard. Total pool = sum of all
              debts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
