#!/bin/bash
# Windows用户请使用 Git Bash 运行此脚本

echo "🚀 AI Diagram Generator - Setup Script"
echo "=========================================="
echo ""

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

echo "✅ Docker found"

# 启动数据库
echo ""
echo "📦 Starting databases (PostgreSQL + Redis)..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Databases started successfully"
else
    echo "❌ Failed to start databases"
    exit 1
fi

# 后端设置
echo ""
echo "🐍 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template"
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and add your API keys!"
fi

echo "📦 Installing Python dependencies..."
if command -v poetry &> /dev/null; then
    poetry install
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Poetry not found. Please install Poetry or run: pip install -r requirements.txt"
fi

cd ..

# 前端设置
echo ""
echo "⚛️  Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template"
    cp .env.example .env
fi

if command -v npm &> /dev/null; then
    echo "📦 Installing Node dependencies..."
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

cd ..

# 完成
echo ""
echo "=========================================="
echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your API keys:"
echo "   - ANTHROPIC_API_KEY (for Claude)"
echo "   - OPENAI_API_KEY (for GPT-4)"
echo ""
echo "2. Start the backend:"
echo "   cd backend && poetry run uvicorn app.main:app --reload"
echo ""
echo "3. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo "=========================================="