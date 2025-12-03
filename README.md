# Resort Information Website

Website thông tin resort với hệ thống QR code phân quyền module. Khách hàng và nhân viên có thể quét QR code để truy cập các thông tin và dịch vụ khác nhau dựa trên quyền truy cập.

## Tính năng

### Cho Khách Hàng (Guest)
- Xem menu nhà hàng
- Xem menu room service
- Xem sơ đồ phòng khách sạn
- Xem các dịch vụ: gym, bar, business center
- Xem thông tin cần biết: WiFi password, phone guide, SCTV channel list, room info

### Cho Nhân Viên (Staff)
- Tất cả tính năng của khách hàng
- Xem tài liệu kỹ thuật (PDF)

### Admin Panel
- Quản lý QR codes và phân quyền module
- Quản lý modules
- Quản lý menu và menu items
- Quản lý services
- Quản lý information
- Upload và quản lý technical documents

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Icons**: React Icons
- **QR Code**: qrcode library
- **PDF Viewer**: react-pdf

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm hoặc yarn

### Installation

1. Clone repository:
```bash
git clone <repository-url>
cd HoaGiangInfo
```

2. Install dependencies:
```bash
cd Frontend
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

Edit `.env` file:
```
DATABASE_URL="postgresql://user:password@localhost:5432/resort_info?schema=public"
ADMIN_PASSWORD="your-admin-password"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Setup database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with initial data
npm run db:seed
```

5. Run development server:
```bash
npm run dev
```

Website sẽ chạy tại `http://localhost:3000`

## Usage

### QR Codes

Sau khi seed database, bạn sẽ có 2 QR codes mặc định:
- **Guest QR**: Token `guest-2024` - Truy cập các module cơ bản
- **Staff QR**: Token `staff-2024` - Truy cập tất cả modules bao gồm technical documents

Truy cập: `http://localhost:3000/guest-2024` hoặc `http://localhost:3000/staff-2024`

### Admin Panel

1. Truy cập: `http://localhost:3000/admin/login`
2. Đăng nhập với mật khẩu đã set trong `.env` (mặc định: `admin123`)
3. Quản lý QR codes, modules, và content

### Generate QR Code

Trong admin panel, bạn có thể:
1. Tạo QR code mới với token tùy chỉnh
2. Gán modules cho QR code
3. Generate và download QR code image

## Project Structure

```
Frontend/
├── app/
│   ├── [token]/              # Dynamic route cho QR code
│   │   ├── menu/
│   │   ├── room-service/
│   │   ├── floor-plan/
│   │   ├── services/
│   │   ├── information/
│   │   └── technical/
│   ├── admin/                 # Admin panel
│   ├── api/                   # API routes
│   └── layout.tsx
├── components/                # React components
├── lib/                       # Utilities
│   ├── prisma.ts
│   ├── qr-auth.ts
│   └── admin-auth.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── public/                    # Static files
```

## API Endpoints

### QR Code
- `GET /api/qr/[token]` - Verify QR token
- `GET /api/qr` - List all QR codes (admin)
- `POST /api/qr` - Create QR code (admin)
- `PUT /api/qr/[id]` - Update QR code (admin)
- `DELETE /api/qr/[id]` - Delete QR code (admin)

### Modules
- `GET /api/modules` - List all modules
- `POST /api/modules` - Create module (admin)

### Content
- `GET /api/menu` - Get menus
- `GET /api/services` - Get services
- `GET /api/information` - Get information
- `GET /api/technical-documents?token=xxx` - Get technical documents

Xem thêm trong `docs/API.md`

## Development

### Database Migrations

```bash
# Create migration
npm run db:migrate

# Apply migrations
npm run db:push
```

### Seed Data

```bash
npm run db:seed
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Admin Guide](docs/ADMIN_GUIDE.md)

## License

MIT







