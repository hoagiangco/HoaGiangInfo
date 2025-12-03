# PostgreSQL Setup Guide

## Cài đặt PostgreSQL

### Windows
1. Download PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Chạy installer và làm theo hướng dẫn
3. Ghi nhớ password cho user `postgres`

### Hoặc dùng Docker (khuyến nghị)
```bash
docker run --name postgres-resort -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=resort_info -p 5432:5432 -d postgres:15
```

## Tạo Database

### Cách 1: Dùng psql command line
```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE resort_info;

# Thoát
\q
```

### Cách 2: Dùng pgAdmin (GUI)
1. Mở pgAdmin
2. Connect to server
3. Right-click "Databases" → Create → Database
4. Tên: `resort_info`
5. Click Save

## Cấu hình .env

Cập nhật file `.env` với connection string:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/resort_info?schema=public"
ADMIN_PASSWORD="admin123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Format connection string:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Ví dụ:**
- User: `postgres`
- Password: `mypassword123`
- Host: `localhost`
- Port: `5432`
- Database: `resort_info`

→ `DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/resort_info?schema=public"`

## Chạy Migrations

Sau khi setup database và cấu hình .env:

```bash
# Push schema vào database
npm run db:push

# Seed data
npm run db:seed
```

## Kiểm tra kết nối

```bash
# Test connection
npx prisma db pull
```

Nếu không có lỗi, database đã kết nối thành công!







