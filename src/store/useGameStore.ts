import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

interface GameState {
  isLoggedIn: boolean;
  currentUser: UserInfo | null;
  login: (user: UserInfo) => void;
  logout: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      currentUser: null,
      login: (user) => set({ isLoggedIn: true, currentUser: user }),
      logout: () => set({ isLoggedIn: false, currentUser: null }),
    }),
    { name: 'wc2026-auth' }
  )
);
