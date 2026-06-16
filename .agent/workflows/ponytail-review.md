# /ponytail-review - Over-engineering Review

- **Khi nào dùng**: Khi muốn review các thay đổi (diff) tập trung hoàn toàn vào việc loại bỏ sự phức tạp không cần thiết (over-engineering).
- **Cách dùng**: `/ponytail-review`

Quy trình hoạt động:
1. Quét diff thay đổi.
2. Tìm kiếm mã nguồn rườm rà có thể thay thế bằng stdlib hoặc native platform feature.
3. Xuất kết quả ngắn gọn: vị trí, những gì cần loại bỏ và phần thay thế.
