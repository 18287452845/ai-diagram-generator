# API密钥配置功能文档

## 概述

前端现在支持两种API密钥配置模式：
1. **服务器端密钥**（默认，推荐）：API密钥存储在服务器的环境变量中
2. **客户端密钥**：用户在浏览器中配置自己的API密钥

## 功能特性

### 1. 双模式支持

#### 服务器端密钥模式
- ✅ 默认模式，最安全
- ✅ 密钥存储在服务器 `.env` 文件中
- ✅ 用户无需配置API密钥
- ✅ 适合团队共享使用

#### 客户端密钥模式
- ✅ 用户自己配置API密钥
- ✅ 密钥存储在浏览器 localStorage
- ✅ 适合个人使用自己的API配额
- ✅ 密钥通过HTTP头部发送到后端

### 2. 支持的AI提供商

- **Claude (Anthropic)** - Claude 3.5 Sonnet
- **OpenAI** - GPT-4
- **DeepSeek** - DeepSeek R1

### 3. 用户界面

- 🔐 密码输入框（可切换显示/隐藏）
- 💾 保存配置功能
- 🗑️ 清除所有密钥功能
- ✅ 密钥状态指示器
- ⚠️ 安全提示

## 使用指南

### 访问设置页面

1. 从首页点击右上角的「设置」按钮
2. 或直接访问 `/settings` 路径

### 配置API密钥

#### 方式一：使用服务器端密钥（推荐）

1. 在设置页面选择「使用服务器端密钥」（默认已选中）
2. 确保服务器的 `.env` 文件已配置相应密钥
3. 无需其他操作

#### 方式二：使用客户端密钥

1. 在设置页面选择「使用客户端密钥」
2. 分别输入三个AI提供商的API密钥：
   - **Claude API Key**: 从 https://console.anthropic.com 获取
   - **OpenAI API Key**: 从 https://platform.openai.com/api-keys 获取
   - **DeepSeek API Key**: 从 https://platform.deepseek.com 获取
3. 点击「保存配置」按钮
4. 密钥状态指示器会显示哪些密钥已配置

### 密钥格式

```
Claude:    sk-ant-api03-...
OpenAI:    sk-proj-...
DeepSeek:  sk-...
```

## 技术实现

### 前端实现

#### 1. 状态管理 (Zustand Store)

```typescript
// stores/configStore.ts
export interface APIKeys {
  anthropicKey: string
  openaiKey: string
  deepseekKey: string
}

export interface ConfigState {
  apiKeys: APIKeys
  useServerKeys: boolean
  setAPIKey: (provider: keyof APIKeys, key: string) => void
  setUseServerKeys: (use: boolean) => void
  clearAPIKeys: () => void
  getAPIKey: (provider: keyof APIKeys) => string
  hasAPIKey: (provider: keyof APIKeys) => boolean
}
```

#### 2. API拦截器

```typescript
// services/api.ts
apiClient.interceptors.request.use((config) => {
  const configState = useConfigStore.getState()
  if (!configState.useServerKeys) {
    const { apiKeys } = configState
    if (apiKeys.anthropicKey) {
      config.headers['X-Anthropic-Key'] = apiKeys.anthropicKey
    }
    if (apiKeys.openaiKey) {
      config.headers['X-OpenAI-Key'] = apiKeys.openaiKey
    }
    if (apiKeys.deepseekKey) {
      config.headers['X-DeepSeek-Key'] = apiKeys.deepseekKey
    }
  }
  return config
})
```

#### 3. 持久化存储

使用 `zustand/middleware` 的 `persist` 中间件将配置保存到 localStorage：

```typescript
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'ai-diagram-config',
    partialize: (state) => ({
      apiKeys: state.useServerKeys ? initialAPIKeys : state.apiKeys,
      useServerKeys: state.useServerKeys,
    }),
  }
)
```

### 后端实现

#### 1. 读取客户端密钥

```python
def get_api_keys_from_request(request: Request) -> dict:
    """Extract API keys from request headers or use server defaults"""
    return {
        'anthropic': request.headers.get('X-Anthropic-Key') or settings.ANTHROPIC_API_KEY,
        'openai': request.headers.get('X-OpenAI-Key') or settings.OPENAI_API_KEY,
        'deepseek': request.headers.get('X-DeepSeek-Key') or settings.DEEPSEEK_API_KEY,
    }
```

#### 2. 临时设置密钥

