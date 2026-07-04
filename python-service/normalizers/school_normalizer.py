from typing import List, Dict, Any, Optional

class SchoolNormalizer:
    @staticmethod
    def map_centre_to_school(centre_code: str, school_mappings: List[Dict[str, Any]]) -> Optional[str]:
        """
        Maps a centre code to school_id using dynamic database mapping list.
        """
        code_clean = centre_code.upper().strip()
        for mapping in school_mappings:
            if mapping.get("centre_code", "").upper().strip() == code_clean:
                return mapping.get("school_id")
        return None
