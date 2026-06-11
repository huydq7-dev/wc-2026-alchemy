import { initDB } from './db.js';
import db from './db.js';
import { syncMatches } from './services/openfootball.js';

const users = [
  {
    id: 'U01',
    name: 'Julian',
    avatar: '🦅',
    pin: '0101',
    paid: 1,
    is_admin: 1,
  },
  {
    id: 'U02',
    name: 'Mountain',
    avatar: '⛰️',
    pin: '0202',
    paid: 1,
    is_admin: 0,
  },
  { id: 'U03', name: 'Terry', avatar: '🦁', pin: '0303', paid: 1, is_admin: 1 },
  { id: 'U04', name: 'Mike', avatar: '🐺', pin: '0404', paid: 1, is_admin: 0 },
  {
    id: 'U05',
    name: 'Alfred',
    avatar: '🐉',
    pin: '0505',
    paid: 1,
    is_admin: 0,
  },
  {
    id: 'U06',
    name: 'Stephen',
    avatar: '🦊',
    pin: '0606',
    paid: 0,
    is_admin: 0,
  },
  {
    id: 'U07',
    name: 'Viktor',
    avatar: '🦚',
    pin: '0707',
    paid: 1,
    is_admin: 0,
  },
  {
    id: 'U08',
    name: 'Curtis',
    avatar: '🐯',
    pin: '0808',
    paid: 1,
    is_admin: 0,
  },
  { id: 'U09', name: 'Gavin', avatar: '🦋', pin: '0909', paid: 0, is_admin: 0 },
  { id: 'U10', name: 'Don', avatar: '🐻', pin: '1010', paid: 1, is_admin: 0 },
  {
    id: 'U11',
    name: 'Andrew',
    avatar: '🦉',
    pin: '1111',
    paid: 0,
    is_admin: 0,
  },
];

const rules = [
  {
    id: 'R01',
    title: 'Prediction Deadline',
    content:
      'Predictions are locked 30 minutes before each match kicks off. Make sure to place your pick before then.',
    order: 1,
  },
  {
    id: 'R02',
    title: 'Result Calculation',
    content:
      'Group Stage: Result after 90 mins (regular time). Knockout: Includes extra time if any (no penalty shootout).',
    order: 2,
  },
  {
    id: 'R03',
    title: 'Points System',
    content:
      'Correct prediction: +1 point. Wrong: -1 point. No prediction: 0 points. Deal draw → both sides 0 points.',
    order: 3,
  },
  {
    id: 'R04',
    title: 'Deal (Handicap)',
    content:
      "Deal '-1': Team receiving deal must win by more than 1 goal. E.g. win 1-0 → Deal draw. Win 2-0 → Deal win. Deal '+0.5': Team gets +0.5 added, draw or lose 0-1 still counts as Deal win.",
    order: 4,
  },
  {
    id: 'R05',
    title: 'Bet Amount & Prize Pool',
    content:
      'Each bet = 5,000 VND. Lose → owe 5,000 VND. Win or Draw → no charge. At end of tournament, total debt forms the prize pool, drink and party together.',
    order: 5,
  },
  {
    id: 'R06',
    title: 'Rules',
    content:
      'All members can predict. Cannot change prediction after deadline. One pick per match.',
    order: 6,
  },
];

async function main() {
  await initDB();

  console.log('Seeding users...');
  await db.batch(
    users.map((u) => ({
      sql: 'INSERT OR REPLACE INTO users (id, name, avatar, pin, paid, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
      args: [u.id, u.name, u.avatar, u.pin, u.paid, u.is_admin],
    })),
    'write',
  );

  console.log('Syncing matches from OpenFootball...');
  try {
    const result = await syncMatches();
    console.log(`  ${result.message}`);
  } catch (err: any) {
    console.error(`  Failed to sync matches: ${err.message}`);
    console.error('  Run POST /api/matches/sync later to retry.');
  }

  console.log('Seeding rules...');
  await db.batch(
    rules.map((r) => ({
      sql: 'INSERT OR REPLACE INTO rules (id, title, content, sort_order) VALUES (?, ?, ?, ?)',
      args: [r.id, r.title, r.content, r.order],
    })),
    'write',
  );

  console.log('Seed completed successfully!');
  console.log(`  - ${users.length} users`);
  console.log(`  - ${rules.length} rules`);
}

main();