```python
def set_service_api_key(service, provider: AIProvider, api_keys: dict):
    """Temporarily set API key for a service if client-side key is provided"""
    if provider == AIProvider.CLAUDE and api_keys['anthropic']:
        original_key = os.environ.get('ANTHROPIC_API_KEY')
        os.environ['ANTHROPIC_API_KEY'] = api_keys['anthropic']
        settings.ANTHROPIC_API_KEY = api_keys['anthropic']
        service._client = None
        return original_key
    # Similar for other providers...
```

#### 3. 请求处理流程

```python
@router.post("/ai/generate")
async def generate_diagram(request: GenerateDiagramRequest, http_request: Request):
    api_keys = get_api_keys_from_request(http_request)

    if request.aiProvider == AIProvider.CLAUDE:
        original_key = set_service_api_key(claude_service, request.aiProvider, api_keys)
        code = await claude_service.generate_diagram(...)
        # Restore original key
        if original_key is not None:
            os.environ['ANTHROPIC_API_KEY'] = original_key
            settings.ANTHROPIC_API_KEY = original_key
```

## 安全考虑

### 客户端密钥模式的安全性

⚠️ **重要提示**：

1. **存储位置**：密钥存储在浏览器的 localStorage 中
2. **传输安全**：密钥通过HTTPS传输（生产环境必须使用HTTPS）
3. **访问限制**：只有当前域名的JavaScript可以访问
4. **清除建议**：在公共设备上使用后应清除密钥
5. **定期更换**：建议定期更换API密钥

### 服务器端密钥模式的安全性

✅ **推荐使用**：

1. **环境隔离**：密钥存储在服务器环境变量中
2. **版本控制**：`.env` 文件不应提交到Git
3. **访问控制**：只有服务器进程可以访问
4. **统一管理**：便于团队集中管理和审计

## 文件清单

### 前端文件

```
frontend/src/
├── stores/
│   └── configStore.ts                 # 配置状态管理
├── components/
│   └── UI/
│       └── APIKeyConfig.tsx          # API密钥配置组件
├── pages/
│   ├── SettingsPage.tsx              # 设置页面
│   └── HomePage.tsx                  # 首页（添加设置链接）
├── services/
│   └── api.ts                        # API客户端（添加拦截器）
├── types/
│   └── diagram.ts                    # 类型定义（添加DeepSeek）
└── App.tsx                           # 路由配置
```

### 后端文件

```
backend/app/
└── api/
    └── routes.py                     # API路由（支持客户端密钥）
```

## 故障排除

### 问题：API调用失败，提示密钥无效

**解决方案**：
1. 检查密钥格式是否正确
2. 确认密钥在对应平台是否有效且有足够配额
3. 如果使用客户端密钥，确认已正确保存
4. 如果使用服务器密钥，检查 `.env` 文件配置

### 问题：保存密钥后没有生效

**解决方案**：
1. 检查浏览器 localStorage 是否被禁用
2. 清除浏览器缓存后重试
3. 检查浏览器控制台是否有错误信息

### 问题：密钥状态显示未配置

**解决方案**：
1. 确认已点击「保存配置」按钮
2. 刷新页面查看是否已保存
3. 检查密钥输入框是否为空

### 问题：无法访问设置页面

**解决方案**：
1. 确认前端路由已正确配置
2. 检查是否导入了 SettingsPage 组件
3. 查看浏览器控制台的错误信息

## 未来改进

- [ ] 添加密钥验证功能（测试密钥是否有效）
- [ ] 支持密钥加密存储
- [ ] 添加使用统计（API调用次数、成本估算）
- [ ] 支持多个密钥轮换使用
- [ ] 添加密钥过期提醒
- [ ] 支持团队密钥管理

## API参考

### HTTP Headers

客户端可以通过以下HTTP头部发送API密钥：

```
X-Anthropic-Key: <claude_api_key>
X-OpenAI-Key: <openai_api_key>
X-DeepSeek-Key: <deepseek_api_key>
```

### 示例请求

```bash
curl -X POST "http://localhost:8000/api/ai/generate" \
  -H "Content-Type: application/json" \
  -H "X-OpenAI-Key: sk-proj-..." \
  -d '{
    "description": "创建一个登录流程图",
    "diagramType": "flowchart",
    "format": "mermaid",
    "aiProvider": "openai"
  }'
```

## 贡献指南

如需添加新的API提供商支持：

1. 在 `APIKeys` 接口中添加新字段
2. 在 `AIProvider` 枚举中添加新提供商
3. 在 `APIKeyConfig` 组件中添加对应的输入框
4. 在 `api.ts` 拦截器中添加头部处理
5. 在后端 `routes.py` 中添加相应逻辑

---

**最后更新**: 2024年11月21日
**版本**: 1.0
**作者**: AI Diagram Generator Team
