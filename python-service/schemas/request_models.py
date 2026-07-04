from pydantic import BaseModel
from typing import List, Dict, Any

class ImportRequestModel(BaseModel):
    source_system: str
    exam_type: str
    year: int
    centre_number: str
    subject_mappings: List[Dict[str, Any]]
