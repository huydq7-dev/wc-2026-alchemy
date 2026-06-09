import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  pinChanged: boolean;
}

interface GameState {
  isLoggedIn: boolean;
  currentUser: UserInfo | null;
  login: (user: UserInfo) => void;
  logout: () => void;
  setPinChanged: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      currentUser: null,
      login: (user) => set({ isLoggedIn: true, currentUser: user }),
      logout: () => set({ isLoggedIn: false, currentUser: null }),
      setPinChanged: () => set((s) => ({
        currentUser: s.currentUser ? { ...s.currentUser, pinChanged: true } : null,
      })),
    }),
    { name: 'wc2026-auth' }
  )
);
