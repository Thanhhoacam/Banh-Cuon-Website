# 🍜 Bánh Cuốn Cậu Cả - Food Ordering System

Một hệ thống đặt món ăn hiện đại được xây dựng với Next.js 14, Firebase, và Tailwind CSS. Hệ thống hỗ trợ đặt món trực tuyến, quản lý đơn hàng real-time, và giao diện responsive cho cả khách hàng và nhân viên.

## ✨ Tính năng chính

### 👥 Giao diện khách hàng

- **Menu món ăn trực quan** với hình ảnh và giá cả
- **Giỏ hàng thông minh** với tính năng thêm/xóa món
- **Chọn số bàn** trước khi đặt món
- **Theo dõi trạng thái đơn hàng** real-time
- **Hủy đơn hàng** khi cần thiết
- **Giao diện responsive** tối ưu cho mobile và desktop

### 👨‍🍳 Giao diện nhân viên/admin

- **Dashboard quản lý** đơn hàng tổng quan
- **Xử lý đơn hàng chưa thanh toán** (pending orders)
- **Quản lý đơn hàng đã thanh toán** (paid orders)
- **Cập nhật trạng thái đơn hàng** real-time
- **Thống kê và báo cáo** nhanh chóng

### 🔄 Tính năng real-time

- **Cập nhật trạng thái đơn hàng** ngay lập tức
- **Đồng bộ dữ liệu** giữa các thiết bị
- **Thông báo toast** cho các hành động
- **Auto-refresh** danh sách đơn hàng

## 🛠️ Công nghệ sử dụng

### Frontend

- **Next.js 14** - React framework với App Router
- **TypeScript** - Type safety và developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Shadcn/ui** - UI component library
- **React Query** - Data fetching và caching

### Backend & Database

- **Firebase Firestore** - NoSQL database real-time
- **Firebase Authentication** - Xác thực người dùng
- **Next.js API Routes** - Serverless API endpoints

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Date-fns** - Date manipulation
- **Zod** - Schema validation

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- Tài khoản Firebase

### Bước 1: Clone repository

```bash
git clone https://github.com/your-username/food-ordering-system.git
cd food-ordering-system/food-order
```

### Bước 2: Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### Bước 3: Cấu hình Firebase

#### 3.1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" hoặc "Thêm dự án"
3. Nhập tên project (ví dụ: `banh-cuon-cau-ca`)
4. Chọn có/không bật Google Analytics (tùy chọn)
5. Click "Create project"

#### 3.2. Bật Firestore Database

1. Trong Firebase Console, chọn project vừa tạo
2. Click "Firestore Database" ở menu bên trái
3. Click "Create database"
4. Chọn "Start in test mode" (cho development)
5. Chọn location gần nhất (ví dụ: `asia-southeast1`)
6. Click "Done"

#### 3.3. Lấy Firebase Config

1. Click vào biểu tượng ⚙️ (Settings) > "Project settings"
2. Scroll xuống phần "Your apps"
3. Click "Web app" (biểu tượng `</>`)
4. Nhập tên app (ví dụ: `banh-cuon-web`)
5. Click "Register app"
6. Copy config object được hiển thị

#### 3.4. Tạo file .env.local

1. Trong thư mục `food-order`, tạo file mới tên `.env.local`
2. Copy nội dung sau và thay thế bằng config từ Firebase:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=********
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=********
NEXT_PUBLIC_FIREBASE_PROJECT_ID=********
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=********
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=********
NEXT_PUBLIC_FIREBASE_APP_ID=******

CLOUDINARY_CLOUD_NAME=********
CLOUDINARY_API_KEY=********
CLOUDINARY_API_SECRET=******
```

#### 3.5. Cấu hình Firestore Rules (Tùy chọn)

1. Trong Firebase Console > Firestore Database > Rules
2. Thay thế rules mặc định bằng:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc/ghi cho tất cả (chỉ dùng cho development)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Lưu ý bảo mật**: Rules trên chỉ dành cho development. Trong production, hãy cấu hình rules phù hợp với yêu cầu bảo mật.

### Bước 4: Chạy dự án

```bash
npm run dev
# hoặc
yarn dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc dự án

```
food-order/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Trang admin
│   │   ├── staff/             # Trang nhân viên
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── admin/             # Admin components
│   │   ├── customer/          # Customer components
│   │   ├── staff/             # Staff components
│   │   └── ui/                # UI components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Utility functions
│   ├── models/                # TypeScript interfaces
│   └── types/                 # Type definitions
├── public/                    # Static assets
└── README.md
```

## 🎯 Hướng dẫn sử dụng

### Cho khách hàng

1. **Chọn số bàn** - Nhập số bàn trước khi đặt món
2. **Thêm món vào giỏ** - Click nút "+" bên cạnh món ăn
3. **Xem giỏ hàng** - Click nút giỏ hàng ở giữa bottom (mobile)
4. **Gửi đơn hàng** - Click "🚀 Gửi đơn hàng"
5. **Theo dõi trạng thái** - Xem trạng thái đơn hàng real-time

### Cho nhân viên

1. **Truy cập admin** - Click nút xanh-tím bên phải màn hình
2. **Xem đơn chưa thanh toán** - Chọn "Đơn chưa thanh toán"
3. **Cập nhật trạng thái** - Click các nút trạng thái tương ứng
4. **Quay lại trang khách** - Click nút cam-đỏ bên trái

## 🔧 API Endpoints

- `GET /api/foods` - Lấy danh sách món ăn
- `POST /api/orders` - Tạo đơn hàng mới
- `PATCH /api/orders/[id]` - Cập nhật trạng thái đơn hàng
- `GET /api/stats` - Lấy thống kê

## 🎨 UI/UX Features

- **Responsive Design** - Tối ưu cho mọi thiết bị
- **Dark/Light Theme** - Hỗ trợ chế độ sáng/tối
- **Smooth Animations** - Chuyển động mượt mà với Framer Motion
- **Toast Notifications** - Thông báo trực quan
- **Loading States** - Trạng thái loading cho UX tốt hơn

## 🚀 Deployment

### Vercel (Recommended)

1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Cấu hình environment variables
4. Deploy tự động

### Firebase Hosting

```bash
npm run build
firebase deploy
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Project Link**: [https://github.com/your-username/food-ordering-system](https://github.com/your-username/food-ordering-system)
- **Demo**: [https://your-demo-link.vercel.app](https://your-demo-link.vercel.app)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Firebase](https://firebase.google.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

⭐ **Nếu dự án này hữu ích, hãy cho một star nhé!** ⭐
