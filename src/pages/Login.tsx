import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, LogIn, AlertCircle, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGameStore } from '@/store/useGameStore'
import { api } from '@/api/client'
import { cn } from '@/lib/utils'

const USER_LIST = [
  { id: 'U01', name: 'Julian', avatar: '🦅' },
  { id: 'U02', name: 'Mountain', avatar: '⛰️' },
  { id: 'U03', name: 'Terry', avatar: '🦁' },
  { id: 'U04', name: 'Mike', avatar: '🐺' },
  { id: 'U05', name: 'Alfred', avatar: '🐉' },
  { id: 'U06', name: 'Stephen', avatar: '🦊' },
  { id: 'U07', name: 'Viktor', avatar: '🦚' },
  { id: 'U08', name: 'Curtis', avatar: '🐯' },
  { id: 'U09', name: 'Gavin', avatar: '🦋' },
  { id: 'U10', name: 'Don', avatar: '🐻' },
  { id: 'U11', name: 'Andrew', avatar: '🦉' },
]

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsPinChange, setNeedsPinChange] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const login = useGameStore(s => s.login)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!selectedUser) { setError('Please select a user'); return }
    if (!pin || pin.length < 4) { setError('Please enter PIN (4 digits)'); return }

    setError('')
    setLoading(true)

    try {
      const user = await api.login(selectedUser, pin)
      login(user)
      if (!user.pinChanged) {
        setNeedsPinChange(true)
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePin = async () => {
    if (!newPin || newPin.length < 4) { setError('New PIN must be at least 4 digits'); return }
    if (newPin !== confirmPin) { setError('PINs do not match'); return }

    setError('')
    setLoading(true)
    try {
      await api.changePin(selectedUser!, pin, newPin)
      useGameStore.getState().setPinChanged()
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to change PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') needsPinChange ? handleChangePin() : handleLogin()
  }

  if (needsPinChange) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <KeyRound className="w-12 h-12 text-[#F5A623] mx-auto mb-4" />
            <h1 className="font-display text-2xl text-white tracking-wider">Set Your PIN</h1>
            <p className="text-gray-500 mt-2 text-sm">First time login — please choose a new PIN</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              placeholder="New PIN (4-6 digits)"
              value={newPin}
              onChange={e => { setNewPin(e.target.value.replace(/\D/g, '')); setError('') }}
              className="bg-[#141929] border-white/10 text-white text-center text-xl tracking-[0.3em] h-14 rounded-xl focus:border-[#F5A623]"
              autoFocus
            />
            <Input
              type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              placeholder="Confirm new PIN"
              value={confirmPin}
              onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '')); setError('') }}
              onKeyDown={handleKeyDown}
              className="bg-[#141929] border-white/10 text-white text-center text-xl tracking-[0.3em] h-14 rounded-xl focus:border-[#F5A623]"
            />

            {error && (
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-400 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />{error}
              </motion.p>
            )}

            <Button
              onClick={handleChangePin}
              disabled={loading || newPin.length < 4 || confirmPin.length < 4}
              className="w-full h-12 bg-[#F5A623] hover:bg-[#F5A623]/80 text-[#0A0E1A] font-semibold rounded-xl text-base"
            >
              {loading ? <span className="animate-pulse">Saving...</span> : 'Set PIN & Continue'}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
            <Trophy className="w-16 h-16 text-[#F5A623] mx-auto mb-4" />
          </motion.div>
          <h1 className="font-display text-4xl text-white tracking-wider">
            WC<span className="text-[#C8102E]">2026</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Log in to make predictions</p>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-center">Select Player</p>
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
                <span className="text-[11px] text-gray-400 font-medium leading-tight text-center">{user.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Input
            type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            placeholder="Enter PIN"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
            onKeyDown={handleKeyDown}
            className="bg-[#141929] border-white/10 text-white text-center text-2xl tracking-[0.5em] h-14 rounded-xl focus:border-[#C8102E]"
            autoFocus
          />

          {error && (
            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-400 text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />{error}
            </motion.p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || !selectedUser || pin.length < 4}
            className="w-full h-12 bg-[#C8102E] hover:bg-[#C8102E]/80 text-white font-semibold rounded-xl text-base"
          >
            {loading ? (
              <span className="animate-pulse">Logging in...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />Log In
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Default PIN: last 4 digits of your user ID
        </p>
      </motion.div>
    </div>
  )
}
