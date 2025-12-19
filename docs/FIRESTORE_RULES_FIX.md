# Sửa Firestore Security Rules

## Vấn đề

Lỗi "Missing or insufficient permissions" xảy ra vì Firestore security rules đang chặn việc đọc user document từ client-side.

## Giải pháp đã áp dụng

Đã tạo API route `/api/auth/check-role` để check admin role từ server-side (bypass security rules). Admin page giờ dùng API route này thay vì client-side check.

## Tuy nhiên, bạn vẫn nên sửa Firestore Rules

Để đảm bảo hệ thống hoạt động tốt, bạn nên cập nhật Firestore security rules trong Firebase Console.

### Bước 1: Vào Firebase Console

1. Truy cập: https://console.firebase.google.com
2. Chọn project của bạn
3. Vào **Firestore Database** → **Rules**

### Bước 2: Cập nhật Rules

Copy và paste rules sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      // Allow user to read their own document OR if they are admin
      allow read: if isSignedIn() && (isOwner(userId) || isAdmin());
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Incidents collection (incident_report)
    match /incident_report/{incidentId} {
      allow read: if true;  // Public read
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Travel plans collection
    match /travel_plans/{planId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && 
                    request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && 
                    resource.data.userId == request.auth.uid;
      allow delete: if isSignedIn() && 
                    (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Online users collection
    match /online_users/{userId} {
      allow read: if true;  // Public for counter
      allow write: if isOwner(userId);
    }
    
    // Chat history collection
    match /chat_history/{messageId} {
      allow read: if isSignedIn() && 
                  resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && 
                    request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;  // Immutable
    }
  }
}
```

### Bước 3: Publish Rules

1. Click **Publish** để lưu rules
2. Đợi vài giây để rules được deploy

### Bước 4: Test

Sau khi publish rules:
1. Đăng xuất và đăng nhập lại
2. Thử vào `/admin` page
3. Nếu vẫn lỗi, clear browser cache và thử lại

## Lưu ý quan trọng

1. **Rule cho users collection**: 
   - Cho phép user đọc document của chính họ
   - Cho phép admin đọc tất cả user documents
   - Điều này cần thiết để check admin role

2. **API route vẫn hoạt động**: 
   - Ngay cả khi rules chưa được sửa, API route `/api/auth/check-role` vẫn hoạt động vì nó dùng Admin SDK (bypass rules)
   - Nhưng sửa rules sẽ giúp client-side code hoạt động tốt hơn

3. **Security**: 
   - Rules này vẫn đảm bảo security
   - User chỉ đọc được document của chính họ (trừ admin)
   - Admin có thể đọc tất cả để quản lý

## Kiểm tra Rules có hoạt động không

Sau khi publish rules, test bằng cách:
1. Mở browser console
2. Vào `/admin` page
3. Xem có còn lỗi "Missing or insufficient permissions" không

Nếu không còn lỗi → Rules đã hoạt động đúng ✅
