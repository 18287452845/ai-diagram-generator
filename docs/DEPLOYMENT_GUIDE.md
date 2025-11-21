# AI Diagram Generator - 部署指南

**版本**: v0.3.0
**更新时间**: 2025-11-20
**适用环境**: 生产环境 / 测试环境

---

## 📋 目录

1. [系统要求](#系统要求)
2. [开发环境部署](#开发环境部署)
3. [生产环境部署](#生产环境部署)
4. [Docker部署](#docker部署)
5. [环境变量配置](#环境变量配置)
6. [数据库初始化](#数据库初始化)
7. [常见问题](#常见问题)
8. [性能优化](#性能优化)
9. [监控和日志](#监控和日志)
10. [备份策略](#备份策略)

---

## 🖥️ 系统要求

### 最低配置
- **CPU**: 2核
- **内存**: 4GB RAM
- **磁盘**: 20GB 可用空间
- **操作系统**: Windows 10/11, Ubuntu 20.04+, macOS 11+

### 推荐配置
- **CPU**: 4核或更多
- **内存**: 8GB RAM 或更多
- **磁盘**: 50GB SSD
- **网络**: 稳定的互联网连接（用于AI API调用）

### 软件依赖

**必需**:
- Node.js 18.x 或更高版本
- Python 3.11 或更高版本
- Docker 20.x 或更高版本
- Docker Compose 2.x 或更高版本

**可选**:
- Nginx（生产环境反向代理）
- PM2（Node.js进程管理）
- Supervisor（Python进程管理）

---

## 🚀 开发环境部署

### 步骤 1: 克隆或获取项目代码

```bash
# 如果使用Git
git clone <repository-url>
cd draw

# 或直接进入项目目录
cd "D:\My Documents\claude_prj\draw"
```

### 步骤 2: 启动数据库服务

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 验证服务状态
docker-compose ps

# 应该看到两个服务都是 "healthy" 状态
# NAME                  STATUS
# diagram_postgres      Up (healthy)
# diagram_redis         Up (healthy)
```

### 步骤 3: 配置后端

```bash
cd backend

# 创建环境变量文件
cp .env.example .env

# 编辑 .env 文件，填入必要配置
# Windows: notepad .env
# Linux/Mac: nano .env
```

**必须配置的环境变量**:
```env
# AI API密钥（至少配置一个）
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # Claude API
OPENAI_API_KEY=sk-proj-xxxxx          # OpenAI API

# 数据库连接（默认值通常可用）
DATABASE_URL=postgresql://admin:password@localhost:5432/diagram_db
REDIS_URL=redis://localhost:6379/0

# 安全密钥（生产环境务必修改）
SECRET_KEY=your-strong-random-secret-key-here
```

**安装 Python 依赖**:

```bash
# 安装 Poetry（如果还没安装）
pip install poetry

# 安装项目依赖
poetry install

# 或使用 pip（不推荐）
pip install -r requirements.txt
```

**初始化数据库**:

```bash
# 运行数据库迁移
poetry run alembic upgrade head

# 验证表已创建
poetry run python -c "from app.core.database import engine; print(engine.table_names())"
```

**启动后端服务**:

```bash
# 开发模式（自动重载）
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 后端将运行在 http://localhost:8000
# API文档: http://localhost:8000/docs
```

### 步骤 4: 配置前端

打开新终端：

```bash
cd frontend

# 创建环境变量
cp .env.example .env

# 默认配置通常不需要修改
cat .env
# VITE_API_URL=http://localhost:8000
```

**安装 Node.js 依赖**:

```bash
npm install

# 或使用 yarn
yarn install
```

**启动前端开发服务器**:

```bash
npm run dev

# 前端将运行在 http://localhost:5173
```

### 步骤 5: 验证部署

1. **访问前端**: http://localhost:5173
2. **访问API文档**: http://localhost:8000/docs
3. **测试功能**:
   - 点击"开始创建"
   - 尝试使用模板或AI生成
   - 测试保存和导出功能

---

## 🏭 生产环境部署

### 架构概览

```
[用户] → [Nginx反向代理] → [前端静态文件]
                         ↓
                    [后端API] → [PostgreSQL]
                         ↓
                    [Redis缓存]
```

### 步骤 1: 准备服务器

**推荐使用 Ubuntu 22.04 LTS**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y git curl wget build-essential

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# 安装 Nginx
sudo apt install -y nginx
```

### 步骤 2: 部署项目文件

```bash
# 创建应用目录
sudo mkdir -p /var/www/diagram-generator
sudo chown $USER:$USER /var/www/diagram-generator
cd /var/www/diagram-generator

# 上传或克隆项目代码
git clone <repository-url> .
# 或使用 scp/rsync 上传
```

### 步骤 3: 配置生产环境变量

```bash
cd /var/www/diagram-generator/backend
cp .env.example .env
nano .env
```

**生产环境配置**:

```env
# 项目配置
PROJECT_NAME="AI Diagram Generator"
ENVIRONMENT=production

# CORS（根据实际域名修改）
ALLOWED_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]

# 数据库（使用强密码）
DATABASE_URL=postgresql://admin:STRONG_PASSWORD_HERE@localhost:5432/diagram_db

# Redis
REDIS_URL=redis://localhost:6379/0

# AI API密钥
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-proj-xxxxx

# 安全密钥（使用强随机字符串）
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 步骤 4: 构建前端

```bash
cd /var/www/diagram-generator/frontend

# 创建生产环境变量
cat > .env.production << EOF
VITE_API_URL=https://yourdomain.com
EOF

# 安装依赖并构建
npm install
npm run build

# 构建产物在 dist/ 目录
ls -la dist/
```

### 步骤 5: 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/diagram-generator
```

**Nginx 配置文件**:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 前端静态文件
    location / {
        root /var/www/diagram-generator/frontend/dist;
        try_files $uri $uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置（AI生成可能较慢）
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }

    # API 文档
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }

    # 上传大小限制
    client_max_body_size 10M;
}
```

**启用站点并配置 SSL**:

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/diagram-generator /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 配置 SSL（使用 Let's Encrypt）
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# SSL 证书自动续期
sudo certbot renew --dry-run
```

### 步骤 6: 使用 Systemd 管理后端服务

```bash
sudo nano /etc/systemd/system/diagram-backend.service
```

**Systemd 服务文件**:

```ini
[Unit]
Description=AI Diagram Generator Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/diagram-generator/backend
Environment="PATH=/var/www/diagram-generator/backend/.venv/bin"
ExecStart=/var/www/diagram-generator/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

# 日志
StandardOutput=append:/var/log/diagram-backend.log
StandardError=append:/var/log/diagram-backend.error.log

# 安全选项
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**启动服务**:

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start diagram-backend

# 设置开机自启
sudo systemctl enable diagram-backend

# 查看状态
sudo systemctl status diagram-backend

# 查看日志
sudo journalctl -u diagram-backend -f
```

### 步骤 7: 启动数据库（生产环境）

```bash
cd /var/www/diagram-generator

# 使用 Docker Compose
docker-compose up -d

# 或使用独立的数据库服务器
# 修改 .env 中的 DATABASE_URL 指向外部数据库
```

---

## 🐳 Docker 完整部署

### 方案 1: Docker Compose 全栈部署

创建生产环境的 Docker Compose 配置：

```bash
cd /var/www/diagram-generator
nano docker-compose.prod.yml
```

**docker-compose.prod.yml**:

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: diagram_postgres_prod
    restart: always
    environment:
      POSTGRES_DB: diagram_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - diagram_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: diagram_redis_prod
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - diagram_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: diagram_backend_prod
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://admin:${DB_PASSWORD}@postgres:5432/diagram_db
      - REDIS_URL=redis://redis:6379/0
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - diagram_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: diagram_frontend_prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - diagram_network
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro

volumes:
  postgres_data:
  redis_data:

networks:
  diagram_network:
    driver: bridge
```

### 创建 Backend Dockerfile

```bash
cd backend
nano Dockerfile
```

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 安装 Poetry
RUN pip install poetry

# 复制依赖文件
COPY pyproject.toml poetry.lock ./

# 安装依赖
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 创建 Frontend Dockerfile

```bash
cd frontend
nano Dockerfile
```

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建
RUN npm run build

# Production stage
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 前端 Nginx 配置

```bash
cd frontend
nano nginx.conf
```

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 部署命令

```bash
# 创建 .env 文件
cat > .env << EOF
DB_PASSWORD=your_strong_password
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-proj-xxxxx
SECRET_KEY=$(openssl rand -hex 32)
EOF

# 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看状态
docker-compose -f docker-compose.prod.yml ps
```

---

## ⚙️ 环境变量完整配置

### 后端环境变量 (.env)

```env
# ========== 项目配置 ==========
PROJECT_NAME="AI Diagram Generator"
VERSION="0.3.0"
API_V1_STR="/api/v1"
ENVIRONMENT=production  # development | production | staging

# ========== CORS 配置 ==========
# 允许的源（JSON数组格式）
ALLOWED_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]

# ========== 数据库配置 ==========
DATABASE_URL=postgresql://admin:password@localhost:5432/diagram_db
# 连接池配置（可选）
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# ========== Redis 配置 ==========
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=  # 如果有密码

# ========== AI API 配置 ==========
# Claude API（Anthropic）
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4-turbo-preview

# ========== 安全配置 ==========
SECRET_KEY=your-very-strong-random-secret-key-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7天

# ========== 日志配置 ==========
LOG_LEVEL=INFO  # DEBUG | INFO | WARNING | ERROR
LOG_FILE=/var/log/diagram-backend.log

# ========== 性能配置 ==========
WORKERS=4  # Uvicorn worker 数量
MAX_CONNECTIONS=100
KEEPALIVE_TIMEOUT=60

# ========== 功能开关 ==========
ENABLE_RATE_LIMITING=true
RATE_LIMIT_PER_MINUTE=60
```

### 前端环境变量 (.env)

```env
# API 地址
VITE_API_URL=https://yourdomain.com

# 应用名称
VITE_APP_NAME="AI Diagram Generator"

# 功能开关
VITE_ENABLE_ANALYTICS=true

# Sentry（错误追踪，可选）
VITE_SENTRY_DSN=
```

---

## 🗄️ 数据库初始化

### 手动初始化

```bash
cd backend

# 方式 1: 使用 Alembic（推荐）
poetry run alembic upgrade head

# 方式 2: 使用 Python 脚本
poetry run python scripts/init_db.py
```

### 创建初始化脚本

```bash
cd backend
mkdir -p scripts
nano scripts/init_db.py
```

```python
from app.core.database import engine, Base
from app.models.diagram import Diagram

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully!")

if __name__ == "__main__":
    init_db()
```

### 验证数据库

```bash
# 连接到 PostgreSQL
docker exec -it diagram_postgres psql -U admin -d diagram_db

# 查看表
\dt

# 查看 diagrams 表结构
\d diagrams

# 退出
\q
```

---

## 🔧 常见问题

### 1. 数据库连接失败

**症状**: `sqlalchemy.exc.OperationalError: could not connect to server`

**解决方案**:
```bash
# 检查 Docker 容器状态
docker-compose ps

# 检查端口占用
netstat -an | grep 5432

# 重启数据库
docker-compose restart postgres

# 查看日志
docker-compose logs postgres
```

### 2. AI API 调用失败

**症状**: `anthropic.error.AuthenticationError: Invalid API Key`

**解决方案**:
```bash
# 验证 API 密钥格式
echo $ANTHROPIC_API_KEY

# 测试 Claude API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'

# 测试 OpenAI API
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hi"}]}'
```

### 3. 前端无法连接后端

**症状**: `Network Error` 或 CORS 错误

**解决方案**:
```bash
# 检查后端是否运行
curl http://localhost:8000/health

# 检查 CORS 配置
# 编辑 backend/.env
ALLOWED_ORIGINS=["http://localhost:5173", "https://yourdomain.com"]

# 重启后端
sudo systemctl restart diagram-backend
```

### 4. Nginx 502 Bad Gateway

**症状**: 访问网站显示 502 错误

**解决方案**:
```bash
# 检查后端服务
sudo systemctl status diagram-backend

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查端口监听
sudo netstat -tlnp | grep 8000
```

### 5. 图表渲染失败

**症状**: 预览面板显示空白或错误

**解决方案**:
```bash
# 检查浏览器控制台
# F12 → Console 标签

# 验证 Mermaid 代码语法
# 访问 https://mermaid.live/ 测试代码

# 清除浏览器缓存
Ctrl+Shift+Delete
```

---

## ⚡ 性能优化

### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_diagrams_created_at ON diagrams(created_at DESC);
CREATE INDEX idx_diagrams_type ON diagrams(type);
CREATE INDEX idx_diagrams_user_id ON diagrams(user_id);  -- 如果有用户系统

-- 分析表
ANALYZE diagrams;

-- 清理
VACUUM ANALYZE diagrams;
```

### 2. Redis 缓存

在 `backend/app/services/ai/` 中添加缓存层：

```python
import hashlib
from app.core.redis import redis_client

def get_cached_generation(description: str, diagram_type: str) -> str | None:
    cache_key = f"gen:{hashlib.md5(f'{description}:{diagram_type}'.encode()).hexdigest()}"
    return redis_client.get(cache_key)

def cache_generation(description: str, diagram_type: str, code: str, ttl: int = 3600):
    cache_key = f"gen:{hashlib.md5(f'{description}:{diagram_type}'.encode()).hexdigest()}"
    redis_client.setex(cache_key, ttl, code)
```

### 3. 前端优化

```bash
# 开启 gzip 压缩（Nginx）
sudo nano /etc/nginx/nginx.conf
```

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### 4. CDN 配置

将静态资源（JS、CSS、图片）上传到 CDN：

```bash
# 使用 AWS S3 + CloudFront 或 Cloudflare
aws s3 sync ./frontend/dist s3://your-bucket/
```

---

## 📊 监控和日志

### 1. 应用日志

```bash
# 后端日志
sudo journalctl -u diagram-backend -f

# 或直接查看日志文件
tail -f /var/log/diagram-backend.log
```

### 2. Nginx 访问日志

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 3. 数据库日志

```bash
docker-compose logs -f postgres
```

### 4. 系统资源监控

```bash
# 安装监控工具
sudo apt install -y htop iotop

# 实时监控
htop

# 磁盘使用
df -h

# Docker 容器资源
docker stats
```

### 5. 设置 Sentry（错误追踪）

```bash
# 前端
cd frontend
npm install @sentry/vite-plugin @sentry/react

# 配置 vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "diagram-frontend",
    }),
  ],
});
```

---

## 💾 备份策略

### 1. 数据库备份

**每日自动备份脚本**:

```bash
sudo nano /usr/local/bin/backup-diagram-db.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/diagram-db"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="diagram_db_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

# 备份数据库
docker exec diagram_postgres pg_dump -U admin diagram_db | gzip > "$BACKUP_DIR/$FILENAME"

# 删除 30 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME"
```

```bash
sudo chmod +x /usr/local/bin/backup-diagram-db.sh

# 添加到 crontab（每天凌晨 2 点）
sudo crontab -e
0 2 * * * /usr/local/bin/backup-diagram-db.sh >> /var/log/db-backup.log 2>&1
```

### 2. 恢复数据库

```bash
# 解压并恢复
gunzip < /var/backups/diagram-db/diagram_db_20250120_020000.sql.gz | \
  docker exec -i diagram_postgres psql -U admin diagram_db
```

### 3. 代码备份

```bash
# 使用 Git
cd /var/www/diagram-generator
git add .
git commit -m "Production snapshot"
git push origin main

# 或打包备份
tar -czf diagram-generator-$(date +%Y%m%d).tar.gz /var/www/diagram-generator
```

---

## 🔐 安全检查清单

- [ ] 修改所有默认密码
- [ ] 使用强随机 SECRET_KEY
- [ ] 配置防火墙（UFW）
- [ ] 启用 HTTPS（SSL证书）
- [ ] 设置 API 速率限制
- [ ] 定期更新依赖包
- [ ] 配置备份策略
- [ ] 启用日志监控
- [ ] 限制数据库外部访问
- [ ] 使用环境变量管理敏感信息

---

## 📞 技术支持

如遇到部署问题：

1. 查看日志文件
2. 检查防火墙和端口
3. 验证环境变量配置
4. 参考本文档的常见问题部分

---

**部署文档版本**: v1.0
**最后更新**: 2025-11-20
**适用版本**: AI Diagram Generator v0.3.0