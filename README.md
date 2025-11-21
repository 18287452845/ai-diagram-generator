# 🎨 AI Diagram Generator

一个基于AI的智能图表绘制系统，支持使用自然语言描述生成各种专业的技术图表。

## ✨ 特性

- 🤖 **三AI引擎**：支持Claude 3.5、GPT-4和DeepSeek R1，智能理解您的描述
- 🔑 **灵活配置**：支持服务器端和客户端API密钥配置
- 📊 **多种图表**：流程图、系统架构图、时序图、类图、ER图、甘特图、泳道图、状态图等
- ✏️ **可视化编辑**：支持代码编辑和可视化拖拽双模式
- 💾 **持久化存储**：PostgreSQL数据库，支持版本历史
- 🎨 **导出功能**：支持导出SVG、PNG、PDF格式
- 🌙 **暗色主题**：支持亮色/暗色主题切换
- ⚡ **实时预览**：代码修改后实时渲染预览

## 🏗️ 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Mermaid.js（图表渲染）
- ReactFlow（可视化编辑）
- Monaco Editor（代码编辑器）
- Zustand（状态管理）
- TailwindCSS（样式）

### 后端
- Python 3.11+
- FastAPI
- SQLAlchemy（ORM）
- PostgreSQL（数据库）
- Redis（缓存）
- Anthropic SDK（Claude API）
- OpenAI SDK（GPT API）
- DeepSeek API（DeepSeek R1）

## 📦 项目结构

```
draw/
├── frontend/              # React前端
│   ├── src/
│   │   ├── components/   # UI组件
│   │   ├── pages/        # 页面
│   │   ├── services/     # API服务
│   │   ├── stores/       # 状态管理
│   │   └── types/        # TypeScript类型
│   └── package.json
├── backend/              # FastAPI后端
│   ├── app/
│   │   ├── api/          # API路由
│   │   ├── services/     # 业务逻辑
│   │   ├── models/       # 数据模型
│   │   ├── schemas/      # Pydantic模式
│   │   └── core/         # 核心配置
│   └── pyproject.toml
├── docker-compose.yml    # Docker配置
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose（用于数据库）
- Claude API Key 或 OpenAI API Key

### 1. 克隆项目

```bash
cd "D:\My Documents\claude_prj\draw"
```

### 2. 启动数据库

```bash
# 启动PostgreSQL和Redis
docker-compose up -d

# 检查状态
docker-compose ps
```

### 3. 配置后端

```bash
cd backend

# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，填入您的API密钥
# ANTHROPIC_API_KEY=your_claude_api_key
# OPENAI_API_KEY=your_openai_api_key
# DEEPSEEK_API_KEY=your_deepseek_api_key

# 安装依赖（使用Poetry）
pip install poetry
poetry install

# 或使用pip
pip install -r requirements.txt  # 需要先从pyproject.toml生成

# 初始化数据库
poetry run alembic upgrade head

# 启动后端服务器
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端API文档：http://localhost:8000/docs

### 4. 配置前端

