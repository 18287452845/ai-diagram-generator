# 🎨 AI Draw.io 图表生成器 - 重构指南

## 📋 项目概述

这是一个基于自然语言和AI的Draw.io图表生成应用。用户只需用自然语言描述需求，AI会自动生成专业的可视化图表，并可在Draw.io可视化编辑器中进行拖拽编辑。

## 🔄 架构变更

### **核心变化**

**之前**: Mermaid + Draw.io 双格式支持 → 需要格式转换
**现在**: 纯Draw.io XML → AI直接生成 → 可视化编辑

### **工作流程**

```
用户输入自然语言描述
       ↓
AI (Claude/GPT-4) 生成
       ↓
  Draw.io XML代码
       ↓
可视化编辑器渲染 (可拖拽编辑)
       ↓
  导出 (SVG/PNG/XML)
```

## 🎯 已完成的重构

### **1. Frontend (TypeScript/React)**

#### 类型定义 (`types/diagram.ts`)
- ❌ 移除 `DiagramFormat` 枚举
- ✅ 简化为单一Draw.io格式
- ✅ 更新导出格式选项

#### AI输入面板 (`components/Editor/AIInputPanel.tsx`)
- ❌ 移除格式选择UI
- ❌ 移除模板选择器
- ✅ 简化为纯自然语言输入
- ✅ 添加每种图表类型的示例说明
- ✅ 改进UI设计（渐变按钮，更好的提示）

#### 编辑器页面 (`pages/EditorPage.tsx`)
- ❌ 移除Mermaid相关代码
- ❌ 移除格式转换功能
- ❌ 移除Mermaid预览面板
- ✅ 简化为两列布局：AI输入 + Draw.io编辑器
- ✅ 可视化/代码视图切换
- ✅ 默认空Draw.io XML模板

#### 代码编辑器 (`components/Editor/CodeEditor.tsx`)
- ❌ 移除format参数
- ✅ 固定为XML语法高亮
- ✅ 添加说明文本

#### 导出按钮 (`components/UI/ExportButton.tsx`)
- ❌ 移除format参数
- ✅ 改为固定的SVG/PNG/XML选项

### **2. Backend (Python/FastAPI)**

#### Schema更新 (`app/schemas/diagram.py`)
- ✅ 默认格式改为 `DiagramFormat.DRAWIO`
- ✅ 所有请求默认使用Draw.io格式

#### AI服务增强 (`app/services/ai/claude_service.py`)
- ✅ 大幅改进Draw.io提示词
  - 详细的XML结构说明
  - 具体的节点示例
  - 布局规则和最佳实践
  - 针对不同图表类型的定制化指导
- ✅ 改进XML清理逻辑
  - 自动移除markdown代码块
  - 确保以<?xml开头
  - 处理各种格式问题
- ✅ 默认格式改为Draw.io

## 🚀 使用指南

### **运行项目**

#### 启动后端
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

#### 启动前端
```bash
cd frontend
npm install
npm run dev
```

### **生成图表**

1. **选择图表类型**：流程图、架构图、时序图等
2. **选择AI引擎**：Claude 3.5 Sonnet 或 GPT-4
3. **描述需求**：用自然语言详细描述
   ```
   示例：
   一个电商网站的用户下单流程
   - 浏览商品
   - 加入购物车
   - 填写收货信息
   - 选择支付方式
   - 支付成功后显示订单确认
   - 如果支付失败则返回重新支付
   ```
4. **点击生成**：AI自动生成Draw.io XML
5. **可视化编辑**：在右侧编辑器中拖拽调整
6. **导出**：支持SVG、PNG、XML格式

### **编辑图表**

- **可视化模式**：直接在Draw.io编辑器中拖拽、调整样式
- **代码模式**：直接编辑XML代码
- **实时同步**：两种模式自动同步

## 📝 AI提示词示例

