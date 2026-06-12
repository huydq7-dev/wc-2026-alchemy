import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MATCH_DURATION_MS = 150 * 60 * 1000;

/** Client-side fallback: derive real status from kickoff time vs. clock. */
export function getEffectiveStatus(
  dbStatus: string,
  matchDate: string,
  matchTime: string,
): 'upcoming' | 'live' | 'finished' {
  if (dbStatus === 'finished') return 'finished';

  const matchStart = new Date(`${matchDate}T${matchTime}:00+07:00`).getTime();
  const now = Date.now();

  if (dbStatus === 'live') {
    return now > matchStart + MATCH_DURATION_MS ? 'finished' : 'live';
  }

  if (now < matchStart) return 'upcoming';
  if (now < matchStart + MATCH_DURATION_MS) return 'live';
  return 'finished';
}
