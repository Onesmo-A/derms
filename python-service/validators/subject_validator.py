from typing import List, Dict, Any

class SubjectValidator:
    @staticmethod
    def validate_marks(subjects: List[Dict[str, Any]]) -> List[str]:
        warnings = []
        valid_grades = {"A", "B", "C", "D", "F", "S", "X"}
        for s in subjects:
            grade = s.get("grade", "").upper().strip()
            if grade not in valid_grades:
                warnings.append(f"Invalid grade value detected: {grade} on subject {s.get('subject_name')}")
        return warnings
