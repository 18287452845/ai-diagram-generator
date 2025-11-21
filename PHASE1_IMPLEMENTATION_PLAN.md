# 优化实施计划 - 第一阶段

## 🎯 立即实施的高优先级优化

### 1. Bundle 优化（预计 3-5 天）

#### 1.1 Vite 配置增强
```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 启用源码映射用于生产调试
    sourcemap: false, // 生产环境关闭以减少体积
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // 代码分割策略
        manualChunks: {
          // React 核心库
          react: ['react', 'react-dom'],
          // 编辑器相关
          editor: ['@monaco-editor/react'],
          // UI 组件库
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          // 路由相关
          router: ['react-router-dom'],
          // 状态管理
          store: ['zustand'],
        },
        // 优化文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 警告阈值
    chunkSizeWarningLimit: 1000,
    // 目标浏览器
    target: 'es2015',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

#### 1.2 组件懒加载实现
```typescript
// frontend/src/pages/LazyPages.tsx
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// 懒加载页面组件
const EditorPage = lazy(() => import('./EditorPage'))
const DiagramsPage = lazy(() => import('./DiagramsPage'))
const HomePage = lazy(() => import('./HomePage'))
const SettingsPage = lazy(() => import('./SettingsPage'))

// 加载组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex items-center gap-2">
      <Loader2 className="animate-spin" size={24} />
      <span>加载中...</span>
    </div>
  </div>
)

export const LazyEditorPage = () => (
  <Suspense fallback={<PageLoader />}>
    <EditorPage />
  </Suspense>
)

export const LazyDiagramsPage = () => (
  <Suspense fallback={<PageLoader />}>
    <DiagramsPage />
  </Suspense>
)

export const LazyHomePage = () => (
  <Suspense fallback={<PageLoader />}>
    <HomePage />
  </Suspense>
)

export const LazySettingsPage = () => (
  <Suspense fallback={<PageLoader />}>
    <SettingsPage />
  </Suspense>
)
```

#### 1.3 React 组件优化
```typescript
// frontend/src/components/Diagram/DiagramPreview.tsx
import React, { memo, useMemo } from 'react'

interface DiagramPreviewProps {
  code: string
  title: string
  type?: string
}

// 使用 memo 优化重渲染
const DiagramPreview = memo<DiagramPreviewProps>(({ code, title, type }) => {
  // 使用 useMemo 缓存计算结果
  const diagramData = useMemo(() => {
    if (!code) return null
    
    try {
      // 解析 XML 或 Mermaid 代码
      return parseDiagramCode(code)
    } catch (error) {
      console.error('Failed to parse diagram code:', error)
      return null
    }
  }, [code])

  const previewUrl = useMemo(() => {
    if (!diagramData) return null
    
    // 生成预览 URL
    return generatePreviewUrl(diagramData)
  }, [diagramData])

  if (!diagramData) {
    return (
      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">无法预览</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        {type && (
          <span className="text-xs text-gray-500">{type}</span>
        )}
      </div>
      <div className="p-4">
        <img 
          src={previewUrl || ''} 
          alt={title}
          className="w-full h-auto max-h-64 object-contain"
          loading="lazy"
        />
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.code === nextProps.code &&
    prevProps.title === nextProps.title &&
    prevProps.type === nextProps.type
  )
})

DiagramPreview.displayName = 'DiagramPreview'

function parseDiagramCode(code: string) {
  // 解析图表代码的逻辑
  return { parsed: true, data: code }
}

function generatePreviewUrl(data: any) {
  // 生成预览 URL 的逻辑
  return null
}

export default DiagramPreview
```

### 2. Redis 缓存实现（预计 5-7 天）

#### 2.1 缓存服务实现
```python
# backend/app/services/cache_service.py
import redis.asyncio as redis
import json
import hashlib
from typing import Optional, Any, List
from app.core.config import settings

