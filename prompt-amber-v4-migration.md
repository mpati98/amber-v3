Bối cảnh: Amber v3 hiện tại là Next.js 16 (App Router) + React 19 + TypeScript,
deploy Vercel, DB Postgres duy nhất được truy cập bởi **2 ORM song song**
(Drizzle cho phần lõi mới, Prisma cho domain Tàng Kinh Các cũ hơn). Mục tiêu
Amber v4: **1 codebase Flutter** chạy Web + Desktop + Mobile, "bản mobile vẫn
host trên Vercel". Tài liệu này là kết quả scan toàn bộ `src/` của v3, dùng để
mở 1 phiên làm việc mới (Claude Code hoặc người) bắt đầu thiết kế/code v4 mà
không phải dò lại từ đầu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 0. ⚠️ Quyết định kiến trúc CẦN CHỐT trước khi code v4

Câu "bản mobile vẫn sẽ host trên Vercel" có 2 cách hiểu khác nhau — ảnh hưởng
toàn bộ cấu trúc dự án, nên chốt trước:

**Phương án A (khuyến nghị, ít rủi ro hơn)** — Giữ backend hiện tại:
Next.js API routes (`src/app/api/**`, ~45 route) tiếp tục chạy trên Vercel y
như bây giờ, đóng vai trò BFF/API cho cả 3 nền tảng. Flutter CHỈ là lớp
client — gọi HTTP vào cùng 1 API đó cho Web/Desktop/Mobile. Ưu điểm: không
phải viết lại toàn bộ business logic (chấm điểm placement test, tính ngân
sách, Gantt, gọi Groq...) bằng Dart; DB schema/migration giữ nguyên. Nhược
điểm: vẫn phải maintain code TypeScript song song với Dart.

**Phương án B** — Backend viết lại hoàn toàn bằng Dart (vd. Serverpod, Dart
Frog) để 1 ngôn ngữ duy nhất cho cả stack. "Vercel" lúc này chỉ còn host phần
tĩnh (Flutter Web build) hoặc không dùng Vercel cho backend nữa. Ưu điểm: 1
ngôn ngữ, chia sẻ model/DTO giữa client-server qua Dart. Nhược điểm: viết lại
toàn bộ ~45 route + toàn bộ business logic đã kiểm chứng ở v3 (rủi ro
regression cao), Postgres cần ORM Dart khác (Drizzle/Prisma đều không có bên
Dart).

Tài liệu này giả định **Phương án A** vì khớp với gợi ý "mobile vẫn host trên
Vercel" và tận dụng được toàn bộ phần backend đã ổn định — nhưng cần người
dùng xác nhận trước khi bắt tay code.

Các quyết định phụ cần chốt kèm theo:
- **State management Flutter**: Riverpod/Bloc/Provider — v3 dùng React state
  cục bộ + fetch-on-mount khắp nơi (không có global store/cache layer như
  React Query/SWR), nên port 1:1 sẽ tạo lại đúng pattern "mỗi trang tự fetch"
  — có đáng cải thiện bằng cache layer (riverpod_generator/hooks) khi build
  lại không?
- **Ẩn dụ "Âm Dương Giới scene"** (trang chủ dạng bản đồ, bấm vào building để
  vào từng khu) — Flutter dựng lại bằng `Stack` + `Positioned` hoàn toàn khả
  thi (xem mục 5.1), nhưng cần xác nhận có giữ nguyên ẩn dụ này trên
  Mobile/Desktop hay đơn giản hoá thành bottom-nav/sidebar chuẩn cho các form
  factor nhỏ.
