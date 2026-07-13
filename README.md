<div align="center">

# 💰 Money+

**Quản lý tài chính cá nhân thông minh — nhanh, an toàn, mọi lúc mọi nơi.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 **[Xem Demo](https://money-dph.vercel.app/)** · [Tính năng](#-tính-năng-nổi-bật) · [Screenshots](#-screenshots) · [Cài đặt](#-bắt-đầu) · [Đóng góp](#-đóng-góp)

</div>

---

## 📖 Giới thiệu

**Money+** là ứng dụng quản lý tài chính cá nhân hiện đại, giúp bạn theo dõi thu chi, quản lý nhiều tài khoản, phân tích dòng tiền và nhận gợi ý thông minh từ AI — tất cả trong một giao diện đẹp mắt, mượt mà như native app.

Được xây dựng trên nền tảng **Next.js 16 App Router** và **Supabase**, Money+ tận dụng tối đa Server Components, Row Level Security và Progressive Web App để mang đến trải nghiệm nhanh, bảo mật và có thể cài đặt trực tiếp trên điện thoại.

> 🔗 **Demo trực tuyến:** [https://money-dph.vercel.app/](https://money-dph.vercel.app/)

---

## ✨ Tính năng nổi bật

| Tính năng                   | Mô tả                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------ |
| 🔐 **Đăng nhập bằng Google** | Xác thực nhanh qua OAuth 2.0 với Supabase Auth — không cần tạo mật khẩu              |
| 📊 **Dashboard tổng quan**   | KPI cards, biểu đồ xu hướng thu chi, so sánh theo kỳ với Recharts                    |
| 🤖 **Trợ lý AI**             | Phân tích chi tiêu và đưa ra insights thông minh nhờ Groq AI (Llama 3.3)             |
| 💳 **Quản lý đa tài khoản**  | Tiền mặt, ngân hàng, ví điện tử, tiết kiệm, đầu tư — theo dõi số dư từng tài khoản   |
| 📁 **Danh mục tùy chỉnh**    | Tạo danh mục thu/chi riêng với emoji tùy chọn cho từng workspace                     |
| 🔄 **Giao dịch thông minh**  | Hỗ trợ nhập tự động bằng AI hoặc thủ công — 3 loại: Chi tiêu, Thu nhập, Chuyển khoản |
| 📈 **Báo cáo chi tiết**      | Bảng báo cáo tài chính tùy biến, phân tích theo danh mục/giao dịch, xuất Excel       |
| 👥 **Workspace chia sẻ**     | Workspace cá nhân + nhóm, phân quyền Owner/Admin/Member                              |
| 💸 **Quản lý công nợ**       | Theo dõi nợ cho vay/đi vay, nhắc nhở tự động qua Telegram                            |
| 🤖 **Telegram Bot**          | Thêm giao dịch nhanh, nhận báo cáo, backup dữ liệu qua Telegram                      |
| 💾 **Sao lưu & Khôi phục**   | Backup JSON qua Telegram, auto-backup định kỳ, khôi phục dữ liệu                     |
| ❤️ **Kết nối tình yêu**      | Module riêng dành cho cặp đôi — chia sẻ chi tiêu cùng người yêu                      |
| 🌙 **Dark / Light Mode**     | Chuyển đổi chủ đề sáng/tối, dịu mắt khi sử dụng ban đêm                              |
| 📱 **Progressive Web App**   | Cài đặt như app native trên iOS/Android, hỗ trợ offline                              |
| ⏰ **Cron Jobs tự động**     | Dọn rác Cloudinary, backup tự động, thông báo nợ — quản lý trực tiếp trên UI         |
| 🛡️ **Admin Panel**           | Thống kê hệ thống, quản lý người dùng, workspace và cron jobs                        |

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="110"><strong>Frontend</strong></td>
<td>
  <img src="https://img.shields.io/badge/Next.js_16-000?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
</td>
</tr>
<tr>
<td align="center"><strong>UI</strong></td>
<td>
  <img src="https://img.shields.io/badge/Shadcn/UI-000?logo=shadcnui&logoColor=white" alt="Shadcn" />
  <img src="https://img.shields.io/badge/Radix_UI-161618?logo=radixui&logoColor=white" alt="Radix" />
  <img src="https://img.shields.io/badge/Recharts-22B5BF?logo=chart.js&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Lucide_Icons-F56040" alt="Lucide" />
</td>
</tr>
<tr>
<td align="center"><strong>State</strong></td>
<td>
  <img src="https://img.shields.io/badge/Zustand-433D37" alt="Zustand" />
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?logo=reacthookform&logoColor=white" alt="React Hook Form" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white" alt="Zod" />
</td>
</tr>
<tr>
<td align="center"><strong>Backend</strong></td>
<td>
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Groq_AI-F55036" alt="Groq" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white" alt="Cloudinary" />
</td>
</tr>
<tr>
<td align="center"><strong>Infra</strong></td>
<td>
  <img src="https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Telegram_Bot-26A5E4?logo=telegram&logoColor=white" alt="Telegram" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white" alt="PWA" />
</td>
</tr>
</table>

---

## 📸 Screenshots

### 🔐 Đăng nhập

Giao diện đăng nhập đẹp mắt với Google OAuth — tự động tạo tài khoản cho lần đầu đăng nhập.

![Login Page](https://github.com/user-attachments/assets/2c7648bd-3350-4c7b-89e5-2b8271a11ad4)

---

### 📊 Dashboard — Tổng quan

Theo dõi dòng tiền với KPI cards (Số dư, Thu nhập, Chi tiêu, Dòng tiền thuần), biểu đồ xu hướng hàng ngày, cơ cấu chi tiêu theo danh mục, so sánh chu kỳ dòng tiền và quản lý đa tài khoản.

![Dashboard Overview](https://github.com/user-attachments/assets/66e43463-a0bd-441e-9e69-c3018f1c3c50)

---

### 🤖 Dashboard — Trợ lý AI

AI phân tích thói quen chi tiêu, nhận xét tổng quan tài chính, gợi ý tiết kiệm cá nhân hóa, cảnh báo rủi ro và hỗ trợ chat trực tiếp về tài chính.

![AI Insights](https://github.com/user-attachments/assets/479ed001-1a14-4fce-95a1-0a67f58f3761)

---

### 📝 Giao dịch

Danh sách giao dịch theo timeline, tổng kết dòng tiền tháng, bộ lọc đa dạng (danh mục, loại giao dịch, khoảng thời gian).

![Transactions List](https://github.com/user-attachments/assets/5a5d3dc6-c8fa-42f3-8827-9488a420f6c2)

---

### ✨ Thêm giao dịch

Hai chế độ nhập: **Tự động** (AI nhận dạng mô tả tự nhiên) và **Thủ công** (chọn loại, danh mục, tài khoản chi tiết).

<p>
  <img src="https://github.com/user-attachments/assets/5eaa68c3-6d0b-4eb2-bf87-bf3d68ec2bf5" alt="Add Transaction - Auto" width="49%" />
  <img src="https://github.com/user-attachments/assets/34ec547f-9f3b-4864-82fb-8d08b327272b" alt="Add Transaction - Manual" width="49%" />
</p>

---

### 💳 Quản lý tài khoản

Tổng quan tài sản, thẻ ngân hàng đang dùng, danh sách tài khoản với số dư chi tiết. Hỗ trợ 6 loại: Tiền mặt, Ngân hàng, Ví điện tử, Tiết kiệm, Đầu tư, Khác.

<p>
  <img src="https://github.com/user-attachments/assets/b2007841-8ed0-4ceb-8687-ae0b5e59722c" alt="Accounts List" width="49%" />
  <img src="https://github.com/user-attachments/assets/530199f5-40b0-4485-8ad7-e7a4d5d5ff8d" alt="Add Account" width="49%" />
</p>

---

### 📁 Danh mục

22 danh mục tùy chỉnh cho chi tiêu & thu nhập, mỗi danh mục có emoji riêng — hỗ trợ tìm kiếm và lọc nhanh.

<p>
  <img src="https://github.com/user-attachments/assets/85f28e9a-5f88-4694-a011-0ea2ddfd24b2" alt="Categories" width="49%" />
  <img src="https://github.com/user-attachments/assets/80094ec4-4f53-4576-bd40-812deec0ddcd" alt="Add Category" width="49%" />
</p>

---

### 💸 Quản lý công nợ

Theo dõi nợ cho vay/đi vay với trạng thái (Chưa trả, Đến hạn, Đã trả), tự động nhắc nhở qua Telegram khi đến hạn.

<p>
  <img src="https://github.com/user-attachments/assets/dc2775c4-4897-4631-8964-209414b5fd0c" alt="Debts Management" width="49%" />
  <img src="https://github.com/user-attachments/assets/33bac12c-d741-4598-b08b-01a16eae0ee6" alt="Add Debt" width="49%" />
</p>

---

### 📈 Báo cáo tài chính

Bảng báo cáo chi tiết theo tháng — bảng chi tiêu, bảng thu nhập, bảng tổng hợp. Hỗ trợ kéo thả danh mục, xuất Excel và lưu template.

![Reports](https://github.com/user-attachments/assets/6246a20f-3351-4984-bc06-bbf582f1a3fb)

---

### ⚙️ Cài đặt

Chuyển đổi Dark/Light Mode, tùy chỉnh thanh điều hướng mobile, quản lý workspace và thông tin tài khoản.

![Settings](https://github.com/user-attachments/assets/eddcc288-78dc-4697-a0e8-cb941d49cd5e)

---

### 💾 Sao lưu & Khôi phục

Backup dữ liệu qua Telegram Bot (thủ công hoặc tự động định kỳ), khôi phục từ file JSON — kết nối trực tiếp với tài khoản Telegram.

![Backup & Restore](https://github.com/user-attachments/assets/0e7716ac-5d32-4450-b44e-0cbc4ea605f2)

---

### 👥 Workspace

Hỗ trợ nhiều workspace (Cá nhân + Nhóm chung), chuyển đổi nhanh giữa các sổ chi tiêu.

![Workspace Switcher](https://github.com/user-attachments/assets/a0df8f2c-8f51-45d2-9d84-7a1f2dbfe9e8)

---

### 🛡️ Admin — Thống kê hệ thống

Tổng quan quản trị với KPI (Người dùng, Workspace, Giao dịch), biểu đồ tăng trưởng, nhật ký giao dịch realtime và giám sát tài nguyên hạ tầng (CPU, Memory, DB, API latency).

![Admin Dashboard](https://github.com/user-attachments/assets/3e46250d-28ea-4b7f-8d56-88ff677a6e3e)

---

### 👤 Admin — Quản lý người dùng

Danh sách người dùng hệ thống với vai trò (User/Admin), tìm kiếm, lọc và nâng cấp quyền.

![User Management](https://github.com/user-attachments/assets/756ddf21-aee8-4bf6-93e0-0e187f7b5383)

---

### 🏢 Admin — Quản lý Workspace

Xem toàn bộ workspace trên hệ thống, thông tin chủ sở hữu, số thành viên, giao dịch và trạng thái hoạt động.

![Workspace Management](https://github.com/user-attachments/assets/dc66d452-6f38-42e9-873c-a70029191f22)

---

### ⏰ Admin — Quản lý Cron Jobs

Theo dõi và quản lý các tác vụ chạy ngầm (Dọn rác Cloudinary, Backup, Thông báo nợ) — bật/tắt, xem log, cấu hình trực tiếp trên UI.

![Cron Jobs Management](https://github.com/user-attachments/assets/aa236bda-6cab-483a-9f86-90c0888e3da4)

---

## 🚀 Bắt đầu

### Yêu cầu hệ thống

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (hoặc **pnpm** / **yarn**)
- **Supabase** project ([tạo tại đây](https://supabase.com/dashboard))
- **Git**

### Cài đặt

```bash
# 1. Clone repository
git clone https://github.com/PeZoi/money-management.git
cd money-management

# 2. Cài đặt dependencies
npm install

# 3. Tạo file biến môi trường
cp .env.example .env.local

# 4. Khởi chạy development server
npm run dev
```

Truy cập 👉 [http://localhost:3000](http://localhost:3000) để xem kết quả.

### Biến môi trường

Tạo file `.env.local` tại thư mục gốc với các biến sau:

| Biến                                   | Mô tả                                                                       | Bắt buộc |
| -------------------------------------- | --------------------------------------------------------------------------- | :------: |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL của Supabase project                                                    |    ✅     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Anon/Publishable Key                                               |    ✅     |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase Service Role Key (server-side only)                                |    ✅     |
| `GROQ_API_KEY`                         | API Key từ [Groq Console](https://console.groq.com/) — dùng cho AI Insights |    ⬜     |
| `TELEGRAM_BOT_TOKEN`                   | Token của Telegram Bot từ [@BotFather](https://t.me/BotFather)              |    ⬜     |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME`        | Username của Telegram Bot (không có @)                                      |    ⬜     |
| `CLOUDINARY_CLOUD_NAME`                | Cloudinary Cloud Name — upload ảnh avatar                                   |    ⬜     |
| `CLOUDINARY_API_KEY`                   | Cloudinary API Key                                                          |    ⬜     |
| `CLOUDINARY_API_SECRET`                | Cloudinary API Secret                                                       |    ⬜     |
| `CRON_SECRET`                          | Secret key xác thực cron jobs                                               |    ⬜     |
| `CRON_JOB_API_KEY`                     | API Key cho dịch vụ cron bên ngoài                                          |    ⬜     |

> **⚠️ Lưu ý:** Các biến **không có** tiền tố `NEXT_PUBLIC_` sẽ chỉ khả dụng ở server-side, đảm bảo an toàn cho API keys nhạy cảm.

### Cấu hình Database

Import schema SQL vào Supabase project:

```bash
# Sử dụng Supabase SQL Editor hoặc CLI
# File schema nằm tại: database/schema.sql
```

---

## 📋 Hướng dẫn sử dụng

### Các lệnh chính

```bash
# Khởi chạy dev server (hot-reload)
npm run dev

# Build bản production
npm run build

# Chạy bản production
npm start

# Kiểm tra linting
npm run lint

# Format code
npm run format
```

---

## 📂 Cấu trúc dự án

```
money-management/
├── app/
│   ├── (private)/          # Các trang yêu cầu đăng nhập
│   │   ├── dashboard/      # Trang tổng quan + AI Insights
│   │   ├── transactions/   # Quản lý giao dịch
│   │   ├── accounts/       # Quản lý tài khoản
│   │   ├── categories/     # Quản lý danh mục
│   │   ├── reports/        # Báo cáo & phân tích
│   │   ├── debts/          # Quản lý công nợ
│   │   ├── love/           # Tính năng dành cho cặp đôi
│   │   ├── settings/       # Cài đặt ứng dụng
│   │   └── admin/          # Quản trị hệ thống
│   ├── (public)/           # Trang công khai
│   │   └── login/          # Đăng nhập Google OAuth
│   └── api/                # Route Handlers (REST API)
│       ├── ai/             # Chat & Insights AI
│       ├── telegram/       # Webhook & Cron Telegram Bot
│       ├── transactions/   # CRUD giao dịch
│       ├── accounts/       # CRUD tài khoản
│       └── ...
├── components/             # Shared components
│   ├── ui/                 # Shadcn UI components
│   └── ...                 # App-level components
├── database/
│   ├── schema.sql          # Full database schema
│   └── migrations/         # Migration files
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities & Supabase clients
├── providers/              # Context providers
├── types/                  # TypeScript type definitions
└── public/                 # Static assets & PWA manifest
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy làm theo các bước sau:

```bash
# 1. Fork repository

# 2. Tạo nhánh tính năng mới
git checkout -b feature/tinh-nang-moi

# 3. Commit thay đổi
git commit -m "feat: thêm tính năng mới"

# 4. Push lên nhánh của bạn
git push origin feature/tinh-nang-moi

# 5. Tạo Pull Request
```

### Quy ước commit message

| Prefix      | Mô tả                        |
| ----------- | ---------------------------- |
| `feat:`     | Tính năng mới                |
| `fix:`      | Sửa lỗi                      |
| `docs:`     | Cập nhật tài liệu            |
| `style:`    | Thay đổi styling, formatting |
| `refactor:` | Tái cấu trúc code            |
| `perf:`     | Tối ưu hiệu năng             |
| `chore:`    | Công việc bảo trì, cấu hình  |

---

## 📄 License

Dự án được phát hành dưới giấy phép [MIT License](LICENSE).

---

## 📬 Liên hệ

<table>
<tr>
<td align="center">
<strong>PeZoi</strong><br/>
<a href="https://github.com/PeZoi">GitHub</a>
</td>
</tr>
</table>

---

<div align="center">

**Nếu dự án hữu ích, hãy tặng một ⭐ trên GitHub nhé!**

Made with ❤️ by [PeZoi](https://github.com/PeZoi)

</div>