class CacheService:
    def __init__(self):
        self.redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def close(self):
        await self.redis.close()

    # 图表缓存
    async def get_cached_diagram(self, diagram_id: str) -> Optional[dict]:
        """获取缓存的图表数据"""
        try:
            cached = await self.redis.get(f"diagram:{diagram_id}")
            return json.loads(cached) if cached else None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    async def cache_diagram(self, diagram_id: str, data: dict, ttl: int = 3600):
        """缓存图表数据"""
        try:
            await self.redis.setex(
                f"diagram:{diagram_id}", 
                ttl, 
                json.dumps(data, default=str)
            )
        except Exception as e:
            print(f"Cache set error: {e}")
    
    async def invalidate_diagram_cache(self, diagram_id: str):
        """删除图表缓存"""
        await self.redis.delete(f"diagram:{diagram_id}")

    # AI 响应缓存
    def _generate_prompt_hash(self, description: str, diagram_type: str, ai_provider: str) -> str:
        """生成提示词哈希"""
        content = f"{description}:{diagram_type}:{ai_provider}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def get_cached_ai_response(self, description: str, diagram_type: str, ai_provider: str) -> Optional[str]:
        """获取缓存的 AI 响应"""
        prompt_hash = self._generate_prompt_hash(description, diagram_type, ai_provider)
        try:
            return await self.redis.get(f"ai:{prompt_hash}")
        except Exception as e:
            print(f"AI cache get error: {e}")
            return None
    
    async def cache_ai_response(self, description: str, diagram_type: str, ai_provider: str, response: str, ttl: int = 86400):
        """缓存 AI 响应（24小时）"""
        prompt_hash = self._generate_prompt_hash(description, diagram_type, ai_provider)
        try:
            await self.redis.setex(f"ai:{prompt_hash}", ttl, response)
        except Exception as e:
            print(f"AI cache set error: {e}")

    # 用户会话缓存
    async def cache_user_session(self, user_id: str, session_data: dict, ttl: int = 604800):
        """缓存用户会话（7天）"""
        try:
            await self.redis.setex(
                f"session:{user_id}",
                ttl,
                json.dumps(session_data, default=str)
            )
        except Exception as e:
            print(f"Session cache error: {e}")
    
    async def get_user_session(self, user_id: str) -> Optional[dict]:
        """获取用户会话"""
        try:
            cached = await self.redis.get(f"session:{user_id}")
            return json.loads(cached) if cached else None
        except Exception as e:
            print(f"Session get error: {e}")
            return None

    # 统计数据缓存
    async def cache_user_stats(self, user_id: str, stats: dict, ttl: int = 300):
        """缓存用户统计数据（5分钟）"""
        try:
            await self.redis.setex(
                f"stats:{user_id}",
                ttl,
                json.dumps(stats, default=str)
            )
        except Exception as e:
            print(f"Stats cache error: {e}")
    
    async def get_user_stats(self, user_id: str) -> Optional[dict]:
        """获取用户统计数据"""
        try:
            cached = await self.redis.get(f"stats:{user_id}")
            return json.loads(cached) if cached else None
        except Exception as e:
            print(f"Stats get error: {e}")
            return None

    # 批量操作
    async def get_cached_diagrams(self, diagram_ids: List[str]) -> dict:
        """批量获取缓存的图表"""
        if not diagram_ids:
            return {}
        
        keys = [f"diagram:{diagram_id}" for diagram_id in diagram_ids]
        try:
            values = await self.redis.mget(keys)
            result = {}
            for i, diagram_id in enumerate(diagram_ids):
                if values[i]:
                    result[diagram_id] = json.loads(values[i])
            return result
        except Exception as e:
            print(f"Batch cache get error: {e}")
            return {}

# 全局缓存服务实例
cache_service = CacheService()
```

#### 2.2 AI 服务集成缓存
```python
# backend/app/services/ai/claude_service.py (修改现有文件)
from app.services.cache_service import cache_service

class ClaudeService:
    # ... 现有代码 ...

    async def generate_diagram(self, description: str, diagram_type: DiagramType, diagram_format: DiagramFormat = DiagramFormat.DRAWIO) -> str:
        """Generate diagram code using Claude with caching"""
        
        # 检查缓存
        cached_response = await cache_service.get_cached_ai_response(
            description, diagram_type.value, "claude"
        )
        if cached_response:
            print("Using cached AI response")
            return cached_response

        system_prompt = self._get_system_prompt(diagram_type, diagram_format)

        message = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": description}],
        )

        code = message.content[0].text

        # 清理代码块
        code = self._clean_code(code, diagram_format)

        # 缓存响应
        await cache_service.cache_ai_response(
            description, diagram_type.value, "claude", code
        )

        return code

    def _clean_code(self, code: str, diagram_format: DiagramFormat) -> str:
        """清理 AI 生成的代码"""
        # ... 现有的清理逻辑 ...
        return code.strip()
