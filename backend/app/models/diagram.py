from sqlalchemy import Column, String, Text, DateTime, Enum
from datetime import datetime
import enum
from app.core.database import Base


class DiagramTypeEnum(str, enum.Enum):
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


class DiagramFormatEnum(str, enum.Enum):
    MERMAID = "mermaid"
    DRAWIO = "drawio"


class AIProviderEnum(str, enum.Enum):
    CLAUDE = "claude"
    OPENAI = "openai"


class Diagram(Base):
    __tablename__ = "diagrams"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(Enum(DiagramTypeEnum), nullable=False)
    format = Column(Enum(DiagramFormatEnum), nullable=False, default=DiagramFormatEnum.MERMAID)  # 新增: 图表格式
    code = Column(Text, nullable=False)  # Mermaid code or Draw.io XML
    ai_provider = Column(Enum(AIProviderEnum), nullable=True)
    ai_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)