export function calculateResult(
  scoreA: number,
  scoreB: number,
  deal: string,
  dealSide: 'A' | 'B',
  pick: 'A' | 'B',
): 'win' | 'lose' | 'draw' {
  const dealValue = parseFloat(deal);

  let adjustedA = scoreA;
  let adjustedB = scoreB;
  if (dealSide === 'A') adjustedA += dealValue;
  else adjustedB += dealValue;

  let dealWinner: 'A' | 'B' | 'draw';
  if (adjustedA > adjustedB) dealWinner = 'A';
  else if (adjustedB > adjustedA) dealWinner = 'B';
  else dealWinner = 'draw';

  if (dealWinner === 'draw') return 'draw';
  if (dealWinner === pick) return 'win';
  return 'lose';
}

export function isPickAllowed(matchDate: string, matchTime: string): boolean {
  const matchDateObj = new Date(`${matchDate}T${matchTime}:00+07:00`);
  // Deadline is 15 minutes before kickoff
  const deadlineDate = new Date(matchDateObj.getTime() - 15 * 60 * 1000);
  return new Date() < deadlineDate;
}

const MATCH_DURATION_MS = 150 * 60 * 1000; // 2.5h covers 90min + halftime + added time

/**
 * Derive the real match status from kickoff time vs. current time.
 * DB status is treated as the source of truth when it's 'finished'
 * (admin-confirmed with scores), otherwise we compute from time.
 */
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

  // DB says 'upcoming' — verify against clock
  if (now < matchStart) return 'upcoming';
  if (now < matchStart + MATCH_DURATION_MS) return 'live';
  return 'finished';
}
