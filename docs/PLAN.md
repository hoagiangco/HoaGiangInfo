# Plan: Resort Information Website với QR Code Access Control

## 1. Project Setup & Configuration

### 1.1 Initialize Next.js Project
- Setup Next.js 14 với App Router trong thư mục `Frontend`
- Configure TypeScript, ESLint, Tailwind CSS
- Setup Prisma ORM với PostgreSQL
- Create `.env` file với database connection string

**Files to create:**
- `Frontend/package.json`
- `Frontend/tsconfig.json`
- `Frontend/tailwind.config.ts`
- `Frontend/next.config.js`
- `Frontend/.env.example`
- `Frontend/prisma/schema.prisma`

### 1.2 Project Structure
```
Frontend/
├── app/
│   ├── [token]/              # Dynamic route cho QR code
│   ├── admin/                # Admin panel
│   ├── api/                  # API routes
│   └── layout.tsx
├── components/
├── lib/
├── public/
└── prisma/
```

## 2. Database Schema (Prisma)

### 2.1 Core Models
**File: `Frontend/prisma/schema.prisma`**

- **QRCode**: Quản lý QR codes (token, name, type, isActive)
- **Module**: Danh sách modules (menu, room-service, floor-plan, services, information, technical)
- **QRModule**: Junction table (many-to-many giữa QRCode và Module)
- **TechnicalDocument**: Tài liệu kỹ thuật (title, category, fileUrl, content)
- **Menu**: Menu nhà hàng/room service
- **MenuItem**: Items trong menu
- **Service**: Dịch vụ (gym, bar, business-center)
- **Information**: Thông tin cần biết (wifi, phone, tv channels, etc.)

### 2.2 Seed Data
- Tạo script seed với sample data
- Default QR codes: "guest" và "staff"
- Default modules với permissions

## 3. Core Features Implementation

### 3.1 QR Code System & Access Control

**File: `Frontend/lib/qr-auth.ts`**
- Function `verifyQRToken(token: string)` - verify token và lấy modules
- Function `checkModuleAccess(token: string, moduleName: string)` - check permission
- Middleware cho route protection

**File: `Frontend/app/[token]/layout.tsx`**
- Verify QR token từ URL
- Load allowed modules
- Pass permissions to child components
- Handle invalid token (404/redirect)

**File: `Frontend/app/[token]/page.tsx`**
- Homepage với menu navigation
- Chỉ hiển thị modules được phép
- Beautiful card-based UI

### 3.2 Guest Modules

**File: `Frontend/app/[token]/menu/page.tsx`**
- Display restaurant menu
- Categories, images, prices
- Filter by category

**File: `Frontend/app/[token]/room-service/page.tsx`**
- Room service menu
- Similar structure to restaurant menu

**File: `Frontend/app/[token]/floor-plan/page.tsx`**
- Display floor plan image/PDF
- Interactive map (optional: clickable rooms)

**File: `Frontend/app/[token]/services/page.tsx`**
- List services (gym, bar, business-center)
- Links to individual service pages

**File: `Frontend/app/[token]/services/[service]/page.tsx`**
- Individual service detail
- Images, description, hours, location

**File: `Frontend/app/[token]/information/page.tsx`**
- WiFi password
- Phone guide
- SCTV channel list
- Room info
- Organized in cards/sections

### 3.3 Staff Module - Technical Documents

**File: `Frontend/app/[token]/technical/page.tsx`**
- List technical documents by category
- Only accessible if module "technical" is allowed

**File: `Frontend/app/[token]/technical/[id]/page.tsx`**
- View PDF document
- PDF viewer component

**File: `Frontend/components/PDFViewer.tsx`**
- React PDF viewer component
- Download button

## 4. API Routes

### 4.1 QR & Module APIs

**File: `Frontend/app/api/qr/[token]/route.ts`**
- GET: Verify token, return QR info và allowed modules
- Response: `{ qrCode, modules: string[] }`

**File: `Frontend/app/api/modules/route.ts`**
- GET: List all modules
- POST: Create new module (admin only)

**File: `Frontend/app/api/qr/route.ts`**
- GET: List all QR codes (admin)
- POST: Create new QR code (admin)

**File: `Frontend/app/api/qr/[id]/route.ts`**
- GET: Get QR code details
- PUT: Update QR code
- DELETE: Delete QR code

**File: `Frontend/app/api/qr/[id]/modules/route.ts`**
- GET: Get modules for QR code
- POST: Assign module to QR code
- DELETE: Remove module from QR code

### 4.2 Content APIs

**File: `Frontend/app/api/menu/route.ts`**
- GET: Get all menus
- POST: Create menu (admin)

**File: `Frontend/app/api/menu-items/route.ts`**
- GET: Get menu items
- POST: Create menu item (admin)

**File: `Frontend/app/api/services/route.ts`**
- GET: Get all services
- POST: Create service (admin)

