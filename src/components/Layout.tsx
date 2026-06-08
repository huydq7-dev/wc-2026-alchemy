import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Trophy, Calendar, BarChart3, BookOpen, Wallet, Home, LogOut, Swords } from 'lucide-react'
import { useGameStore } from '@/store/useGameStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/schedule', icon: Calendar, label: 'Lịch & Cược' },
  { to: '/leaderboard', icon: BarChart3, label: 'BXH' },
  { to: '/rules', icon: BookOpen, label: 'Luật' },
  { to: '/fund', icon: Wallet, label: 'Quỹ' },
  { to: '/standings', icon: Swords, label: 'Bảng đấu' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0E1A]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#F5A623]" />
            <div>
              <h1 className="font-display text-2xl text-white tracking-wider">
                WC<span className="text-[#C8102E]">2026</span>
              </h1>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'bg-[#C8102E]/20 text-[#C8102E]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <UserMenu />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0E1A]/95 backdrop-blur border-t border-white/5">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-0',
                location.pathname === to
                  ? 'text-[#C8102E]'
                  : 'text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[64px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function UserMenu() {
  const user = useGameStore(s => s.currentUser)
  const logout = useGameStore(s => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-xl">{user.avatar}</span>
        <span className="text-sm text-white font-medium">{user.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Thoát</span>
      </Button>
    </div>
  )
}
