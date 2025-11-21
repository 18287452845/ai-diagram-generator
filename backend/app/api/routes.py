from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os

from app.core.database import get_db
from app.models.diagram import Diagram
from app.schemas.diagram import (
    DiagramCreate,
    DiagramUpdate,
    DiagramResponse,
    GenerateDiagramRequest,
    GenerateDiagramResponse,
    RefineDiagramRequest,
    ExplainDiagramRequest,
    ExplainDiagramResponse,
    AIProvider,
)
from app.services.ai.claude_service import claude_service
from app.services.ai.openai_service import openai_service
from app.services.ai.deepseek_service import deepseek_service
from app.services.export_service import export_service
from app.core.config import settings

router = APIRouter()


def get_api_keys_from_request(request: Request) -> dict:
    """Extract API keys from request headers or use server defaults"""
    return {
        'anthropic': request.headers.get('X-Anthropic-Key') or settings.ANTHROPIC_API_KEY,
        'openai': request.headers.get('X-OpenAI-Key') or settings.OPENAI_API_KEY,
        'deepseek': request.headers.get('X-DeepSeek-Key') or settings.DEEPSEEK_API_KEY,
    }


def get_api_base_urls_from_request(request: Request) -> dict:
    """Extract API base URLs from request headers"""
    return {
        'anthropic': request.headers.get('X-Anthropic-Base-Url'),
        'openai': request.headers.get('X-OpenAI-Base-Url'),
        'deepseek': request.headers.get('X-DeepSeek-Base-Url'),
    }


def set_service_api_key(service, provider: AIProvider, api_keys: dict, base_urls: dict):
    """Temporarily set API key and base URL for a service if client-side values are provided"""
    if provider == AIProvider.CLAUDE and api_keys['anthropic']:
        # Temporarily override the API key
        original_key = os.environ.get('ANTHROPIC_API_KEY')
        os.environ['ANTHROPIC_API_KEY'] = api_keys['anthropic']
        settings.ANTHROPIC_API_KEY = api_keys['anthropic']
        # Reset client to use new key
        service._client = None
        return original_key
    elif provider == AIProvider.OPENAI and api_keys['openai']:
        original_key = os.environ.get('OPENAI_API_KEY')
        os.environ['OPENAI_API_KEY'] = api_keys['openai']
        settings.OPENAI_API_KEY = api_keys['openai']
        service._client = None
        return original_key
    elif provider == AIProvider.DEEPSEEK and api_keys['deepseek']:
        original_key = os.environ.get('DEEPSEEK_API_KEY')
        os.environ['DEEPSEEK_API_KEY'] = api_keys['deepseek']
        settings.DEEPSEEK_API_KEY = api_keys['deepseek']
        service._client = None
        return original_key
    return None


def set_service_base_url(service, provider: AIProvider, base_urls: dict):
    """Set custom base URL for a service if provided"""
    if provider == AIProvider.CLAUDE and base_urls.get('anthropic'):
        service.base_url = base_urls['anthropic']
    elif provider == AIProvider.OPENAI and base_urls.get('openai'):
        service.base_url = base_urls['openai']
    elif provider == AIProvider.DEEPSEEK and base_urls.get('deepseek'):
        service.base_url = base_urls['deepseek']


