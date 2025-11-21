#!/bin/bash
# AI Diagram Generator - 快速部署脚本
# 适用于: Ubuntu 20.04+ / Debian 11+
# 使用方法: sudo bash deploy.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

log_info "开始部署 AI Diagram Generator..."

# ============================================
# 1. 系统更新和基础工具安装
# ============================================
log_info "[1/10] 更新系统..."
apt update && apt upgrade -y

log_info "[2/10] 安装基础工具..."
apt install -y \
    git \
    curl \
    wget \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# ============================================
# 2. 安装 Docker
# ============================================
log_info "[3/10] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    log_info "Docker 安装完成"
else
    log_warn "Docker 已安装，跳过"
fi

# 安装 Docker Compose
log_info "[4/10] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_info "Docker Compose 安装完成"
else
    log_warn "Docker Compose 已安装，跳过"
fi

# ============================================
# 3. 安装 Node.js
# ============================================
log_info "[5/10] 安装 Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    log_info "Node.js 安装完成: $(node --version)"
else
    log_warn "Node.js 已安装: $(node --version)"
fi

# ============================================
# 4. 安装 Python
# ============================================
log_info "[6/10] 安装 Python 3.11..."
if ! command -v python3.11 &> /dev/null; then
    add-apt-repository -y ppa:deadsnakes/ppa
    apt update
    apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
    log_info "Python 安装完成: $(python3.11 --version)"
else
    log_warn "Python 3.11 已安装"
fi

# 安装 Poetry
log_info "[7/10] 安装 Poetry..."
if ! command -v poetry &> /dev/null; then
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
    log_info "Poetry 安装完成"
else
    log_warn "Poetry 已安装"
fi

# ============================================
# 5. 安装 Nginx
# ============================================
log_info "[8/10] 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    log_info "Nginx 安装完成"
else
    log_warn "Nginx 已安装"
fi

# ============================================
# 6. 创建应用目录
# ============================================
log_info "[9/10] 创建应用目录..."
APP_DIR="/var/www/diagram-generator"
mkdir -p $APP_DIR
chown -R $SUDO_USER:$SUDO_USER $APP_DIR

# ============================================
# 7. 配置防火墙
# ============================================
log_info "[10/10] 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw --force enable
    log_info "防火墙配置完成"
fi

# ============================================
# 完成
# ============================================
echo ""
log_info "✅ 基础环境安装完成！"
echo ""
echo "接下来的步骤："
echo "1. 上传或克隆项目代码到: $APP_DIR"
echo "   git clone <repository-url> $APP_DIR"
echo ""
echo "2. 配置环境变量:"
echo "   cd $APP_DIR/backend"
echo "   cp .env.example .env"
echo "   nano .env  # 填入 API 密钥"
echo ""
echo "3. 启动数据库:"
echo "   cd $APP_DIR"
echo "   docker-compose up -d"
echo ""
echo "4. 配置后端:"
echo "   cd $APP_DIR/backend"
echo "   poetry install"
echo "   poetry run alembic upgrade head"
echo ""
echo "5. 构建前端:"
echo "   cd $APP_DIR/frontend"
echo "   npm install"
echo "   npm run build"
echo ""
echo "6. 配置 Nginx（参考 DEPLOYMENT_GUIDE.md）"
echo ""
log_info "部署文档: $APP_DIR/docs/DEPLOYMENT_GUIDE.md"
echo ""

# 输出版本信息
echo "安装的版本："
echo "  - Docker: $(docker --version)"
echo "  - Docker Compose: $(docker-compose --version)"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Python: $(python3.11 --version)"
echo "  - Nginx: $(nginx -v 2>&1)"
echo ""

log_info "重新登录以使 Docker 权限生效: su - $SUDO_USER"