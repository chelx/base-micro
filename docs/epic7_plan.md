# Plan: Epic 7 - Triển khai CI/CD & Môi trường chạy (Deployment OpenShift)

Tự động hóa hoàn toàn quy trình từ mã nguồn đến môi trường Production trên OpenShift cluster, đảm bảo tính nhất quán và tốc độ release.

## Scope

- **In (Trong phạm vi):**
  - Dockerization (Multi-stage builds).
  - Helm Charts (Generic & Specialized).
  - Jenkins Pipelines (CI/CD).
  - GitOps sync (ArgoCD).
- **Out (Ngoài phạm vi):**
  - Quản trị cluster OpenShift (cài đặt nodes, network plugin - thường do đội infra phụ trách).

## Action Items (Subagent Dispatch List)

- [ ] **Docker (Optimize):** Viết `Dockerfile` chuẩn cho NestJS sử dụng `node:iron-alpine`. Áp dụng multi-stage build để giảm size image (< 200MB) và loại bỏ `devDependencies`.
- [ ] **Helm (Base):** Xây dựng Base Helm Chart tại `deployments/charts/base-app`. Hỗ trợ cấu hình động ConfigMap, Secrets, HPA và Ingress.
- [ ] **Jenkins (CI):** Viết `Jenkinsfile` sử dụng Shared Libraries. Thực hiện: Lint -> Unit Test -> Nx Affected Build -> Docker Build -> Push Registry.
- [ ] **GitOps (CD):** Cấu hình **ArgoCD** Application set. Tự động lắng nghe thay đổi của file `values.yaml` trong Git và thực hiện sync/rolling update lên OpenShift Namespace tương ứng.
- [ ] **Infra (Scale):** Cấu hình Horizontal Pod Autoscaler (HPA) cho các service quan trọng (Auth, Gateway) dựa trên CPU Utilization (threshold 70%).

## Validation & Quality Gates

1. **Build Speed:** Pipeline CI cho 1 service không được quá 5 phút (với caching).
2. **Zero Downtime:** Thực hiện deploy phiên bản mới, verify không có request nào bị lỗi (Rolling update test).
3. **Rollback Test:** Manual trigger rollback trên ArgoCD, hệ thống phải quay về bản image cũ trong < 60s.
4. **Environment Isolation:** Đảm bảo biến môi trường của Namespace `Dev` không bị lẫn sang `Staging/Prod`.
