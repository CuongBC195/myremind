# MyRemind - Hệ thống Nhắc nhở Bảo hiểm Y tế

Ứng dụng PWA (Progressive Web App) quản lý và nhắc nhở tái tục bảo hiểm y tế với thông báo tự động.

## ✨ Tính năng

- 🔐 **Xác thực người dùng**: Đăng ký, đăng nhập với JWT
- 📋 **Quản lý bảo hiểm**: Thêm, sửa, xóa, xem chi tiết hợp đồng bảo hiểm y tế
- 🔔 **Thông báo tự động**: 
  - In-app notifications (thông báo trong ứng dụng)
  - Push notifications (thông báo đẩy PWA)
  - Tự động kiểm tra và nhắc nhở mỗi ngày lúc 8h sáng
- ⏰ **Tần suất nhắc nhở tùy chỉnh**: Đến hạn, 3 ngày, 1 tuần, 2 tuần, 1 tháng trước
- 📱 **PWA**: Cài đặt như ứng dụng trên mobile/desktop
- 💰 **Chuyển đổi tiền tệ**: Hiển thị số tiền bằng chữ tiếng Việt
- 🎨 **UI hiện đại**: Giao diện đẹp, responsive, tối ưu UX

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres (Neon)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: JWT (jsonwebtoken, jose)
- **Push Notifications**: Web Push API
- **Deployment**: Vercel

## 📋 Yêu cầu

- Node.js 18+ 
- npm hoặc yarn
- Tài khoản Vercel (cho deployment)
- Database: Vercel Postgres hoặc Neon Postgres

## 🚀 Cài đặt Local

### 1. Clone repository

```bash
git clone git@github.com:CuongBC195/myremind.git
cd myremind
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Thiết lập môi trường

Tạo file `.env.local` từ template:

```bash
cp create-env.template.sh .env.local
```

Hoặc tạo thủ công file `.env.local` với nội dung:

```env
# Database
POSTGRES_URL=your-postgres-connection-string
POSTGRES_PRISMA_URL=your-postgres-prisma-url
POSTGRES_URL_NON_POOLING=your-postgres-non-pooling-url

# JWT Secret (tạo một chuỗi ngẫu nhiên mạnh)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# App URL (cho production)
APP_URL=http://localhost:3001

# VAPID Keys cho Push Notifications (tùy chọn)
# Chạy: node scripts/generate-vapid-keys.js
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Cron Secret (tùy chọn, cho bảo mật cron job)
CRON_SECRET=your-cron-secret-key
```

### 4. Thiết lập Database

Chạy các file SQL migration theo thứ tự:

1. `schema.sql` - Tạo bảng insurances và enum types
2. `schema-auth.sql` - Tạo bảng users và thêm user_id vào insurances
3. `schema-update.sql` - Thêm priority, reminder_frequency, notes
4. `schema-health-insurance.sql` - Cập nhật cho bảo hiểm y tế
5. `schema-notifications.sql` - Tạo bảng notifications và push_subscriptions
6. `schema-add-2weeks.sql` - Thêm tần suất nhắc nhở 2 tuần

**Cách chạy SQL:**
- Với Neon: Vào Neon Console → SQL Editor → Paste và chạy từng file
- Với Vercel Postgres: Vào Vercel Dashboard → Storage → Postgres → Query → Paste và chạy

### 5. Chạy ứng dụng

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```

Ứng dụng sẽ chạy tại `http://localhost:3001`

## 📱 Sử dụng

1. **Đăng ký tài khoản**: Truy cập `/register` để tạo tài khoản mới
2. **Đăng nhập**: Truy cập `/login` để đăng nhập
3. **Thêm bảo hiểm**: Click "Thêm nhắc nhở mới" và điền thông tin
4. **Xem danh sách**: Trang chủ hiển thị tất cả bảo hiểm với filter
5. **Xem chi tiết**: Click vào tên khách hàng để xem chi tiết
6. **Sửa/Xóa**: Vào trang chi tiết và click "Sửa" hoặc "Xóa"
7. **Bật Push Notifications**: Vào Hồ sơ → Bật thông báo đẩy

## 🔔 Hệ thống Thông báo

### In-App Notifications
- Hiển thị trong icon chuông ở header
- Tự động refresh mỗi 2 phút (chỉ khi tab đang active)
- Click để xem và đánh dấu đã đọc

### Push Notifications
- Gửi thông báo ngay cả khi không mở ứng dụng
- Cần bật trong trang Hồ sơ
- Yêu cầu VAPID keys (xem `PUSH_NOTIFICATIONS_SETUP.md`)

### Cron Job
- Tự động chạy mỗi ngày lúc 8h sáng (UTC)
- Kiểm tra bảo hiểm sắp hết hạn dựa trên `reminder_frequency`
- Tạo in-app notifications và gửi push notifications

## 🚀 Deployment lên Vercel

Xem hướng dẫn chi tiết trong file [VERCEL_SETUP.md](./VERCEL_SETUP.md)

Tóm tắt:
1. Push code lên GitHub
2. Import project vào Vercel
3. Thiết lập Environment Variables
4. Kết nối Database
5. Deploy!

## 📁 Cấu trúc Project

```
myremind/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── cron/           # Cron job endpoints
│   │   ├── notifications/  # Notifications API
│   │   └── push/           # Push notifications API
│   ├── add/                # Thêm bảo hiểm
│   ├── edit/               # Sửa bảo hiểm
│   ├── details/            # Chi tiết bảo hiểm
│   ├── login/              # Đăng nhập
│   ├── register/           # Đăng ký
│   └── profile/            # Hồ sơ
├── components/             # React components
├── lib/                     # Utilities và helpers
├── public/                  # Static files (manifest, sw.js)
├── scripts/                 # Utility scripts
├── schema*.sql             # Database migrations
└── vercel.json             # Vercel configuration
```

## 🔒 Bảo mật

- Tất cả file `.env*` đã được thêm vào `.gitignore`
- JWT tokens được lưu trong httpOnly cookies và localStorage
- Passwords được hash bằng bcryptjs
- API routes được bảo vệ bởi middleware authentication

## 📝 Scripts hữu ích

```bash
# Generate VAPID keys cho push notifications
node scripts/generate-vapid-keys.js

# Test database connection
node scripts/test-db-connection.js

# Verify database schema
node scripts/verify-schema.js
```

## 🤝 Đóng góp

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👤 Author

**CuongBC195**
- GitHub: [@CuongBC195](https://github.com/CuongBC195)

## 🙏 Acknowledgments

- Next.js team
- Vercel team
- All open-source contributors

---

⭐ Nếu project này hữu ích, hãy star repo này!