- **2 ORM 1 DB**: có nên gộp domain Tàng Kinh Các (hiện dùng Prisma) vào
  Drizzle luôn trong đợt migrate này không, hay giữ nguyên schema Postgres,
  chỉ đổi lớp gọi ở backend? (Xem mục 2.2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. Tech stack v3 hiện tại (để biết cái gì cần port / thay thế)

```
Next.js 16.3.4 (App Router)         → thay bằng Flutter (Web/Desktop/Mobile)
React 19.2.8                        → thay bằng Flutter widget tree
TypeScript 5                        → giữ ở backend (nếu chọn Phương án A) / Dart nếu B
Tailwind CSS 4 + shadcn             → thay bằng Flutter ThemeData + widget riêng (xem mục 5)
Drizzle ORM 0.45 (domain chính)     → giữ nguyên nếu Phương án A
Prisma 7.10 (domain Tàng Kinh Các)  → giữ nguyên nếu Phương án A (xem 2.2 để cân nhắc gộp)
NextAuth v5 beta (Credentials, JWT) → giữ nguyên nếu Phương án A; Flutter lưu JWT qua
                                       secure storage (flutter_secure_storage) thay vì cookie
Postgres (1 DB, 2 ORM)              → giữ nguyên
Groq API (chat/transcribe/TTS)      → giữ nguyên lời gọi ở backend, Flutter chỉ gọi API nội bộ
Vercel Blob (file storage)          → giữ nguyên nếu Phương án A
rss-parser (RSS)                    → giữ ở backend
grammy (Telegram bot — STUB)        → xem mục 6, hiện chưa có nghiệp vụ thật, cân nhắc bỏ
framer-motion                       → thay bằng Flutter animation (AnimatedXxx/Hero/implicit anim)
```

Deploy: không có `vercel.json`, dùng cấu hình mặc định của Vercel cho
Next.js. Nếu giữ Phương án A, phần "backend Vercel" gần như không đổi so với
v3 — chỉ bỏ phần render UI (App Router pages) đi, giữ lại `src/app/api/**`,
`src/db/`, `src/lib/` (trừ các phần dead code liệt kê ở mục 6).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2. Kiến trúc dữ liệu đầy đủ

### 2.1 Drizzle — domain chính (`src/db/schema.ts`, 1 file, quy tắc bắt buộc:
mọi `pgTable()` PHẢI đứng trước mọi `relations()`, không xen kẽ — vi phạm gây
lỗi TDZ lúc runtime mà `tsc` không bắt được)

```
users              — id, email (unique), name, passwordHash (bcryptjs), createdAt
projects           — bảng TRUNG TÂM đa hình: id, userId, name, color, type
                      (STANDARD | FINANCE | LEARN | PRACTICE), startDate, endDate,
                      archivedAt (soft-delete dùng chung toàn hệ thống — không có
                      cột status riêng cho "đã xong/đã xoá"), createdAt
tasks              — userId, projectId (nullable), title, description, status
                      (PREP|WAITING|IN_PROGRESS|DONE), importance (1-3), urgency (1-3),
                      durationMinutes, startDate, dueDate, prepLeadDays, rrule (RFC 5545,
                      null = không lặp)
taskOccurrences    — taskId, occurrenceDate, completedAt (cho task lặp)

// Finance — 1 "tháng" = 1 project (type=FINANCE)
financeAccounts    — userId, name, type (CASH|BANK|E_WALLET|CREDIT_CARD), currentBalance
                      (numeric 14,2 — LUÔN dùng numeric cho tiền, không float), archivedAt
financeCategories  — userId, name, icon (emoji), kind (INCOME|EXPENSE)
financeTransactions— userId, projectId, accountId, categoryId (nullable), kind, amount
                      (luôn dương, dấu quyết định bởi kind), note, occurredAt
financeBudgets     — userId, projectId, categoryId, limitAmount
financeBalanceSnapshots — projectId (PK), totalBalance, recordedAt — chụp số dư đầu
                      tháng để vẽ biểu đồ biến động không phải dò lại lịch sử

// Learn — 1 khoá học = 1 project (type=LEARN)
learnCourseDetails — projectId (PK), source, field, outcome, status
                      (PLANNED|IN_PROGRESS|COMPLETED)
learnLessons       — projectId, title, studiedAt, durationMinutes, note

// Trà Đình — 1 buổi luyện = 1 project (type=PRACTICE)
practiceSessionDetails — projectId (PK), mode (CONVERSATION|EXAM_PREP|PROFESSIONAL), summary
practiceMessages   — projectId, role (USER|ASSISTANT), content, audioUrl (Vercel Blob),
                      createdAt
skillScores        — userId, skill (GRAMMAR|VOCABULARY|LISTENING|SPEAKING|READING|WRITING),
                      cefrLevel (A1-C2), score (0-100), updatedAt — 1 dòng/skill/user,
                      UPDATE không tạo mới

// Kiều Lâu — trung tâm thông báo, dùng chung mọi tòa
activityLogs       — userId, source (DU_AN|FINANCE|LEARN|TRA_DINH|KIEU_LAU), action, title,
                      metadata (jsonb), createdAt — lịch sử vĩnh viễn, không phải cảnh báo
feedSources        — userId, name, url (RSS)
feedArticlesCache  — sourceId, title, url, publishedAt, fetchedAt — CACHE TẠM, mỗi lần
                      "làm mới" xoá sạch rồi chèn lại, KHÔNG tích luỹ lịch sử
```

