# Tài liệu Thiết kế Hệ thống Base Microservice (arc42)

## 1. Giới thiệu và Mục tiêu (Introduction and Goals)

Văn bản này phác thảo kiến trúc hệ thống (Software Architecture) của **Base Microservice**, một bộ khung kiến trúc chuẩn (boilerplate) dành riêng cho các dự án outsourcing của công ty.

**Mục tiêu chính (Goals):**

- **Standardization (Chuẩn hoá):** Đảm bảo mọi dự án mới được khởi tạo với một cấu trúc thư mục, tech-stack và design pattern đồng nhất (tránh tình trạng "mỗi dự án một kiểu").
- **Velocity (Tốc độ):** Tích hợp sẵn các boilerplate, thư viện lõi (Authentication VNeID, Upload, Notification) và công cụ CLI để giảm thời gian setup dự án từ vài tuần xuống còn vài giờ.
- **Maintainability & Quality (Dễ bảo trì):** Kiến trúc phải đủ đơn giản để developer mới dễ dàng onboarding, nhưng cũng đủ chặt chẽ (microservices, loose coupling) để dự án scale lên khi cần thiết.

## 2. Ràng buộc Kiến trúc (Architecture Constraints)

### 2.1. Ràng buộc Kỹ thuật (Technical Constraints)

- **Ngôn ngữ lập trình:** Bắt buộc sử dụng Node.js phối hợp với framework NestJS.
- **Monorepo:** Bắt buộc quản lý tất cả microservices và thư viện dùng chung trong 1 Git Repository duy nhất sử dụng `Nx`.
- **Chuẩn hoá Database:** Sử dụng `TypeORM` làm bộ Object-Relational Mapping áp dụng cho mọi SQL Database (Postgres, MySQL, SQLServer, Oracle).
- **Tin nhắn (Messaging):** Bắt buộc sử dụng Kafka cho mọi luồng truyền dữ liệu bất đồng bộ giữa các module/microservice.

### 2.2. Ràng buộc Tổ chức (Organizational Constraints)

- Tham gia phát triển bởi nhóm Lập trình viên đa phần là Outsourcing, do đó Learning Curve phải được giảm thiểu thông qua CLI Script và cấu trúc thư mục dạng Module "chuẩn NestJS".
- Yêu cầu bàn giao kết quả (source code, API chạy thử) nhanh chóng với công sức setup lại Base Source gần như bằng 0.

## 3. Ngữ cảnh Hệ thống (System Scope and Context)

Hệ thống Base Microservice này đóng vai trò là backend "cứng" cung cấp API cho các dự án đa dạng của công ty.

### 3.1. Ngữ cảnh Nghiệp vụ (Business Context)

- **Người dùng (Users):** Quản trị viên (Web Portal), Người dùng cuối (Mobile Apps/Web Apps), và có thể mở API Public cho đối tác thứ 3 (Tuỳ dự án).
- **Hệ thống bên ngoài (External Systems):**
  - **VNeID (SSO V2.0):** Hệ thống định danh diện tử quốc gia. Base source có sẵn module tích hợp chuẩn để xác thực người dùng qua VNeID.
  - **SMTP / SMS Gateway / Push Provider:** Các hệ thống thứ 3 (nhúng qua interface) để xử lý việc gửi Notification ra ngoài.

### 3.2. Ngữ cảnh Kỹ thuật (Technical Context)

Client giao tiếp với hệ thống chủ yếu qua giao thức HTTP/REST (thông qua Nginx Ingress Controller làm API Gateway). Các hệ thống bên ngoài như VNeID được Base System gọi tới qua REST API an toàn kèm TLS.

## 4. Chiến lược Giải pháp (Solution Strategy)

### 4.1. Định hướng Kiến trúc

- **Kiến trúc:** Microservices thuần (mỗi service làm chủ một Database riêng biệt, đảm bảo tính đóng gói và loose coupling).
- **Giao tiếp (Communication):**
  - **Đồng bộ (Synchronous):** Sử dụng gRPC cho giao tiếp nội bộ hiệu năng cao và REST API (thông qua API Gateway) cho client bên ngoài.
  - **Bất đồng bộ (Asynchronous):** Sử dụng Kafka Message Queue để phát sóng event và xử lý ngầm.

### 4.2. Quản lý Dữ liệu và State

- **ORM:** Thống nhất sử dụng `TypeORM` làm công cụ mapping data với các loại DB lõi.
- **Cache:** Sử dụng Redis dạng Distributed Cache để tối ưu performance và tốc độ phản hồi cho các luồng read nặng.

### 4.3. Mô hình Triển khai

