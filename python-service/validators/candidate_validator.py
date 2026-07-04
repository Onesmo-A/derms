from typing import List, Dict, Any

class CandidateValidator:
    @staticmethod
    def validate_candidates(candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
        errors = []
        warnings = []
        cands_seen = set()
        
        for cand in candidates:
            cno = cand.get("candidate_number")
            if not cno:
                errors.append("Candidate missing candidate number identification.")
                continue
            if cno in cands_seen:
                warnings.append(f"Duplicate candidate entry detected in staging payload: {cno}")
            cands_seen.add(cno)
            
            # Division check
            div = cand.get("division", "").upper()
            if div not in ["I", "II", "III", "IV", "0", "ABS"]:
                warnings.append(f"Unknown division classification: {div} for candidate {cno}")
                
        return {"errors": errors, "warnings": warnings}
