# 🚗 Grab The Beyond - Hệ thống Báo cáo Sự cố

## 📋 Tổng quan

Hệ thống cho phép người dùng đánh dấu và báo cáo các sự cố trên bản đồ Đà Nẵng. Admin có thể xem và phê duyệt các báo cáo trước khi hiển thị công khai trên bản đồ.

## ✨ Tính năng

### Người dùng
- 📍 Nhấp vào bản đồ để chọn vị trí sự cố
- 📝 Báo cáo sự cố với:
  - Loại sự cố (Ngập lụt, Ổ gà, Thi công, Tắc đường)
  - Mức độ nghiêm trọng (Thấp, Trung bình, Cao)
  - Mô tả chi tiết
  - Hình ảnh (tùy chọn)
- ✅ Nhận thông báo đã gửi thành công
- 🗺️ Xem các sự cố đã được Admin xác nhận trên bản đồ

### Admin Dashboard
- 📊 Xem thống kê tổng quan:
  - Số sự cố chờ xử lý
  - Số sự cố đã xác nhận
  - Tổng số sự cố
  - Số sự cố nghiêm trọng
- 📋 Quản lý sự cố:
  - **Tab "Chờ xử lý"**: Xem và xét duyệt sự cố mới
  - **Tab "Đã xác nhận"**: Xem và quản lý sự cố đã duyệt
- ✅ Phê duyệt sự cố (hiển thị trên bản đồ)
- ❌ Từ chối sự cố (xóa khỏi danh sách chờ)
- 🗑️ Xóa sự cố đã xác nhận khỏi bản đồ

## 🎨 Giao diện

### Trang chủ
- Bản đồ tương tác với các marker màu sắc theo loại sự cố
- Form báo cáo sự cố dễ sử dụng
- Legend hiển thị ý nghĩa các icon

### Admin Dashboard
- Thiết kế clean, hiện đại
- Card statistics với icon trực quan
- Grid layout responsive cho danh sách sự cố
- Modal xem chi tiết sự cố
- Hover effects mượt mà

## 💾 Lưu trữ dữ liệu

Hệ thống sử dụng **localStorage** để lưu trữ:
- `grab_pending_incidents`: Sự cố chờ Admin xét duyệt
- `grab_incidents`: Sự cố đã được Admin xác nhận

**Ưu điểm:**
- ✅ Đơn giản, không cần database
- ✅ Không cần backend API
- ✅ Hoạt động offline
- ✅ Phù hợp cho demo và prototype

**Lưu ý:**
- Dữ liệu chỉ lưu trên trình duyệt hiện tại
- Xóa cache/cookies sẽ mất dữ liệu
- Nên chuyển sang database thực (Firebase, MongoDB...) cho production

## 🚀 Cách sử dụng

### Người dùng báo cáo sự cố

1. Đăng nhập vào hệ thống
2. Nhấp vào nút **"Report Incident"** hoặc click trực tiếp trên bản đồ
3. Chọn loại sự cố và mức độ nghiêm trọng
4. Nhập mô tả và upload hình ảnh (nếu có)
5. Nhấn **"Submit Report"**
6. Nhận thông báo đã gửi tới Admin

### Admin xét duyệt sự cố

1. Đăng nhập với tài khoản Admin
2. Click vào avatar → chọn **"Admin Dashboard"**
3. Xem danh sách sự cố trong tab **"Chờ xử lý"**
4. Click vào sự cố để xem chi tiết
5. Chọn:
   - **"Phê duyệt"** → Sự cố hiển thị trên bản đồ
   - **"Từ chối"** → Xóa sự cố khỏi danh sách

### Quản lý sự cố đã xác nhận

1. Vào tab **"Đã xác nhận"** trong Admin Dashboard
2. Xem danh sách các sự cố đang hiển thị trên bản đồ
3. Click **"Xóa"** để gỡ sự cố khỏi bản đồ

## 🛠️ Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Truy cập:
- Trang chủ: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin

## 📦 Dependencies mới

- `date-fns`: Format thời gian hiển thị (ví dụ: "2 hours ago")

## 🔐 Bảo mật

**Lưu ý cho production:**
- Cần thêm role-based access control (RBAC)
- Chỉ cho phép Admin truy cập `/admin`
- Validate dữ liệu từ client
- Thêm rate limiting cho API
- Chuyển sang database server-side

## 🎯 Roadmap

- [ ] Thêm filter theo loại/mức độ sự cố
- [ ] Search và sort trong Admin Dashboard
- [ ] Export danh sách sự cố ra Excel/PDF
- [ ] Notifications khi có sự cố mới cần xét duyệt
- [ ] Chuyển sang database thực (Firebase/MongoDB)
- [ ] Thêm comment/discussion cho mỗi sự cố
- [ ] Map clustering khi có nhiều sự cố gần nhau

## 👥 Hỗ trợ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ team phát triển.
