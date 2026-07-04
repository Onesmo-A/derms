from typing import Dict, Any, List

class NectaNormalizer:
    # Standard mapping for common NECTA abbreviations
    SUBJECT_MAP = {
        "CIV": {"name": "CIVICS", "code": "CIV"},
        "HIST": {"name": "HISTORY", "code": "HIST"},
        "GEO": {"name": "GEOGRAPHY", "code": "GEO"},
        "KISW": {"name": "KISWAHILI", "code": "KISW"},
        "ENGL": {"name": "ENGLISH LANGUAGE", "code": "ENGL"},
        "LIT ENG": {"name": "LITERATURE IN ENGLISH", "code": "LITENG"},
        "BIO": {"name": "BIOLOGY", "code": "BIO"},
        "B/MATH": {"name": "BASIC MATHEMATICS", "code": "MATH"},
        "CHEM": {"name": "CHEMISTRY", "code": "CHEM"},
        "PHYS": {"name": "PHYSICS", "code": "PHYS"},
        "COMM": {"name": "COMMERCE", "code": "COMM"},
        "B/KEEPING": {"name": "BOOK KEEPING", "code": "BKP"},
        "B/KEEP": {"name": "BOOK KEEPING", "code": "BKP"},
        "AGRI": {"name": "AGRICULTURE", "code": "AGR"},
        "ISL": {"name": "ISLAMIC KNOWLEDGE", "code": "ISL"},
        "BIBLE": {"name": "BIBLE KNOWLEDGE", "code": "BIB"},
        "COMP": {"name": "COMPUTER STUDIES", "code": "COMP"},
    }

    GRADE_POINTS = {
        "A": 1,
        "B": 2,
        "C": 3,
        "D": 4,
        "F": 5,
        "S": 5,
        "X": 0
    }

    def normalize_subject_name(self, raw_subject: str) -> str:
        raw_upper = raw_subject.upper().strip()
        if raw_upper in self.SUBJECT_MAP:
            return self.SUBJECT_MAP[raw_upper]["name"]
        return raw_upper

    def normalize_subject_code(self, raw_subject: str) -> str:
        raw_upper = raw_subject.upper().strip()
        if raw_upper in self.SUBJECT_MAP:
            return self.SUBJECT_MAP[raw_upper]["code"]
        return raw_upper

    def calculate_points(self, grade: str) -> int:
        return self.GRADE_POINTS.get(grade.upper().strip(), 5)

    def normalize_candidate(self, candidate: Dict[str, Any], database_subjects: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Normalizes a candidate's grades and subject maps.
        database_subjects is a list of subject dicts from Laravel containing {'id', 'name', 'code'}
        """
        raw_subjects = candidate.get("raw_subjects", {})
        normalized_subjects = []
        
        # Match database subjects
        for raw_sub_code, raw_grade in raw_subjects.items():
            norm_name = self.normalize_subject_name(raw_sub_code)
            norm_code = self.normalize_subject_code(raw_sub_code)
            
            # Find subject in database list
            matched_subject_id = None
            for db_sub in database_subjects:
                # Match by exact name or code
                db_name_upper = db_sub.get("name", "").upper()
                db_code_upper = db_sub.get("code", "").upper()
                if (norm_name == db_name_upper) or (norm_code == db_code_upper) or (raw_sub_code.upper().strip() == db_code_upper):
                    matched_subject_id = db_sub.get("id")
                    norm_name = db_sub.get("name") # Use official DB name
                    break
                    
            normalized_subjects.append({
                "subject_id": matched_subject_id,
                "subject_name": norm_name,
                "raw_subject_code": raw_sub_code,
                "grade": raw_grade.upper(),
                "points": self.calculate_points(raw_grade)
            })
            
        return {
            "candidate_number": candidate.get("candidate_number"),
            "gender": candidate.get("gender"),
            "division": candidate.get("division"),
            "points": candidate.get("points"),
            "raw_subjects": raw_subjects,
            "normalized_subjects": normalized_subjects
        }
