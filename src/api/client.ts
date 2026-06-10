import { useGameStore } from '@/store/useGameStore';

const BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
  const userId = useGameStore.getState().currentUser?.id;
  return userId ? { 'x-user-id': userId } : {};
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Users
  getUsers: () => request<any[]>('/users'),
  getUserProfile: (id: string) => request<any>(`/users/${id}`),
  updateUser: (id: string, data: { paid: boolean }) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Matches
  getMatches: (params?: { status?: string; stage?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.stage) sp.set('stage', params.stage);
    const qs = sp.toString();
    return request<any[]>(`/matches${qs ? `?${qs}` : ''}`);
  },
  getNextMatch: () => request<any | null>('/matches/next'),
  getMatch: (id: string) => request<any>(`/matches/${id}`),
  updateMatch: (id: string, data: { status?: string; score_a?: number; score_b?: number; deal?: string; deal_side?: string }) =>
    request(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getMatchPickable: (id: string) => request<{ pickable: boolean }>(`/matches/${id}/pickable`),

  // Predictions
  getPredictions: (params?: { userId?: string; matchId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.userId) sp.set('userId', params.userId);
    if (params?.matchId) sp.set('matchId', params.matchId);
    const qs = sp.toString();
    return request<any[]>(`/predictions${qs ? `?${qs}` : ''}`);
  },
  placePrediction: (data: { userId: string; matchId: string; pick: 'A' | 'B' }) =>
    request('/predictions', { method: 'POST', body: JSON.stringify(data) }),
  getUserHistory: (userId: string) =>
    request<{ predictions: any[]; stats: any }>(`/predictions/user/${userId}/history`),

  // Leaderboard
  getLeaderboard: () => request<any>('/leaderboard'),

  // Fund
  getFund: () => request<any>('/fund'),
  updateFundUser: (id: string, paid: boolean) =>
    request(`/fund/users/${id}`, { method: 'PATCH', body: JSON.stringify({ paid }) }),

  // Auth
  login: (userId: string, pin: string) =>
    request<{ id: string; name: string; avatar: string; paid: boolean; debtPaid: boolean; isAdmin: boolean; pinChanged: boolean }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ userId, pin }) }
    ),
  changePin: (userId: string, oldPin: string, newPin: string) =>
    request<{ success: boolean; message: string }>('/auth/change-pin', { method: 'POST', body: JSON.stringify({ userId, oldPin, newPin }) }),
  resetPin: (userId: string) =>
    request<{ success: boolean; message: string }>('/auth/reset-pin', { method: 'POST', body: JSON.stringify({ userId }) }),

  // Rules
  getRules: () => request<any[]>('/rules'),

  // Sync
  syncMatches: () =>
    request<{ synced: number; message: string }>('/matches/sync', { method: 'POST' }),
  syncOdds: () =>
    request<{ updated: number; message: string }>('/matches/sync-odds', { method: 'POST' }),

  // Standings & Bracket
  getStandings: () => request<any>('/standings'),
  getBracket: () => request<any>('/bracket'),

  // Teams & Squad
  getTeams: () => request<{ teams: any[] }>('/teams'),
  getSquad: (teamCode: string) => request<{ squad: any }>(`/teams/${teamCode}/squad`),

  // Activity
  getActivity: (params?: { page?: number; limit?: number; action?: string; userId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.action) sp.set('action', params.action);
    if (params?.userId) sp.set('userId', params.userId);
    const qs = sp.toString();
    return request<any>(`/activity${qs ? `?${qs}` : ''}`);
  },
};
