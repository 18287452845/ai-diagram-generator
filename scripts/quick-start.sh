#!/bin/bash
# Windows 开发环境快速启动脚本
# 使用 Git Bash 运行

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

echo "========================================"
echo "  AI Diagram Generator - 快速启动"
echo "========================================"
echo ""

# 检查项目根目录
if [ ! -f "docker-compose.yml" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 1. 检查 Docker
log_info "检查 Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先安装 Docker Desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker 未运行，请启动 Docker Desktop"
    exit 1
fi

log_info "Docker 运行正常"

# 2. 启动数据库
log_info "启动数据库服务..."
docker-compose up -d

log_info "等待数据库就绪..."
sleep 5

# 检查数据库状态
if docker-compose ps | grep -q "healthy"; then
    log_info "数据库启动成功"
else
    log_warn "数据库可能还在启动中，请稍候"
fi

# 3. 检查后端配置
log_info "检查后端配置..."
if [ ! -f "backend/.env" ]; then
    log_warn "未找到 backend/.env，正在创建..."
    cp backend/.env.example backend/.env
    log_warn "请编辑 backend/.env 文件填入 API 密钥"
    echo "   ANTHROPIC_API_KEY=your_key"
    echo "   OPENAI_API_KEY=your_key"
    echo ""
    read -p "按回车键继续..."
fi

# 4. 检查前端配置
log_info "检查前端配置..."
if [ ! -f "frontend/.env" ]; then
    log_warn "未找到 frontend/.env，正在创建..."
    cp frontend/.env.example frontend/.env
fi

# 5. 检查依赖
log_info "检查 Python 依赖..."
cd backend
if [ ! -d ".venv" ] && [ ! -d "$(poetry env info -p 2>/dev/null)" ]; then
    log_warn "Python 依赖未安装"
    echo "请运行: cd backend && poetry install"
fi
cd ..

log_info "检查 Node.js 依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    log_warn "Node.js 依赖未安装"
    echo "请运行: cd frontend && npm install"
fi
cd ..

# 6. 检查数据库迁移
log_info "检查数据库..."
cd backend
if command -v poetry &> /dev/null; then
    if ! poetry run alembic current &> /dev/null; then
        log_warn "数据库未初始化"
        echo "正在运行迁移..."
        poetry run alembic upgrade head && log_info "数据库迁移完成" || log_warn "迁移失败，请手动运行"
    else
        log_info "数据库已初始化"
    fi
fi
cd ..

echo ""
echo "========================================"
log_info "环境检查完成！"
echo "========================================"
echo ""
echo "现在可以启动服务："
echo ""
echo "终端 1 - 后端:"
echo "  cd backend"
echo "  poetry run uvicorn app.main:app --reload"
echo ""
echo "终端 2 - 前端:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "然后访问: http://localhost:5173"
echo ""
echo "API 文档: http://localhost:8000/docs"
echo ""

# 询问是否启动服务
read -p "是否现在启动后端和前端服务? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "启动后端服务（新窗口）..."
    # Windows Git Bash
    start bash -c "cd backend && poetry run uvicorn app.main:app --reload; exec bash"

    sleep 2

    log_info "启动前端服务（新窗口）..."
    start bash -c "cd frontend && npm run dev; exec bash"

    log_info "服务已启动！"
    echo ""
    echo "前端: http://localhost:5173"
    echo "后端: http://localhost:8000/docs"
fi