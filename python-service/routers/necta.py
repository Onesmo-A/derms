from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

try:
    from services.scraper import NectaScraper
    from services.normalizer import NectaNormalizer
    from services.comparator import NectaComparator
except ImportError:
    from ..services.scraper import NectaScraper
    from ..services.normalizer import NectaNormalizer
    from ..services.comparator import NectaComparator

router = APIRouter(prefix="/api/necta", tags=["NECTA"])
scraper = NectaScraper()
normalizer = NectaNormalizer()
comparator = NectaComparator()

class ScrapeRequest(BaseModel):
    exam_type: str
    year: int
    centre_number: str
    database_subjects: List[Dict[str, Any]]

class CompareRequest(BaseModel):
    necta_candidates: List[Dict[str, Any]]
    db_candidates: List[Dict[str, Any]]

@router.get("/years")
def get_years(exam_type: str = Query(..., description="Exam type, e.g. CSEE, ACSEE")):
    try:
        years = scraper.discover_years(exam_type)
        return {"exam_type": exam_type, "years": years}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/centres")
def get_centres(
    exam_type: str = Query(..., description="Exam type, e.g. CSEE"),
    year: int = Query(..., description="Academic year")
):
    try:
        centres = scraper.discover_centres(exam_type, year)
        return {"exam_type": exam_type, "year": year, "centres": centres}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scrape-centre")
def scrape_centre(request: ScrapeRequest):
    try:
        raw_result = scraper.scrape_centre(request.exam_type, request.year, request.centre_number)
        
        # Normalize each candidate
        normalized_candidates = []
        for cand in raw_result.get("candidates", []):
            norm_cand = normalizer.normalize_candidate(cand, request.database_subjects)
            normalized_candidates.append(norm_cand)
            
        return {
            "centre_number": raw_result.get("centre_number"),
            "school_name": raw_result.get("school_name"),
            "candidates": normalized_candidates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare")
def compare_results(request: CompareRequest):
    try:
        report = comparator.compare(request.necta_candidates, request.db_candidates)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
