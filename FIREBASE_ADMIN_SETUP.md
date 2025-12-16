# 🔧 Hướng dẫn cấu hình Firebase Admin SDK

## Vấn đề
Khi sử dụng API route `/api/users/offline`, bạn gặp lỗi `PERMISSION_DENIED` vì:
- API route chạy trên server (Next.js) không có authentication context
- Firestore security rules yêu cầu `request.auth.uid == userId`
- Cần Firebase Admin SDK để bypass security rules cho server-side operations

## ✅ Giải pháp: Cấu hình Firebase Admin SDK

### Bước 1: Tạo Service Account trong Firebase Console

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** (⚙️) → **Service accounts** tab
4. Click **Generate new private key**
5. File JSON sẽ được download về máy

### Bước 2: Lấy thông tin từ Service Account JSON

File JSON có dạng:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

### Bước 3: Thêm vào file `.env`

Thêm các biến sau vào file `.env` ở root của project:

```env
# Firebase Admin SDK (Server-side - Required)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Lưu ý quan trọng:**
- `FIREBASE_ADMIN_PRIVATE_KEY` phải được đặt trong dấu ngoặc kép `"`
- Giữ nguyên các ký tự `\n` trong private key (không thay thế bằng newline thật)
- Hoặc nếu bạn copy từ file JSON, thay `\n` thật bằng `\\n`

### Bước 4: Restart server

Sau khi thêm biến môi trường, **bắt buộc phải restart** Next.js server:

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
npm run dev
```

### Bước 5: Kiểm tra

1. Mở browser console
2. Đóng tab hoặc navigate away
3. Kiểm tra terminal - không còn lỗi `PERMISSION_DENIED`

## 🔍 Troubleshooting

### Lỗi: "FIREBASE_ADMIN_PROJECT_ID is not set"
- Kiểm tra file `.env` có tồn tại không
- Đảm bảo các biến có tên chính xác (không có khoảng trắng)
- Restart server sau khi thêm biến

### Lỗi: "Invalid credential"
- Kiểm tra `FIREBASE_ADMIN_PRIVATE_KEY` có đúng format không
- Đảm bảo private key được đặt trong dấu ngoặc kép
- Kiểm tra `FIREBASE_ADMIN_CLIENT_EMAIL` có đúng không

### Lỗi vẫn còn sau khi cấu hình
- Xóa `.next` folder và rebuild: `rm -rf .next && npm run dev`
- Kiểm tra file `.env` có trong `.gitignore` (không commit lên git)
- Xác nhận service account có quyền truy cập Firestore

## 📝 Security Notes

⚠️ **QUAN TRỌNG:**
- File `.env` **KHÔNG BAO GIỜ** được commit lên Git
- Service account có full access đến Firestore - chỉ dùng cho server-side
- Không expose các biến này ra client-side (không dùng `NEXT_PUBLIC_` prefix)

## 🔗 Tài liệu tham khảo

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Accounts](https://firebase.google.com/docs/admin/setup#initialize-sdk)
