export function calculateResult(
  scoreA: number,
  scoreB: number,
  deal: string,
  dealSide: 'A' | 'B',
  pick: 'A' | 'B'
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
  const matchHour = parseInt(matchTime.split(':')[0]);
  const matchDateObj = new Date(`${matchDate}T${matchTime}:00+07:00`);

  let deadlineDate = new Date(matchDateObj);
  if (matchHour < 6) {
    deadlineDate.setDate(deadlineDate.getDate() - 1);
  }
  deadlineDate.setHours(17, 30, 0, 0);

  return new Date() < deadlineDate;
}
