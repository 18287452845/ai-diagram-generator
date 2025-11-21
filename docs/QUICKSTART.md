# 快速启动指南

## Windows 环境

### 1. 启动数据库
```bash
# 在项目根目录执行
docker-compose up -d
```

### 2. 启动后端
```bash
# 打开新的终端
cd backend

# 首次运行需要配置
cp .env.example .env
# 编辑 .env 文件，填入你的 API Keys

# 安装依赖
pip install poetry
poetry install

# 启动服务
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 启动前端
```bash
# 打开新的终端
cd frontend

# 首次运行
cp .env.example .env
npm install

# 启动服务
npm run dev
```

### 4. 访问应用

- 前端：http://localhost:5173
- 后端API文档：http://localhost:8000/docs

---

## 获取API密钥

### Claude API
1. 访问 https://console.anthropic.com
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新密钥
5. 复制密钥到 `backend/.env` 的 `ANTHROPIC_API_KEY`

### OpenAI API
1. 访问 https://platform.openai.com
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新密钥
5. 复制密钥到 `backend/.env` 的 `OPENAI_API_KEY`

---

## 常用命令

### 停止所有服务
```bash
# 停止数据库
docker-compose down

# 停止后端/前端：在对应终端按 Ctrl+C
```

### 查看日志
```bash
# 数据库日志
docker-compose logs -f postgres

# 后端日志：查看终端输出
# 前端日志：查看终端输出或浏览器控制台
```

### 重置数据库
```bash
docker-compose down -v
docker-compose up -d
```