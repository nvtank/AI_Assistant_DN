# Troubleshooting: Không vào được Admin Page

## Vấn đề: Đã set admin nhưng vẫn không vào được `/admin`

### Bước 1: Kiểm tra User Document trong Firestore

Truy cập endpoint debug:
```
http://localhost:3000/api/admin/check-admin?email=anhnvt.23ite@vku.udn.vn
```

Hoặc theo UID:
```
http://localhost:3000/api/admin/check-admin?uid=nsyHpPWywsNmaQFMLbZno7jVl5m2
```

Kiểm tra response:
- `existsInFirestore`: phải là `true`
- `role`: phải là `"admin"`
- `isAdmin`: phải là `true`

### Bước 2: Clear Browser Cache và LocalStorage

1. **Mở Developer Tools** (F12)
2. Vào tab **Application** (Chrome) hoặc **Storage** (Firefox)
3. Tìm **Local Storage** → chọn domain của bạn
4. Xóa key `user` hoặc clear all
5. **Hard Refresh**: Ctrl+Shift+R (Windows/Linux) hoặc Cmd+Shift+R (Mac)

### Bước 3: Đăng xuất và Đăng nhập lại

**Quan trọng**: Sau khi set admin, bạn PHẢI:
1. Đăng xuất hoàn toàn
2. Clear browser cache (như bước 2)
3. Đăng nhập lại
4. Sau đó mới vào `/admin`

### Bước 4: Kiểm tra Firestore Security Rules

Đảm bảo Firestore rules cho phép đọc user document:

```javascript
match /users/{userId} {
  allow read: if request.auth != null; // Cho phép đọc nếu đã đăng nhập
  allow write: if request.auth.uid == userId || 
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Bước 5: Kiểm tra Console Logs

Mở Developer Tools → Console và xem có lỗi gì không:
- Lỗi Firestore permission denied?
- Lỗi network?
- Warning về admin check?

### Bước 6: Set Admin lại (nếu cần)

Nếu user document không tồn tại hoặc role không đúng:

```
http://localhost:3000/api/admin/set-admin?email=anhnvt.23ite@vku.udn.vn
```

Sau đó:
1. Đợi 2-3 giây để Firestore sync
2. Đăng xuất
3. Clear cache
4. Đăng nhập lại
5. Vào `/admin`

### Bước 7: Kiểm tra trực tiếp trong Firestore Console

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project của bạn
3. Vào **Firestore Database**
4. Tìm collection `users`
5. Tìm document có ID = `nsyHpPWywsNmaQFMLbZno7jVl5m2`
6. Kiểm tra field `role` có giá trị `"admin"` không

Nếu không có document:
- Document chưa được tạo
- Chạy lại set-admin API

Nếu có document nhưng role không phải "admin":
- Update trực tiếp trong Firestore Console
- Hoặc chạy lại set-admin API

---

## Debug Commands

### Kiểm tra admin status:
```bash
curl "http://localhost:3000/api/admin/check-admin?email=anhnvt.23ite@vku.udn.vn"
```

### Set admin lại:
```bash
curl "http://localhost:3000/api/admin/set-admin?email=anhnvt.23ite@vku.udn.vn"
```

---

## Lưu ý quan trọng

1. **Firestore có cache**: Client SDK cache data, cần force refresh
2. **LocalStorage cache**: Browser cache user data, cần clear
3. **Auth state**: Cần đăng xuất/đăng nhập lại để refresh auth state
4. **Timing**: Firestore có thể mất vài giây để sync, đợi 2-3 giây sau khi set admin

---

## Nếu vẫn không được

1. Kiểm tra Firebase Admin SDK config trong `.env`
2. Kiểm tra Firestore indexes có được tạo chưa
3. Xem logs trong server console
4. Kiểm tra network tab trong DevTools xem API calls có lỗi không
