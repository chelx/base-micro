# Thiết lập Lộ trình (Roadmap) với RICE Framework

Dựa trên kết quả phân tích bằng RICE Prioritizer từ `product-manager-toolkit`, lộ trình triển khai (Roadmap) được tối ưu hoá theo giá trị (Value) và Độ khó (Effort) như sau:

## 📊 Mức độ ưu tiên (Priority)

1. **Epic 1:** Monorepo & Base Framework (Rúp rút RICE: 60.0)
2. **Epic 4:** Auth Service & Security (Rúp rút RICE: 60.0)
3. **Epic 2:** CLI Tools (Rúp rút RICE: 40.0)
4. **Epic 6:** Audit System (Rúp rút RICE: 33.33)
5. **Epic 5:** Core Business Services (Rúp rút RICE: 25.0)
6. **Epic 3:** Platform Infrastructure (Rúp rút RICE: 20.0)
7. **Epic 7:** Deployment OpenShift (Rúp rút RICE: 20.0)

---

## 📅 Roadmap Đề xuất (Theo Sprint/Quarter)

Với giả định nguồn lực team vừa đủ:

### 🚀 Phase 1: Nền tảng & Bảo mật cốt lõi (Core Foundation)

- **Epic 1: Monorepo & Base Framework:** Thiết lập khung code (Nx, NestJS, `libs/common`).
- **Epic 4: Auth Service & Security:** Setup xác thực JWT, SSO VNeID và RBAC.
  > _Mục tiêu:_ Có khung source code chuẩn chạy được và check phân quyền bảo mật thành công ở API Gateway.

### ⚡ Phase 2: Tăng tốc phát triển (Developer Velocity)

- **Epic 2: CLI Tools:** Giúp team outsource tự generate API/CRUD.
- **Epic 6: Audit System:** Lắng nghe Kafka và lưu log. Phục vụ setup logic lõi.
  > _Mục tiêu:_ Team đã có thể tự code các feature dễ dàng mà vẫn tuân thủ được luồng ghi Audit.

### 🏢 Phase 3: Dịch vụ & Triển khai (Services & Infrastructure)

- **Epic 5: Core Business Services:** File Service, User Service, Notification.
- **Epic 3: Platform Infrastructure:** Setup Kafka, Redis, Ingress cho môi trường.
- **Epic 7: Deployment OpenShift:** Jenkins CI/CD và ArgoCD.
  > _Mục tiêu:_ Đưa toàn bộ base microservices lên cụm OpenShift chạy CI/CD tự động, sẵn sàng làm template cho dự án outsource.
