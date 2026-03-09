# Plan: Epic 5 - Phát triển Dịch vụ Lõi (Core Business Services)

Mục tiêu là xây dựng các microservices nghiệp vụ nền tảng. Các service này được thiết kế để phục vụ đa mục đích và có thể tích hợp dễ dàng với nhau qua gRPC hoặc Message Broker.

## Scope

- **In (Trong phạm vi):**
  - **User Service:** Quản lý profile, quan hệ Role-Permission.
  - **File Service:** Tích hợp Storage (Local/PV) và quản lý metadata file.
  - **Notification Service:** Hệ thống gửi tin đa kênh (Email, SMS, Push).
- **Out (Ngoài phạm vi):**
  - Logic xác thực (đã có ở Epic 4).
  - Giao diện Admin UI quản trị User/File.

## Action Items (Subagent Dispatch List)

- [ ] **User (Core):** Khởi tạo `apps/user-service`. Thiết lập Schema PostgreSQL cho User, Profile và Roles. Xây dựng CRUD APIs pass qua `ValidationPipe`.
- [ ] **User (Integration):** Implement gRPC handler để trả về thông tin Profile/Permissions khi Auth Service hoặc Gateway yêu cầu.
- [ ] **File (Engine):** Khởi tạo `apps/file-service`. Xây dựng logic Upload/Download. Tích hợp NestJS `Multer` và cấu hình lưu trữ xuống OpenShift Persistent Volumes.
- [ ] **File (Security):** Implement Token-based access cho File Download (URL có thời hạn) để bảo mật tài nguyên.
- [ ] **Notify (Provider):** Khởi tạo `apps/notification-service`. Xây dựng các Adapters cho SMTP (Email), Twilio/Infobip (SMS) và Firebase (Push).
- [ ] **Notify (Queue):** Tích hợp Kafka Consumer để lắng nghe các yêu cầu gửi thông báo từ các service khác (ví dụ: Audit alert hoặc Welcome email).

## Validation & Quality Gates

1. **Service Independence:** Từng service phải khởi chạy độc lập được với Database riêng.
2. **File Integrity:** Test upload file lớn (>50MB) và verify checksum sau khi lưu trữ.
3. **Notification Delivery:** Mock các providers để verify logic retry khi gửi thông báo thất bại.
4. **Integration Test:** User Service gỡ quyền của một user, Verify gRPC call từ Auth Service trả về đúng state mới.
