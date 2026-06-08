import { initDB } from './db.js';
import db from './db.js';
import { syncMatches } from './services/openfootball.js';

initDB();

// Seed users
const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, name, avatar, pin, paid) VALUES (?, ?, ?, ?, ?)
`);

const users = [
  { id: 'U01', name: 'Minh Anh', avatar: '🦅', pin: '1111', paid: 1 },
  { id: 'U02', name: 'Tuấn Kiệt', avatar: '🐯', pin: '2222', paid: 1 },
  { id: 'U03', name: 'Hải Đăng', avatar: '🦁', pin: '3333', paid: 0 },
  { id: 'U04', name: 'Thu Hà', avatar: '🦊', pin: '4444', paid: 1 },
  { id: 'U05', name: 'Quang Huy', avatar: '🐉', pin: '5555', paid: 1 },
  { id: 'U06', name: 'Lan Phương', avatar: '🦋', pin: '6666', paid: 0 },
  { id: 'U07', name: 'Trọng Nghĩa', avatar: '🐺', pin: '7777', paid: 1 },
  { id: 'U08', name: 'Bích Ngọc', avatar: '🦚', pin: '8888', paid: 1 },
];

const seedUsers = db.transaction(() => {
  for (const u of users) {
    insertUser.run(u.id, u.name, u.avatar, u.pin, u.paid);
  }
});

// Seed matches from OpenFootball (async, done in main below)

// Seed rules
const insertRule = db.prepare(`
  INSERT OR IGNORE INTO rules (id, title, content, sort_order) VALUES (?, ?, ?, ?)
`);

const rules = [
  { id: 'R01', title: 'Thời hạn đặt cược', content: 'Trận sau 20:00 ngày D → Khóa cược lúc 17:30 ngày D. Trận sau 00:00 ngày D (sáng sớm) → Khóa cược lúc 17:30 ngày D-1.', order: 1 },
  { id: 'R02', title: 'Cách tính kết quả', content: 'Vòng bảng: Tính kết quả sau 2 hiệp chính (90 phút). Vòng Knock-out: Tính cả 2 hiệp phụ nếu có (không tính penalty shootout).', order: 2 },
  { id: 'R03', title: 'Hệ thống điểm', content: 'Đoán đúng: +1 điểm. Đoán sai: -1 điểm. Không đặt cược: 0 điểm. Nếu hòa Deal → cả hai bên không mất điểm (0 điểm).', order: 3 },
  { id: 'R04', title: 'Tỉ lệ chấp (Deal)', content: "Deal '-1': Đội nhận deal phải thắng hơn 1 bàn. Ví dụ: thắng 1-0 → hòa Deal. Thắng 2-0 → thắng Deal. Deal '+0.5': Đội nhận deal được cộng 0.5, hòa hoặc thua 0-1 đều tính thắng Deal.", order: 4 },
  { id: 'R05', title: 'Tiền cược & Quỹ nhóm', content: 'Mỗi ván cược = 5.000 VNĐ. Thua → nợ 5.000đ. Thắng hoặc Hòa → không mất tiền. Cuối giải, tổng nợ của tất cả thành viên tạo thành quỹ thưởng, chia theo thứ hạng: Hạng 1: 40%, Hạng 2: 30%, Hạng 3: 20%, Hạng 4: 10%.', order: 5 },
  { id: 'R06', title: 'Điều kiện hợp lệ', content: 'Mọi thành viên đều có thể đặt cược. Không thể thay đổi dự đoán sau khi đã khóa cược. Mỗi trận chỉ được chọn 1 lần.', order: 6 },
];

const seedRules = db.transaction(() => {
  for (const r of rules) {
    insertRule.run(r.id, r.title, r.content, r.order);
  }
});

async function main() {
  console.log('Seeding users...');
  seedUsers();

  console.log('Syncing matches from OpenFootball...');
  try {
    const result = await syncMatches();
    console.log(`  ${result.message}`);
  } catch (err: any) {
    console.error(`  Failed to sync matches: ${err.message}`);
    console.error('  Run POST /api/matches/sync later to retry.');
  }

  console.log('Seeding rules...');
  seedRules();

  console.log('Seed completed successfully!');
  console.log(`  - ${users.length} users`);
  console.log(`  - ${rules.length} rules`);
}

main();
