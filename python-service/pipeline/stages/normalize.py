from typing import Dict, Any
from normalizers.subject_normalizer import SubjectNormalizer
from normalizers.grade_normalizer import GradeNormalizer
from normalizers.candidate_normalizer import CandidateNormalizer

class NormalizeStage:
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raw_data = context["raw_data"]
        subject_mappings = context.get("subject_mappings", [])
        
        normalized_candidates = []
        for cand in raw_data.get("candidates", []):
            clean_cno = CandidateNormalizer.clean_candidate_number(cand["candidate_number"])
            norm_subjects = []
            
            for sub_code, grade in cand.get("raw_subjects", {}).items():
                mapped = SubjectNormalizer.normalize(sub_code, subject_mappings)
                norm_subjects.append({
                    "subject_id": mapped["subject_id"],
                    "subject_name": mapped["subject_name"],
                    "subject_code": mapped["normalized_code"],
                    "grade": grade.upper(),
                    "points": GradeNormalizer.get_points(grade)
                })
                
            normalized_candidates.append({
                "candidate_number": clean_cno,
                "gender": cand.get("gender"),
                "division": cand.get("division"),
                "points": cand.get("points"),
                "subjects": norm_subjects
            })
            
        context["normalized_candidates"] = normalized_candidates
        context["summary"] = raw_data.get("summary", {})
        return context
