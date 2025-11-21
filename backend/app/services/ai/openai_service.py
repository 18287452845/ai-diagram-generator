from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.diagram import DiagramType, DiagramFormat


class OpenAIService:
    def __init__(self):
        self._client = None
        self.model = "gpt-4-turbo-preview"
        self.base_url = None  # Can be overridden for custom endpoints
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None:
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is not set")
            
            client_kwargs = {"api_key": settings.OPENAI_API_KEY}
            if self.base_url:
                client_kwargs["base_url"] = self.base_url
                
            self._client = AsyncOpenAI(**client_kwargs)
        return self._client

    def _get_system_prompt(self, diagram_type: DiagramType) -> str:
        """Get system prompt based on diagram type"""
        # Reuse the same prompts as Claude service
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
        }

        return prompts.get(
            diagram_type,
            "你是Mermaid图表专家，根据用户描述生成相应的Mermaid代码。只返回代码，不要有其他解释。",
        )

    async def generate_diagram(self, description: str, diagram_type: DiagramType, diagram_format: DiagramFormat = DiagramFormat.MERMAID) -> str:
        """Generate diagram code using OpenAI"""
        # OpenAI currently only supports Mermaid format well
        if diagram_format == DiagramFormat.DRAWIO:
            # For now, we'll still generate Mermaid and let the caller know
            # In future, this could be enhanced to support Draw.io
            pass

        system_prompt = self._get_system_prompt(diagram_type)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": description},
            ],
            max_tokens=2000,
        )

        code = response.choices[0].message.content
        # Clean up code blocks if present
        if "```" in code:
            code = code.split("```")[1]
            if code.startswith("mermaid"):
                code = code[7:]
        return code.strip()

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
            max_tokens=2000,
        )

        code = response.choices[0].message.content
        if "```" in code:
            code = code.split("```")[1]
            if code.startswith("mermaid"):
                code = code[7:]
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


openai_service = OpenAIService()