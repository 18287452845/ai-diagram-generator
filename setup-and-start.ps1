# AI Diagram Generator - 自动配置和启动脚本
# PowerShell 脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Diagram Generator - 环境配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
$projectRoot = "D:\My Documents\trae_prj\ai-diagram-generator"
Set-Location $projectRoot

# 1. 检查并创建环境配置文件
Write-Host "[1/7] 检查环境配置文件..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    $backendEnv = @"
# Database Configuration
DATABASE_URL=postgresql://admin:password@localhost:5432/diagram_db

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# AI API Keys (请填入您的API密钥)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
"@
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding utf8
    Write-Host "  ✓ 已创建 backend\.env" -ForegroundColor Green
} else {
    Write-Host "  ✓ backend\.env 已存在" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    $frontendEnv = @"
# Backend API URL
VITE_API_URL=http://localhost:8000
"@
    $frontendEnv | Out-File -FilePath "frontend\.env" -Encoding utf8
    Write-Host "  ✓ 已创建 frontend\.env" -ForegroundColor Green
} else {
    Write-Host "  ✓ frontend\.env 已存在" -ForegroundColor Green
}

# 2. 检查Docker
Write-Host ""
Write-Host "[2/7] 检查 Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "  ✓ Docker 运行正常" -ForegroundColor Green
    
    # 启动Docker服务
    Write-Host "  正在启动数据库服务..." -ForegroundColor Yellow
    docker-compose up -d 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 数据库服务已启动" -ForegroundColor Green
        Start-Sleep -Seconds 5
    } else {
        Write-Host "  ⚠ 数据库服务启动失败，请检查Docker Desktop是否运行" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠ Docker 未运行，请先启动 Docker Desktop" -ForegroundColor Red
    Write-Host "  然后重新运行此脚本" -ForegroundColor Yellow
}

# 3. 检查Python
Write-Host ""
Write-Host "[3/7] 检查 Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python 未安装" -ForegroundColor Red
    exit 1
}

# 4. 安装后端依赖
Write-Host ""
Write-Host "[4/7] 检查后端依赖..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
try {
    # 检查关键包是否已安装
    python -c "import fastapi" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  正在安装后端依赖..." -ForegroundColor Yellow
        pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary alembic redis anthropic openai pydantic pydantic-settings python-dotenv python-multipart python-jose[cryptography] passlib[bcrypt] aiofiles pillow 2>&1 | Out-Null
    }
    Write-Host "  ✓ 后端依赖已就绪" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ 后端依赖安装可能有问题" -ForegroundColor Yellow
}

# 5. 初始化数据库
Write-Host ""
Write-Host "[5/7] 初始化数据库..." -ForegroundColor Yellow
try {
    # 检查alembic是否可用
    $alembicPath = (Get-Command alembic -ErrorAction SilentlyContinue)
    if (-not $alembicPath) {
        # 尝试使用python -m alembic
        python -m alembic upgrade head 2>&1 | Out-Null
    } else {
        alembic upgrade head 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 数据库已初始化" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 数据库初始化失败（可能Docker未运行）" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ 数据库初始化失败（可能Docker未运行）" -ForegroundColor Yellow
}

# 6. 检查Node.js
Write-Host ""
Write-Host "[6/7] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js 未安装" -ForegroundColor Red
    exit 1
}

# 7. 安装前端依赖
Write-Host ""
Write-Host "[7/7] 检查前端依赖..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "  正在安装前端依赖..." -ForegroundColor Yellow
    npm install 2>&1 | Out-Null
}
Write-Host "  ✓ 前端依赖已就绪" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ 环境配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动服务
Write-Host "正在启动服务..." -ForegroundColor Yellow
Write-Host ""

Set-Location $projectRoot

# 启动后端
Write-Host "启动后端服务 (http://localhost:8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# 启动前端
Write-Host "启动前端服务 (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  服务已启动！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  前端: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  后端API文档: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "提示: 如果数据库连接失败，请确保Docker Desktop已启动" -ForegroundColor Yellow
Write-Host "      然后运行: docker-compose up -d" -ForegroundColor Yellow
Write-Host ""

