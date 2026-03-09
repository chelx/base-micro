# Plan: Epic 6 - Hệ thống Kiểm toán & Log sự kiện (Audit System)

Đảm bảo tính minh bạch và khả năng truy vết (Traceability) cho toàn bộ hệ thống bằng cách ghi lại mọi biến động dữ liệu quan trọng qua Kafka.

## Scope

- **In (Trong phạm vi):**
  - Thư viện `libs/kafka` wrapper.
  - Interceptors tự động bắt event C/U/D tại core services.
  - `audit-service` (Consumer & Storage).
- **Out (Ngoài phạm vi):**
  - Business logs (Pino/Winston) - đã thuộc Epic 1.
  - Visualization log (ELK) - đã thuộc Epic 3.

## Action Items (Subagent Dispatch List)

- [ ] **Kafka (Lib):** Xây dựng `libs/kafka`. Wrapper NestJS `Microservices` module để đơn giản hóa việc Inject Producer và nhận Consumer Decorators với cấu hình Retry/DeadLetterQueue mặc định.
- [ ] **Audit (Interceptor):** Xây dựng `AuditLogInterceptor` trong `libs/common`. Tự động trích xuất UserID, Action, EntityName và Old/New Data để gửi vào Kafka topic `system.audit.log`.
- [ ] **Audit (Service):** Khởi tạo `apps/audit-service`. Thiết lập Database (MongoDB hoặc PostgreSQL với Partitioning) chuyên dụng cho dữ liệu Audit lớn.
- [ ] **Audit (Worker):** Viết Kafka Consumer xử lý message từ topic audit. Thực hiện chuẩn hóa dữ liệu và lưu trữ bền vững.
- [ ] **Audit (API):** Xây dựng API query Audit Log theo thời gian, theo User hoặc theo Entity phục vụ mục đích tra soát.

## Validation & Quality Gates

1. **Zero Impact:** Audit Interceptor không được làm chậm request chính (phải chạy async, fire-and-forget vào Kafka).
2. **Data Consistency:** Thực hiện thay đổi ở User Service, Verify sau < 1s dữ liệu Audit xuất hiện trong Audit DB.
3. **Throughput Test:** Giả lập 1000 events/sec, verify Audit Service không bị treo và Kafka Consumer không bị lag (vượt quá threshold).
