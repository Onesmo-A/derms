from typing import List, Dict, Any

class CandidateComparator:
    @staticmethod
    def compare(staged: List[Dict[str, Any]], db: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        staged: List of normalized staged candidates.
        db: List of DB candidates: [{'exam_number', 'student_name'}]
        """
        staged_cands = {c["candidate_number"]: c for c in staged}
        db_cands = {c["exam_number"]: c for c in db}
        
        missing_in_db = []
        missing_in_staged = []
        matches = []
        
        for cno, cand in staged_cands.items():
            if cno not in db_cands:
                missing_in_db.append({
                    "candidate_number": cno,
                    "gender": cand.get("gender"),
                    "division": cand.get("division"),
                    "points": cand.get("points")
                })
            else:
                matches.append(cno)
                
        for cno, cand in db_cands.items():
            if cno not in staged_cands:
                missing_in_staged.append({
                    "candidate_number": cno,
                    "student_name": cand.get("student_name")
                })
                
        return {
            "matches": matches,
            "missing_in_db": missing_in_db,
            "missing_in_staged": missing_in_staged
        }
