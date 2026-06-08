import { Wallet, Check, AlertTriangle, PiggyBank, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toast } from 'sonner'

export default function Fund() {
  const queryClient = useQueryClient()
  const { data: fund, isLoading } = useQuery({
    queryKey: ['fund'],
    queryFn: () => api.getFund(),
  })

  const handleTogglePaid = async (userId: string, currentPaid: boolean) => {
    try {
      await api.updateFundUser(userId, !currentPaid)
      queryClient.invalidateQueries({ queryKey: ['fund'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      toast.success('Cập nhật trạng thái thành công')
    } catch {
      toast.error('Lỗi khi cập nhật')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-8 w-40 bg-[#141929] rounded animate-pulse" />
        <div className="h-64 bg-[#141929] rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-white tracking-wider flex items-center gap-2">
        <Wallet className="w-7 h-7 text-[#C8102E]" />
        Quỹ nhóm
      </h1>

      {/* Fund Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-[#141929] border-white/5">
          <CardContent className="p-4">
            <PiggyBank className="w-5 h-5 text-[#F5A623] mb-2" />
            <p className="font-display text-2xl text-white">
              {(fund?.totalFund || 0).toLocaleString()} đ
            </p>
            <p className="text-xs text-gray-500">Tổng quỹ dự kiến</p>
          </CardContent>
        </Card>
        <Card className="bg-[#141929] border-white/5">
          <CardContent className="p-4">
            <Banknote className="w-5 h-5 text-green-400 mb-2" />
            <p className="font-display text-2xl text-white">
              {(fund?.betAmount || 5000).toLocaleString()} đ
            </p>
            <p className="text-xs text-gray-500">Tiền mỗi ván</p>
          </CardContent>
        </Card>
      </div>

      {/* Debt List */}
      <Card className="bg-[#141929] border-white/5">
        <CardHeader>
          <CardTitle className="text-white font-display text-lg flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#F5A623]" />
            Nợ cá nhân
            <span className="text-xs text-gray-500 font-normal ml-auto">
              Mỗi ván thua = {(fund?.betAmount || 5000).toLocaleString()} đ
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Paid Users */}
          {fund?.paidUsers?.length > 0 && (
            <div className="space-y-1">
              {fund.paidUsers.map((user: any) => (
                <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{user.avatar}</span>
                    <div>
                      <span className="text-sm text-white">{user.name}</span>
                      <p className="text-[10px] text-gray-500">{user.losses} trận thua</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 font-medium">
                      {user.debt.toLocaleString()} đ
                    </span>
                    <Badge className="bg-green-500/15 text-green-400 text-[10px] border-green-500/20">
                      <Check className="w-3 h-3 mr-0.5" /> Đã đóng
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500 h-7"
                      onClick={() => handleTogglePaid(user.userId, true)}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unpaid Users */}
          {fund?.unpaidUsers?.length > 0 && (
            <>
              {fund.paidUsers?.length > 0 && <Separator className="my-3 bg-white/5" />}
              <div className="space-y-1">
                {fund.unpaidUsers.map((user: any) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg bg-red-500/[0.02] border border-red-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{user.avatar}</span>
                      <div>
                        <span className="text-sm text-white">{user.name}</span>
                        <p className="text-[10px] text-red-400">{user.losses} trận thua</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-400 font-semibold">
                        {user.debt.toLocaleString()} đ
                      </span>
                      <Badge className="bg-red-500/15 text-red-400 text-[10px] border-red-500/20">
                        <AlertTriangle className="w-3 h-3 mr-0.5" /> Chưa đóng
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-green-400 h-7"
                        onClick={() => handleTogglePaid(user.userId, false)}
                      >
                        Đã đóng
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {fund?.paidUsers?.length === 0 && fund?.unpaidUsers?.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">
              Chưa có dữ liệu nợ. Hãy bắt đầu đặt cược!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prize Distribution */}
      {fund?.totalFund > 0 && (
        <Card className="bg-[#141929] border-white/5">
          <CardHeader>
            <CardTitle className="text-white font-display text-lg flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-[#F5A623]" />
              Dự kiến thưởng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fund?.prizes?.map((prize: any) => (
                <div
                  key={prize.rank}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    prize.rank === 1 && 'bg-[#F5A623]/5 border-[#F5A623]/10',
                    prize.rank !== 1 && 'bg-white/[0.02] border-white/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl w-8 text-center">
                      {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : prize.rank === 3 ? '🥉' : `#${prize.rank}`}
                    </span>
                    <div>
                      <p className="text-sm text-white font-semibold">
                        {prize.user?.name || 'Chưa xác định'}
                      </p>
                      {prize.user && (
                        <p className="text-xs text-gray-500">
                          {prize.user.totalPoints > 0 ? '+' : ''}{prize.user.totalPoints} điểm
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-[#F5A623]">{prize.amount.toLocaleString()} đ</p>
                    <p className="text-[10px] text-gray-500">{prize.percentage}% quỹ</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              * Dự kiến dựa trên bảng xếp hạng hiện tại. Tổng quỹ = tổng nợ của tất cả thành viên.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
