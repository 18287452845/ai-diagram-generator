# AI 对话式图表生成功能

## 功能概述

新增了 AI 对话式图表生成功能，支持：
- 流式输出 AI 响应
- 保留对话上下文
- 自动提取并渲染图表代码
- 多轮对话优化图表

## 技术实现

### 后端改动

1. **新增 Schema** (`backend/app/schemas/diagram.py`):
   - `ChatMessage`: 聊天消息模型
   - `ChatRequest`: 聊天请求模型

2. **新增 API 端点** (`backend/app/api/routes.py`):
   - `POST /api/ai/chat/stream`: 流式聊天端点
   - 支持 Server-Sent Events (SSE)
   - 支持所有 AI 提供商 (Claude, OpenAI, DeepSeek)

3. **AI 服务增强**:
   - `claude_service.chat_stream()`: Claude 流式聊天
   - `openai_service.chat_stream()`: OpenAI 流式聊天
   - `deepseek_service.chat_stream()`: DeepSeek 流式聊天

### 前端改动

1. **新增类型** (`frontend/src/types/diagram.ts`):
   - `ChatMessage`: 聊天消息接口
   - `ChatConversation`: 对话会话接口

2. **新增 Store** (`frontend/src/stores/chatStore.ts`):
   - 使用 Zustand 持久化对话历史
   - 支持多个对话会话
   - 自动保存到 localStorage

3. **新增组件** (`frontend/src/components/Editor/AIChatPanel.tsx`):
   - 替换原有的 AIInputPanel
   - 实现流式输出显示
   - 自动滚动到最新消息
   - 支持 Shift+Enter 换行，Enter 发送
   - 自动提取并渲染图表代码

4. **更新页面** (`frontend/src/pages/EditorPage.tsx`):
   - 使用新的 AIChatPanel 组件
   - 增加聊天面板宽度以更好展示对话

## 使用说明

### 基本使用

1. 在编辑器页面左侧，选择图表类型和 AI 引擎
2. 在输入框中描述想要的图表
3. 按 Enter 发送消息（Shift+Enter 换行）
4. AI 会流式返回响应
5. 当 AI 回复包含图表代码时，会自动提取并渲染到右侧编辑器

### 对话上下文

- 所有对话历史会被保存
- AI 会理解之前的对话内容
- 可以通过多轮对话逐步优化图表
- 点击垃圾桶图标可清空当前对话

### 示例对话

```
用户: 创建一个用户登录流程图
AI: [流式生成图表代码和说明]
[图表自动渲染]

用户: 在登录失败后增加重试逻辑
AI: [基于之前的图表，流式生成更新后的代码]
[图表自动更新]
```

## 数据流程

1. 用户输入消息
2. 创建或使用现有对话会话
3. 添加用户消息到会话
4. 发送聊天请求到后端（包含完整对话历史）
5. 后端调用 AI 服务的流式接口
6. 前端接收 SSE 流并实时更新 UI
7. 流结束后，提取图表代码
8. 自动渲染图表到编辑器

## 持久化

- 对话历史保存在浏览器 localStorage
- key: `ai-diagram-chat`
- 包含所有对话会话和消息
- 页面刷新后对话历史仍然保留

## API 接口

### POST /api/ai/chat/stream

**请求体:**
```json
{
  "messages": [
    {"role": "user", "content": "创建登录流程图"},
    {"role": "assistant", "content": "..."}
  ],
  "diagramType": "flowchart",
  "format": "drawio",
  "aiProvider": "claude"
}
```

**响应 (SSE):**
```
data: {"type": "chunk", "content": "正在"}
data: {"type": "chunk", "content": "生成"}
data: {"type": "done"}
```

**错误响应:**
```
data: {"type": "error", "message": "错误信息"}
```

## 注意事项

1. 流式响应需要浏览器支持 Fetch API 和 ReadableStream
2. 建议使用现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
3. 长时间的对话可能导致 token 使用量增加
4. 建议定期清空不需要的对话历史

## 未来改进

- [ ] 支持对话分支和回滚
- [ ] 添加对话导出功能
- [ ] 支持图片识别生成图表
- [ ] 添加对话摘要功能
- [ ] 支持多人协作对话
