# Plan: Epic 3 - Xây dựng Hạ tầng Cơ sở (Platform Infrastructure)

Mục tiêu chính là thiết lập toàn bộ cụm Middleware và Observability trên môi trường OpenShift. Các task được phân rã theo tư duy **Subagent-Driven Development**, đảm bảo tính độc lập và khả năng kiểm thử biên (boundary testing).

## Scope

- **In (Trong phạm vi):**
  - Triển khai và cấu hình các thành phần Infrastructure bằng Helm Chart hoặc Operators.
  - Thiết lập bảo mật cơ bản cho Middleware (Passwords, ACLs, SSL).
  - Kết nối các luồng log và metrics cơ bản từ Cluster về stack tập trung.
- **Out (Ngoài phạm vi):**
  - Code nghiệp vụ ứng dụng (thuộc Epic khác).
  - CI/CD automation cho application code (Epic 7).
  - Tối ưu hoá performance sâu (sẽ thực hiện sau khi có tải thực tế).

## Action Items (Subagent Dispatch List)

Mỗi mục dưới đây là một đầu việc trọn gói, có đầu vào (Requirements) và đầu ra (Verifiable Artifacts) rõ ràng.

- [ ] **Infra (Gateway):** Cài đặt **Nginx Ingress Controller** thông qua Helm. Cấu hình Default SSL Certificate và thiết lập Policy cho Global Rate-limiting (ví dụ: 100 req/s per IP).
- [ ] **Infra (Discovery):** Triển khai cụm **Consul** (3 nodes/server mode cho High Availability). Xuất link UI quản trị và cấu hình ACL Token mặc định cho các microservices đăng ký (Service Registration).
- [ ] **Infra (Messaging):** Cài đặt **Kafka** cluster (sử dụng Strimzi Operator hoặc Kafka Helm Chart). Tạo sẵn topic `system.audit.log` và topic `system.notifications`. Cấu hình Plaintext+SASL cho nội bộ cluster.
- [ ] **Infra (Storage):** Triển khai **Redis Distributed Cache** (Master-Slave replication). Cấu hình mật khẩu và Persistent Volume để đảm bảo không mất dữ liệu khi Pod restart.
- [ ] **Infra (Logging):** Thiết lập **ELK Stack**. Cài đặt Elasticsearch (Data node), Kibana (Dashboard). Triển khai **FluentBit** dưới dạng DaemonSet để tự động thu thập logs từ `/var/log/containers` của mọi Node trong OpenShift gán nhãn theo Namespace/Pod.
- [ ] **Infra (Observability):** Cài đặt **Kube-Prometheus-Stack** (Prometheus, Grafana, Alertmanager) và **Jaeger**. Import sẵn các dashboard chuẩn cho Node Exporter, K8s Pods và Kafka monitoring.

## Validation & Quality Gates

Mọi stack hạ tầng phải pass các tiêu chí sau trước khi bàn giao:

1. **Connectivity Check:** Các subagent khác (ví dụ Implementer của Epic 4/5) có thể connect vào Kafka/Redis từ bên trong pod (`telnet` hoặc `curl` pass).
2. **Persistence Check:** Thử xóa Pod Kafka/Redis, dữ liệu cũ vẫn phải tồn tại sau khi Pod mới được spawn lại.
3. **Observability Check:** Log từ `apps/` bất kỳ phải hiện lên Kibana Discovery; Metrics của Cluster phải hiển thị realtime trên Grafana Dashboard.
