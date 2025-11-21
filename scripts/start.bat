@echo off
REM Windows 快速启动脚本
REM 双击运行或在 CMD 中执行

chcp 65001 >nul
title AI Diagram Generator - 快速启动

echo ========================================
echo   AI Diagram Generator - 快速启动
echo ========================================
echo.

REM 检查 Docker
echo [1/6] 检查 Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker 未运行，请启动 Docker Desktop
    pause
    exit /b 1
)
echo     ✓ Docker 运行正常

REM 启动数据库
echo.
echo [2/6] 启动数据库...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [错误] 数据库启动失败
    pause
    exit /b 1
)
echo     ✓ 数据库已启动

REM 等待数据库就绪
echo     等待数据库初始化...
timeout /t 5 /nobreak >nul

REM 检查配置文件
echo.
echo [3/6] 检查配置文件...
if not exist "backend\.env" (
    echo     ⚠ 创建 backend\.env
    copy "backend\.env.example" "backend\.env" >nul
    echo     请编辑 backend\.env 文件填入 API 密钥
    pause
)

if not exist "frontend\.env" (
    echo     ⚠ 创建 frontend\.env
    copy "frontend\.env.example" "frontend\.env" >nul
)
echo     ✓ 配置文件已就绪

REM 检查 Python 依赖
echo.
echo [4/6] 检查 Python 依赖...
cd backend
if not exist ".venv" (
    if not exist "poetry.lock" (
        echo     ⚠ Python 依赖未安装
        echo     正在安装...
        call poetry install
    )
)
echo     ✓ Python 依赖已安装

REM 初始化数据库
echo.
echo [5/6] 初始化数据库...
call poetry run alembic current >nul 2>&1
if %errorlevel% neq 0 (
    echo     正在运行数据库迁移...
    call poetry run alembic upgrade head
)
echo     ✓ 数据库已初始化
cd ..

REM 检查 Node.js 依赖
echo.
echo [6/6] 检查 Node.js 依赖...
cd frontend
if not exist "node_modules" (
    echo     ⚠ Node.js 依赖未安装
    echo     正在安装...
    call npm install
)
echo     ✓ Node.js 依赖已安装
cd ..

echo.
echo ========================================
echo   ✓ 环境检查完成！
echo ========================================
echo.
echo 正在启动服务...
echo.

REM 启动后端（新窗口）
start "AI Diagram - 后端" cmd /k "cd backend && poetry run uvicorn app.main:app --reload"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端（新窗口）
start "AI Diagram - 前端" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   服务已启动！
echo ========================================
echo.
echo   前端: http://localhost:5173
echo   后端: http://localhost:8000/docs
echo.
echo 按任意键退出此窗口（服务将继续运行）
pause >nul