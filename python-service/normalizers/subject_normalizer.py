from typing import List, Dict, Any

class SubjectNormalizer:
    @staticmethod
    def normalize(raw_subject: str, subject_mappings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Maps raw subject using dynamic database subject mapping list.
        subject_mappings is a list of dicts: [{'external_code', 'subject_id', 'subject_name'}]
        """
        raw_clean = raw_subject.upper().strip()
        
        # Match from dynamic database list
        for mapping in subject_mappings:
            if mapping.get("external_code", "").upper().strip() == raw_clean:
                return {
                    "subject_id": mapping.get("subject_id"),
                    "subject_name": mapping.get("subject_name"),
                    "normalized_code": mapping.get("external_code")
                }
                
        # Default fallback standard dictionary if dynamic maps are unseeded
        STANDARD_MAPS = {
            "CIV": "CIVICS", "HIST": "HISTORY", "GEO": "GEOGRAPHY", "KISW": "KISWAHILI", "ENGL": "ENGLISH LANGUAGE",
            "BIO": "BIOLOGY", "B/MATH": "BASIC MATHEMATICS", "CHEM": "CHEMISTRY", "PHYS": "PHYSICS",
            "COMM": "COMMERCE", "B/KEEPING": "BOOK KEEPING"
        }
        
        return {
            "subject_id": None,
            "subject_name": STANDARD_MAPS.get(raw_clean, raw_clean),
            "normalized_code": raw_clean
        }