Mọi bảng đều có `userId` (trừ bảng con tham chiếu qua `projectId`/`sourceId`)
→ mọi query production phải lọc theo user đang đăng nhập, không có bảng nào
dùng chung giữa nhiều user.

### 2.2 Prisma — domain Tàng Kinh Các (`prisma/schema.prisma`, CÙNG
`DATABASE_URL` với Drizzle ở trên — 2 ORM, 1 database)

```
AdminAccount   — id, email, passwordHash, resetTokenHash, resetTokenExpiresAt
                 ⚠️ MỒ CÔI — 0 chỗ nào trong code còn import/dùng model này.
                 Tàn dư từ hệ thống auth admin cũ (trước khi chuyển sang
                 NextAuth+Drizzle). KHÔNG cần port.
Publication    — title, author, isbn, coverUrl, format (PHYSICAL|EBOOK|AUDIOBOOK),
                 status (TO_READ|READING|READ|ABANDONED), rating (1-5, chỉ khi READ),
                 currentPage/totalPages, tags (JSON string), url, review, notes,
                 dateAdded/dateStarted/dateFinished
Highlight      — publicationId, quote, page, note, createdAt
ReadingGoal    — year (unique), targetBooks, targetPages, note — tiến độ tự tính
                 từ Publication.dateFinished, không lưu cứng
Topic          — name (unique), description
Document       — title, type (TEXT|CHECKLIST|MINDMAP|IMAGE|FILE), content (markdown),
                 attachmentUrl (Vercel Blob), tags, pinned, sourceUrl, topicId
```

**Khuyến nghị**: nếu build lại backend (dù Phương án A hay B), nên **gộp 2
domain này vào 1 ORM duy nhất** — tách biệt lịch sử chỉ vì lý do "domain cũ
build trước, domain mới build bằng ORM khác", không phải ranh giới nghiệp vụ
thật sự. Amber v4 là thời điểm hợp lý để dọn việc này vì đằng nào cũng phải
đụng vào toàn bộ lớp data-access khi đổi client.

### 2.3 Store file-hệ-thống — KHÔNG dùng, bỏ qua

`src/lib/store.ts` (277 dòng) định nghĩa lại y hệt các type của domain Tàng
Kinh Các nhưng lưu vào file JSON trong `.data/` — **không được import ở bất
kỳ đâu trong codebase**. Là bản prototype trước khi domain này chuyển sang
Prisma/Postgres thật. Không cần scan/port phần này.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3. Toàn bộ tính năng — theo "tòa" (khu vực)

### 3.1 Trang chủ (`/`) — "Âm Dương Giới scene"

1 background art tĩnh (1920×1080, auto-scale theo viewport bằng
`ResizeObserver` + `Math.max` để cover) với 4 "building" bấm được (định nghĩa
ở `src/lib/buildings.ts`, vị trí bằng % để responsive), hover 1 building thì
dim 3 building còn lại (framer-motion). Góc trên-phải hiện tên user + badge
số cảnh báo chưa đọc (gọi `/api/kieu-lau/notifications`) + link Cài đặt.

### 3.2 Tàng Kinh Các (`/tang-kinh-cac`) — lưu trữ & tri thức (Prisma-backed)

- **Sách** (`/tang-kinh-cac/sach`): CRUD Publication, trạng thái đọc, rating
  sao, highlight/trích dẫn theo trang, upload ảnh bìa
- **Tài liệu** (`/tang-kinh-cac/tai-lieu`): ghi chú dạng TEXT/CHECKLIST
  (todo-list)/MINDMAP (outline lồng nhau)/IMAGE/FILE, gán topic, ghim
  (pinned), upload file qua Vercel Blob
