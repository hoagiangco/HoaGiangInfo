# Admin Guide

## Đăng nhập

1. Truy cập `/admin/login`
2. Nhập mật khẩu admin (được set trong `.env`)
3. Click "Đăng nhập"

## Dashboard

Dashboard hiển thị thống kê:
- Số lượng QR codes
- Số lượng modules
- Số lượng menus
- Số lượng services
- Số lượng information items
- Số lượng technical documents

## Quản lý QR Codes

### Tạo QR Code mới

1. Vào **QR Codes** → Click **Tạo QR Code mới**
2. Điền thông tin:
   - **Tên**: Tên QR code (ví dụ: "Room 101 QR")
   - **Token**: Token duy nhất (ví dụ: "room-101")
   - **Mô tả**: Mô tả QR code
   - **Loại**: guest, staff, hoặc custom
   - **Active**: Bật/tắt QR code
3. Click **Lưu**

### Chỉnh sửa QR Code

1. Vào **QR Codes** → Click **Edit** trên QR code cần sửa
2. Sửa thông tin
3. **Gán Modules**: Chọn modules mà QR code này có thể truy cập
4. Click **Lưu**

### Generate QR Code Image

1. Vào **QR Codes**
2. Click **Generate QR** trên QR code
3. QR code image sẽ hiển thị
4. Click **Download** để tải về

### URL Format

QR code URL: `https://your-domain.com/[token]`

Ví dụ: `https://resort.com/guest-2024`

## Quản lý Modules

Modules định nghĩa các tính năng có sẵn trong hệ thống:
- `menu`: Menu nhà hàng
- `room-service`: Room service menu
- `floor-plan`: Sơ đồ phòng
- `services`: Dịch vụ khách sạn
- `information`: Thông tin cần biết
- `technical`: Tài liệu kỹ thuật (chỉ staff)

Modules được tạo tự động khi seed database. Bạn có thể xem danh sách trong **Modules**.

## Quản lý Menu

### Tạo Menu

1. Vào **Menu** → Click **Tạo Menu mới**
2. Điền thông tin:
   - **Tên**: Tên menu
   - **Mô tả**: Mô tả menu
   - **Category**: restaurant hoặc room-service
3. Click **Lưu**

### Thêm Menu Items

1. Vào menu cần thêm items
2. Click **Add Item**
3. Điền thông tin:
   - **Tên**: Tên món
   - **Mô tả**: Mô tả món
   - **Giá**: Giá (VND)
   - **Category**: Loại món (appetizer, main, dessert, etc.)
   - **Hình ảnh**: Upload hình ảnh (optional)
4. Click **Lưu**

## Quản lý Services

1. Vào **Services** → Click **Tạo Service mới**
2. Điền thông tin:
   - **Tên**: Tên dịch vụ
   - **Loại**: gym, bar, business-center
   - **Mô tả**: Mô tả dịch vụ
   - **Giờ mở cửa**: Ví dụ "06:00 - 22:00"
   - **Vị trí**: Vị trí dịch vụ
   - **Hình ảnh**: Upload hình ảnh
3. Click **Lưu**

## Quản lý Information

1. Vào **Information** → Click **Tạo Information mới**
2. Điền thông tin:
   - **Category**: wifi, phone, tv, room-info
   - **Title**: Tiêu đề
   - **Content**: Nội dung
   - **Icon**: Emoji icon (optional)
   - **Order**: Thứ tự hiển thị
3. Click **Lưu**

## Quản lý Technical Documents

### Upload Document

1. Vào **Technical Documents** → Click **Upload Document**
2. Điền thông tin:
   - **Title**: Tiêu đề tài liệu
   - **Category**: maintenance, cleaning, safety, equipment, procedures
   - **Description**: Mô tả
   - **Content**: Nội dung HTML/Markdown (optional)
   - **File**: Upload PDF file
3. Click **Upload**

### Categories

- **maintenance**: Bảo trì
- **cleaning**: Vệ sinh
- **safety**: An toàn
- **equipment**: Thiết bị
- **procedures**: Quy trình

### View Documents

Documents chỉ hiển thị cho QR codes có module "technical" được gán.

## Best Practices

1. **QR Code Tokens**: Sử dụng token dễ nhớ và mô tả (ví dụ: "room-101", "lobby-guest")
2. **Module Permissions**: Chỉ gán modules cần thiết cho mỗi QR code
3. **Content Updates**: Cập nhật nội dung thường xuyên
4. **File Sizes**: Giới hạn kích thước file PDF (< 10MB)
5. **Testing**: Test QR codes sau khi tạo/sửa

## Troubleshooting

### QR Code không hoạt động
- Kiểm tra QR code có `isActive = true`
- Kiểm tra token có đúng không
- Kiểm tra modules đã được gán chưa

### Không truy cập được module
- Kiểm tra QR code có module đó trong danh sách không
- Kiểm tra module có `isActive = true` không

### File upload lỗi
- Kiểm tra kích thước file (< 10MB)
- Kiểm tra định dạng file (PDF only)
- Kiểm tra quyền ghi thư mục uploads







