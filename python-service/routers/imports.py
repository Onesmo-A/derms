from fastapi import APIRouter, HTTPException, Query
from schemas.request_models import ImportRequestModel
from schemas.response_models import ImportResponseModel
from services.import_service import ImportService
from adapters.registry import adapter_registry
import time

router = APIRouter(prefix="/api/v1/imports", tags=["Imports"])
import_service = ImportService()

@router.get("/years")
def get_discovered_years(
    source: str = Query(..., description="External source name, e.g. NECTA"),
    exam_type: str = Query(..., description="Exam type")
):
    try:
        adapter = adapter_registry.get_adapter(source)
        years = adapter.discover_years(exam_type)
        return {"source_system": source, "exam_type": exam_type, "years": years}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/centres")
def get_discovered_centres(
    source: str = Query(..., description="External source, e.g. NECTA"),
    exam_type: str = Query(..., description="Exam type"),
    year: int = Query(..., description="Year")
):
    try:
        adapter = adapter_registry.get_adapter(source)
        centres = adapter.discover_centres(exam_type, year)
        return {"source_system": source, "exam_type": exam_type, "year": year, "centres": centres}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-centre", response_model=ImportResponseModel)
def process_centre_import(request: ImportRequestModel):
    try:
        start_time = time.time()
        context = {
            "source_system": request.source_system,
            "exam_type": request.exam_type,
            "year": request.year,
            "centre_number": request.centre_number,
            "subject_mappings": request.subject_mappings
        }
        payload = import_service.run_import(context)
        
        # Telemetry parsing
        from monitoring.metrics import metrics_collector
        elapsed = time.time() - start_time
        metrics_collector.record_parse(len(payload.get("candidates", [])), elapsed)
        
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
