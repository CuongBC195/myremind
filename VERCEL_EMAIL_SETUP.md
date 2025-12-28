# Hướng dẫn Setup Email trên Vercel

Hướng dẫn chi tiết từng bước để thêm email configuration trên Vercel.

## 📋 Bước 1: Vào Vercel Dashboard

1. Mở trình duyệt và vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Đăng nhập vào tài khoản của bạn
3. Tìm và click vào project **`myremind`** (hoặc tên project của bạn)

## 🔐 Bước 2: Vào Environment Variables

1. Trong project dashboard, click vào tab **"Settings"** (ở thanh menu trên)
2. Trong menu bên trái, click vào **"Environment Variables"**

## ➕ Bước 3: Thêm Email Variables

Thêm từng biến sau (click **"Add"** cho mỗi biến):

### 3.1. EMAIL_SERVICE

```
Key: EMAIL_SERVICE
Value: gmail
Environment: Production, Preview, Development (chọn cả 3)
```

Click **"Save"**

### 3.2. EMAIL_USER

```
Key: EMAIL_USER
Value: your-email@gmail.com
Environment: Production, Preview, Development (chọn cả 3)
```

Click **"Save"**

### 3.3. EMAIL_PASSWORD

```
Key: EMAIL_PASSWORD
Value: your-app-password
Environment: Production, Preview, Development (chọn cả 3)
```

**⚠️ Lưu ý quan trọng:**
- Đây là **App Password** từ Google (16 ký tự, có thể có khoảng trắng)
- Nếu Vercel báo lỗi hoặc không chấp nhận khoảng trắng, thử nhập **KHÔNG CÓ khoảng trắng**
- Không phải mật khẩu thông thường của Gmail

Click **"Save"**

### 3.4. EMAIL_FROM

```
Key: EMAIL_FROM
Value: MyRemind <your-email@gmail.com>
Environment: Production, Preview, Development (chọn cả 3)
```

Click **"Save"**

## ✅ Bước 4: Kiểm tra lại

Đảm bảo bạn đã thêm đủ 4 biến sau:

- ✅ `EMAIL_SERVICE` = `gmail`
- ✅ `EMAIL_USER` = `your-email@gmail.com`
- ✅ `EMAIL_PASSWORD` = `your-app-password` (App Password từ Google)
- ✅ `EMAIL_FROM` = `MyRemind <your-email@gmail.com>`

## 🔄 Bước 5: Redeploy

Sau khi thêm tất cả Environment Variables:

1. Vào tab **"Deployments"** (ở thanh menu trên)
2. Tìm deployment mới nhất (ở đầu danh sách)
3. Click vào **"..."** (3 chấm) bên cạnh deployment
4. Chọn **"Redeploy"**
5. Click **"Redeploy"** để xác nhận
6. Đợi build và deploy hoàn tất (2-5 phút)

## 🧪 Bước 6: Test Email

### Cách 1: Test bằng Cron Job

1. Tạo một bảo hiểm mới với:
   - `reminder_frequency` = `on_due` (Vào ngày hết hạn)
   - `expiry_date` = **hôm nay**
2. Đợi cron job chạy (hoặc trigger thủ công - xem Cách 2)

### Cách 2: Test thủ công (Nhanh hơn)

1. Sau khi deploy xong, mở URL: `https://myremind.vercel.app/api/cron/check-expiry`
2. Hoặc dùng curl:
   ```bash
   curl https://myremind.vercel.app/api/cron/check-expiry
   ```
3. Kiểm tra email inbox của bạn
4. Nếu có bảo hiểm sắp hết hạn, bạn sẽ nhận được email

### Cách 3: Kiểm tra Logs

1. Vào Vercel Dashboard → Project → **"Functions"**
2. Tìm function `/api/cron/check-expiry`
3. Click vào để xem logs
4. Tìm dòng: `Email sent successfully to [your-email]`

## 🔍 Troubleshooting

### Email không được gửi

1. **Kiểm tra Environment Variables:**
   - Vào Settings → Environment Variables
   - Đảm bảo tất cả 4 biến đã được thêm đúng
   - Đảm bảo đã chọn đúng Environment (Production, Preview, Development)

2. **Kiểm tra App Password:**
   - Đảm bảo đang dùng **App Password**, không phải mật khẩu thông thường
   - Nếu Vercel không chấp nhận khoảng trắng, bỏ tất cả khoảng trắng đi

3. **Kiểm tra Logs:**
   - Vào Functions → `/api/cron/check-expiry` → Xem logs
   - Tìm lỗi như: "Email transporter not available" hoặc "Error sending email"

4. **Kiểm tra Spam Folder:**
   - Email có thể bị vào thư mục Spam
   - Kiểm tra cả Promotions tab (nếu dùng Gmail)

### Lỗi "Email transporter not available"

**Nguyên nhân:** Environment variables chưa được set hoặc không đúng.

**Giải pháp:**
1. Kiểm tra lại tất cả EMAIL_* variables
2. Redeploy lại project
3. Đảm bảo đã chọn đúng Environment khi thêm variables

### Lỗi "Invalid login"

**Nguyên nhân:** EMAIL_PASSWORD không đúng hoặc không phải App Password.

**Giải pháp:**
1. Tạo lại App Password từ Google:
   - Vào [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate new app password cho "Mail"
2. Cập nhật EMAIL_PASSWORD trên Vercel
3. Redeploy lại project

## ✅ Checklist

Sau khi hoàn thành, đảm bảo:

- [ ] Đã thêm 4 EMAIL_* variables trên Vercel
- [ ] Đã chọn đúng Environment (Production, Preview, Development)
- [ ] Đã redeploy project
- [ ] Đã test gửi email thành công
- [ ] Đã kiểm tra email inbox (và spam folder)

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Vercel Dashboard → Functions → Logs
2. Email inbox và spam folder
3. Environment Variables đã được set đúng chưa

