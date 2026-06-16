# /ponytail-debt - Track deliberate shortcuts

- **Khi nào dùng**: Thu thập tất cả comment dạng `ponytail:` trong codebase để theo dõi các điểm tối giản hóa có chủ ý, tránh bị lãng quên.
- **Cách dùng**: `/ponytail-debt`

Quy trình hoạt động:
1. Grep toàn bộ dự án tìm từ khóa `ponytail:`.
2. Trích xuất thông tin về giới hạn (ceiling) và trigger nâng cấp.
3. Xuất danh sách sổ nợ kỹ thuật (Technical Debt Ledger).
