import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, LogIn, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGameStore } from '@/store/useGameStore'
import { api } from '@/api/client'
import { cn } from '@/lib/utils'

const USER_LIST = [
  { id: 'U01', name: 'Minh Anh', avatar: '🦅' },
  { id: 'U02', name: 'Tuấn Kiệt', avatar: '🐯' },
  { id: 'U03', name: 'Hải Đăng', avatar: '🦁' },
  { id: 'U04', name: 'Thu Hà', avatar: '🦊' },
  { id: 'U05', name: 'Quang Huy', avatar: '🐉' },
  { id: 'U06', name: 'Lan Phương', avatar: '🦋' },
  { id: 'U07', name: 'Trọng Nghĩa', avatar: '🐺' },
  { id: 'U08', name: 'Bích Ngọc', avatar: '🦚' },
]

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useGameStore(s => s.login)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!selectedUser) {
      setError('Vui lòng chọn người chơi')
      return
    }
    if (!pin || pin.length < 4) {
      setError('Vui lòng nhập PIN (4 số)')
      return
    }

    setError('')
    setLoading(true)

    try {
      const user = await api.login(selectedUser, pin)
      login(user)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
          >
            <Trophy className="w-16 h-16 text-[#F5A623] mx-auto mb-4" />
          </motion.div>
          <h1 className="font-display text-4xl text-white tracking-wider">
            WC<span className="text-[#C8102E]">2026</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Đăng nhập để dự đoán</p>
        </div>

        {/* User Grid */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-center">Chọn người chơi</p>
          <div className="grid grid-cols-4 gap-2">
            {USER_LIST.map((user) => (
              <button
                key={user.id}
                onClick={() => { setSelectedUser(user.id); setError('') }}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                  selectedUser === user.id
                    ? 'border-[#C8102E] bg-[#C8102E]/10 scale-105'
                    : 'border-white/5 bg-[#141929] hover:border-white/20 hover:bg-[#141929]/80'
                )}
              >
                <span className="text-3xl">{user.avatar}</span>
                <span className="text-[11px] text-gray-400 font-medium leading-tight text-center">
                  {user.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* PIN Input */}
        <div className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="Nhập PIN 4 số"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
            onKeyDown={handleKeyDown}
            className="bg-[#141929] border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14 rounded-xl focus:border-[#C8102E]"
            autoFocus
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-400 text-sm flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || !selectedUser || pin.length < 4}
            className="w-full h-12 bg-[#C8102E] hover:bg-[#C8102E]/80 text-white font-semibold rounded-xl text-base"
          >
            {loading ? (
              <span className="animate-pulse">Đang đăng nhập...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          PIN mặc định: 1111 cho Minh Anh, 2222 cho Tuấn Kiệt, ...
        </p>
      </motion.div>
    </div>
  )
}