- **Kế hoạch đọc** (`/tang-kinh-cac/ke-hoach-doc`): mục tiêu số sách/số trang
  theo năm, tiến độ tự tính
- Có "random pick" (`/documents/random`, `/highlights/random`) — có thể là
  tính năng "gợi ý ngẫu nhiên" trên trang chủ hoặc widget riêng

### 3.3 Nghị Sự Đường (`/nghi-su-duong`) — hub gộp 3 domain, mỗi domain có
overview riêng gọi lúc load hub

- **Dự án thông thường** (`/du-an`): 3 tab —
  - *Tổng quan* (mặc định, DATA THẬT): lời chào theo giờ, 4 thẻ số liệu
    (task hôm nay/đang làm/dự án chạy/TB hoàn thành), list task hôm nay +
    badge trạng thái/tag mức độ quan trọng, progress bar dự án đang chạy,
    list dự án sắp tới
  - *Lịch* (⚠️ **MOCK DATA** — `src/lib/mock-data.ts`, chưa nối API thật):
    Week grid + Month Gantt, click ngày xem chi tiết (biểu đồ hiệu suất theo
    giờ + nhóm task phụ)
  - *Việc hôm nay* (⚠️ **MOCK DATA** — cùng file mock-data.ts): tương tự chi
    tiết 1 ngày nhưng full-page
  - **Việc cần làm khi build v4**: 2 trong 3 tab này chưa có API thật đứng
    sau — nếu v4 muốn tính năng này hoạt động thật, cần thiết kế thêm
    route/logic cho Week/Month Gantt (group task theo ngày trong khoảng thời
    gian, xử lý rrule để "trải" task lặp ra các ngày) trước khi Flutter có
    dữ liệu để vẽ.
- **Tài chính** (`/finance`, `/finance/[projectId]`): mỗi tháng = 1 project,
  quản lý nhiều ví (accounts), danh mục thu/chi, giao dịch, ngân sách theo
  danh mục, biểu đồ biến động số dư
- **Học tập** (`/hoc-tap`, `/hoc-tap/[id]`): mỗi khoá học = 1 project, danh
  sách bài học đã học, tổng thời lượng, trạng thái khoá học

### 3.4 Kiều Lâu (`/kieu-lau`) — trung tâm thông báo & tin tức

- Cảnh báo tự sinh (không lưu bảng riêng, tính runtime): task sắp/quá hạn,
  ngân sách vượt hạn mức, tháng tài chính chưa khởi tạo, khoá học lâu không
  học
- Feed hoạt động gần đây (đọc từ `activityLogs`, dùng chung mọi tòa)
- Quản lý nguồn RSS quan tâm + "làm mới" để kéo bài viết mới nhất (cache tạm,
  không lưu lịch sử)

### 3.5 Trà Đình (`/tra-dinh`, `/tra-dinh/[sessionId]`,
`/tra-dinh/placement-test`) — luyện tiếng Anh với AI

- **Bài test đầu vào** (1 lần/lần làm lại, không lưu nháp giữa chừng): 25 câu
  trắc nghiệm ngữ pháp+từ vựng, 1 đoạn văn + 5 câu đọc hiểu, 1 bài viết
  100-150 từ được Groq chấm — kết quả ghi vào `skillScores`
- **Buổi luyện hội thoại**: 3 chế độ (trò chuyện tự do/luyện thi/chuyên
  nghiệp), chat với AI gia sư song ngữ Việt-Anh qua Groq chat completion, hỗ
  trợ ghi âm→transcribe (Whisper) làm input, và phát giọng nói AI (TTS —
  hiện đang BỊ CHẶN, xem mục 4)
- Kết thúc buổi: Groq tự tóm tắt + chấm điểm CEFR cho các kỹ năng thể hiện
  rõ trong buổi đó, cập nhật `skillScores`
- Trang hub hiện 6 kỹ năng dạng progress bar (điểm + CEFR level), nút "làm
  bài test đầu vào"/"làm lại bài test" tuỳ đã có kết quả hay chưa

### 3.6 Tài khoản

- `/login`, `/register` (NextAuth Credentials — email+password, bcryptjs)
- `/settings` — quản lý hồ sơ/đổi mật khẩu (xem `src/app/api/user/**`)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4. Tích hợp bên thứ 3 cần giữ lại (nếu Phương án A) hoặc port (nếu B)