- Triển khai trên môi trường Kubernetes (K8s) và đóng gói cấu hình thông qua Helm Charts, đảm bảo tính linh hoạt khi deploy trên các môi trường hoặc cụm K8s khác nhau.

### 4.4. Công cụ hỗ trợ Phát triển (Developer Experience)

- Hệ thống CLI Tools nội bộ được tích hợp thẳng vào project dưới dạng scripts (VD: `npm run generate:api`). CLI hỗ trợ gen scaffolding cho API, CRUD, Queue Worker (Kafka) và Cron-job, giúp developer mới onboard và code theo đúng chuẩn ngay.

### 4.5. Bảo mật và Phân quyền

- **Authorization:** Định cấu hình phân quyền tinh chỉnh tới từng record với mô hình ABAC/RBAC, tích hợp sẵn library `CASL` chuyên dụng của hệ sinh thái Node.js/NestJS.

## 5. View Building Block (Building Block View)

### 5.1. Khối Hệ thống Tổng thể (Level 1: System Context & Inter-Service)

Toàn bộ source code được quản lý theo mô hình **Monorepo** sử dụng công cụ **Nx**, giúp chia sẻ code (shared libraries, interfaces, DTOs) giữa các service dễ dàng và tối ưu hóa quá trình build/test.

**Thành phần chính cấp Hệ thống:**

- **API Gateway (Nginx Ingress):** Điểm vào (entrypoint) duy nhất từ client bên ngoài, định tuyến requests tới đúng service.
- **Service Discovery (Consul):** Quản lý định vị các instances của service, phục vụ cho gRPC load balancing nội bộ.
- **Message Broker (Kafka):** Trục xương sống cho giao tiếp bất đồng bộ, truyền tải event giữa các service.
- **Dịch vụ lõi (Core Services):** Các domain chính độc lập (VD: `Auth Service`, `User Service`, `File Service`, `Notification Service`). Mỗi service nắm giữ trọn vẹn logic và 1 Database độc lập.

### 5.2. Cấu trúc Lõi 1 Microservice (Level 2: Service Internals)

Mỗi service được thiết kế theo cấu trúc **Module-based (Feature-driven)** tương tự chuẩn NestJS cơ bản, kết hợp DDD nhẹ nhàng. Điểm mạnh là dễ học, dễ onboard cho team outsource.

**Cấu trúc thư mục tiêu chuẩn (Template):**

```text
apps/[service-name]/
├── src/
│   ├── config/              # Cấu hình môi trường, DB, Kafka...
│   ├── core/                # Các thành phần cốt lõi của service (Filters, Interceptors, Guards)
│   ├── modules/             # [Feature Modules] Mỗi module là 1 tính năng độc lập
│   │   ├── [feature]/
│   │   │   ├── controllers/ # HTTP Route handlers (REST)
│   │   │   ├── grpc/        # gRPC methods handlers
│   │   │   ├── services/    # Business logic xử lý
│   │   │   ├── entities/    # TypeORM Entities định nghĩa schema DB
│   │   │   ├── dto/         # Data Transfer Objects (Validation rules)
│   │   │   ├── [feature].module.ts
│   │   ├── ...
│   ├── main.ts              # Entrypoint khởi tạo ứng dụng NestJS
libs/                        # [Nx Shared Libraries]
├── common/                  # Utilities, Helpers dùng chung cho toàn bộ monorepo
├── interfaces/              # Các interface/type dùng chung
├── kafka/                   # Thư viện wrapper cho Kafka Producer/Consumer
```

### 5.3. Các thành phần chia sẻ (Shared Blocks)

Trong kiến trúc Monorepo với Nx, những module mang tính dùng chung (như Auditing logger, thư viện cấu trúc response lỗi, helper classes) được trích xuất thành các **Nx Libraries** nằm trong thư mục `libs/`. Các service ở thư mục `apps/` chỉ cần import vào để sử dụng, giảm triệt để code lặp lặp lại (DRY).

## 6. View Runtime (Runtime View)

Để hiểu cách các component tương tác với nhau, dưới đây là kịch bản chạy (Runtime scenario) tiêu biểu nhất: **Một Client gọi API cần dữ liệu thông qua Authentication.**

1.  **Client Request:** Mobile App / Web Portal gửi request HTTP GET tới `/api/v1/users/profile`.
2.  **API Gateway (Nginx):**
    - Nhận request, thiết lập rate-limiting.
    - Gọi tới service nội bộ `Auth Service` qua gRPC để xác thực chuỗi JWT Token nằm trong Header (Bear Token).
3.  **Auth Service:**
    - Giải mã token, kiểm tra Session Cache trên Redis.
    - Nếu valid, trả về thông tin User Payload kèm Role. Nếu không chứa đủ thông tin, tiến hành móc sang VNeID thông qua logic tích hợp SSO để verify.
