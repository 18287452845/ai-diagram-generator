import os
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.diagram import DiagramType, DiagramFormat


class DeepSeekService:
    def __init__(self):
        self._client = None
        self.model = "deepseek-reasoner"  # DeepSeek R1 model
        self.base_url = settings.DEEPSEEK_BASE_URL  # Base URL from config, can be overridden

    @property
    def client(self):
        """Lazy initialization of DeepSeek client"""
        if self._client is None:
            api_key = settings.DEEPSEEK_API_KEY or os.environ.get("DEEPSEEK_API_KEY")
            if not api_key:
                raise ValueError("DEEPSEEK_API_KEY is not set")
            self._client = AsyncOpenAI(
                api_key=api_key,
                base_url=self.base_url
            )
        return self._client

    def _get_system_prompt(self, diagram_type: DiagramType, diagram_format: DiagramFormat = DiagramFormat.MERMAID) -> str:
        """Get system prompt based on diagram type and format"""
        if diagram_format == DiagramFormat.DRAWIO:
            return self._get_drawio_prompt(diagram_type)
        else:
            return self._get_mermaid_prompt(diagram_type)

    def _get_mermaid_prompt(self, diagram_type: DiagramType) -> str:
        """Get Mermaid-specific prompts"""
        prompts = {
            DiagramType.FLOWCHART: """
你是一个专业的流程图设计专家。用户会描述一个流程，你需要生成Mermaid flowchart代码。
要求：
- 使用清晰的节点标签
- 合理使用不同形状（方框、菱形、圆角等）
- 标注清晰的流向
- 代码要规范、可运行
只返回Mermaid代码，不要有其他解释。
""",
            DiagramType.ARCHITECTURE: """
你是一个系统架构师。用户会描述一个系统，你需要生成Mermaid flowchart代码来展示系统架构。
要求：
- 使用subgraph组织不同层次（前端、后端、数据层等）
- 明确标注技术栈和组件
- 显示数据流向和依赖关系
只返回Mermaid代码，不要有其他解释。
""",
            DiagramType.SEQUENCE: """
你是UML时序图专家。用户会描述交互过程，你需要生成Mermaid sequence diagram代码。
要求：
- 明确参与者（Actor/System/Service）
- 按时间顺序展示交互
- 标注关键的返回值
只返回Mermaid代码，不要有其他解释。
""",
            DiagramType.ER: """
你是数据库设计专家。用户会描述数据模型，你需要生成Mermaid ER diagram代码。
要求：
- 定义清晰的实体和属性
- 标注主键（PK）和外键（FK）
- 明确关系类型（一对一、一对多、多对多）
- 使用规范的实体关系表示法
只返回Mermaid代码，不要有其他解释。
""",
            DiagramType.GANTT: """
你是项目管理专家。用户会描述项目任务，你需要生成Mermaid gantt图代码。
要求：
- 合理划分任务和时间段
- 标注任务依赖关系
- 使用section组织任务组
- 时间安排要合理
只返回Mermaid代码，不要有其他解释。
""",
            DiagramType.CLASS: """
你是软件架构师。用户会描述类结构，你需要生成Mermaid class diagram代码。
要求：
- 定义类的属性和方法
- 标注访问修饰符（+public, -private, #protected）
- 明确类之间的关系（继承、实现、组合、聚合）
- 使用规范的UML类图表示法
只返回Mermaid代码，不要有其他解释。
""",
            DiagramType.STATE: """
你是状态机设计专家。用户会描述状态转换，你需要生成Mermaid state diagram代码。
要求：
- 定义所有状态
- 明确状态转换条件
- 标注起始和结束状态
- 包含复合状态（如需要）
只返回Mermaid代码，不要有其他解释。
""",
        }

        return prompts.get(
            diagram_type,
            "你是Mermaid图表专家，根据用户描述生成相应的Mermaid代码。只返回代码，不要有其他解释。",
        )

    def _get_drawio_prompt(self, diagram_type: DiagramType) -> str:
        """Get Draw.io-specific prompts"""
        base_prompt = """
你是专业的图表设计专家。用户会用自然语言描述需求，你需要生成Draw.io XML格式的图表代码。

Draw.io XML格式要求：
- 使用标准的mxfile结构
- 每个图形元素都是一个mxCell，需要唯一的ID
- 使用mxGeometry定义位置和大小（x, y, width, height）
- 使用style属性定义样式（颜色、形状、边框等）
- 连接线使用edge元素，通过source和target属性指定起点和终点节点的ID

基本模板：
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="AIService" version="21.0.0">
  <diagram name="Diagram" id="diagram-1">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- 图形元素从 id=2 开始 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

重要规则：
1. 节点ID必须唯一，从2开始递增
2. 合理布局：节点垂直间距80-120像素，水平间距150-200像素
3. 颜色搭配协调：使用fillColor和strokeColor
4. 节点大小合适：一般width=120, height=60
5. 连接线使用edgeStyle=orthogonalEdgeStyle保持正交

"""
        type_specific = {
            DiagramType.FLOWCHART: """
流程图要求：
- 开始/结束：ellipse形状，fillColor=#d5e8d4，strokeColor=#82b366
- 处理步骤：rounded=0矩形，fillColor=#dae8fc，strokeColor=#6c8ebf
- 决策节点：rhombus形状，fillColor=#fff2cc，strokeColor=#d6b656
- 连接线：使用endArrow=classic表示方向

节点示例：
<mxCell id="2" value="开始" style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
  <mxGeometry x="300" y="50" width="120" height="60" as="geometry" />
</mxCell>

决策节点示例：
<mxCell id="3" value="是否通过?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
  <mxGeometry x="275" y="150" width="150" height="80" as="geometry" />
</mxCell>

连接示例：
<mxCell id="4" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;endArrow=classic;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry" />
</mxCell>

带标签的连接：
<mxCell id="5" value="是" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;endArrow=classic;" edge="1" parent="1" source="3" target="6">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
""",
            DiagramType.ARCHITECTURE: """
架构图要求：
- 数据库：shape=cylinder3，fillColor=#f8cecc，strokeColor=#b85450
- 服务/组件：rounded=1矩形，fillColor=#dae8fc，strokeColor=#6c8ebf
- 外部系统：shape=hexagon，fillColor=#e1d5e7，strokeColor=#9673a6
- 使用分层布局：上层是用户界面，中层是服务层，下层是数据层
- 使用箭头显示数据流向和依赖关系

数据库示例：
<mxCell id="10" value="MySQL\nDatabase" style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;boundedLbl=1;backgroundOutline=1;size=15;" vertex="1" parent="1">
  <mxGeometry x="300" y="400" width="120" height="80" as="geometry" />
</mxCell>
""",
            DiagramType.SEQUENCE: """
时序图要求：
- 参与者：shape=umlActor或矩形，fillColor=#dae8fc
- 生命线：垂直虚线
- 消息：使用箭头连接，value属性标注消息内容
- 按时间顺序从上到下排列
- 参与者水平间距200像素，消息垂直间距80像素
""",
            DiagramType.ER: """
ER图要求：
- 实体：矩形，fillColor=#dae8fc，strokeColor=#6c8ebf
- 属性：椭圆形，fillColor=#d5e8d4
- 在实体内部列出属性（用<br>分隔）
- 关系：使用菱形或直接连线
- 标注关系类型（1:1, 1:N, N:M）

实体示例：
<mxCell id="20" value="用户<br>---<br>ID (PK)<br>姓名<br>邮箱" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;align=left;verticalAlign=top;" vertex="1" parent="1">
  <mxGeometry x="200" y="100" width="120" height="100" as="geometry" />
</mxCell>
""",
        }

        return base_prompt + type_specific.get(diagram_type, "请根据用户描述生成合适的Draw.io XML代码。") + "\n\n只返回完整的XML代码，不要有markdown代码块标记，不要有其他解释。直接以<?xml开头。"

    async def generate_diagram(self, description: str, diagram_type: DiagramType, diagram_format: DiagramFormat = DiagramFormat.MERMAID) -> str:
        """Generate diagram code using DeepSeek R1"""
        system_prompt = self._get_system_prompt(diagram_type, diagram_format)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": description},
            ],
            max_tokens=4000,
        )

        code = response.choices[0].message.content

        # Clean up code blocks if present
        if "```" in code:
            parts = code.split("```")
            if len(parts) >= 3:
                code = parts[1]
                # Remove language identifier
                if code.startswith("mermaid\n"):
                    code = code[8:]
                elif code.startswith("xml\n"):
                    code = code[4:]
                elif code.startswith("mermaid"):
                    code = code[7:]
                elif code.startswith("xml"):
                    code = code[3:]

        # For Draw.io XML, ensure it starts with <?xml
        code = code.strip()
        if diagram_format == DiagramFormat.DRAWIO and not code.startswith("<?xml"):
            # Try to find the XML declaration
            xml_start = code.find("<?xml")
            if xml_start > 0:
                code = code[xml_start:]

        return code

    async def refine_diagram(self, code: str, instruction: str, diagram_format: DiagramFormat = DiagramFormat.MERMAID) -> str:
        """Refine existing diagram with instruction"""
        format_name = "Mermaid" if diagram_format == DiagramFormat.MERMAID else "Draw.io XML"
        prompt = f"""
现有的{format_name}代码：
```
{code}
```

修改要求：{instruction}

请修改上面的{format_name}代码以满足要求。只返回修改后的完整代码，不要有其他解释。
"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4000,
        )

        code = response.choices[0].message.content
        if "```" in code:
            parts = code.split("```")
            if len(parts) >= 3:
                code = parts[1]
                if code.startswith("mermaid") or code.startswith("xml"):
                    code = code.split("\n", 1)[1] if "\n" in code else code
        return code.strip()

    async def explain_diagram(self, code: str, diagram_format: DiagramFormat = DiagramFormat.MERMAID) -> str:
        """Explain diagram in natural language"""
        format_name = "Mermaid" if diagram_format == DiagramFormat.MERMAID else "Draw.io XML"
        prompt = f"""
请用中文解释这个{format_name}图表的内容和结构：

```
{code}
```

用简洁清晰的语言描述图表表达的信息。
"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
        )

        return response.choices[0].message.content


deepseek_service = DeepSeekService()