**Groq API** (`https://api.groq.com/openai/v1`, key qua `GROQ_API_KEY`) — 3
use case trong Trà Đình:
- Chat completion, model `openai/gpt-oss-120b` — đã verify TRỰC TIẾP bằng
  cách gọi `GET /v1/models` với chính key của project (không tin theo doc
  Groq vì doc từng liệt kê model đã bị revoke quyền truy cập)
- Transcribe giọng nói, model `whisper-large-v3-turbo`
- Text-to-speech, model `canopylabs/orpheus-v1-english` — **hiện trả 400
  "model_terms_required"**, cần admin tổ chức bấm chấp nhận điều khoản tại
  `console.groq.com/playground?model=canopylabs%2Forpheus-v1-english`, không
  fix được bằng code. ⚠️ Kiểm tra lại danh sách model Groq hiện hành trước
  khi hardcode tên model trong v4 — model access hay đổi.

**Vercel Blob** (`@vercel/blob`) — lưu file upload Tàng Kinh Các + audio Trà
Đình. Nếu giữ backend trên Vercel thì giữ nguyên nguyên; nếu chuyển hạ tầng
khác thì cần thay bằng S3-compatible storage khác.

**rss-parser** — parse RSS cho Kiều Lâu, chạy phía server (timeout 10s, giới
hạn 15 bài/nguồn).

**grammy (Telegram bot)** — ⚠️ **CHỈ LÀ STUB**, `src/lib/telegram-bot.ts` mới
5 dòng, chưa gắn lệnh/nghiệp vụ nào. Route webhook (`/api/telegram/webhook`)
verify secret token nhưng bot chưa làm gì thật sự. Cân nhắc: có đưa tính năng
Telegram vào roadmap v4 không, hay bỏ hẳn phần stub này (bớt 1 dependency).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5. Design system — 2 theme SONG SONG, áp dụng theo NGỮ CẢNH (không phải
tuỳ chọn của user)

**Quan trọng**: đây là phát hiện chính xác từ scan trực tiếp className trong
từng file (không suy đoán) — theme không phải light/dark switch mà người
dùng chọn, mà 2 bảng màu cố định cho 2 NHÓM MÀN HÌNH khác nhau:

### 5.1 Theme tối "Âm Dương Giới" — dùng cho TOÀN BỘ trang nội dung (trang
chủ + cả 4 tòa + mọi trang con của chúng)

```
--color-ink-950: #05070f   (nền chính)
--color-ink-900: #0c1128   (nền card, hơi sáng hơn nền chính)
--color-ink-800: #18204a
--color-yugen-500: #8b7ff0 (tím — mức độ quan trọng THẤP, glow phụ)
--color-yugen-300: #c9c3f5
--color-shuiro-500: #e0616f (đỏ — cảnh báo/lỗi/mức độ quan trọng CAO)
--color-kincha-400: #eccb8a (vàng gold — màu NHẤN chính, CTA, tiêu đề, mức TB)
--color-kincha-200: #f3e2c0
```

Font: `font-serif-display` (Noto Serif, có italic) cho tiêu đề/nhãn nhấn,
`font-sans` (Inter) cho nội dung — cả 2 load qua `next/font/google`, subset
`latin` + `vietnamese`.

Component kit dùng chung nằm ở `src/components/tang-kinh-cac/ui.tsx` (LƯU Ý:
tên thư mục gây hiểu lầm — thực chất được import bởi TẤT CẢ các tòa, không
riêng Tàng Kinh Các): `ScrollCard` (card viền mờ + glow màu khi hover, 3 biến
thể glow yugen/shuiro/kincha), `ProgressBar` (gradient yugen→kincha),
`StatusBadge`, `RatingStars`, `TypeTag`.

Pattern modal chuẩn (dark dialog):
```
<Dialog><DialogContent className="dark border border-white/10 bg-ink-900">
  <DialogTitle className="font-serif-display text-kincha-400">...
  input: className="border-white/15 bg-white/5 text-white placeholder:text-white/30
                     focus-visible:border-kincha-400/50"
```

