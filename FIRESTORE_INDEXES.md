# Firestore Indexes Setup Guide

## Cách tạo Firestore Indexes trong Firebase Console

### Bước 1: Mở Firebase Console
1. Truy cập: https://console.firebase.google.com/
2. Chọn project: **grabthebeyond**

### Bước 2: Vào Firestore Indexes
1. Click vào **Firestore Database** ở menu bên trái
2. Click vào tab **Indexes**
3. Click nút **Create Index**

### Bước 3: Tạo các indexes cần thiết

#### Index 1: chat_conversations - userId + updatedAt
- **Collection ID**: `chat_conversations`
- **Fields to index**:
  - `userId` - Ascending
  - `updatedAt` - Descending
- **Query scope**: Collection
- Click **Create**

#### Index 2: chat_conversations - completed + userId + updatedAt
- **Collection ID**: `chat_conversations`
- **Fields to index**:
  - `completed` - Ascending
  - `userId` - Ascending
  - `updatedAt` - Descending
- **Query scope**: Collection
- Click **Create**

#### Index 3: travel_plans - userId + createdAt
- **Collection ID**: `travel_plans`
- **Fields to index**:
  - `userId` - Ascending
  - `createdAt` - Descending
- **Query scope**: Collection
- Click **Create**

### Bước 4: Đợi index được build
- Indexes thường mất 1-5 phút để build
- Bạn sẽ thấy status: **Building** → **Enabled**
- Khi status là **Enabled**, index đã sẵn sàng sử dụng

### Lưu ý:
- Nếu bạn thấy link trong console error, click vào link đó để tự động tạo index
- App vẫn hoạt động khi thiếu index (sẽ query không có orderBy và sort manually), nhưng sẽ chậm hơn

## Các Indexes cần tạo:

1. **chat_conversations**
   - `userId` (Ascending) + `updatedAt` (Descending)
   - `completed` (Ascending) + `userId` (Ascending) + `updatedAt` (Descending)

2. **travel_plans**
   - `userId` (Ascending) + `createdAt` (Descending)

