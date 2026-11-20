# HoaGiangInfo - Hệ thống thông tin khách hàng & quản lý nội bộ

Hệ thống thông tin đa chức năng dành cho Nhà hàng & Khách sạn:
- **Phía Khách hàng (Customer):** Quét mã QR tại bàn / phòng để xem menu, sơ đồ, tiện ích, dịch vụ, hướng dẫn và **gửi đánh giá / phản hồi trải nghiệm dịch vụ**.
- **Phía Nội bộ (Internal):** Cổng quản trị phân quyền đa cấp (RBAC), **kho lưu trữ tài liệu nội bộ riêng tư** (bảo mật nghiêm ngặt), tiếp nhận & phân công xử lý phản hồi khách hàng, quản lý nội dung CMS và nhật ký kiểm toán (Audit Logs).

---

## 1. Phân chia rõ ràng: Khách hàng vs Nội bộ

| Đặc điểm | Vùng Khách hàng (`/[token]`) | Vùng Nội bộ (`/admin`, `/api/internal/*`) |
|---|---|---|
| **Xác thực** | Token QR tĩnh theo bàn/phòng (không tài khoản) | Tài khoản nhân viên cá nhân (Email + Mật khẩu bcrypt) |
| **Phiên làm việc** | Không lưu phiên nhạy cảm | Session DB-backed (cookie `hg_session`, sha256 token hash) |
| **Quyền hạn** | Chỉ đọc nội dung công khai (`isActive=true`) & gửi phản hồi | Phân quyền 4 vai trò: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `STAFF` |
| **Tài liệu nội bộ** | **Tuyệt đối không thể truy cập** (bị chặn ở middleware + route + storage) | Phân quyền theo phòng ban & cấp bậc; lưu ngoài thư mục public |
| **Phản hồi** | Chỉ được gửi (POST write-only, rate limit, honeypot) | Hộp thư xử lý, giao việc, ghi chú, xuất CSV |

---

## 2. Hệ thống phân quyền (RBAC)

1. **SUPER_ADMIN**: Toàn quyền hệ thống, quản lý mọi tài khoản (kể cả Admin khác).
2. **ADMIN**: Quản lý người dùng cấp dưới, quản lý toàn bộ nội dung CMS, xem mọi tài liệu và nhật ký truy cập.
3. **MANAGER (Quản lý)**: Tiếp nhận phản hồi khách hàng, giao việc cho nhân viên, xem thông tin liên hệ khách hàng (PII), tải lên và xem tài liệu thuộc phòng ban quản lý.
4. **STAFF (Nhân viên)**: Chỉ xem tài liệu chung hoặc tài liệu phòng ban mình; xử lý phản hồi được quản lý giao trực tiếp. Không thể vào CMS, quản lý user hay xem audit log.

---

## 3. Khởi tạo & Cài đặt

### Yêu cầu
- Node.js 18+ (khuyên dùng LTS)
- PostgreSQL

### Các bước cài đặt

1. Di chuyển vào thư mục dự án:
```bash
cd Project
npm install
```

2. Cấu hình file môi trường:
```bash
cp .env.example .env
```
Cập nhật thông tin trong `.env`:
- `DATABASE_URL`: Đường dẫn kết nối PostgreSQL
- `NEXT_PUBLIC_APP_URL`: URL chạy ứng dụng (ví dụ: `http://localhost:6001`)
- `APP_SECRET`: Chuỗi ngẫu nhiên dùng băm IP chống spam feedback
- `STORAGE_DIR`: Thư mục lưu trữ tài liệu nội bộ (mặc định `./storage`, nằm ngoài thư mục `public/`)

3. Khởi tạo Cơ sở dữ liệu:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Tạo tài khoản Super Admin đầu tiên:
```bash
npm run user:create -- --email admin@hoagiang.vn --name "Ban Giám Đốc" --role SUPER_ADMIN
```
*(Hệ thống sẽ nhắc nhập mật khẩu an toàn: tối thiểu 10 ký tự, có chữ hoa, chữ thường và chữ số).*

5. Chạy ứng dụng:
```bash
npm run dev
# hoặc build production
npm run build
npm start
```

---

## 4. Kiểm thử bảo mật & Phân quyền

Hệ thống tích hợp sẵn bộ kiểm thử phân quyền tự động:
```bash
npm run test:authz
```
Kiểm tra tự động:
- Khách hàng vô danh / giả mạo cookie không thể truy cập bất kỳ trang hay API nội bộ nào.
- Nhân viên (STAFF) không thể xem tài liệu phòng ban khác hoặc chỉnh sửa tài liệu.
- Nhân viên không thể xem dữ liệu phản hồi nếu không được giao.
- Kiểm tra cơ chế chống CSRF và rate-limiting.

---

## 5. Cấu trúc thư mục

```
Project/
├── app/
│   ├── [token]/                # Vùng khách hàng (Menu, Dịch vụ, Sơ đồ, Góp ý)
│   │   └── feedback/           # Form đánh giá trải nghiệm dịch vụ
│   ├── admin/                  # Vùng nội bộ nhân viên
│   │   ├── (content)/          # Quản trị CMS (Menu, Services, Floor plans, QR)
│   │   ├── (analytics)/        # Thống kê lượt xem
│   │   ├── documents/          # Kho tài liệu nội bộ (bảo mật)
│   │   ├── feedback/           # Hộp thư phản hồi khách hàng & xử lý
│   │   ├── users/              # Quản lý tài khoản & phân quyền
│   │   ├── audit/              # Nhật ký truy cập & hành động
│   │   └── account/            # Thông tin cá nhân & đổi mật khẩu
│   ├── api/
│   │   ├── auth/               # Đăng nhập, đăng xuất, đổi mật khẩu
│   │   ├── internal/           # API nội bộ (Documents, Feedback, Users)
│   │   └── public/             # API công khai (Gửi feedback)
│   └── login/                  # Trang đăng nhập nội bộ
├── lib/
│   ├── auth/                   # Lõi bảo mật: Sessions, Permissions, Guard, Password
│   ├── storage.ts              # Quản lý lưu trữ tài liệu riêng tư ngoài public/
│   ├── feedback.ts             # Bộ lọc & phân quyền dữ liệu phản hồi
│   ├── documents.ts            # Phân quyền tài liệu theo phòng ban
│   └── rate-limit.ts           # Chống brute-force & spam
├── storage/                    # Thư mục lưu trữ file tài liệu nội bộ (Private)
└── scripts/
    ├── create-user.ts          # CLI tạo tài khoản quản trị
    ├── migrate-documents.ts    # Di chuyển tài liệu cũ sang storage an toàn
    └── test-authz.ts           # Kiểm thử phân quyền tự động
```
