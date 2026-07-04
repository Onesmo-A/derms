from comparators.candidate_comparator import CandidateComparator
from comparators.marks_comparator import MarksComparator
from comparators.summary_comparator import SummaryComparator
from typing import List, Dict, Any

class ComparisonService:
    def __init__(self):
        self.candidate_comparator = CandidateComparator()
        self.marks_comparator = MarksComparator()
        self.summary_comparator = SummaryComparator()

    def run_comparison(self, staged_candidates: List[Dict[str, Any]], db_candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
        cand_report = self.candidate_comparator.compare(staged_candidates, db_candidates)
        
        staged_map = {c["candidate_number"]: c for c in staged_candidates}
        db_map = {c["exam_number"]: c for c in db_candidates}
        
        grade_mismatches = []
        div_mismatches = []
        
        for cno in cand_report["matches"]:
            staged_c = staged_map[cno]
            db_c = db_map[cno]
            
            # Compare division
            if staged_c.get("division") != db_c.get("division"):
                div_mismatches.append({
                    "candidate_number": cno,
                    "student_name": db_c.get("student_name"),
                    "staged_division": staged_c.get("division"),
                    "db_division": db_c.get("division")
                })
                
            # Compare grades
            mismatches = self.marks_comparator.compare_grades(staged_c.get("subjects", []), db_c.get("marks", []))
            if mismatches:
                grade_mismatches.append({
                    "candidate_number": cno,
                    "student_name": db_c.get("student_name"),
                    "mismatches": mismatches
                })
                
        return {
            "summary": {
                "total_staged": len(staged_candidates),
                "total_db": len(db_candidates),
                "matches": len(cand_report["matches"]),
                "missing_in_db_count": len(cand_report["missing_in_db"]),
                "missing_in_staged_count": len(cand_report["missing_in_staged"]),
                "division_mismatches_count": len(div_mismatches),
                "grade_mismatches_count": len(grade_mismatches)
            },
            "missing_in_db": cand_report["missing_in_db"],
            "missing_in_staged": cand_report["missing_in_staged"],
            "division_mismatches": div_mismatches,
            "grade_mismatches": grade_mismatches
        }