```bash
cd frontend

# 复制环境变量
cp .env.example .env

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端访问地址：http://localhost:5173

## 📖 使用指南

### 配置API密钥

系统支持两种API密钥配置方式：

#### 方式一：服务器端配置（推荐）
适合团队使用，密钥统一管理，更安全。

1. 编辑 `backend/.env` 文件
2. 填入API密钥：
   ```bash
   ANTHROPIC_API_KEY="your_claude_api_key"
   OPENAI_API_KEY="your_openai_api_key"
   DEEPSEEK_API_KEY="your_deepseek_api_key"
   ```
3. 重启后端服务

#### 方式二：客户端配置
适合个人使用，使用自己的API配额。

1. 打开应用，点击右上角「设置」
2. 选择「使用客户端密钥」
3. 输入相应的API密钥
4. 点击「保存配置」

详细配置文档：[API密钥配置指南](docs/QUICK_START_API_CONFIG.md)

### 生成图表

1. 打开应用，点击"开始创建"
2. 在左侧面板选择图表类型（流程图、架构图等）
3. 选择AI引擎（Claude或GPT-4）
4. 输入图表描述，例如：
   ```
   一个用户登录系统的流程图，包含以下步骤：
   1. 用户输入用户名和密码
   2. 系统验证用户信息
   3. 验证成功跳转到主页
   4. 验证失败显示错误提示
   ```
5. 点击"生成图表"
6. 在中间面板查看和编辑Mermaid代码
7. 在右侧面板实时预览图表

### 编辑图表

- **代码模式**：直接在Monaco编辑器中修改Mermaid代码
- **可视化模式**：（开发中）使用拖拽方式调整节点和连线

### 导出图表

点击右上角"导出"按钮，选择格式：
- **SVG**：矢量图，适合打印和缩放
- **PNG**：位图，适合插入文档
- **PDF**：适合学术论文和报告

## 🔧 开发指南

### 添加新的图表类型

1. 在 `shared/types/` 中添加类型定义
2. 在后端 `app/services/ai/claude_service.py` 添加提示词
3. 在前端 `src/components/Editor/AIInputPanel.tsx` 添加选项

### API端点

- `POST /api/ai/generate` - 生成图表
- `POST /api/ai/refine` - 优化图表
- `POST /api/ai/explain` - 解释图表
- `GET /api/diagrams` - 获取所有图表
- `POST /api/diagrams` - 创建图表
- `PUT /api/diagrams/{id}` - 更新图表
- `DELETE /api/diagrams/{id}` - 删除图表

### 数据库迁移

```bash
cd backend

# 创建新迁移
poetry run alembic revision --autogenerate -m "description"

# 执行迁移
poetry run alembic upgrade head

# 回滚
poetry run alembic downgrade -1
```

## 🧪 测试

### 后端测试

```bash
cd backend
poetry run pytest
```

### 前端测试

```bash
cd frontend
npm run test
```

## 📝 环境变量说明

### 后端 (.env)

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Claude API密钥 | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API密钥 | `sk-proj-...` |
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | `sk-...` |
| `DATABASE_URL` | PostgreSQL连接字符串 | `postgresql://...` |
| `REDIS_URL` | Redis连接字符串 | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT密钥（生产环境需更改） | `your-secret-key` |

### 前端 (.env)

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_URL` | 后端API地址 | `http://localhost:8000` |

## 🚢 部署

### Docker部署（推荐）

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 手动部署

1. **后端**：使用Gunicorn或Uvicorn
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. **前端**：构建静态文件
```bash
npm run build
# 将dist/目录部署到Nginx或其他Web服务器
```

## 🐛 常见问题

### Q: API密钥错误
**A**: 检查`.env`文件中的API密钥是否正确填写，注意不要有多余的空格或引号。

### Q: 数据库连接失败
**A**: 确保Docker容器正在运行：`docker-compose ps`，检查DATABASE_URL配置。

### Q: 图表渲染失败
**A**: 检查Mermaid代码语法是否正确，查看浏览器控制台错误信息。

### Q: AI生成超时
**A**: AI生成可能需要10-30秒，请耐心等待。如果频繁超时，检查网络连接和API配额。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📮 联系方式

- 项目地址：https://github.com/yourusername/ai-diagram-generator
- 问题反馈：https://github.com/yourusername/ai-diagram-generator/issues

## 🗺️ 开发路线图

### Phase 1: MVP ✅
- [x] 基础项目结构
- [x] AI生成功能（Claude + GPT-4）
- [x] Mermaid渲染
- [x] 代码编辑器
- [x] 基础CRUD

### Phase 2: 功能增强（Week 4-7）
- [ ] ReactFlow可视化编辑
- [ ] 更多图表类型支持
- [ ] 导出功能（PNG/PDF）
- [ ] 模板系统
- [ ] 用户认证

### Phase 3: 生产就绪（Week 8-10）
- [ ] 性能优化
- [ ] 单元测试
- [ ] CI/CD
- [ ] 文档完善
- [ ] 部署指南

---

**Made with ❤️ using Claude Code**