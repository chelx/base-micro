# Plan: Epic 4 - Dịch vụ Xác thực & Phân quyền (Auth Service & Security)

Mục tiêu là xây dựng trung tâm bảo mật cho hệ sinh thái microservices, xử lý từ đăng nhập (SSO), quản lý session cho đến phân quyền chi tiết (RBAC/ABAC). Các task tuân thủ mô hình **Subagent-Driven Development** với các ranh giới module rõ ràng.

## Scope

- **In (Trong phạm vi):**
  - Khởi tạo `auth-service` và các module lõi (Auth, User, Token).
  - Tích hợp chuẩn VNeID SSO V2.0.
  - Quản lý JWT (Access/Refresh tokens) và Session Store (Redis).
  - Cung cấp gRPC interface cho API Gateway validate token.
  - Thư viện Authorization (`@casl/ability`) dùng chung.
- **Out (Ngoài phạm vi):**
  - Giao diện người dùng (Frontend Login Page) - chỉ cung cấp API/Redirect flows.
  - Quản lý User Profile chi tiết (thuộc User Service ở Epic 5).
  - Cấu hình hạ tầng Redis/Kong (đã làm ở Epic 3).

## Action Items (Subagent Dispatch List)

- [x] **Auth (Init):** Khởi tạo `apps/auth-service` bằng Nx NestJS generator. Cài đặt các dependencies bảo mật: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`.
- [x] **Auth (SSO):** Thực hiện tích hợp **VNeID SSO V2.0**. Bao gồm: Xây dựng Endpoint nhận Authorization Code, trao đổi lấy Access Token từ VNeID Server, và mapping thông tin định danh vào hệ thống local.
- [x] **Auth (Token):** Xây dựng module quản lý **JWT Token**. Thực hiện cơ chế Rotate Refresh Token và cơ chế Blacklist token (lưu vào Redis) khi người dùng Logout hoặc đổi mật khẩu.
- [x] **Auth (Session):** Tích hợp **Redis Session Store**. Đảm bảo mọi phiên đăng nhập đều được lưu vết trong Redis để hỗ trợ tính năng "Đăng xuất khỏi tất cả thiết bị" và kiểm tra trạng thái hoạt động realtime.
- [x] **Auth (Validation):** Triển khai **gRPC Server** trong Auth Service. Cung cấp phương thức `ValidateToken(TokenRequest)` để API Gateway hoặc các service khác gọi vào kiểm tra tính hợp lệ của token mà không cần giải mã thủ công ở phía Gateway.
- [x] **Auth (Authorization):** Tích hợp thư viện `@casl/ability` vào `libs/common`. Xây dựng `AbilityFactory` và các Custom Decorators (`@CheckAbilities()`) để các service khác có thể dễ dàng khai báo quyền hạn trên từng API.

## Validation & Quality Gates

1. **Security Scan:** Code phải pass kiểm tra không có lỗi hardcode secret. Các thông số VNeID ClientID/Secret phải dùng Environment Variables.
2. **gRPC Protocol Test:** Sử dụng `grpcurl` hoặc Postman gRPC để test performance và tính chính xác của phương thức ValidateToken (latency < 20ms).
3. **Session Persistence:** Kiểm tra nếu Redis sập và khởi động lại, các session (có persistence) vẫn phải được phục hồi hoặc handle gracefully (force login).
4. **Unit Coverage:** Các logic về JWT mapping và CASL Rule definition phải có unit test cover tối thiểu 80%.
