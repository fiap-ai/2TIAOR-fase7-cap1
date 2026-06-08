"""Symptom knowledge base endpoint — Phase 2 data."""

from fastapi import APIRouter

from src.data.knowledge import load_knowledge_map, search_symptoms

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


@router.get("/knowledge")
async def get_knowledge_map():
    """Return the full symptom-disease knowledge map."""
    entries = load_knowledge_map()
    return {"entries": entries, "count": len(entries)}


@router.get("/search")
async def search(q: str = ""):
    """Search the knowledge map by symptom or disease name."""
    if not q:
        return {"results": [], "count": 0}
    results = search_symptoms(q)
    return {"results": results, "count": len(results)}
