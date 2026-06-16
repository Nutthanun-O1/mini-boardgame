# /ponytail-audit - Codebase Over-engineering Audit

- **Khi nào dùng**: Khi muốn kiểm tra toàn bộ mã nguồn để phát hiện những nơi thiết kế rườm rà, lạm dụng dependency hoặc boilerplate.
- **Cách dùng**: `/ponytail-audit`

Quy trình hoạt động:
1. Quét toàn bộ cây thư mục dự án (trừ `node_modules`, `.git`, v.v.).
2. Phân loại và xếp hạng các phần code thừa hoặc thư viện bên thứ ba không cần thiết.
3. Trả về báo cáo một dòng cho mỗi điểm tìm thấy.
