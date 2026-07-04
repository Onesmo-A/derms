from typing import List, Dict, Any

class MarksComparator:
    @staticmethod
    def compare_grades(staged_subjects: List[Dict[str, Any]], db_marks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        staged_subjects: [{'subject_code', 'grade'}]
        db_marks: [{'subject_code', 'grade'}]
        """
        staged_map = {s["subject_code"]: s["grade"] for s in staged_subjects}
        db_map = {m["subject_code"]: m["grade"] for m in db_marks}
        
        mismatches = []
        for code, grade in staged_map.items():
            if code in db_map and grade != db_map[code]:
                mismatches.append({
                    "subject_code": code,
                    "staged_grade": grade,
                    "db_grade": db_map[code]
                })
        return mismatches