```

#### 2.3 图表服务集成缓存
```python
# backend/app/services/diagram_service.py
from sqlalchemy.orm import Session
from app.models.diagram import Diagram
from app.schemas.diagram import DiagramCreate, DiagramUpdate
from app.services.cache_service import cache_service
from typing import List, Optional

class DiagramService:
    async def get_diagram_by_id(self, diagram_id: str, db: Session) -> Optional[Diagram]:
        """获取图表，优先从缓存读取"""
        # 尝试从缓存获取
        cached_diagram = await cache_service.get_cached_diagram(diagram_id)
        if cached_diagram:
            print("Using cached diagram")
            # 转换为 Diagram 对象（简化版本）
            return Diagram(
                id=cached_diagram['id'],
                title=cached_diagram['title'],
                code=cached_diagram['code'],
                diagram_type=cached_diagram['diagram_type'],
                user_id=cached_diagram['user_id'],
                created_at=cached_diagram['created_at'],
                updated_at=cached_diagram['updated_at']
            )
        
        # 从数据库获取
        diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
        if diagram:
            # 缓存结果
            await cache_service.cache_diagram(diagram_id, {
                'id': diagram.id,
                'title': diagram.title,
                'code': diagram.code,
                'diagram_type': diagram.diagram_type,
                'user_id': diagram.user_id,
                'created_at': diagram.created_at.isoformat(),
                'updated_at': diagram.updated_at.isoformat()
            })
        
        return diagram

    async def update_diagram(self, diagram_id: str, diagram_update: DiagramUpdate, db: Session) -> Optional[Diagram]:
        """更新图表并清除缓存"""
        diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
        if not diagram:
            return None
        
        # 更新数据库
        for field, value in diagram_update.dict(exclude_unset=True).items():
            setattr(diagram, field, value)
        
        db.commit()
        db.refresh(diagram)
        
        # 清除缓存
        await cache_service.invalidate_diagram_cache(diagram_id)
        
        return diagram

    async def get_user_diagrams(self, user_id: str, db: Session, skip: int = 0, limit: int = 50) -> List[Diagram]:
        """获取用户的图表列表"""
        return db.query(Diagram)\
            .filter(Diagram.user_id == user_id)\
            .order_by(Diagram.updated_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()

# 服务实例
diagram_service = DiagramService()
```

#### 2.4 数据库索引优化
```python
# backend/alembic/versions/001_add_indexes.py
"""Add performance indexes

Revision ID: 001_add_indexes
Revises: initial_migration
Create Date: 2024-01-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001_add_indexes'
down_revision = 'initial_migration'
branch_labels = None
depends_on = None

def upgrade():
    # 为 diagrams 表添加索引
    op.create_index(
        'idx_diagrams_user_id', 
        'diagrams', 
        ['user_id']
    )
    
    op.create_index(
        'idx_diagrams_updated_at', 
        'diagrams', 
        ['updated_at']
    )
    
    op.create_index(
        'idx_diagrams_diagram_type', 
        'diagrams', 
        ['diagram_type']
    )
    
    # 复合索引用于常见查询
    op.create_index(
        'idx_diagrams_user_updated', 
        'diagrams', 
        ['user_id', 'updated_at']
    )

def downgrade():
    op.drop_index('idx_diagrams_user_updated', 'diagrams')
    op.drop_index('idx_diagrams_diagram_type', 'diagrams')
    op.drop_index('idx_diagrams_updated_at', 'diagrams')
    op.drop_index('idx_diagrams_user_id', 'diagrams')
```

### 3. API 速率限制（预计 2-3 天）

#### 3.1 速率限制中间件
```python
# backend/app/middleware/rate_limit.py
from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis.asyncio as redis
from app.core.config import settings
import time
import json

# Redis 连接用于分布式速率限制
redis_rate_limit = redis.from_url(settings.REDIS_URL)

def get_user_id(request: Request) -> str:
    """获取用户标识，优先使用用户ID，否则使用IP"""
    # 尝试从请求中获取用户ID（如果有认证）
    if hasattr(request.state, 'user') and request.state.user:
        return f"user:{request.state.user.id}"
    
    # 使用 IP 地址
    return f"ip:{get_remote_address(request)}"

# 创建限制器实例
limiter = Limiter(
    key_func=get_user_id,
    storage_uri=settings.REDIS_URL,
    default_limits=["1000/hour"]  # 默认每小时1000次请求
)

# 自定义速率限制异常处理器
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """自定义速率限制异常处理"""
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "error": "Rate limit exceeded",
            "message": f"请求过于频繁，请稍后再试。限制：{exc.detail}",
            "retry_after": exc.detail.split(" ")[0] if exc.detail else "60"
        }
    )

# 针对不同端点的限制规则
RATE_LIMITS = {
    "generate": "10/minute",      # AI 生成：每分钟10次
    "refine": "20/minute",        # AI 优化：每分钟20次
    "explain": "30/minute",       # AI 解释：每分钟30次
    "create": "100/hour",         # 创建图表：每小时100次
    "update": "500/hour",         # 更新图表：每小时500次
    "default": "1000/hour"        # 默认限制：每小时1000次
}

class CustomRateLimiter:
    def __init__(self):
        self.redis = redis_rate_limit
    
    async def is_allowed(self, key: str, limit: str) -> tuple[bool, dict]:
        """检查是否允许请求"""
        try:
            # 解析限制规则（如 "10/minute"）
            count, period = limit.split('/')
            count = int(count)
            
            # 计算时间窗口
            if period == 'minute':
                window = 60
            elif period == 'hour':
                window = 3600
            elif period == 'day':
                window = 86400
            else:
                window = 60  # 默认1分钟
            
            current_time = int(time.time())
            window_start = current_time - window
            
            # Redis key
            redis_key = f"rate_limit:{key}:{period}:{current_time // window}"
            
            # 获取当前计数
            current_count = await self.redis.get(redis_key)
            current_count = int(current_count) if current_count else 0
            
            # 检查是否超过限制
            if current_count >= count:
                # 获取过期时间
                ttl = await self.redis.ttl(redis_key)
                return False, {
                    "limit": count,
                    "remaining": 0,
                    "reset": current_time + ttl,
                    "retry_after": ttl
                }
            
            # 增加计数
            pipe = self.redis.pipeline()
            pipe.incr(redis_key)
            pipe.expire(redis_key, window)
            await pipe.execute()
            
            return True, {
                "limit": count,
                "remaining": count - current_count - 1,
                "reset": current_time + window,
                "retry_after": 0
            }
            
        except Exception as e:
            print(f"Rate limit check error: {e}")
            # 如果 Redis 出错，允许请求通过
            return True, {"limit": 0, "remaining": 0, "reset": 0, "retry_after": 0}

# 全局速率限制器实例
custom_rate_limiter = CustomRateLimiter()
```

#### 3.2 路由保护装饰器
```python
# backend/app/decorators/rate_limit.py
from functools import wraps
from fastapi import Request, HTTPException, status
from app.middleware.rate_limit import custom_rate_limiter, RATE_LIMITS
import inspect

def rate_limit(endpoint_name: str = None):
    """速率限制装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取请求对象
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # 在 kwargs 中查找 Request
                for key, value in kwargs.items():
                    if isinstance(value, Request):
                        request = value
                        break
            
            if not request:
                # 如果没有找到 Request 对象，直接执行函数
                return await func(*args, **kwargs)
            
            # 确定限制规则
            if endpoint_name:
                limit_rule = RATE_LIMITS.get(endpoint_name, RATE_LIMITS["default"])
            else:
                # 从函数名推断
                func_name = func.__name__
                if 'generate' in func_name:
                    limit_rule = RATE_LIMITS["generate"]
                elif 'refine' in func_name:
                    limit_rule = RATE_LIMITS["refine"]
                elif 'explain' in func_name:
                    limit_rule = RATE_LIMITS["explain"]
                elif 'create' in func_name:
                    limit_rule = RATE_LIMITS["create"]
                elif 'update' in func_name:
                    limit_rule = RATE_LIMITS["update"]
                else:
                    limit_rule = RATE_LIMITS["default"]
            
            # 获取用户标识
            if hasattr(request.state, 'user') and request.state.user:
                key = f"user:{request.state.user.id}"
            else:
                key = f"ip:{request.client.host}"
            
            # 检查速率限制
            allowed, info = await custom_rate_limiter.is_allowed(key, limit_rule)
            
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": f"请求过于频繁，请 {info['retry_after']} 秒后重试",
                        "limit": info["limit"],
                        "retry_after": info["retry_after"]
                    },
                    headers={
                        "X-RateLimit-Limit": str(info["limit"]),
                        "X-RateLimit-Remaining": str(info["remaining"]),
                        "X-RateLimit-Reset": str(info["reset"]),
                        "Retry-After": str(info["retry_after"])
                    }
                )
            
            # 添加速率限制头信息
            if hasattr(request, 'scope'):
                request.scope['rate_limit'] = info
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator
```

#### 3.3 API 路由应用速率限制
```python
# backend/app/api/v1/endpoints/diagrams.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.decorators.rate_limit import rate_limit
from app.services.ai.claude_service import claude_service

