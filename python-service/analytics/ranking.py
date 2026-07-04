from typing import List, Dict, Any

class RankingEngine:
    @staticmethod
    def rank_schools(schools_summaries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Ranks schools by total_gpa ascending (lower is better in NECTA)
        sorted_schools = sorted(schools_summaries, key=lambda s: s.get("total_gpa", 5.0))
        for idx, school in enumerate(sorted_schools):
            school["rank"] = idx + 1
        return sorted_schools
