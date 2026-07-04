from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.comparison_service import ComparisonService
from typing import List, Dict, Any

router = APIRouter(prefix="/api/v1/comparisons", tags=["Comparisons"])
comparison_service = ComparisonService()

class CompareRequest(BaseModel):
    staged_candidates: List[Dict[str, Any]]
    db_candidates: List[Dict[str, Any]]

@router.post("")
def compare_external_results(request: CompareRequest):
    try:
        report = comparison_service.run_comparison(request.staged_candidates, request.db_candidates)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
