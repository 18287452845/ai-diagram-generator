# DeepSeek R1 快速参考指南

## 快速开始

### 1. 获取API密钥
访问 https://platform.deepseek.com/ 注册并获取API密钥

### 2. 配置
```bash
# 编辑 backend/.env
DEEPSEEK_API_KEY="your_api_key_here"
```

### 3. 重启服务
```bash
docker-compose restart backend
# 或
cd backend && poetry run uvicorn app.main:app --reload
```

## API调用示例

### 生成图表
```json
POST /api/v1/ai/generate
{
  "description": "用户注册流程",
  "diagramType": "flowchart",
  "format": "mermaid",
  "aiProvider": "deepseek"
}
```

### 优化图表
```json
POST /api/v1/ai/refine
{
  "code": "graph TD\n  A-->B",
  "instruction": "添加更多细节",
  "format": "mermaid",
  "aiProvider": "deepseek"
}
```

### 解释图表
```json
POST /api/v1/ai/explain
{
  "code": "graph TD\n  A-->B",
  "format": "mermaid",
  "aiProvider": "deepseek"
}
```

## 支持的图表类型

- `flowchart` - 流程图
- `architecture` - 架构图
- `sequence` - 时序图
- `er` - ER图
- `gantt` - 甘特图
- `class` - 类图
- `state` - 状态图
- `mindmap` - 思维导图
- `roadmap` - 路线图

## 支持的格式

- `mermaid` - Mermaid图表代码
- `drawio` - Draw.io XML格式

## 测试命令

```bash
# 运行集成测试
cd backend
python test_deepseek.py
```

## 故障排除

### 问题："DEEPSEEK_API_KEY is not set"
**解决**：检查 `.env` 文件，确保已设置API密钥

### 问题：连接超时
**解决**：
1. 检查网络连接
2. 确认API密钥有效
3. 检查防火墙设置

### 问题：响应格式错误
**解决**：服务会自动清理markdown代码块，如仍有问题请查看日志

## 与其他提供商对比

| 特性 | Claude | OpenAI | DeepSeek |
|------|--------|--------|----------|
| Mermaid | ✅ | ✅ | ✅ |
| Draw.io | ✅ | ⚠️ | ✅ |
| 推理能力 | ✅✅ | ✅ | ✅✅ |
| 响应速度 | 快 | 快 | 中等 |
| 成本 | 高 | 中 | 低 |

## 注意事项

⚠️ DeepSeek R1是推理模型，响应时间可能比其他模型长
⚠️ 确保 `.env` 文件不被提交到Git
⚠️ 注意API调用配额和速率限制

## 技术支持

- DeepSeek文档: https://platform.deepseek.com/docs
- 项目文档: docs/DEEPSEEK_INTEGRATION.md
- 实现总结: docs/IMPLEMENTATION_SUMMARY.md
