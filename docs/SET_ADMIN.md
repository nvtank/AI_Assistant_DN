# Hướng dẫn Set Admin Role

Có 3 cách để set một tài khoản thành admin:

## Cách 1: Qua API Route (Dễ nhất) ⭐

### Bước 1: Mở browser và truy cập

**Theo email:**
```
http://localhost:3000/api/admin/set-admin?email=your-email@example.com
```

**Theo UID:**
```
http://localhost:3000/api/admin/set-admin?uid=user-uid-here
```

### Bước 2: Kiểm tra kết quả

Nếu thành công, bạn sẽ thấy JSON response:
```json
{
  "success": true,
  "message": "User email@example.com (uid) has been set as admin",
  "userId": "user-uid",
  "email": "email@example.com",
  "role": "admin"
}
```

### Bước 3: Test

Đăng nhập với tài khoản đó và truy cập:
```
http://localhost:3000/admin
```

---

## Cách 2: Qua Script (Command Line)

### Bước 1: Chạy script

**Theo email:**
```bash
npm run set-admin your-email@example.com
```

**Theo UID:**
```bash
npm run set-admin --uid user-uid-here
```

### Bước 2: Kiểm tra output

Nếu thành công, bạn sẽ thấy:
```
✅ Found user: user-uid
✅ Updated user email@example.com (user-uid) to admin role
🎉 Success! User is now an admin.
```

---

## Cách 3: Qua Firestore Console (Thủ công)

### Bước 1: Lấy User UID

1. Đăng nhập vào Firebase Console: https://console.firebase.google.com
2. Vào **Authentication** → **Users**
3. Tìm user cần set admin
4. Copy **UID** của user đó

### Bước 2: Tạo/Update User Document

1. Vào **Firestore Database**
2. Tìm collection `users`
3. Tìm document có ID = UID của user (hoặc tạo mới nếu chưa có)
4. Set các fields:
   ```json
   {
     "uid": "user-uid-here",
     "email": "user@example.com",
     "role": "admin",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

### Bước 3: Save và test

---

## Lưu ý

1. **User phải tồn tại trong Firebase Auth** trước khi set admin
2. **Firebase Admin SDK** phải được cấu hình đúng trong `.env`:
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`

3. Sau khi set admin, user cần **đăng xuất và đăng nhập lại** để role được cập nhật

4. Nếu user document chưa tồn tại trong Firestore, hệ thống sẽ tự động tạo mới với role admin

---

## Troubleshooting

### Lỗi: "User not found"
- Kiểm tra email/UID có đúng không
- Đảm bảo user đã đăng ký trong Firebase Auth

### Lỗi: "Firebase Admin SDK not configured"
- Kiểm tra file `.env` có đầy đủ Firebase Admin config
- Restart server sau khi thêm env variables

### Vẫn không vào được /admin sau khi set
- Đăng xuất và đăng nhập lại
- Clear browser cache
- Kiểm tra Firestore document có field `role: "admin"` không

---

## Kiểm tra User có phải Admin không

Truy cập:
```
http://localhost:3000/api/auth/verify-admin
```

Nếu là admin, sẽ trả về:
```json
{
  "success": true,
  "userId": "user-uid",
  "role": "admin"
}
```