**File: `Frontend/app/api/information/route.ts`**
- GET: Get all information items
- POST: Create information (admin)

**File: `Frontend/app/api/technical-documents/route.ts`**
- GET: Get technical documents (check permission)
- POST: Upload/create document (admin)
- File upload handling for PDFs

**File: `Frontend/app/api/technical-documents/[id]/route.ts`**
- GET: Get document details
- PUT: Update document
- DELETE: Delete document

## 5. Admin Panel

### 5.1 Authentication

**File: `Frontend/app/admin/login/page.tsx`**
- Simple password login form
- Store session in cookies/localStorage

**File: `Frontend/lib/admin-auth.ts`**
- Password verification
- Session management

**File: `Frontend/middleware.ts`**
- Protect `/admin/*` routes
- Check admin session

### 5.2 Admin Pages

**File: `Frontend/app/admin/layout.tsx`**
- Admin layout với sidebar navigation
- Logout button

**File: `Frontend/app/admin/page.tsx`**
- Dashboard với statistics
- Quick actions

**File: `Frontend/app/admin/qr-codes/page.tsx`**
- List all QR codes
- Create/Edit/Delete QR codes
- Assign modules to QR codes
- Generate QR code images (using qrcode library)

**File: `Frontend/app/admin/qr-codes/[id]/page.tsx`**
- Edit QR code details
- Manage module permissions
- View QR code image

**File: `Frontend/app/admin/modules/page.tsx`**
- List all modules
- Create/Edit modules

**File: `Frontend/app/admin/menu/page.tsx`**
- Manage menus và menu items
- Upload images
- CRUD operations

**File: `Frontend/app/admin/services/page.tsx`**
- Manage services (gym, bar, business-center)
- Upload images
- CRUD operations

**File: `Frontend/app/admin/information/page.tsx`**
- Manage information items
- CRUD operations

**File: `Frontend/app/admin/technical-documents/page.tsx`**
- List technical documents
- Upload PDF files
- Manage categories
- CRUD operations

## 6. Components

### 6.1 Shared Components

**File: `Frontend/components/Navigation.tsx`**
- Dynamic navigation based on allowed modules
- Responsive menu

**File: `Frontend/components/ModuleCard.tsx`**
- Card component cho modules
- Icon, title, description

**File: `Frontend/components/QRCodeGenerator.tsx`**
- Generate QR code image từ token
- Download functionality

**File: `Frontend/components/AdminSidebar.tsx`**
- Sidebar navigation cho admin

**File: `Frontend/components/FileUpload.tsx`**
- File upload component (PDF, images)
- Preview functionality

## 7. Styling & UI

### 7.1 Design System
- Tailwind CSS configuration
- Color scheme cho resort theme
- Responsive design (mobile-first)
- Beautiful, modern UI

**File: `Frontend/app/globals.css`**
- Custom styles
- Tailwind directives

### 7.2 Icons
- Install react-icons hoặc lucide-react
- Consistent icon usage

## 8. Documentation

### 8.1 Technical Documentation

**File: `docs/ARCHITECTURE.md`**
- System architecture
- Database schema
- API documentation
- QR code flow

**File: `docs/API.md`**
- API endpoints documentation
- Request/Response examples
- Authentication

**File: `docs/DEPLOYMENT.md`**
- Setup instructions
- Environment variables
- Database migration
- Deployment guide

**File: `docs/ADMIN_GUIDE.md`**
- Hướng dẫn sử dụng admin panel
- Cách tạo QR codes
- Quản lý modules
- Upload documents

**File: `README.md`**
- Project overview
- Quick start
- Features list
- Tech stack

## 9. Development Tasks

### Phase 1: Foundation
1. Setup Next.js project với TypeScript, Tailwind
2. Setup Prisma với PostgreSQL
3. Create database schema
4. Seed initial data
5. Basic routing structure

### Phase 2: Core Features
1. QR code verification system
2. Module access control
3. Guest modules (menu, room-service, floor-plan, services, information)
4. Basic UI components

### Phase 3: Staff Features
1. Technical documents module
2. PDF viewer
3. File upload system

### Phase 4: Admin Panel
1. Admin authentication
2. QR code management
3. Module management
4. Content management (menu, services, information)
5. Technical documents management

### Phase 5: Polish & Documentation
1. UI/UX improvements
2. Error handling
3. Loading states
4. Documentation
5. Testing

## 10. Dependencies

**Core:**
- next: ^14.0.0
- react: ^18.0.0
- typescript: ^5.0.0
- prisma: ^5.0.0
- @prisma/client: ^5.0.0

**UI:**
- tailwindcss: ^3.0.0
- react-icons: ^4.0.0
- react-pdf: (for PDF viewer)

**Utilities:**
- qrcode: (generate QR code images)
- zod: (validation)
- bcryptjs: (password hashing)

**File Upload:**
- formidable: (handle file uploads)
- @types/formidable







