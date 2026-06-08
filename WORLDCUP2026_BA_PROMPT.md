# 🏆 BA DOCUMENT + AI PROMPT — WORLD CUP 2026 PREDICTION SYSTEM
**Dự án:** Alchemy Group — World Cup 2026 Prediction Web  
**Phiên bản:** 2.0  
**Mục tiêu:** Thay thế file Excel bằng nền tảng Web hiện đại, tương tác thời gian thực, có Leaderboard động.

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan)
2. [Dữ liệu mẫu (Sample Data)](#2-dữ-liệu-mẫu)
3. [Cấu trúc thực thể (Data Entities)](#3-cấu-trúc-thực-thể)
4. [Logic nghiệp vụ (Business Logic)](#4-logic-nghiệp-vụ)
5. [Tính năng chi tiết (Features)](#5-tính-năng)
6. [UI/UX Guidelines](#6-uiux-guidelines)
7. [Prompt chính cho AI](#7-prompt-chính)

---

## 1. TỔNG QUAN

Hệ thống cho phép các thành viên nhóm:
- Xem **lịch thi đấu** World Cup 2026
- **Đặt cược** (dự đoán đội thắng) dựa trên tỉ lệ chấp (Deal)
- Theo dõi **Leaderboard** tự động cập nhật theo kết quả thực tế
- Quản lý **quỹ nhóm** (ai nợ tiền, ai đã đóng)

---

## 2. DỮ LIỆU MẪU

### 2.1 Danh sách người chơi (Users)

```json
[
  { "id": "U01", "name": "Minh Anh",   "avatar": "🦅", "paid": true,  "totalPoints": 0, "balance": 0 },
  { "id": "U02", "name": "Tuấn Kiệt",  "avatar": "🐯", "paid": true,  "totalPoints": 0, "balance": 0 },
  { "id": "U03", "name": "Hải Đăng",   "avatar": "🦁", "paid": false, "totalPoints": 0, "balance": -50000 },
  { "id": "U04", "name": "Thu Hà",     "avatar": "🦊", "paid": true,  "totalPoints": 0, "balance": 0 },
  { "id": "U05", "name": "Quang Huy",  "avatar": "🐉", "paid": true,  "totalPoints": 0, "balance": 0 },
  { "id": "U06", "name": "Lan Phương", "avatar": "🦋", "paid": false, "totalPoints": 0, "balance": -50000 },
  { "id": "U07", "name": "Trọng Nghĩa","avatar": "🐺", "paid": true,  "totalPoints": 0, "balance": 0 },
  { "id": "U08", "name": "Bích Ngọc",  "avatar": "🦚", "paid": true,  "totalPoints": 0, "balance": 0 }
]
```

### 2.2 Lịch thi đấu (Schedule)

```json
[
  {
    "id": "M001",
    "date": "2026-06-11",
    "time": "20:00",
    "teamA": { "name": "Mexico",    "code": "MX", "flag": "🇲🇽" },
    "teamB": { "name": "USA",       "code": "US", "flag": "🇺🇸" },
    "deal": "+0.5",
    "dealSide": "A",
    "venue": "SoFi Stadium, Los Angeles",
    "stage": "Group A",
    "status": "upcoming",
    "scoreA": null,
    "scoreB": null
  },
  {
    "id": "M002",
    "date": "2026-06-12",
    "time": "02:00",
    "teamA": { "name": "Brazil",    "code": "BR", "flag": "🇧🇷" },
    "teamB": { "name": "Croatia",   "code": "HR", "flag": "🇭🇷" },
    "deal": "-1",
    "dealSide": "A",
    "venue": "MetLife Stadium, New York",
    "stage": "Group B",
    "status": "upcoming",
    "scoreA": null,
    "scoreB": null
  },
  {
    "id": "M003",
    "date": "2026-06-12",
    "time": "20:00",
    "teamA": { "name": "Argentina", "code": "AR", "flag": "🇦🇷" },
    "teamB": { "name": "Nigeria",   "code": "NG", "flag": "🇳🇬" },
    "deal": "-1.5",
    "dealSide": "A",
    "venue": "Rose Bowl, Pasadena",
    "stage": "Group C",
    "status": "live",
    "scoreA": 1,
    "scoreB": 0
  },
  {
    "id": "M004",
    "date": "2026-06-13",
    "time": "03:00",
    "teamA": { "name": "France",    "code": "FR", "flag": "🇫🇷" },
    "teamB": { "name": "Germany",   "code": "DE", "flag": "🇩🇪" },
    "deal": "-0.5",
    "dealSide": "A",
    "venue": "AT&T Stadium, Dallas",
    "stage": "Group D",
    "status": "finished",
    "scoreA": 2,
    "scoreB": 1
  },
  {
    "id": "M005",
    "date": "2026-06-13",
    "time": "20:00",
    "teamA": { "name": "Spain",     "code": "ES", "flag": "🇪🇸" },
    "teamB": { "name": "Japan",     "code": "JP", "flag": "🇯🇵" },
    "deal": "-1",
    "dealSide": "A",
    "venue": "Levi's Stadium, San Jose",
    "stage": "Group E",
    "status": "finished",
    "scoreA": 3,
    "scoreB": 1
  },
  {
    "id": "M006",
    "date": "2026-06-14",
    "time": "02:00",
    "teamA": { "name": "England",   "code": "GB-ENG", "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    "teamB": { "name": "Portugal",  "code": "PT", "flag": "🇵🇹" },
    "deal": "+0.5",
    "dealSide": "B",
    "venue": "Gillette Stadium, Boston",
    "stage": "Group F",
    "status": "finished",
    "scoreA": 1,
    "scoreB": 2
  }
]
```

### 2.3 Dự đoán (Predictions)

```json
[
  { "userId": "U01", "matchId": "M001", "pick": "A", "result": null, "points": null },
  { "userId": "U01", "matchId": "M004", "pick": "A", "result": "win", "points": 1 },
  { "userId": "U01", "matchId": "M005", "pick": "A", "result": "win", "points": 1 },
  { "userId": "U01", "matchId": "M006", "pick": "B", "result": "win", "points": 1 },
  { "userId": "U02", "matchId": "M004", "pick": "B", "result": "lose", "points": -1 },
  { "userId": "U02", "matchId": "M005", "pick": "A", "result": "win", "points": 1 },
  { "userId": "U03", "matchId": "M004", "pick": "A", "result": "win", "points": 1 },
  { "userId": "U03", "matchId": "M006", "pick": "A", "result": "lose", "points": -1 },
  { "userId": "U04", "matchId": "M005", "pick": "B", "result": "lose", "points": -1 },
  { "userId": "U04", "matchId": "M006", "pick": "B", "result": "win", "points": 1 }
]
```

### 2.4 Luật chơi (Rules)

```json
[
  {
    "id": "R01",
    "title": "Thời hạn đặt cược",
    "content": "Trận sau 20:00 ngày D → Khóa cược lúc 17:30 ngày D. Trận sau 00:00 ngày D (sáng sớm) → Khóa cược lúc 17:30 ngày D-1."
  },
  {
    "id": "R02",
    "title": "Cách tính kết quả",
    "content": "Vòng bảng: Tính kết quả sau 2 hiệp chính (90 phút). Vòng Knock-out: Tính cả 2 hiệp phụ nếu có (không tính penalty shootout)."
  },
  {
    "id": "R03",
    "title": "Hệ thống điểm",
    "content": "Đoán đúng: +1 điểm. Đoán sai: -1 điểm. Không đặt cược: 0 điểm."
  },
  {
    "id": "R04",
    "title": "Tỉ lệ chấp (Deal)",
    "content": "Deal '-1': Đội A phải thắng hơn 1 bàn. Tức là thắng 1-0 → hòa Deal. Thắng 2-0 → Đội A thắng Deal. Deal '+0.5': Đội A được cộng 0.5, hòa hoặc thua 0-1 đều tính Đội A thắng Deal. Nếu hòa Deal → cả hai bên không mất điểm (0 điểm)."
  },
  {
    "id": "R05",
    "title": "Quỹ nhóm",
    "content": "Mỗi thành viên đóng 50.000 VNĐ vào quỹ. Cuối giải, quỹ lấy đi nhậu."
  },
  {
    "id": "R06",
    "title": "Điều kiện hợp lệ",
    "content": "Chỉ đặt được khi đã đóng quỹ. Không thể thay đổi dự đoán sau khi đã khóa cược."
  }
]
```

---

## 3. CẤU TRÚC THỰC THỂ

```typescript
// === MATCH ===
interface Match {
  id: string;               // "M001"
  date: string;             // "YYYY-MM-DD"
  time: string;             // "HH:MM" (Vietnam time, UTC+7)
  teamA: Team;
  teamB: Team;
  deal: string;             // "-1", "+0.5", "0"
  dealSide: "A" | "B";     // Deal áp dụng cho đội nào
  venue: string;
  stage: string;            // "Group A", "Round of 16", "Semi-final", "Final"
  status: "upcoming" | "live" | "finished";
  scoreA: number | null;
  scoreB: number | null;
}

interface Team {
  name: string;
  code: string;             // ISO country code
  flag: string;             // Emoji flag
}

// === USER ===
interface User {
  id: string;
  name: string;
  avatar: string;           // Emoji
  paid: boolean;
  totalPoints: number;      // Tự tính từ predictions
  balance: number;          // Dương = được nhận, Âm = còn nợ (VNĐ)
}

// === PREDICTION ===
interface Prediction {
  userId: string;
  matchId: string;
  pick: "A" | "B";
  result: "win" | "lose" | "draw" | null;  // null = chưa có kết quả
  points: 1 | -1 | 0 | null;
}

// === LEADERBOARD ENTRY ===
interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  totalPoints: number;
  wins: number;
  losses: number;
  draws: number;
  pendingBets: number;      // Số trận đã cược chưa có kết quả
  trend: "up" | "down" | "same";  // So với kỳ trước
  isPaid: boolean;
}
```

---

## 4. LOGIC NGHIỆP VỤ

### 4.1 Hàm tính kết quả Deal

```typescript
/**
 * Tính kết quả Deal cho một trận đấu.
 * deal: "-1" | "+0.5" | "-1.5" | "0" | ...
 * dealSide: "A" hoặc "B" — đội nhận tỉ lệ chấp
 * pick: "A" hoặc "B" — người chơi chọn đội nào
 * Trả về: "win" | "lose" | "draw"
 */
function calculateResult(
  scoreA: number,
  scoreB: number,
  deal: string,
  dealSide: "A" | "B",
  pick: "A" | "B"
): "win" | "lose" | "draw" {
  const dealValue = parseFloat(deal);
  
  // Áp dụng deal vào điểm
  let adjustedA = scoreA;
  let adjustedB = scoreB;
  if (dealSide === "A") adjustedA += dealValue;
  else adjustedB += dealValue;

  // Xác định đội thắng sau deal
  let dealWinner: "A" | "B" | "draw";
  if (adjustedA > adjustedB) dealWinner = "A";
  else if (adjustedB > adjustedA) dealWinner = "B";
  else dealWinner = "draw";

  if (dealWinner === "draw") return "draw";        // 0 điểm
  if (dealWinner === pick) return "win";            // +1 điểm
  return "lose";                                    // -1 điểm
}
```

### 4.2 Hàm kiểm tra thời hạn cược

```typescript
/**
 * Kiểm tra xem trận đấu có còn trong thời gian cho phép cược không.
 * Giờ cắt mặc định: 17:30 cùng ngày (nếu trận >= 20:00)
 * Hoặc 17:30 ngày hôm trước (nếu trận đấu 00:00 - 06:00 sáng hôm sau)
 */
function isPickAllowed(matchDate: string, matchTime: string): boolean {
  const matchHour = parseInt(matchTime.split(":")[0]);
  const matchDateObj = new Date(`${matchDate}T${matchTime}:00+07:00`);

  let deadlineDate = new Date(matchDateObj);
  if (matchHour < 6) {
    // Trận sáng sớm → deadline 17:30 ngày hôm trước
    deadlineDate.setDate(deadlineDate.getDate() - 1);
  }
  deadlineDate.setHours(17, 30, 0, 0);

  return new Date() < deadlineDate;
}
```

### 4.3 Hàm tính Leaderboard

```typescript
function buildLeaderboard(users: User[], predictions: Prediction[]): LeaderboardEntry[] {
  return users
    .map(user => {
      const userPreds = predictions.filter(p => p.userId === user.id);
      const wins   = userPreds.filter(p => p.result === "win").length;
      const losses = userPreds.filter(p => p.result === "lose").length;
      const draws  = userPreds.filter(p => p.result === "draw").length;
      const pending = userPreds.filter(p => p.result === null).length;
      const totalPoints = wins - losses; // draws = 0 điểm

      return {
        rank: 0, // gán sau khi sort
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        totalPoints,
        wins,
        losses,
        draws,
        pendingBets: pending,
        trend: "same",
        isPaid: user.paid,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
```

---

## 5. TÍNH NĂNG

### 5.1 Dashboard (Trang chủ)
- **Hero Section**: Countdown đến trận đấu tiếp theo
- **Live Match Banner**: Nổi bật khi có trận đang diễn ra (animation nhấp nháy)
- **Mini Leaderboard**: Top 3 người dẫn đầu
- **Thống kê nhanh**: Tổng số trận, số đã có kết quả, số trận người dùng đã cược

### 5.2 Trang Lịch & Cược (`/schedule`)
- Lọc theo: Tất cả / Hôm nay / Sắp diễn ra / Đã kết thúc
- Mỗi Match Card hiển thị:
  - Cờ + Tên 2 đội
  - Tỉ lệ Deal (nổi bật ở giữa)
  - Tỉ số (nếu đã có) hoặc Giờ đấu
  - Nút [Chọn Đội A] / [Chọn Đội B] — disabled nếu quá deadline hoặc trận đã xong
  - Badge: LIVE / FINISHED / `HH:MM còn lại`
  - Trạng thái cược cá nhân: chưa cược / đã chọn A / đã chọn B (hiển thị dấu ✅)

### 5.3 Leaderboard (`/leaderboard`)

**Bảng xếp hạng đầy đủ với:**

| # | Avatar | Tên | Điểm | Thắng | Thua | Hòa | Đang chờ | Trạng thái |
|---|--------|-----|------|-------|------|-----|----------|------------|
| 1 | 🦅 | Minh Anh | +3 | 3 | 0 | 0 | 1 | ✅ Đã đóng |
| 2 | 🐯 | Tuấn Kiệt | +1 | 1 | 0 | 0 | 0 | ✅ Đã đóng |
| ... |

**Tính năng Leaderboard:**
- Sắp xếp theo: Điểm / Tỉ lệ thắng / Số trận đã cược
- Highlight hàng của người dùng hiện tại
- Mũi tên xu hướng: ▲ lên / ▼ xuống / ─ giữ nguyên (so với trận trước)
- Ô màu đỏ cho người chưa đóng tiền
- Thanh progress bar điểm so với người dẫn đầu
- Click vào tên → mở modal xem toàn bộ lịch sử cược của người đó

### 5.4 Chi tiết trận đấu (`/match/:id`)
- Tỉ số đầy đủ
- Bảng "Ai đoán gì?" — hiển thị pick của tất cả thành viên
- Giải thích kết quả Deal bằng text dễ hiểu: *"France thắng 2-1, với deal -0.5, France thắng deal → Người chọn France: +1 điểm"*

### 5.5 Trang Luật chơi (`/rules`)
- Accordion đẹp mắt cho từng điều luật
- Ví dụ minh họa tương tác cho cách tính Deal

### 5.6 Quản lý quỹ (`/fund`) *(Admin only)*
- Danh sách đã đóng / chưa đóng
- Tổng quỹ hiện tại
- Dự kiến phần thưởng theo thứ hạng hiện tại

---

## 6. UI/UX GUIDELINES

### Màu sắc (World Cup 2026 Brand)
```css
:root {
  --primary:    #C8102E;   /* Đỏ FIFA */
  --secondary:  #003087;   /* Xanh đậm */
  --accent:     #F5A623;   /* Vàng gold */
  --success:    #00B140;   /* Xanh lá thắng */
  --danger:     #E63946;   /* Đỏ thua */
  --neutral:    #8E9AAF;   /* Xám hòa */
  --bg-dark:    #0A0E1A;   /* Nền tối */
  --bg-card:    #141929;   /* Card tối */
  --text:       #F0F4FF;
}
```

### Typography
- Display font: `Bebas Neue` hoặc `Barlow Condensed` — cho số điểm, tên đội
- Body font: `Inter` hoặc `Outfit` — cho nội dung thường
- Số điểm lớn, bold, có màu xanh (dương) hoặc đỏ

### Components ưu tiên
- **Match Card**: Glassmorphism với border gradient khi được chọn
- **Leaderboard Row**: Highlight với glow effect cho Top 1
- **Deal Badge**: Pill với màu nổi bật, font mono
- **Countdown**: Flip clock animation (giờ:phút:giây)
- **Live Badge**: Dot nhấp nháy màu đỏ

### Responsive
- **Mobile-first**: Card stack, bottom navigation
- **Desktop**: Sidebar leaderboard + main content
- **Breakpoints**: `sm: 640px`, `md: 768px`, `lg: 1024px`

### Interactions
- SPA (không reload trang)
- Optimistic UI: Click chọn đội → hiện ngay, xác nhận sau
- Toast notification khi đặt cược thành công/thất bại
- Skeleton loading cho dữ liệu đang tải

---

## 7. PROMPT CHÍNH

> Sao chép toàn bộ đoạn dưới đây và dán vào Claude, ChatGPT, hoặc v0.dev:

---

### 🚀 PROMPT ĐẦY ĐỦ (Dành cho Claude / ChatGPT)

```
Bạn là một senior frontend developer. Hãy build một ứng dụng React (Vite + TypeScript + Tailwind CSS) 
hoàn chỉnh cho hệ thống dự đoán World Cup 2026 của một nhóm bạn bè.

## YÊU CẦU KỸ THUẬT
- Stack: React 18 + TypeScript + Tailwind CSS + React Router v6
- State management: Zustand (nhẹ, đủ dùng)
- Icons: Lucide React
- Animation: Framer Motion
- KHÔNG cần backend — dùng dữ liệu mẫu từ JSON trong code (có thể sau nâng cấp lên Supabase)

## CÁC TRANG CẦN XÂY DỰNG
1. `/` — Dashboard: Countdown trận tiếp theo, Live Match banner, Top 3 Leaderboard mini
2. `/schedule` — Lịch thi đấu + Giao diện đặt cược (Match Cards)
3. `/leaderboard` — Bảng xếp hạng đầy đủ với filter, trend arrows, progress bar
4. `/match/:id` — Chi tiết trận: tỉ số, deal explanation, bảng dự đoán của mọi người
5. `/rules` — Luật chơi dạng Accordion đẹp mắt

## DỮ LIỆU MẪU
Sử dụng JSON data sau đây (copy từ file BA):
[DÁN TOÀN BỘ JSON TỪ SECTION 2 CỦA FILE NÀY VÀO ĐÂY]

## LOGIC BẮT BUỘC
1. Hàm calculateResult(scoreA, scoreB, deal, dealSide, pick) → "win"|"lose"|"draw"
2. Hàm isPickAllowed(matchDate, matchTime) → boolean (deadline 17:30)
3. Hàm buildLeaderboard(users, predictions) → LeaderboardEntry[]

## LEADERBOARD YÊU CẦU ĐẶC BIỆT
- Cột: Hạng | Avatar | Tên | Tổng điểm | Thắng | Thua | Hòa | Đang chờ | Trạng thái đóng tiền
- Highlight hàng Top 1 với golden glow
- Trend arrows (▲▼─) so sánh với trận trước
- Progress bar % so với người dẫn đầu
- Click vào user → Modal lịch sử cược cá nhân
- Responsive: table trên desktop, card stack trên mobile

## DESIGN SYSTEM
- Theme: Dark mode, World Cup 2026 brand colors
- Primary: #C8102E (đỏ), Secondary: #003087 (xanh), Accent: #F5A623 (vàng)
- Display font: Bebas Neue (import từ Google Fonts)
- Body font: Outfit
- Match Card: glassmorphism, border glow khi hover
- Live Badge: animated red dot
- Countdown: flip clock style

## TRẠNG THÁI NGƯỜI DÙNG
- Hiện tại hardcode userId = "U01" (Minh Anh) là người đang đăng nhập
- Hiển thị "Cược của bạn" khác biệt với cược của người khác

Hãy bắt đầu với file cấu trúc thư mục, sau đó viết từng file theo thứ tự:
src/data/mockData.ts → src/types/index.ts → src/utils/gameLogic.ts → 
src/store/useGameStore.ts → src/components/ → src/pages/
```

---

### ⚡ PROMPT NGẮN (Dành cho v0.dev)

```
Build a dark-themed React World Cup 2026 prediction app for a friend group.

Pages: Dashboard (countdown + live match + top3), Schedule (match cards with betting), 
Leaderboard (full table with trend arrows + progress bars + user history modal), 
Match Detail, Rules.

Data: 8 players, 6 matches (upcoming/live/finished), predictions per user.
Logic: Deal handicap system (e.g. "-1" means team must win by more than 1 goal), 
deadline lock at 17:30.

Leaderboard table columns: Rank, Avatar(emoji), Name, Points, W/L/D, Pending, Payment status.
Top 1 gets golden glow. Mobile = card stack. Click user = modal with their full bet history.

Design: Dark bg (#0A0E1A), red/blue/gold palette, Bebas Neue display font, 
glassmorphism cards, animated LIVE badge.

Use mock JSON data inline, Zustand for state, Framer Motion for animations.
```

---

## 📝 GHI CHÚ TRIỂN KHAI

| Giai đoạn | Việc cần làm | Công cụ gợi ý |
|-----------|-------------|---------------|
| MVP | UI tĩnh với mock data | React + Tailwind |
| V1 | Lưu state local | Zustand + localStorage |
| V2 | Multi-user thực | Supabase (auth + realtime DB) |
| V3 | Thông báo | Supabase Realtime → Push notification |
| V4 | Admin panel | Thêm trang quản lý kết quả |

---

*File được tạo bởi Alchemy Group · World Cup 2026 · Cập nhật: 2026*
