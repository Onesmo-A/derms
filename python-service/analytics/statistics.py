from typing import List, Dict, Any

class StatsEngine:
    @staticmethod
    def calculate_gpa(candidates: List[Dict[str, Any]]) -> float:
        valid_points = [c["points"] for c in candidates if c.get("points") is not None]
        if not valid_points:
            return 0.0
        return sum(valid_points) / (len(valid_points) * 7.0) # GPA base of 7 subjects