### **流程图**
```
创建一个用户注册流程图：
1. 用户填写注册信息
2. 验证邮箱格式
3. 检查用户名是否已存在
4. 如果已存在，提示用户重新输入
5. 如果不存在，发送验证邮件
6. 用户点击邮件验证链接
7. 注册成功，跳转到首页
```

### **架构图**
```
设计一个Web应用的三层架构：
- 前端层：React SPA
- 后端层：FastAPI REST API
- 数据层：PostgreSQL数据库 + Redis缓存
显示它们之间的数据流向
```

### **时序图**
```
展示用户登录的时序：
- 用户 -> 前端：输入用户名密码
- 前端 -> 后端API：发送登录请求
- 后端API -> 数据库：验证凭证
- 数据库 -> 后端API：返回用户信息
- 后端API -> 前端：返回JWT token
- 前端 -> 用户：显示登录成功
```

## 🎨 Draw.io XML 结构说明

### **基本结构**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net">
  <diagram name="Diagram">
    <mxGraphModel>
      <root>
        <mxCell id="0" />                    <!-- 根节点 -->
        <mxCell id="1" parent="0" />          <!-- 画布 -->
        <!-- 节点和连接从 id=2 开始 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### **节点示例**
```xml
<!-- 矩形节点 -->
<mxCell id="2" value="处理"
        style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
        vertex="1" parent="1">
  <mxGeometry x="300" y="100" width="120" height="60" as="geometry" />
</mxCell>

<!-- 决策节点 -->
<mxCell id="3" value="是否通过?"
        style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;"
        vertex="1" parent="1">
  <mxGeometry x="275" y="200" width="150" height="80" as="geometry" />
</mxCell>

<!-- 连接线 -->
<mxCell id="4" value="是"
        style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeWidth=2;endArrow=classic;"
        edge="1" parent="1" source="3" target="5">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

## 🔧 开发技巧

### **自定义Draw.io样式**

常用颜色组合：
- 绿色系：`fillColor=#d5e8d4;strokeColor=#82b366`
- 蓝色系：`fillColor=#dae8fc;strokeColor=#6c8ebf`
- 黄色系：`fillColor=#fff2cc;strokeColor=#d6b656`
- 红色系：`fillColor=#f8cecc;strokeColor=#b85450`
- 紫色系：`fillColor=#e1d5e7;strokeColor=#9673a6`

常用形状：
- 矩形：`rounded=0`
- 圆角矩形：`rounded=1`
- 椭圆：`ellipse`
- 菱形：`rhombus`
- 圆柱体：`shape=cylinder3`
- 六边形：`shape=hexagon`

### **调试AI生成**

如果生成的图表不理想：
1. 提供更详细的描述
2. 明确指定节点关系和流程
3. 说明特殊要求（颜色、布局等）
4. 可以在代码视图中手动微调XML

## 🐛 故障排除

### **问题：Draw.io编辑器卡在"Loading..."**
- **原因**：iframe未收到'configure'事件
- **解决**：已修复，组件现在正确处理'configure'事件

### **问题：Monaco编辑器加载失败**
- **原因**：CDN连接超时
- **解决**：已切换到unpkg.com CDN

### **问题：生成的XML格式错误**
- **原因**：AI返回了markdown代码块
- **解决**：后端自动清理代码块标记

## 📚 相关文档

- [Draw.io Embed API](https://www.drawio.com/doc/faq/embed-mode)
- [Draw.io XML Format](https://jgraph.github.io/mxgraph/docs/js-api/files/model/mxGraphModel-js.html)
- [Claude API](https://docs.anthropic.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)

## 🎯 未来改进

- [ ] 添加图表模板库
- [ ] 支持多页签图表
- [ ] 协作编辑功能
- [ ] 版本历史记录
- [ ] AI图表优化建议
- [ ] 自动布局算法
- [ ] 主题和样式预设

## 📄 License

MIT License

---

**Made with ❤️ using Claude AI and Draw.io**