from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
import uuid

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

router = APIRouter()


# AI Generation endpoints
@router.post("/ai/generate", response_model=GenerateDiagramResponse)
async def generate_diagram(request: GenerateDiagramRequest):
    """Generate diagram using AI"""
    try:
        if request.aiProvider == AIProvider.CLAUDE:
            code = await claude_service.generate_diagram(
                request.description, request.diagramType, request.format
            )
        elif request.aiProvider == AIProvider.DEEPSEEK:
            code = await deepseek_service.generate_diagram(
                request.description, request.diagramType, request.format
            )
        else:
            code = await openai_service.generate_diagram(
                request.description, request.diagramType, request.format
            )

        return GenerateDiagramResponse(code=code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/ai/refine", response_model=GenerateDiagramResponse)
async def refine_diagram(request: RefineDiagramRequest):
    """Refine existing diagram with instruction"""
    try:
        if request.aiProvider == AIProvider.CLAUDE:
            code = await claude_service.refine_diagram(request.code, request.instruction, request.format)
        elif request.aiProvider == AIProvider.DEEPSEEK:
            code = await deepseek_service.refine_diagram(request.code, request.instruction, request.format)
        else:
            code = await openai_service.refine_diagram(request.code, request.instruction, request.format)

        return GenerateDiagramResponse(code=code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {str(e)}")


@router.post("/ai/explain", response_model=ExplainDiagramResponse)
async def explain_diagram(request: ExplainDiagramRequest):
    """Explain diagram in natural language"""
    try:
        if request.aiProvider == AIProvider.CLAUDE:
            explanation = await claude_service.explain_diagram(request.code, request.format)
        elif request.aiProvider == AIProvider.DEEPSEEK:
            explanation = await deepseek_service.explain_diagram(request.code, request.format)
        else:
            explanation = await openai_service.explain_diagram(request.code, request.format)

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