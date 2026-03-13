# Hướng dẫn kết nối Supabase

Ứng dụng này được thiết kế để hoạt động với Supabase cho Backend (Database & Storage).

## Bước 1: Tạo dự án Supabase
1. Truy cập [Supabase](https://supabase.com/) và tạo một dự án mới.
2. Lấy URL và Anon Key trong phần `Project Settings > API`.

## Bước 2: Cấu hình biến môi trường
Tạo file `.env` ở thư mục gốc của dự án (cùng cấp với `package.json`) và thêm:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Bước 3: Tạo Database Schema
Chạy các lệnh SQL sau trong SQL Editor của Supabase:

```sql
-- Bảng thông tin ứng viên
CREATE TABLE candidate_info (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  dob DATE,
  position TEXT,
  unit TEXT,
  years_of_work INTEGER,
  qualifications TEXT,
  achievements TEXT,
  intro TEXT,
  avatar_url TEXT
);

-- Bảng hồ sơ thành tích
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  size INTEGER
);

-- Bảng kết quả khảo sát
CREATE TABLE survey_responses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  unit TEXT,
  q1 TEXT,
  q2 TEXT[],
  q3 TEXT,
  q4 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Bước 4: Cấu hình Storage
1. Tạo một bucket mới tên là `achievements` (để public).
2. Tạo một bucket mới tên là `avatars` (để public).

*Lưu ý: Hiện tại ứng dụng đang sử dụng Mock Data (dữ liệu mẫu) trong `src/store/mockData.ts` để bạn có thể xem trước giao diện và tính năng. Khi đã kết nối Supabase, bạn có thể thay thế các hàm gọi dữ liệu trong các component để sử dụng `supabase` client từ `src/lib/supabase.ts`.*
