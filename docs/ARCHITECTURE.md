# System Architecture

## Overview

Resort Information Website là một ứng dụng Next.js fullstack với hệ thống phân quyền dựa trên QR code. Mỗi QR code có thể truy cập các modules khác nhau dựa trên cấu hình.

## Database Schema

### Core Models

#### QRCode
Quản lý các QR codes với token duy nhất.

- `id`: Unique identifier
- `name`: Tên QR code
- `token`: Token duy nhất (dùng trong URL)
- `type`: Loại (guest, staff, custom)
- `isActive`: Trạng thái active/inactive
- `modules`: Quan hệ many-to-many với Module

#### Module
Định nghĩa các modules có sẵn trong hệ thống.

- `id`: Unique identifier
- `name`: Tên module (unique)
- `displayName`: Tên hiển thị
- `route`: Route path
- `isPublic`: Có cần QR code không

#### QRModule
Junction table giữa QRCode và Module (many-to-many).

#### TechnicalDocument
Tài liệu kỹ thuật cho nhân viên.

- `id`: Unique identifier
- `title`: Tiêu đề
- `category`: Danh mục
- `fileUrl`: Đường dẫn file PDF
- `content`: Nội dung HTML/Markdown

#### Menu & MenuItem
Quản lý menu nhà hàng và room service.

#### Service
Quản lý các dịch vụ (gym, bar, business-center).

#### Information
Thông tin cần biết (WiFi, phone, TV channels, etc.).

## Access Control Flow

1. User quét QR code → Redirect đến `/[token]`
2. Server verify token trong `[token]/layout.tsx`
3. Load allowed modules từ database
4. Pass modules to child components
5. Navigation chỉ hiển thị modules được phép
6. Nếu truy cập module không được phép → Redirect về home

## API Structure

### Public APIs
- `GET /api/qr/[token]` - Verify QR token
- `GET /api/modules` - List modules
- `GET /api/menu` - Get menus
- `GET /api/services` - Get services
- `GET /api/information` - Get information

### Protected APIs (Admin)
- Tất cả POST/PUT/DELETE endpoints
- Check admin session trong middleware

### Permission-based APIs
- `GET /api/technical-documents?token=xxx` - Check module access

## File Structure

```
app/
├── [token]/              # Dynamic route
│   ├── layout.tsx        # Verify token, load modules
│   ├── page.tsx          # Homepage với module cards
│   └── [module]/         # Module pages
├── admin/                 # Admin panel
│   ├── layout.tsx        # Check admin session
│   └── [pages]          # Admin pages
└── api/                  # API routes
    ├── qr/
    ├── modules/
    └── [content]/
```

## Authentication

### Admin Authentication
- Simple password-based
- Session stored in HTTP-only cookies
- Middleware protects `/admin/*` routes

### QR Code Authentication
- Token-based (no login required)
- Verified on each request
- Modules loaded from database

## Security Considerations

1. **Admin Password**: Should be hashed in production
2. **QR Token**: Should be random and unique
3. **File Uploads**: Validate file types and sizes
4. **SQL Injection**: Prisma ORM prevents SQL injection
5. **XSS**: React escapes by default, but be careful with `dangerouslySetInnerHTML`

## Performance

1. **Database Queries**: Use Prisma includes for eager loading
2. **Caching**: Consider adding Redis for frequently accessed data
3. **Image Optimization**: Use Next.js Image component
4. **Static Generation**: Consider ISR for public content

## Future Enhancements

1. Multi-language support
2. Analytics tracking
3. Push notifications
4. Offline support (PWA)
5. Advanced file management
6. User feedback system







