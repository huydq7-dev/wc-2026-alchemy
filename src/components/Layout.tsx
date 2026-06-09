import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Trophy, Calendar, BarChart3, BookOpen, Wallet, Home, LogOut, Swords, Activity } from 'lucide-react'
import { useGameStore } from '@/store/useGameStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/leaderboard', icon: BarChart3, label: 'Rank' },
  { to: '/rules', icon: BookOpen, label: 'Rules' },
  { to: '/fund', icon: Wallet, label: 'Prize' },
  { to: '/standings', icon: Swords, label: 'Standings' },
  { to: '/activity', icon: Activity, label: 'Activity' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-50 border-b border-[#17307C] bg-[#08113E]/84 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-[#17307C] bg-[#0B1543]">
              <Trophy className="h-5 w-5 text-[#60E6F6]" />
            </div>
            <div>
              <p className="app-kicker">Alchemy Pool</p>
              <h1 className="font-display text-2xl leading-none tracking-[0.18em] text-white">
                WC<span className="text-[#60E6F6]">2026</span>
              </h1>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 border border-white/8 bg-white/[0.03] p-1.5 md:flex">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 rounded-none px-3.5 py-2 text-sm font-medium transition-colors',
                  location.pathname === to
                    ? 'bg-white text-[#09112B]'
                    : 'text-white/50 hover:bg-white/6 hover:text-white'
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
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#17307C] bg-[#08113E]/88 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex min-w-0 flex-col items-center gap-0.5 rounded-none px-3 py-1.5 text-xs font-medium transition-colors',
                location.pathname === to
                  ? 'bg-white text-[#09112B]'
                  : 'text-white/40'
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
      <div className="hidden items-center gap-2 sm:flex">
        <span className="text-xl">{user.avatar}</span>
        <span className="text-sm font-medium text-white">{user.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-white/48 hover:bg-white/6 hover:text-white"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Logout</span>
      </Button>
    </div>
  )
}
