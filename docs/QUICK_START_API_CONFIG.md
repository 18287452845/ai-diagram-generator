# API密钥配置 - 快速开始

## 🚀 5分钟快速配置

### 步骤1: 启动应用

```bash
# 启动后端
cd backend
poetry run uvicorn app.main:app --reload

# 启动前端（另一个终端）
cd frontend
npm run dev
```

### 步骤2: 访问设置页面

打开浏览器访问：`http://localhost:5173/settings`

或从首页点击右上角的「设置」按钮

### 步骤3: 选择配置模式

#### 选项A: 使用服务器端密钥（推荐）✅

**适合场景**：团队使用、生产环境

1. 在设置页面保持「使用服务器端密钥」选中
2. 配置服务器 `.env` 文件：
```bash
cd backend
nano .env  # 或使用其他编辑器

# 添加以下内容：
ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
OPENAI_API_KEY="sk-proj-your-key-here"
DEEPSEEK_API_KEY="sk-your-key-here"
```
3. 重启后端服务
4. ✅ 完成！现在可以开始使用了

#### 选项B: 使用客户端密钥

**适合场景**：个人使用、开发测试

1. 在设置页面选择「使用客户端密钥」
2. 输入API密钥：
   - Claude: https://console.anthropic.com 获取
   - OpenAI: https://platform.openai.com/api-keys 获取
   - DeepSeek: https://platform.deepseek.com 获取
3. 点击「保存配置」
4. ✅ 完成！密钥已保存到浏览器

### 步骤4: 测试配置

1. 返回首页，点击「开始创建」
2. 选择一个AI提供商（Claude/OpenAI/DeepSeek）
3. 输入描述，如："创建一个用户登录流程图"
4. 点击生成
5. 如果配置正确，应该能看到生成的图表

## 🔍 快速诊断

### 检查服务器密钥是否配置

```bash
cd backend
python -c "from app.core.config import settings; print('Claude:', 'OK' if settings.ANTHROPIC_API_KEY else 'Missing'); print('OpenAI:', 'OK' if settings.OPENAI_API_KEY else 'Missing'); print('DeepSeek:', 'OK' if settings.DEEPSEEK_API_KEY else 'Missing')"
```

### 检查客户端密钥是否保存

1. 打开浏览器开发者工具（F12）
2. 切换到 Application/Storage 标签
3. 查看 Local Storage → `http://localhost:5173`
4. 找到 `ai-diagram-config` 键
5. 查看值是否包含您的配置

### 测试API密钥是否有效

```bash
# 测试 Claude
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $YOUR_CLAUDE_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}'

# 测试 OpenAI
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}'

# 测试 DeepSeek
curl https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $YOUR_DEEPSEEK_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-reasoner","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}'
```

## ⚠️ 常见问题

### Q: 生成图表时提示"API key is not set"
**A**:
- 如果使用服务器密钥：检查 `.env` 文件并重启后端
- 如果使用客户端密钥：打开设置页面，确认密钥已保存

### Q: 密钥已配置但仍然失败
**A**:
1. 检查密钥格式是否正确（不要有多余空格）
2. 确认密钥没有过期
3. 检查账户是否有足够的配额
4. 查看浏览器控制台和后端日志的错误信息

### Q: 如何切换配置模式？
**A**:
1. 打开设置页面
2. 选择新的模式
3. 如果切换到客户端模式，需要重新输入密钥
4. 如果切换到服务器模式，客户端密钥会被清除

### Q: 客户端密钥安全吗？
**A**:
- 密钥存储在浏览器 localStorage 中
- 仅当前域名可访问
- 通过HTTPS传输（生产环境）
- 建议：不要在公共设备上保存密钥
- 推荐：团队使用时优先选择服务器端密钥

## 📝 配置检查清单

### 服务器端模式
- [ ] `.env` 文件已创建
- [ ] API密钥已正确填写（无多余空格和引号）
- [ ] 后端服务已重启
- [ ] 设置页面显示「使用服务器端密钥」
- [ ] 能够成功生成图表

### 客户端模式
- [ ] 设置页面已选择「使用客户端密钥」
- [ ] 已输入至少一个AI提供商的密钥
- [ ] 点击了「保存配置」按钮
- [ ] 密钥状态显示为「已配置」
- [ ] 能够成功生成图表

## 🎯 下一步

配置完成后，您可以：

1. **创建图表**：从首页点击「开始创建」
2. **浏览图表**：从首页点击「我的图表」
3. **调整设置**：随时访问设置页面修改配置
4. **查看文档**：阅读 `docs/FRONTEND_API_KEY_CONFIG.md` 了解详细信息

## 📚 相关文档

- [完整配置文档](./FRONTEND_API_KEY_CONFIG.md)
- [DeepSeek集成指南](./DEEPSEEK_INTEGRATION.md)
- [快速参考](./DEEPSEEK_QUICK_REFERENCE.md)

## 💡 最佳实践

1. **生产环境**：始终使用服务器端密钥
2. **开发环境**：可以使用客户端密钥方便测试
3. **密钥管理**：定期更换API密钥
4. **成本控制**：监控API使用量和成本
5. **安全第一**：不要将密钥提交到版本控制系统

---

需要帮助？查看[故障排除文档](./FRONTEND_API_KEY_CONFIG.md#故障排除)或提交Issue。
