Là công ty oursourcing, chúng tôi cần một code base microservice để có thể phát triển các dự án nhanh chóng và dễ dàng quản lý.

Code base này sẽ được sử dụng cho tất cả các dự án của chúng tôi, vì vậy nó cần phải linh hoạt và có thể mở rộng.

Các chức năng sẵn có trong codebase

1. tích hợp vneid
2. Xác thực & Phân quyền: RBAC, ABAC
3. Quản lý file: upload, download, delete, share,
4. Audit log
5. Notification: email, sms, push notification
6. Quản lý user
7. CLI tool tạo service
8. CLI tool tạo CRUD
9. CLI tool tạo worker xử lý sự kiện từ kafka
10. CLI tool tạo job xử lý định kỳ
11. CLI tool tạo API

Techstack:

- Language: Nodejs, nestjs microservices
- Database: support postgresql, mysql, mongodb, oracle, sqlserver
- Message Queue: kafka
- Cache: Redis
- Containerization: Docker
- Orchestration: Kubernetes
- API Gateway: nginx ingress
- Service Discovery: Consul
- Monitoring: Prometheus
- Logging: ELK Stack
- Tracing: Jaeger
- CI/CD: jenkins
