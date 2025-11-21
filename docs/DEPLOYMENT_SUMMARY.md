# 🚀 快速部署总结

## 📦 部署文档和脚本

您现在拥有完整的部署资源：

### 📚 文档

1. **`docs/DEPLOYMENT_GUIDE.md`** (20+ 页)
   - 系统要求
   - 开发环境部署（Windows/Mac/Linux）
   - 生产环境部署（Ubuntu/Debian）
   - Docker 完整部署
   - 环境变量详解
   - 常见问题排查
   - 性能优化指南
   - 监控和日志
   - 备份策略

### 🛠️ 自动化脚本

2. **`scripts/start.bat`** - Windows 一键启动
   - 检查 Docker 状态
   - 自动启动数据库
   - 验证配置文件
   - 安装依赖（如需要）
   - 初始化数据库
   - 在新窗口启动前后端

   **使用方法**: 双击运行或 `start.bat`

3. **`scripts/quick-start.sh`** - Linux/Mac 快速启动
   - 完整的环境检查
   - 自动修复常见问题
   - 交互式启动服务

   **使用方法**: `bash scripts/quick-start.sh`

4. **`scripts/deploy.sh`** - Linux 生产环境部署
   - 自动安装所有依赖
   - Docker + Docker Compose
   - Node.js + Python
   - Nginx
   - 防火墙配置

   **使用方法**: `sudo bash scripts/deploy.sh`

---

## ⚡ 三种部署方式

### 方式 1: Windows 开发环境（最简单）

```batch
# 1. 双击运行
start.bat

# 2. 访问
http://localhost:5173
```

**耗时**: 5-10 分钟（首次启动）

---

### 方式 2: Docker 全栈部署（推荐）

```bash
# 1. 创建 .env 文件
cp .env.example .env
nano .env  # 填入 API 密钥

# 2. 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 3. 查看状态
docker-compose ps
```

**耗时**: 10-15 分钟

---

### 方式 3: 生产服务器部署（完整）

```bash
# 1. 运行自动化脚本
sudo bash scripts/deploy.sh

# 2. 上传代码
git clone <repo> /var/www/diagram-generator

# 3. 配置环境
cd /var/www/diagram-generator/backend
cp .env.example .env
nano .env

# 4. 构建前端
cd ../frontend
npm install && npm run build

# 5. 配置 Nginx（见文档）
sudo nano /etc/nginx/sites-available/diagram-generator

# 6. 配置 Systemd 服务（见文档）
sudo systemctl start diagram-backend
sudo systemctl enable diagram-backend
```

**耗时**: 30-60 分钟

---

## 📋 部署检查清单

### 开发环境

- [ ] Docker Desktop 已安装并运行
- [ ] Node.js 18+ 已安装
- [ ] Python 3.11+ 已安装
- [ ] Git 已安装
- [ ] 配置 `backend/.env`（API 密钥）
- [ ] 运行 `start.bat` 或 `quick-start.sh`
- [ ] 访问 http://localhost:5173 验证

### 生产环境

- [ ] 服务器系统: Ubuntu 20.04+ 或 Debian 11+
- [ ] 域名已解析到服务器 IP
- [ ] SSL 证书已配置（Let's Encrypt）
- [ ] 防火墙已配置（80, 443, 22 端口）
- [ ] 数据库密码已修改
- [ ] SECRET_KEY 已更换
- [ ] 备份策略已配置
- [ ] 监控已设置

---

## 🔧 快速命令参考

### 数据库

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看日志
docker-compose logs -f postgres

# 备份
docker exec diagram_postgres pg_dump -U admin diagram_db > backup.sql

# 恢复
cat backup.sql | docker exec -i diagram_postgres psql -U admin diagram_db
```

### 后端

```bash
# 开发模式
cd backend
poetry run uvicorn app.main:app --reload

# 生产模式
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# 数据库迁移
poetry run alembic upgrade head

# 查看日志
sudo journalctl -u diagram-backend -f
```

### 前端

```bash
# 开发模式
cd frontend
npm run dev

# 构建生产版本
npm run build

# 预览构建
npm run preview
```

### Nginx

```bash
# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx

# 重启
sudo systemctl restart nginx

# 查看日志
sudo tail -f /var/log/nginx/error.log
```

---

## 🌐 访问地址

### 开发环境

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **数据库**: localhost:5432
- **Redis**: localhost:6379

### 生产环境

- **前端**: https://yourdomain.com
- **后端 API**: https://yourdomain.com/api
- **API 文档**: https://yourdomain.com/docs
- **健康检查**: https://yourdomain.com/health

---

## 🔐 必需的环境变量

### 必须配置（至少一个 AI API）

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # Claude API
OPENAI_API_KEY=sk-proj-xxxxx          # OpenAI API
```

### 可选但推荐修改

```env
DATABASE_URL=postgresql://admin:STRONG_PASSWORD@localhost:5432/diagram_db
SECRET_KEY=your-strong-random-secret-key-at-least-32-chars
```

---

## 📊 性能建议

### 最低配置（开发/测试）
- **CPU**: 2 核
- **内存**: 4GB
- **磁盘**: 20GB

### 推荐配置（生产环境）
- **CPU**: 4 核以上
- **内存**: 8GB 以上
- **磁盘**: 50GB SSD
- **网络**: 10Mbps+ 带宽

### 预期并发
- **小型**: 10-50 并发用户
- **中型**: 50-200 并发用户
- **大型**: 200+ 并发用户（需要集群部署）

---

## 🐛 常见问题速查

### 1. Docker 启动失败

```bash
# Windows: 检查 Docker Desktop 是否运行
# Linux: 检查 Docker 服务
sudo systemctl status docker
sudo systemctl start docker
```

### 2. 端口被占用

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux
sudo lsof -i :8000
sudo kill -9 <PID>
```

### 3. API 密钥错误

```bash
# 验证密钥格式
echo $ANTHROPIC_API_KEY  # Linux
echo %ANTHROPIC_API_KEY%  # Windows CMD

# 测试 API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
```

### 4. 数据库连接失败

```bash
# 检查容器状态
docker-compose ps

# 重启数据库
docker-compose restart postgres

# 查看日志
docker-compose logs postgres
```

### 5. 前端无法连接后端

检查 CORS 配置：
```env
# backend/.env
ALLOWED_ORIGINS=["http://localhost:5173"]
```

---

## 📞 获取帮助

1. **查看详细文档**: `docs/DEPLOYMENT_GUIDE.md`
2. **查看测试指南**: `docs/TESTING_GUIDE.md`
3. **查看功能文档**: `docs/NEW_FEATURES_SUMMARY.md`
4. **检查日志文件**: `/var/log/diagram-backend.log`
5. **查看 Docker 日志**: `docker-compose logs -f`

---

## 🎉 部署成功验证

部署成功后，执行以下测试：

1. ✅ 访问前端页面
2. ✅ 点击"开始创建"
3. ✅ 使用模板或 AI 生成图表
4. ✅ 测试代码编辑和实时预览
5. ✅ 测试保存功能
6. ✅ 测试导出功能（SVG/PNG）
7. ✅ 测试暗色主题切换
8. ✅ 测试快捷键（Ctrl+S/Z/Y）

---

**部署资源准备完毕！** 🚀

选择适合您的部署方式开始吧！