**Cho Flutter**: đây chính là bảng `ColorScheme`/`ThemeData` chính của app —
nên dựng `ScrollCard` thành 1 widget dùng chung sớm (viền mờ bo góc nhỏ +
container glow màu động theo tham số, tương đương pattern
`BoxDecoration` + `AnimatedContainer` khi hover/focus — trên mobile/touch thì
"hover glow" cần đổi thành press/selected state vì không có hover thật).

### 5.2 Theme sáng "đất nung" (earth-tone shadcn) — CHỈ dùng ở 3 trang:
`/login`, `/register`, `/settings`

```
--color-primary-50..900   (nâu, từ kem nhạt #fbf3e9 đến nâu đậm #2b211a)
--color-accent-400/500/700 (cam đất nung, #e07a5f → #9c4a1f)
--color-secondary-300/500  (vàng/tan, #f2d399 / #d9a441)
--color-bg-light / bg-dark / text-primary / text-secondary
```

Build trên biến CSS chuẩn shadcn (`--background`, `--foreground`, `--card`,
`--primary`... ánh xạ từ bảng màu đất nung ở trên), dùng component
`@/components/ui/*` (Button/Dialog/Input/Label/Tabs — dựng trên `@base-ui/react`
+ `class-variance-authority`). Có sẵn biến `.dark` (oklch xám chuẩn shadcn)
nhưng KHÔNG dùng thực tế — 3 trang này luôn ở chế độ sáng.

**Cho Flutter**: có thể dựng thành `ThemeData.light()` riêng biệt, chỉ áp
dụng cho luồng auth/settings — 2 `ThemeData` khác nhau trong cùng
`MaterialApp`, chuyển theme theo route thay vì theo cờ dark/light toàn cục.

### 5.3 Ngôn ngữ & bản sắc

Toàn bộ copy UI bằng tiếng Việt (kể cả tên hàm/biến trong comment code cũng
tiếng Việt — codebase song ngữ Việt trong comment, Anh trong tên biến). Trà
Đình là ngoại lệ có nội dung song ngữ Việt-Anh thật (vì đó là app luyện tiếng
Anh). Amber v4 nên giữ tiếng Việt làm ngôn ngữ chính, cân nhắc có cần
i18n/l10n formal (flutter gen-l10n) hay giữ hardcode string tiếng Việt như v3.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6. Nợ kỹ thuật & dead code — KHÔNG CẦN PORT sang v4

- `src/lib/store.ts` (277 dòng) — không được import ở đâu, xem mục 2.3
- `AdminAccount` model (Prisma) — mồ côi, tàn dư hệ auth admin cũ
- Package `resend` — có trong `package.json` nhưng không import ở đâu (từng
  định dùng gửi email, chưa triển khai)
- Package `jose` — có trong `package.json` nhưng không import ở đâu (tàn dư
  JWT thủ công trước khi chuyển sang NextAuth)
- `src/lib/apiError.ts` (`withApiError` wrapper) — CÓ dùng (17 chỗ, chủ yếu
  route Tàng Kinh Các) nhưng là pattern cũ hơn so với các route mới (route
  mới tự try/catch trong handler) — cân nhắc thống nhất 1 pattern khi build
  lại backend
- Tab "Lịch" và "Việc hôm nay" trong `/du-an` — UI đã có, nhưng CHẠY TRÊN
  MOCK DATA (`src/lib/mock-data.ts`), chưa có API thật đứng sau (xem 3.3)
- `grammy`/Telegram bot — stub chưa có nghiệp vụ (xem mục 4)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 7. Auth & bảo mật — convention áp dụng nhất quán trên ~45 route

```ts
// Mọi route (trừ /api/auth/**, /api/health, /api/telegram/webhook — verify
// bằng secret token riêng) đều mở đầu bằng:
const session = await auth();
if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
// Ghi dữ liệu → validate bằng zod .safeParse(), 400 + error.flatten() nếu fail
// Mọi query lọc theo session.user.id — không có endpoint nào trả chéo user
// Sau khi ghi thành công → logActivity({userId, source, action, title, metadata?})
//   (fire-and-forget, tự nuốt lỗi, không làm hỏng response chính)
```

