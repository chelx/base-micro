# Strategy: Build on host/CI using Nx, then copy the pruned output.
# Why? Trong Nx monorepo, nếu truyền toàn bộ source code vào Docker (COPY . .) thì bất kỳ thay đổi nào
# ở bất kỳ file nào cũng làm mất Docker Cache của TẤT CẢ các app.
# 
# Usage:
# 1. npx nx build <app_name>
# 2. npx nx run <app_name>:prune-lockfile
# 3. docker build -f Dockerfile.app --build-arg APP_NAME=<app_name> -t <app_name>:latest .

FROM node:20-alpine AS deps
WORKDIR /app
ARG APP_NAME

# Dựa vào target pruning của Nx, copy riêng file package.json và package-lock.json của app
COPY dist/apps/${APP_NAME}/package.json dist/apps/${APP_NAME}/package-lock.json ./

# Cài đặt các dependencies cần thiết cho production
RUN npm install --omit=dev --ignore-scripts

FROM node:20-alpine AS runner
WORKDIR /app
ARG APP_NAME
ENV NODE_ENV=production

# Copy node_modules từ bước deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code đã được build bởi web-pack của Nx
COPY dist/apps/${APP_NAME} ./

CMD ["node", "main.js"]
