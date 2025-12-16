# GrabTheBeyond - System Design Documentation

## 📋 Mục Lục

1. [System Architecture](./diagrams/01-System-Architecture.md) - Kiến trúc tổng thể hệ thống
2. [Database Design](./diagrams/02-Database-Design.md) - Thiết kế cơ sở dữ liệu
3. [Sequence Diagrams](./diagrams/03-Sequence-Diagrams.md) - Các luồng xử lý chi tiết
4. [Component Diagram](./diagrams/04-Component-Diagram.md) - Cấu trúc thành phần
5. [Deployment Diagram](./diagrams/05-Deployment-Diagram.md) - Kiến trúc triển khai
6. [Data Flow Diagram](./diagrams/06-Data-Flow-Diagram.md) - Luồng dữ liệu
7. [Use Case Diagram](./diagrams/07-Use-Case-Diagram.md) - Tình huống sử dụng
8. [API Architecture](./diagrams/08-API-Architecture.md) - Kiến trúc API
9. [Real-time Communication](./diagrams/09-Realtime-Architecture.md) - Giao tiếp thời gian thực

## 🎯 Tổng Quan Hệ Thống

**GrabTheBeyond** là một nền tảng du lịch thông minh tích hợp AI cho thành phố Đà Nẵng, được xây dựng cho Grab Hackathon 2025. Hệ thống kết hợp nhiều công nghệ tiên tiến:

### 🏗️ Kiến Trúc Tổng Thể
- **Frontend**: Next.js 14 với TypeScript, React 18, Tailwind CSS
- **Backend**: Express.js với Socket.IO cho real-time communication
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage (cho upload ảnh)
- **AI Engine**: Google Gemini AI
- **Map Service**: Leaflet + OpenStreetMap
- **External APIs**: Google Places, OpenWeather, Grab Integration

### 🎨 Các Tính Năng Chính

#### 1. Real-time Incident Reporting System
- Báo cáo sự cố theo thời gian thực
- Upload hình ảnh, mô tả, vị trí GPS
- Hiển thị trên bản đồ tương tác
- Thông báo real-time qua Socket.IO

#### 2. Context-Aware AI Chatbot
- Tích hợp Google Gemini AI
- Tư vấn địa điểm du lịch thông minh
- Hỗ trợ voice input (Speech Recognition)
- Tìm kiếm địa điểm qua Google Places API
- Cung cấp thông tin thời tiết real-time

#### 3. Travel Planner
- Lập kế hoạch du lịch theo ngân sách
- Đề xuất lịch trình theo ngày
- Tính toán chi phí ước tính
- Tích hợp với Grab để đặt xe

#### 4. Grab Integration
- Deep linking đến ứng dụng Grab
- Tự động điền địa chỉ đón/trả
- Hiển thị ước tính giá cước

#### 5. Online Users Tracking
- Theo dõi số người dùng online real-time
- Heartbeat mechanism (20s interval)
- Tự động cleanup khi user offline

### 📊 Các Sơ Đồ Kỹ Thuật

Tài liệu này bao gồm 9 loại sơ đồ kỹ thuật được thiết kế theo chuẩn UML và Software Engineering:

1. **System Architecture Diagram**: Mô tả các layers, services, và data flow
2. **Database ER Diagram**: Cấu trúc collections trong Firestore
3. **Sequence Diagrams**: 5+ flows quan trọng (login, report incident, AI chat...)
4. **Component Diagram**: Cấu trúc module và dependencies
5. **Deployment Diagram**: Infrastructure và hosting
6. **Data Flow Diagram**: Luồng dữ liệu qua các layers
7. **Use Case Diagram**: Tương tác user với hệ thống
8. **API Architecture**: RESTful APIs và WebSocket endpoints
9. **Real-time Architecture**: Socket.IO event flow

### 🛡️ Security & Performance

- **Authentication**: Firebase Auth với JWT tokens
- **Authorization**: Role-based access control (User, Admin)
- **API Security**: CORS configuration, rate limiting
- **Data Validation**: Server-side và client-side validation
- **Real-time Sync**: Optimistic updates với Firestore
- **Caching**: Client-side caching cho map tiles
- **Performance**: Code splitting, lazy loading, image optimization

### 🚀 Deployment Strategy

- **Frontend**: Vercel/Railway (Next.js optimized)
- **Backend**: Railway/Heroku (Express server)
- **Database**: Firebase Cloud Firestore (managed)
- **CDN**: Firebase Hosting/Cloudinary (cho media files)
- **Monitoring**: Firebase Analytics, Console logs

---

## 📖 Hướng Dẫn Đọc Tài Liệu

1. **Cho Ban Giám Khảo/Stakeholders**: Đọc theo thứ tự từ 1 → 9
2. **Cho Developers**: Bắt đầu với System Architecture → API Architecture → Component Diagram
3. **Cho Database Designers**: Tập trung vào Database Design và Data Flow
4. **Cho DevOps**: Xem Deployment Diagram và Real-time Architecture

---

## 🎓 Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Leaflet |
| **Backend** | Node.js, Express.js, Socket.IO |
| **Database** | Firebase Firestore, Firebase Storage |
| **Auth** | Firebase Authentication |
| **AI/ML** | Google Gemini AI API |
| **APIs** | Google Places, OpenWeather, Nominatim Geocoding |
| **Real-time** | Socket.IO (WebSocket), Firebase Realtime Listeners |
| **DevOps** | Railway, Vercel, Git, npm |

---

**Last Updated**: December 16, 2025  
**Version**: 1.0.0  
**Team**: GrabTheBeyond Development Team