router = APIRouter()

@router.post("/generate")
@rate_limit("generate")
async def generate_diagram(
    request: DiagramGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """生成图表 - 严格的速率限制"""
    try:
        result = await claude_service.generate_diagram(
            request.description,
            request.diagram_type,
            request.diagram_format
        )
        
        return {"code": result, "message": "生成成功"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="生成失败，请重试"
        )

@router.post("/refine")
@rate_limit("refine")
async def refine_diagram(
    request: DiagramRefineRequest,
    current_user: User = Depends(get_current_user)
):
    """优化图表 - 中等速率限制"""
    try:
        result = await claude_service.refine_diagram(
            request.code,
            request.instruction,
            request.diagram_format
        )
        
        return {"code": result, "message": "优化成功"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="优化失败，请重试"
        )

@router.post("/explain")
@rate_limit("explain")
async def explain_diagram(
    request: DiagramExplainRequest,
    current_user: User = Depends(get_current_user)
):
    """解释图表 - 宽松的速率限制"""
    try:
        explanation = await claude_service.explain_diagram(
            request.code,
            request.diagram_format
        )
        
        return {"explanation": explanation, "message": "解释成功"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="解释失败，请重试"
        )

@router.post("/")
@rate_limit("create")
async def create_diagram(
    diagram: DiagramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建图表"""
    # 创建逻辑...

@router.put("/{diagram_id}")
@rate_limit("update")
async def update_diagram(
    diagram_id: str,
    diagram_update: DiagramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新图表"""
    # 更新逻辑...
```

### 4. 输入验证增强（预计 1-2 天）

#### 4.1 增强的 Pydantic 模型
```python
# backend/app/schemas/diagram.py
from pydantic import BaseModel, Field, validator
import re
from typing import Optional
from app.enums.diagram_type import DiagramType, DiagramFormat, AIProvider

class DiagramGenerateRequest(BaseModel):
    description: str = Field(
        ..., 
        min_length=10, 
        max_length=2000,
        description="图表描述，10-2000字符"
    )
    diagram_type: DiagramType
    diagram_format: DiagramFormat = DiagramFormat.DRAWIO
    ai_provider: AIProvider = AIProvider.CLAUDE
    
    @validator('description')
    def validate_description(cls, v):
        """验证描述内容，防止恶意输入"""
        v = v.strip()
        
        # 检查是否包含潜在的 XSS 或注入攻击
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',                # JavaScript protocol
            r'on\w+\s*=',                 # Event handlers
            r'eval\s*\(',                 # eval function
            r'document\.',                # Document access
            r'window\.',                  # Window access
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE | re.DOTALL):
                raise ValueError('描述包含不安全的内容')
        
        # 检查是否包含过多的特殊字符
        special_char_count = len(re.findall(r'[<>"\'&]', v))
        if special_char_count > len(v) * 0.3:  # 超过30%是特殊字符
            raise ValueError('描述包含过多特殊字符')
        
        return v
    
    @validator('diagram_type')
    def validate_diagram_type(cls, v):
        """验证图表类型"""
        if v not in DiagramType:
            raise ValueError('不支持的图表类型')
        return v

class DiagramRefineRequest(BaseModel):
    code: str = Field(..., min_length=10, max_length=50000)
    instruction: str = Field(..., min_length=5, max_length=500)
    diagram_format: DiagramFormat = DiagramFormat.DRAWIO
    
    @validator('instruction')
    def validate_instruction(cls, v):
        """验证优化指令"""
        v = v.strip()
        
        # 基本的恶意内容检查
        if re.search(r'<script|javascript:|on\w+\s*=', v, re.IGNORECASE):
            raise ValueError('指令包含不安全的内容')
        
        return v
    
    @validator('code')
    def validate_code(cls, v):
        """验证图表代码"""
        v = v.strip()
        
        # 检查代码格式
        if v.startswith('<?xml'):
            # XML 格式基本验证
            if not v.endswith('</mxfile>'):
                raise ValueError('XML 格式不正确')
        elif v.startswith('graph') or v.startswith('flowchart'):
            # Mermaid 格式基本验证
            pass
        else:
            raise ValueError('不支持的代码格式')
        
        return v

class DiagramExplainRequest(BaseModel):
    code: str = Field(..., min_length=10, max_length=50000)
    diagram_format: DiagramFormat = DiagramFormat.DRAWIO
    
    @validator('code')
    def validate_code(cls, v):
        """验证要解释的代码"""
        v = v.strip()
        if len(v) < 10:
            raise ValueError('代码长度不足')
        return v
```

#### 4.2 前端输入验证
```typescript
// frontend/src/utils/validation.ts

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class InputValidator {
  // 图表描述验证
  static validateDescription(description: string): ValidationResult {
    const errors: string[] = []
    
    // 长度检查
    if (!description || description.trim().length < 10) {
      errors.push('描述至少需要10个字符')
    }
    
    if (description.length > 2000) {
      errors.push('描述不能超过2000个字符')
    }
    
    // 内容检查
    const trimmedDescription = description.trim()
    
    // 检查潜在的 XSS
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmedDescription)) {
        errors.push('描述包含不安全的内容')
        break
      }
    }
    
    // 特殊字符比例检查
    const specialCharCount = (trimmedDescription.match(/[<>"'&]/g) || []).length
    if (specialCharCount > trimmedDescription.length * 0.3) {
      errors.push('描述包含过多特殊字符')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // 图表标题验证
  static validateTitle(title: string): ValidationResult {
    const errors: string[] = []
    
    if (!title || title.trim().length === 0) {
      errors.push('标题不能为空')
    }
    
    if (title.length > 100) {
      errors.push('标题不能超过100个字符')
    }
    
    // 检查特殊字符
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(title)) {
        errors.push('标题包含不安全的内容')
        break
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // AI 指令验证
  static validateInstruction(instruction: string): ValidationResult {
    const errors: string[] = []
    
    if (!instruction || instruction.trim().length < 5) {
      errors.push('指令至少需要5个字符')
    }
    
    if (instruction.length > 500) {
      errors.push('指令不能超过500个字符')
    }
    
    // 基本安全检查
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(instruction)) {
        errors.push('指令包含不安全的内容')
        break
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// 在组件中使用
export const useValidation = () => {
  const validateDescription = (description: string): string[] => {
    const result = InputValidator.validateDescription(description)
    return result.errors
  }
  
  const validateTitle = (title: string): string[] => {
    const result = InputValidator.validateTitle(title)
    return result.errors
  }
  
  const validateInstruction = (instruction: string): string[] => {
    const result = InputValidator.validateInstruction(instruction)
    return result.errors
  }
  
  return {
    validateDescription,
    validateTitle,
    validateInstruction
  }
}
```

## 📋 实施检查清单

### Bundle 优化
- [ ] 更新 vite.config.ts 配置
- [ ] 实现路由懒加载
- [ ] 添加组件 memo 优化
- [ ] 测试打包体积减少效果
- [ ] 验证懒加载功能正常

### Redis 缓存
- [ ] 实现 CacheService 类
- [ ] 集成到 AI 服务
- [ ] 集成到图表服务
- [ ] 添加数据库索引
- [ ] 测试缓存命中率
- [ ] 验证缓存失效机制

### 速率限制
- [ ] 实现速率限制中间件
- [ ] 添加装饰器支持
- [ ] 应用到所有 API 端点
- [ ] 测试不同限制规则
- [ ] 验证错误处理和响应头

### 输入验证
- [ ] 增强 Pydantic 模型
- [ ] 实现前端验证工具
- [ ] 集成到相关组件
- [ ] 测试各种攻击向量
- [ ] 验证用户体验

## 🎯 预期成果

### 性能提升
- 首屏加载时间减少 40-50%
- API 响应时间减少 30-40%（通过缓存）
- 打包体积减少 20-30%

### 安全性提升
- 防止常见的 XSS 和注入攻击
- API 滥用防护
- 输入数据完整性保证

### 用户体验提升
- 更快的页面加载
- 更流畅的交互
- 更好的错误处理

---

**实施时间**: 总计 10-15 个工作日
**团队配置**: 2 前端开发 + 1 后端开发
**风险等级**: 低（主要是增量优化，不破坏现有功能）