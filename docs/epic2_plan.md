# Epic 2 Plan: Xây dựng Bộ công cụ CLI (Developer Experience) ✅ HOÀN THÀNH

**Approach**: Xây dựng bộ CLI scaffolding tools bằng Node.js scripts thuần + EJS templates dưới `tools/generators/`. Mỗi generator là 1 CLI script nhận tham số `--name` và `--app`, render EJS templates ra thư mục tương ứng trong `apps/<app>/src/<name>/`.

## Scope

- **In**: ✅ Base CLI engine, `generate:api`, `generate:crud`, `generate:worker`, `generate:job`
- **Out**: Cấu hình infrastructure thực tế, CI/CD, business logic

## Action Items — COMPLETED

- [x] **Task 1: Base CLI & Shared Utilities** — `tools/generators/utils.ts` (17/17 tests)
- [x] **Task 2: `generate:api`** — Controller + Service + Module (3 templates)
- [x] **Task 3: `generate:crud`** — Entity + Repo + DTO + Service + Controller + Module (6 templates)
- [x] **Task 4: `generate:worker`** — Kafka consumer module (3 templates)
- [x] **Task 5: `generate:job`** — Cron job module (2 templates)
- [x] **Task 6: E2E Validation** — 4 generators chạy thành công, npm scripts đăng ký

## Cách sử dụng

```bash
# Sinh module API cơ bản
npm run generate:api -- --name=task --app=sample-api

# Sinh bộ CRUD đầy đủ với TypeORM
npm run generate:crud -- --name=product --app=sample-api

# Sinh Kafka worker
npm run generate:worker -- --name=order-processor --app=sample-api

# Sinh Cron Job
npm run generate:job -- --name=cleanup-task --app=sample-api

# Chạy tests
npm run test:generators
```