# AI Generation endpoints
@router.post("/ai/generate", response_model=GenerateDiagramResponse)
async def generate_diagram(request: GenerateDiagramRequest, http_request: Request):
    """Generate diagram using AI"""
    api_keys = get_api_keys_from_request(http_request)
    base_urls = get_api_base_urls_from_request(http_request)

    try:
        if request.aiProvider == AIProvider.CLAUDE:
            set_service_base_url(claude_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(claude_service, request.aiProvider, api_keys, base_urls)
            code = await claude_service.generate_diagram(
                request.description, request.diagramType, request.format
            )
            # Restore original key if it was temporarily changed
            if original_key is not None:
                os.environ['ANTHROPIC_API_KEY'] = original_key
                settings.ANTHROPIC_API_KEY = original_key
                claude_service._client = None
        elif request.aiProvider == AIProvider.DEEPSEEK:
            set_service_base_url(deepseek_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(deepseek_service, request.aiProvider, api_keys, base_urls)
            code = await deepseek_service.generate_diagram(
                request.description, request.diagramType, request.format
            )
            if original_key is not None:
                os.environ['DEEPSEEK_API_KEY'] = original_key
                settings.DEEPSEEK_API_KEY = original_key
                deepseek_service._client = None
        else:
            set_service_base_url(openai_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(openai_service, request.aiProvider, api_keys, base_urls)
            code = await openai_service.generate_diagram(
                request.description, request.diagramType, request.format
            )
            if original_key is not None:
                os.environ['OPENAI_API_KEY'] = original_key
                settings.OPENAI_API_KEY = original_key
                openai_service._client = None

        return GenerateDiagramResponse(code=code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/ai/refine", response_model=GenerateDiagramResponse)
async def refine_diagram(request: RefineDiagramRequest, http_request: Request):
    """Refine existing diagram with instruction"""
    api_keys = get_api_keys_from_request(http_request)
    base_urls = get_api_base_urls_from_request(http_request)

    try:
        if request.aiProvider == AIProvider.CLAUDE:
            set_service_base_url(claude_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(claude_service, request.aiProvider, api_keys, base_urls)
            code = await claude_service.refine_diagram(request.code, request.instruction, request.format)
            if original_key is not None:
                os.environ['ANTHROPIC_API_KEY'] = original_key
                settings.ANTHROPIC_API_KEY = original_key
                claude_service._client = None
        elif request.aiProvider == AIProvider.DEEPSEEK:
            set_service_base_url(deepseek_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(deepseek_service, request.aiProvider, api_keys, base_urls)
            code = await deepseek_service.refine_diagram(request.code, request.instruction, request.format)
            if original_key is not None:
                os.environ['DEEPSEEK_API_KEY'] = original_key
                settings.DEEPSEEK_API_KEY = original_key
                deepseek_service._client = None
        else:
            set_service_base_url(openai_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(openai_service, request.aiProvider, api_keys, base_urls)
            code = await openai_service.refine_diagram(request.code, request.instruction, request.format)
            if original_key is not None:
                os.environ['OPENAI_API_KEY'] = original_key
                settings.OPENAI_API_KEY = original_key
                openai_service._client = None

        return GenerateDiagramResponse(code=code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {str(e)}")


@router.post("/ai/explain", response_model=ExplainDiagramResponse)
async def explain_diagram(request: ExplainDiagramRequest, http_request: Request):
    """Explain diagram in natural language"""
    api_keys = get_api_keys_from_request(http_request)
    base_urls = get_api_base_urls_from_request(http_request)

    try:
        if request.aiProvider == AIProvider.CLAUDE:
            set_service_base_url(claude_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(claude_service, request.aiProvider, api_keys, base_urls)
            explanation = await claude_service.explain_diagram(request.code, request.format)
            if original_key is not None:
                os.environ['ANTHROPIC_API_KEY'] = original_key
                settings.ANTHROPIC_API_KEY = original_key
                claude_service._client = None
        elif request.aiProvider == AIProvider.DEEPSEEK:
            set_service_base_url(deepseek_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(deepseek_service, request.aiProvider, api_keys, base_urls)
            explanation = await deepseek_service.explain_diagram(request.code, request.format)
            if original_key is not None:
                os.environ['DEEPSEEK_API_KEY'] = original_key
                settings.DEEPSEEK_API_KEY = original_key
                deepseek_service._client = None
        else:
            set_service_base_url(openai_service, request.aiProvider, base_urls)
            original_key = set_service_api_key(openai_service, request.aiProvider, api_keys, base_urls)
            explanation = await openai_service.explain_diagram(request.code, request.format)
            if original_key is not None:
                os.environ['OPENAI_API_KEY'] = original_key
                settings.OPENAI_API_KEY = original_key
                openai_service._client = None

        return ExplainDiagramResponse(explanation=explanation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")


# CRUD endpoints for diagrams
@router.get("/diagrams", response_model=List[DiagramResponse])
def get_diagrams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all diagrams"""
    diagrams = db.query(Diagram).offset(skip).limit(limit).all()
    return diagrams


@router.get("/diagrams/{diagram_id}", response_model=DiagramResponse)
def get_diagram(diagram_id: str, db: Session = Depends(get_db)):
    """Get diagram by ID"""
    diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return diagram


@router.post("/diagrams", response_model=DiagramResponse)
def create_diagram(diagram: DiagramCreate, db: Session = Depends(get_db)):
    """Create new diagram"""
    db_diagram = Diagram(
        id=str(uuid.uuid4()),
        title=diagram.title,
        type=diagram.type,
        format=diagram.format,
        code=diagram.code,
        ai_provider=diagram.ai_provider,
        ai_prompt=diagram.ai_prompt,
    )
    db.add(db_diagram)
    db.commit()
    db.refresh(db_diagram)
    return db_diagram


@router.put("/diagrams/{diagram_id}", response_model=DiagramResponse)
def update_diagram(
    diagram_id: str, diagram: DiagramUpdate, db: Session = Depends(get_db)
):
    """Update diagram"""
    db_diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not db_diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")

    if diagram.title is not None:
        db_diagram.title = diagram.title
    if diagram.code is not None:
        db_diagram.code = diagram.code
    if diagram.format is not None:
        db_diagram.format = diagram.format

    db.commit()
    db.refresh(db_diagram)
    return db_diagram


@router.delete("/diagrams/{diagram_id}")
def delete_diagram(diagram_id: str, db: Session = Depends(get_db)):
    """Delete diagram"""
    db_diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not db_diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")

    db.delete(db_diagram)
    db.commit()
    return {"message": "Diagram deleted successfully"}


# Export endpoints
@router.get("/diagrams/{diagram_id}/export")
async def export_diagram(
    diagram_id: str,
    format: str = "svg",
    db: Session = Depends(get_db)
):
    """Export diagram to various formats"""
    # Get diagram
    diagram = db.query(Diagram).filter(Diagram.id == diagram_id).first()
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not found")

    try:
        if format == "svg":
            data = await export_service.export_svg(diagram.code)
            media_type = "image/svg+xml"
            filename = f"{diagram.title}.svg"
        elif format == "png":
            data = await export_service.export_png(diagram.code)
            media_type = "image/png"
            filename = f"{diagram.title}.png"
        elif format == "pdf":
            data = await export_service.export_pdf(diagram.code)
            media_type = "application/pdf"
            filename = f"{diagram.title}.pdf"
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")

        return Response(
            content=data,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
