import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, LogIn, AlertCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/store/useGameStore";
import { useUsers } from "@/hooks/useUsers";
import { api } from "@/api/client";
import { cn } from "@/lib/utils";

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPinChange, setNeedsPinChange] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const { data: users, isLoading: usersLoading } = useUsers();
  const login = useGameStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!selectedUser) {
      setError("Please select a user");
      return;
    }
    if (!pin || pin.length < 4) {
      setError("Please enter PIN (4 digits)");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await api.login(selectedUser, pin);
      login(user);
      if (!user.pinChanged) {
        setNeedsPinChange(true);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!newPin || newPin.length < 4) {
      setError("New PIN must be at least 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.changePin(selectedUser!, pin, newPin);
      useGameStore.getState().setPinChanged();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to change PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (needsPinChange) {
        handleChangePin();
      } else {
        handleLogin();
      }
    }
  };

  if (needsPinChange) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060912] p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%),linear-gradient(135deg,_rgba(16,24,52,0.95),_rgba(7,10,20,1))]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-panel relative w-full max-w-md rounded-none p-7"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <p className="app-kicker justify-center">First Login</p>
            <h1 className="mt-3 font-display text-2xl tracking-[0.16em] text-white">
              Set Your PIN
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Choose a private PIN before entering the pool.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="New PIN (4-6 digits)"
              value={newPin}
              onChange={(e) => {
                setNewPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              className="h-14 rounded-2xl text-center text-xl tracking-[0.3em]"
              autoFocus
            />
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Confirm new PIN"
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              onKeyDown={handleKeyDown}
              className="h-14 rounded-2xl text-center text-xl tracking-[0.3em]"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-sm text-red-300"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.p>
            )}

            <Button
              onClick={handleChangePin}
              disabled={loading || newPin.length < 4 || confirmPin.length < 4}
              className="h-12 w-full rounded-2xl text-base"
            >
              {loading ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                "Set PIN & Continue"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060912] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%),linear-gradient(135deg,_rgba(16,24,52,0.95),_rgba(7,10,20,1))]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-panel relative w-full max-w-md rounded-none p-7"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <Trophy className="h-9 w-9 text-white" />
            </div>
          </motion.div>
          <p className="app-kicker justify-center">Internal Prediction Pool</p>
          <h1 className="mt-3 font-display text-4xl tracking-[0.18em] text-white">
            WC<span className="text-white/60">2026</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Log in to make predictions and track your rank.
          </p>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-center text-[10px] uppercase tracking-[0.28em] text-white/45">
            Select Player
          </p>
          <div className="grid grid-cols-4 gap-2">
            {usersLoading ? (
              <div className="col-span-4 py-4 text-center text-white/40">
                Loading...
              </div>
            ) : users ? (
              users.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user.id);
                    setError("");
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border p-3 transition-all",
                    selectedUser === user.id
                      ? "scale-[1.02] border-white/18 bg-white/12"
                      : "border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.06]",
                  )}
                >
                  <span className="text-3xl">{user.avatar}</span>
                  <span className="text-center text-[11px] leading-tight font-medium text-white/60">
                    {user.name}
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-4 py-4 text-center text-white/40">
                No users found
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className="h-14 rounded-2xl text-center text-2xl tracking-[0.5em]"
            autoFocus
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-sm text-red-300"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || !selectedUser || pin.length < 4}
            className="h-12 w-full rounded-2xl text-base"
          >
            {loading ? (
              <span className="animate-pulse">Logging in...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </>
            )}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-white/32">
          Default PIN: last 4 digits of your user ID
        </p>
      </motion.div>
    </div>
  );
}
