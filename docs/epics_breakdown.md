# Phân rã Epics: Base Microservice Project

Dựa trên tài liệu thiết kế kiến trúc chuẩn arc42 (`arc42_architecture_document.md`) và phương pháp lập kế hoạch Agile từ `product-manager-toolkit`, dưới đây là danh sách phân rã hệ thống thành các **Epics** mang tính thực thi cao. Mỗi Epic bao gồm mục tiêu cụ thể và các User Stories / Tasks chi tiết.

---

## Epic 1: Thiết lập Monorepo & Base Framework (Nền móng)

**Mục tiêu:** Khởi tạo không gian làm việc đồng nhất cho toàn dự án, đảm bảo tuân thủ các ràng buộc về công nghệ và tiêu chuẩn code.

**Các Tasks/Stories chính:**

- [ ] Khởi tạo thư mục dự án với **Nx Workspace** dành cho Node.js/NestJS.
- [ ] Cấu hình ESLint và Prettier dùng chung cho toàn bộ monorepo (yêu cầu pass 100%).
- [ ] Thiết lập cấu trúc thư mục chuẩn `apps/` (cho microservices) và `libs/` (cho shared code).
- [ ] Tạo thư viện `libs/common`: Cấu hình Base Logger (Winston/Pino chuẩn JSON) và `GlobalExceptionFilter` bắt lỗi tập trung.
- [ ] Tạo thư viện `libs/interfaces`: Định nghĩa các shared interfaces và Base Response DTO.
- [ ] Tích hợp OpenTelemetry cơ bản vào `libs/common` để chuẩn bị cho distributed tracing.
- [ ] Cấu hình chuẩn `TypeORM` base để tái sử dụng cho các service kết nối DB.

---

## Epic 2: Xây dựng Bộ công cụ CLI (Developer Experience)

**Mục tiêu:** Giảm thiểu "Learning Curve" và tăng tốc độ code cho đội ngũ lập trình viên thông qua các script sinh code tự động (scaffolding).

**Các Tasks/Stories chính:**

- [ ] Viết CLI script `generate:api` để tạo module NestJS chuẩn (báo gồm Controller, Service, Module).
- [ ] Viết CLI script `generate:crud` để sinh tự động mã nguồn CRUD đầy đủ (kết nối sẵn TypeORM Repository, DTO validation).
- [ ] Viết CLI script `generate:worker` để sinh cấu trúc một worker service xử lý sự kiện Kafka.
- [ ] Viết CLI script `generate:job` để sinh cấu trúc module xử lý tác vụ định kỳ (Cron-job).

---

## Epic 3: Xây dựng Hạ tầng Cơ sở (Platform Infrastructure)

**Mục tiêu:** Cài đặt và cấu hình cụm các dịch vụ nền tảng (middleware/infrastructure) trên môi trường OpenShift.

**Các Tasks/Stories chính:**

- [ ] Thiết lập Nginx Ingress Controller (API Gateway) kèm cấu hình SSL/TLS và Rate-limiting.
- [ ] Triển khai cụm Service Discovery sử dụng **Consul**.
- [ ] Triển khai cụm Message Broker **Kafka** (Zookeeper/Kraft mode).
- [ ] Triển khai cụm **Redis Distributed Cache**.
- [ ] Setup stack Observability 1 (Logging): Cài đặt **ELK Stack** (Elasticsearch, Logstash, Kibana) + FluentBit DaemonSet.
- [ ] Setup stack Observability 2 (Metrics & Tracing): Cài đặt **Prometheus / Grafana** và **Jaeger**.

---

## Epic 4: Dịch vụ Xác thực & Phân quyền (Auth Service & Security)

**Mục tiêu:** Xử lý tập trung bài toán đăng nhập, SSO với dịch vụ công quốc gia và cung cấp thư viện kiểm tra quyền hạn.

**Các Tasks/Stories chính:**

- [ ] Khởi tạo `auth-service` trong thư mục `apps/`.
- [ ] Code flow tích hợp API **VNeID SSO V2.0** theo chuẩn REST API bảo mật.
- [ ] Xây dựng tính năng cấp phát và giải mã **JWT Token**.
- [ ] Tích hợp tính năng quản lý Session qua Redis Cache.
- [ ] Xây dựng API nội bộ (gRPC method) để API Gateway gọi vào check token validity trước khi forward request.
- [ ] Cấu hình thư viện phân quyền `@casl/ability` trong `libs/common` để các service khác có thể khai báo RBAC/ABAC Guard.

---

## Epic 5: Phát triển Dịch vụ Lõi (Core Business Services)

**Mục tiêu:** Cung cấp các service nghiệp vụ nền tảng mà hầu hết ứng dụng nào cũng cần.

**Các Tasks/Stories chính:**

- [ ] **User Service:** Xây dựng các API quản lý thông tin User Profile, phân quyền Role (sử dụng PostgreSQL).
- [ ] **File Service:** Xây dựng API Quản lý file (Upload, Download, Share, Delete). Tích hợp cấu hình lưu trữ xuống OpenShift Persistent Volumes.
- [ ] **Notification Service:** Xây dựng API Push Notification. Tích hợp interface để gọi ra ngoài: SMTP (Email), SMS Gateway, và Push Provider (FCM/OneSignal).

---

## Epic 6: Hệ thống Kiểm toán & Log sự kiện (Audit System)

**Mục tiêu:** Đảm bảo mọi thay đổi dữ liệu (C/U/D) quan trọng đều được ghi vế.

**Các Tasks/Stories chính:**

- [ ] Tạo shared library `libs/kafka` wrapper chức năng Producer/Consumer của Kafka.
- [ ] Cấu hình các trigger hoặc interceptor phía core service tự động bắn event (Data changed message) vào Kafka mỗi khi có thay đổi nghiệp vụ.
- [ ] Khởi tạo `audit-service`.
- [ ] Viết Consumer worker (trong Audit Service) lắng nghe topic sự kiện từ Kafka và ghi vào DB lưu trữ Audit Log tập trung.

---

## Epic 7: Triển khai CI/CD & Môi trường chạy (Deployment OpenShift)

**Mục tiêu:** Tự động hoá hoàn toàn luồng đưa source code từ Gitl Lên OpenShift Cluster.

**Các Tasks/Stories chính:**

- [ ] Viết các Dockerfile tối ưu (multi-stage) cho NestJS App.
- [ ] Tạo template **Helm Chart** chuẩn chỉnh để triển khai 1 ứng dụng microservice tuỳ biến.
- [ ] Cấu hình **Jenkins Pipeline (CI)**: Checkout, Lint, Test, Nx affected build và push image lên Private Registry.
- [ ] Cấu hình **ArgoCD / Jenkins (CD)**: Lắng nghe thay đổi Helm tags và tự động sync/rolling update Pods lên OpenShift cluster.
- [ ] Setup cấu hình Horizontal Pod Autoscaler (HPA) trên K8s cho các service dựa trên memory/CPU.