4.  **Routing:** API Gateway sau khi nhận kết quả auth hợp lệ, forward request gốc kèm User Payload vào Header tới `User Service`.
5.  **User Service (Business Logic):**
    - Dùng `@casl/ability` Guard kiểm tra quyền (RBAC) "User này có quyền đọc Profile không?".
    - Query vào PostgreSQL database thông qua `TypeORM` để lấy thông tin.
    - Định dạng kết quả qua DTO Response và trả về JSON cho Gateway.
6.  **Gateway tới Client:** API Gateway trả JSON cuối cùng về cho Client (200 OK).

_(Biểu đồ Sequence diagram minh hoạ cho flow này có thể vẽ bổ sung sau)_

## 7. View Triển khai (Deployment View)

### 7.1. Hạ tầng Cơ sở (Infrastructure Level 1)

Hệ thống được thiết kế để triển khai native trên môi trường Cloud, cụ thể là **Private Cloud sử dụng Red Hat OpenShift (Kubernetes enterprise)**.

- **Node (Workers):** Các máy chủ vật lý hoặc VM chạy OpenShift Node.
- **Storage:** Persistent Volumes (PV/PVC) trên OpenShift được cấp phát động cho các cụm Database (PostgreSQL, Mongo, Redis, Kafka) và thư mục lưu trữ File (`Volume`).

### 7.2. Pipeline Triển khai CI/CD (Deployment Pipeline)

Mô hình triển khai bám sát chuẩn GitOps/CI-CD tự động hoá:

1.  **CI (Jenkins):** Lấy code từ repo, chạy linter, unit test. Sử dụng Nx affected để chỉ build những microservices có thay đổi code.
2.  **Container Registry:** Jenkins đóng gói Docker Image cho từng service và push lên Private Container Registry của công ty.
3.  **CD (Jenkins/ArgoCD):** Cập nhật tag image mới vào Helm Charts repo và trigger OpenShift pull image mới về restart pods (Rolling Update).

### 7.3. Cấu trúc Cụm (Cluster View)

- **Ingress Layer:** Nginx Ingress Route của OpenShift xử lý SSL/TLS termination và route traffic HTTP(S) vào service tương ứng.
- **App Layer:** Các Pod chứa Microservice (NodeJS/NestJS). Consul Pods làm nhiệm vụ service registry.
- **Data & Broker Layer:** Kafka Cluster (Zookeeper/Kraft), Redis Cluster, và các Database Pods tương ứng. Trang bị hệ thống Monitoring (Prometheus/Grafana) và Logging (Elasticsearch, Logstash, Kibana - ELK) cắm trực tiếp vào các layer này thông qua DaemonSet/Sidecar.

## 8. Các Khái niệm Xuyên suốt (Cross-cutting Concepts)

### 8.1. Logging và Tracing

- **Logging:** Các microservice ghi log vào `stdout/stderr` theo chuẩn JSON (sử dụng thư viện Winston/Pino), sau đó FluentBit/Logstash thu thập và đẩy vào Elasticsearch (ELK Stack).
- **Tracing:** Sử dụng OpenTelemetry để inject TraceID vào Header của mọi request (HTTP/gRPC) và event (Kafka) đi qua nền tảng. Dữ liệu span được gửi tới Jaeger để dễ dàng debug lỗi xuyên service.

### 8.2. Bảo mật (Security & IAM)

- **Authentication:** Tích hợp với VNeID (SSO V2.0). API Gateway xác thực tính hợp lệ của JWT token trước khi forward request vào service bên trong.
- **Authorization:** Áp dụng mô hình RBAC (Role-based) cơ bản và ABAC (Attribute-based) nâng cao qua thư viện `@casl/ability` đặt trực tiếp tại các NestJS Guards của từng service.

### 8.3. Xử lý Lỗi (Exception Handling)

Xây dựng một `GlobalExceptionFilter` (nằm trong thư viện Nx Shared `libs/common`) bắt toàn bộ các lỗi unhandled của service, chuẩn hoá thành một cấu trúc HTTP Error Response duy nhất gửi về client, đồng thời tự động masking các thông tin nhạy cảm.

### 8.4. Auditing

Các thao tác thay đổi dữ liệu (C/U/D) mang tính nghiệp vụ quan trọng đều bắt buộc phải trigger event ném vào Kafka. `Audit Service` sẽ listen các event này và lưu lại lịch sử Audit Log (Ai đã làm gì, lúc nào, thay đổi từ giá trị X thành Y) nhằm mục đích truy vết và tuân thủ (compliance).

## 9. Quyết định Kiến trúc (Architecture Decisions)

