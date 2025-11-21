from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class DiagramType(str, Enum):
    FLOWCHART = "flowchart"
    ARCHITECTURE = "architecture"
    SEQUENCE = "sequence"
    GANTT = "gantt"
    SWIMLANE = "swimlane"
    ER = "er"
    CLASS = "class"
    STATE = "state"
    MINDMAP = "mindmap"
    ROADMAP = "roadmap"


class DiagramFormat(str, Enum):
    MERMAID = "mermaid"
    DRAWIO = "drawio"


class AIProvider(str, Enum):
    CLAUDE = "claude"
    OPENAI = "openai"
    DEEPSEEK = "deepseek"


class DiagramBase(BaseModel):
    title: str
    type: DiagramType
    format: DiagramFormat = DiagramFormat.DRAWIO  # Default to Draw.io format
    code: str
    ai_provider: Optional[AIProvider] = None
    ai_prompt: Optional[str] = None


class DiagramCreate(DiagramBase):
    pass


class DiagramUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    format: Optional[DiagramFormat] = None  # 新增: 允许更新格式


class DiagramResponse(DiagramBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GenerateDiagramRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)
    diagramType: DiagramType
    format: DiagramFormat = DiagramFormat.DRAWIO  # Default to Draw.io format
    aiProvider: AIProvider
    style: Optional[str] = None


class GenerateDiagramResponse(BaseModel):
    code: str
    explanation: Optional[str] = None


class RefineDiagramRequest(BaseModel):
    code: str
    format: DiagramFormat  # 新增: 图表格式
    instruction: str = Field(..., min_length=1, max_length=500)
    aiProvider: AIProvider


class ExplainDiagramRequest(BaseModel):
    code: str
    format: DiagramFormat  # 新增: 图表格式
    aiProvider: AIProvider


class ExplainDiagramResponse(BaseModel):
    explanation: str


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    diagramType: DiagramType
    format: DiagramFormat = DiagramFormat.DRAWIO
    aiProvider: AIProvider
    style: Optional[str] = None