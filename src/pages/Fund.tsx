import { Wallet, Check, AlertTriangle, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { toast } from 'sonner';

export default function Fund() {
  const queryClient = useQueryClient();
  const { data: fund, isLoading } = useQuery({
    queryKey: ['fund'],
    queryFn: () => api.getFund(),
  });

  const handleToggleSettled = async (userId: string, currentSettled: boolean) => {
    try {
      await api.updateFundUser(userId, !currentSettled);
      queryClient.invalidateQueries({ queryKey: ['fund'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success('Status updated');
    } catch {
      toast.error('Update failed');
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
    <div className="space-y-6">
      <PageHeader
        title="Debt Points"
        icon={<Wallet className="w-7 h-7 text-primary" />}
        description="Track total debt points and who has settled their losses."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <PiggyBank className="mb-2 h-5 w-5 text-primary" />
            <p className="font-display text-2xl text-white">
              {(fund?.totalFund || 0).toLocaleString()} pts
            </p>
            <p className="app-meta">Total Debt Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <AlertTriangle className="mb-2 h-5 w-5 text-accent" />
            <p className="font-display text-2xl text-white">
              {(fund?.betAmount || 5000).toLocaleString()} pts
            </p>
            <p className="app-meta">Per Loss</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white font-display text-lg flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Individual Debts
            <span className="ml-auto text-xs font-normal text-white/40">
              Each loss = {(fund?.betAmount || 5000).toLocaleString()} pts
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fund?.settledUsers?.length > 0 && (
            <div className="space-y-1">
              {fund.settledUsers.map((user: any) => (
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
                      {user.debt.toLocaleString()} pts
                    </span>
                    <Badge className="rounded-none border-primary/20 bg-primary/10 text-primary-light shrink-0">
                      <Check className="w-3 h-3 mr-0.5" />
                      Settled
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-white/48 shrink-0"
                      onClick={() => handleToggleSettled(user.userId, true)}
                    >
                      Undo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fund?.unsettledUsers?.length > 0 && (
            <>
              {fund.settledUsers?.length > 0 && <Separator className="my-3 bg-white/5" />}
              <div className="space-y-1">
                {fund.unsettledUsers.map((user: any) => (
                  <div
                    key={user.userId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-none border border-accent/18 bg-accent/6 p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{user.avatar}</span>
                      <div className="min-w-0">
                        <span className="text-sm text-white truncate block">{user.name}</span>
                        <p className="app-meta text-[#FFD890]">{user.losses} losses</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                      <span className="text-sm font-semibold text-[#FFD890] shrink-0">
                        {user.debt.toLocaleString()} pts
                      </span>
                      <Badge className="rounded-none border-accent/20 bg-accent/10 text-[#FFD890] shrink-0">
                        <AlertTriangle className="w-3 h-3 mr-0.5" />
                        Unsettled
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary shrink-0"
                        onClick={() => handleToggleSettled(user.userId, false)}
                      >
                        Mark Settled
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {fund?.settledUsers?.length === 0 && fund?.unsettledUsers?.length === 0 && (
            <p className="py-4 text-center text-sm text-white/45">
              No debt data yet. Start predicting!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