- **AD-001: Sử dụng Nx Monorepo thay vì Multi-repo.** Lựa chọn này giúp đẩy nhanh tốc độ code các module dùng chung (như thư viện auth, interface) của công ty outsource, tránh việc phải publish/install 1 đống các npm package nội bộ.
- **AD-002: Chọn NestJS làm Framework chuẩn.** Chống lại sự phân mảnh công nghệ (người dùng Express, người dùng Fastify). NestJS có kiến trúc module rõ ràng, Dependency Injection mạnh mẽ và code style gần với Angular/Spring Boot, dễ dàng scale up team.
- **AD-003: Phân tán Database.** Mỗi Microservice hoàn toàn sở hữu DB của nó nhằm chặn đứng việc query chéo rủi ro (spaghetti queries) và thắt nút cổ chai (bottleneck) ở mức Data.
- **AD-004: Tích hợp CLI Script.** Quyết định nhúng các script tạo boilerplate (gen API, CRUD) trực tiếp vào source thay vì làm 1 tool CLI ở ngoài nhằm đồng bộ workflow cho developer.

## 10. Yêu cầu Chất lượng (Quality Requirements)

### 10.1. Khả năng Mở rộng (Scalability)

- Hệ thống phải có khả năng scale up/down tự động (HPA trên K8s) dựa trên CPU/Memory usage và độ trễ của Message Queue (Kafka lag).

### 10.2. Hiệu năng (Performance)

- Các API cốt lõi (như lấy thông tin User qua Cache) phản hồi dưới 100ms.
- Các giao tiếp nội bộ qua gRPC duy trì độ trễ dưới 20ms để không ảnh hưởng luồng nghiệp vụ.

### 10.3. Tính Sẵn sàng (Availability)

- Đảm bảo SLA 99.9% uptime. Các Single Point of Failure (API Gateway, Consul, Kafka) buộc phải chạy cluster (đảm bảo redundancy).

### 10.4. Khả năng Bảo trì (Maintainability)

- Thoả mãn dễ dàng cho developer mới clone source và tạo xong 1 API hoàn chỉnh với CLI tool trong vòng dưới 15 phút.
- Cấu trúc code phải pass 100% các rule ESLint/Prettier chung của toàn công ty.

## 11. Đánh giá Rủi ro và Technical Debt (Risks and Technical Debt)

- **Rủi ro Learning Curve của Nx & Microservices:** Với các developer quen làm Monolithic hoặc Framework khác, việc làm quen với Nx Workspace, NestJS Dependency Injection và tư duy Event-driven (Kafka) sẽ tốn thời gian mapping.
  - _Mitigation:_ Tài liệu nội bộ hướng dẫn chi tiết (như bản thân tài liệu này), cùng với các CLI Tools dựng sẵn để giấu đi độ phức tạp lúc setup boilerplate.
- **Rủi ro Quản lý Database Migration:** Trong môi trường Microservices, mỗi API rẽ nhánh Data ra riêng. Khi làm các Use-case phức tạp cần Joint Data, developer có thể lúng túng hoặc query vòng vo.
  - _Mitigation:_ Áp dụng CQRS (Command Query Responsibility Segregation) hoặc Materialized View qua việc stream data từ các DB nhỏ về 1 DB đọc tập trung thông qua Kafka/Debezium nếu tần suất quá cao.
- **Technical Debt về E2E Testing:** Do tốc độ ra features của cty outsource thường đòi hỏi nhanh, Unit Test có thể viết tạm đủ nhưng E2E Test dọc toàn bộ cụm Microservices rất dễ bị bỏ qua, dẫn đến Regress bugs ở giao diện End-user.

## 12. Bảng thuật ngữ (Glossary)

| Thuật ngữ / Viết tắt | Định nghĩa khái niệm                                                                                                |
| :------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Monorepo**         | Một Repository Git duy nhất chứa nhiều project/microservice nhưng tách biệt phần build.                             |
| **Nx**               | Công cụ Build system sinh ra để quản lý Monorepo hiệu quả (chỉ build những hàm bị ảnh hưởng - affected).            |
| **VNeID SSO**        | Nền tảng định danh điện tử của Bộ Công An, ở đây dùng phiên bản SSO 2.0 để xác thực công dân.                       |
| **RBAC / ABAC**      | Role-Based Access Control (Theo Role) & Attribute-Based Access Control (Theo Thuộc tính / Tài nguyên).              |
| **Consul**           | Công cụ của HashiCorp để Service Discovery (Đánh địa chỉ IP động của các microservice nội bộ).                      |
| **CQRS**             | Command Query Responsibility Segregation - Kỹ thuật tách biệt luồng Ghi (Command) và Đọc (Query) để scale database. |
