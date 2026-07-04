from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ImportResponseModel(BaseModel):
    centre_number: str
    school_name: str
    candidates: List[Dict[str, Any]]
    summary: Dict[str, Any]
    analysis: Dict[str, Any]
    errors: List[str]
    warnings: List[str]
