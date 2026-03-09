# Plan: Epic 1 - Thiết lập Monorepo & Base Framework (Nền móng)

Thiết lập một cấu trúc **Nx Monorepo** vững chắc cho backend Node.js/NestJS. Mỗi task dưới đây được thiết kế đủ nhỏ, độc lập để có thể giao (dispatch) cho một **Implementer Subagent** theo phương pháp _Subagent-Driven Development_. Mỗi subagent sau khi code xong sẽ được review spec và chất lượng code (Two-stage review).

## Scope

- **In (Trong phạm vi):**
  - Khởi tạo thư mục gốc với Nx, cài đặt Core Dependencies (NestJS, TypeORM, Winston).
  - Cấu hình Global Linter (ESLint, Prettier).
  - Xây dựng các thư viện dùng chung (`libs/common`, `libs/interfaces`).
- **Out (Ngoài phạm vi):**
  - Deploy CI/CD (thuộc Epic khác).
  - Code core business (Auth, User) - chỉ dựng cái base để tái sử dụng.
  - Cấu hình phức tạp của Kafka/Redis (sẽ làm ở Epic 3).

## Action Items (Subagent Dispatch List)

Mỗi mục trong danh sách này là một phiên làm việc (session) riêng biệt dành cho Subagent.

- [ ] **Khởi tạo (Init):** Dùng tuỳ chọn `npx create-nx-workspace` với template NestJS độc lập để tạo khung code. Thiết lập cứng thư mục `apps/` và `libs/`.
- [ ] **Cấu hình (Linting):** Can thiệp vào `.eslintrc.json`, `.prettierrc` tại root để set 100% strict rules chung cho cả team outsource. Tắt những warning thừa.
- [ ] **Thực thi (Lib):** Tạo Nx library `libs/interfaces`. Định nghĩa các Type cơ bản: `BaseResponseDTO`, `PaginationDTO`, `BaseEntity` và chuẩn hoá mã lỗi `BusinessErrorCode` thành Enum.
- [ ] **Thực thi (Lib):** Tạo Nx library `libs/common`. Setup bộ Base Logger sử dụng `pino` format logs sang chuẩn JSON.
- [ ] **Thực thi (Lib):** Bổ sung `GlobalExceptionFilter` vào `libs/common` để catch mọi unhandled exceptions và trả về JSON chuẩn HTTP error theo response DTO.
- [ ] **Thực thi (Tracing):** Thêm cấu hình OpenTelemetry cơ bản (tạo middleware/interceptor gắn root span vào headers) trong `libs/common` để sẵn sàng cho Jaeger tracing về sau.
- [ ] **Thực thi (Database):** Tạo utilities cấu hình `TypeORM` chung. Bao gồm function setup db connection qua biến môi trường (.env) nhằm tái sử dụng cho mọi NestJS module.

## Validation & Quality Gates

Mỗi task ở trên khi hoàn tất bắt buộc phải trải qua 2 vòng review:

1. **Spec Review:** Code push lên chạy `npm run lint` và `nx run-many --target=build` có pass 100% không?
2. **Code Quality Review:** Các đoạn code như GlobalExceptionFilter, Logger đã test cover được các unit test tối thiểu (jest) chưa?