NextAuth v5 (beta) — Credentials provider, session strategy `jwt`, callback
gắn `userId` vào token rồi vào session. Middleware (`src/proxy.ts`) chặn ở
tầng Next.js: trang chưa đăng nhập → redirect `/login?callbackUrl=...`; API
chưa đăng nhập → 401 JSON thẳng (vì `fetch` phía client không tự theo
redirect HTML được). `PUBLIC_PATHS` allowlist gồm cả `/assets` — next/image
tự gọi lại route optimize ảnh nội bộ KHÔNG kèm cookie, nếu không whitelist
thì mọi ảnh local sẽ vỡ (gotcha đã từng dính, không phải giả thuyết).

**Cho Flutter (Phương án A)**: không có cookie/session trình duyệt tự động
như web — cần tự lưu JWT (nhận từ 1 endpoint login trả token, hoặc điều
chỉnh NextAuth để expose 1 API login trả JWT thay vì set cookie) vào
`flutter_secure_storage`, gắn `Authorization: Bearer <token>` mọi request.
Đây là điểm PHẢI thiết kế lại ở backend, không port nguyên xi được vì
NextAuth v5 mặc định thiết kế cho luồng cookie trình duyệt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 8. Biến môi trường

```
DATABASE_URL              — Postgres, dùng chung bởi Drizzle VÀ Prisma
GROQ_API_KEY               — Groq chat/transcribe/TTS
TELEGRAM_BOT_TOKEN         — optional, bot còn là stub
TELEGRAM_WEBHOOK_SECRET    — optional, verify webhook Telegram
AUTH_SECRET (hoặc NEXTAUTH_SECRET) — NextAuth v5 đọc ngầm, không thấy
                             process.env trực tiếp trong code nhưng BẮT BUỘC
                             phải set (thư viện tự đọc theo convention)
BLOB_READ_WRITE_TOKEN      — Vercel Blob, tự inject khi deploy trên Vercel,
                             cần set thủ công nếu chạy local/nơi khác
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 9. Đề xuất lộ trình (nếu chốt Phương án A)

1. **Dọn backend trước khi tách UI**: xoá dead code ở mục 6, quyết định gộp
   2 ORM hay không (mục 2.2), thiết kế lại luồng auth trả JWT cho non-browser
   client (mục 7), bổ sung API thật cho tab Lịch/Việc hôm nay nếu muốn giữ
   tính năng đó ở v4 (mục 3.3).
2. **Dựng design token Flutter** từ 2 bảng màu ở mục 5 — 2 `ThemeData`
   riêng biệt, ưu tiên dựng `ScrollCard`/`ProgressBar`/badge kit trước vì
   được dùng lại ở khắp mọi màn hình dark-theme.
3. **Port từng "tòa" độc lập** theo thứ tự rủi ro thấp → cao: Kiều Lâu (chủ
   yếu đọc dữ liệu) → Tàng Kinh Các (CRUD chuẩn, không AI) → Nghị Sự Đường/Dự
   án+Tài chính+Học tập (CRUD + tính toán) → Trà Đình (phức tạp nhất: ghi âm,
   phát audio, streaming chat — cần đánh giá kỹ package Flutter cho
   record/playback trên cả 3 nền tảng trước).
4. **Trang chủ scene** làm sau cùng hoặc song song — vì phụ thuộc quyết định
   ở mục 0 (giữ ẩn dụ bản đồ hay đổi nav chuẩn) và cần asset ảnh nền đã có
   sẵn (`/assets/*.webp`) — kiểm tra bản quyền/nguồn asset trước khi đóng gói
   vào app mobile (asset ảnh hiện phục vụ qua Next.js public/, cần bundle vào
   Flutter app hoặc tiếp tục serve qua network).

## 10. Checklist trước khi bắt đầu code v4

- [ ] Chốt Phương án A/B (mục 0)
- [ ] Chốt state management Flutter
- [ ] Chốt có gộp Prisma→Drizzle không (mục 2.2)
- [ ] Thiết kế endpoint auth trả JWT cho client non-browser (mục 7)
- [ ] Quyết định số phận tab Lịch/Việc hôm nay ở Dự án (mục 3.3, 6)
- [ ] Quyết định số phận Telegram bot stub (mục 4, 6)
- [ ] Verify lại model Groq hiện hành trước khi hardcode (mục 4)
- [ ] Xác nhận nguồn/bản quyền asset ảnh scene trước khi bundle vào mobile
      (mục 9.4)
