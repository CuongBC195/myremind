# Email Notifications Setup

Hệ thống MyRemind sử dụng email để gửi thông báo nhắc nhở bảo hiểm cho người dùng.

## Environment Variables

Thêm các biến môi trường sau vào `.env.local` và Vercel:

### Gmail (Khuyến nghị)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=MyRemind <your-email@gmail.com>
```

**Lưu ý:** Với Gmail, bạn cần sử dụng **App Password** thay vì mật khẩu thông thường:

1. Vào [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (bật nếu chưa bật)
3. App passwords → Generate app password
4. Chọn "Mail" và "Other (Custom name)" → Nhập "MyRemind"
5. Copy password 16 ký tự và dùng làm `EMAIL_PASSWORD`

### Custom SMTP

```env
EMAIL_SERVICE=custom
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=MyRemind <your-email@domain.com>
SMTP_HOST=smtp.your-domain.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Cách hoạt động

1. **Cron Job** chạy mỗi ngày lúc 8h sáng (theo cấu hình trong `vercel.json`)
2. Hệ thống kiểm tra các bảo hiểm sắp hết hạn dựa trên `reminder_frequency`:
   - `on_due`: Vào ngày hết hạn
   - `3_days`: 3 ngày trước
   - `1_week`: 1 tuần trước
   - `2_weeks`: 2 tuần trước
   - `1_month`: 1 tháng trước
3. Gửi email thông báo đến email đăng ký của người dùng
4. Tạo in-app notification khi người dùng mở hệ thống

## Email Template

Email được gửi với format HTML đẹp mắt, bao gồm:
- Thông tin khách hàng
- Mã số bảo hiểm (nếu có)
- Số ngày còn lại hoặc đã quá hạn
- Link để xem chi tiết và gia hạn

## Testing

Để test email notifications:

1. Tạo bảo hiểm với `reminder_frequency` = `on_due`
2. Đặt `expiry_date` = hôm nay
3. Chờ cron job chạy (hoặc trigger thủ công bằng cách gọi `/api/cron/check-expiry`)

## Troubleshooting

### Email không được gửi

1. Kiểm tra environment variables đã được set đúng chưa
2. Kiểm tra logs trong Vercel Dashboard → Functions → `/api/cron/check-expiry`
3. Với Gmail, đảm bảo đang dùng App Password, không phải mật khẩu thông thường
4. Kiểm tra spam folder

### Lỗi authentication

- Gmail: Đảm bảo 2-Step Verification đã bật và đang dùng App Password
- Custom SMTP: Kiểm tra host, port, và credentials

