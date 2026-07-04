from typing import List, Dict, Any

class NectaComparator:
    def compare(self, necta_candidates: List[Dict[str, Any]], db_candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compares NECTA scraped candidates with existing DB records.
        db_candidates format: List[dict] containing:
          - exam_number (candidate_number)
          - student_name
          - division
          - division_points (points)
          - marks: List[dict] of {'subject_code', 'grade'}
        """
        db_map = {c["exam_number"]: c for c in db_candidates}
        necta_map = {c["candidate_number"]: c for c in necta_candidates}
        
        discrepancies = []
        missing_in_necta = []
        missing_in_db = []
        matches_count = 0
        
        # 1. Check matching candidates
        for cno, necta_cand in necta_map.items():
            if cno not in db_map:
                missing_in_db.append({
                    "candidate_number": cno,
                    "gender": necta_cand.get("gender"),
                    "division": necta_cand.get("division"),
                    "points": necta_cand.get("points")
                })
                continue
                
            matches_count += 1
            db_cand = db_map[cno]
            cand_discrepancies = []
            
            # Compare divisions
            necta_div = necta_cand.get("division")
            db_div = db_cand.get("division")
            if necta_div != db_div:
                cand_discrepancies.append({
                    "type": "division_mismatch",
                    "field": "division",
                    "necta": necta_div,
                    "db": db_div
                })
                
            # Compare aggregate points
            necta_pts = necta_cand.get("points")
            db_pts = db_cand.get("division_points")
            if necta_pts is not None and db_pts is not None and necta_pts != db_pts:
                cand_discrepancies.append({
                    "type": "points_mismatch",
                    "field": "points",
                    "necta": necta_pts,
                    "db": db_pts
                })
                
            # Compare subject grades
            necta_subs = {s["raw_subject_code"]: s["grade"] for s in necta_cand.get("normalized_subjects", [])}
            # Also normalize key names or search matches
            db_marks = {m["subject_code"]: m["grade"] for m in db_cand.get("marks", [])}
            
            for code, n_grade in necta_subs.items():
                if code not in db_marks:
                    cand_discrepancies.append({
                        "type": "missing_subject_in_db",
                        "subject": code,
                        "necta": n_grade,
                        "db": None
                    })
                elif n_grade != db_marks[code]:
                    cand_discrepancies.append({
                        "type": "grade_mismatch",
                        "subject": code,
                        "necta": n_grade,
                        "db": db_marks[code]
                    })
                    
            for code, db_grade in db_marks.items():
                if code not in necta_subs:
                    cand_discrepancies.append({
                        "type": "missing_subject_in_necta",
                        "subject": code,
                        "necta": None,
                        "db": db_grade
                    })
                    
            if cand_discrepancies:
                discrepancies.append({
                    "candidate_number": cno,
                    "student_name": db_cand.get("student_name", "Unknown"),
                    "mismatches": cand_discrepancies
                })
                
        # 2. Check candidates in DB but missing in NECTA
        for cno, db_cand in db_map.items():
            if cno not in necta_map:
                missing_in_necta.append({
                    "candidate_number": cno,
                    "student_name": db_cand.get("student_name"),
                    "division": db_cand.get("division"),
                    "points": db_cand.get("division_points")
                })
                
        return {
            "summary": {
                "total_necta": len(necta_candidates),
                "total_db": len(db_candidates),
                "matches": matches_count,
                "discrepancies_count": len(discrepancies),
                "missing_in_db_count": len(missing_in_db),
                "missing_in_necta_count": len(missing_in_necta)
            },
            "discrepancies": discrepancies,
            "missing_in_db": missing_in_db,
            "missing_in_necta": missing_in_necta
        }
