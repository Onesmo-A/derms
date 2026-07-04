import re
from typing import Dict, Any

class CandidateNormalizer:
    @staticmethod
    def clean_candidate_number(raw_cno: str) -> str:
        # Standard format: S0101/0001
        clean = raw_cno.upper().replace(" ", "").strip()
        return clean
