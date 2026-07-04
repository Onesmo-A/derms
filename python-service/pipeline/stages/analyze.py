from typing import Dict, Any
from analytics.pass_rate import PassRateCalculator
from analytics.statistics import StatsEngine

class AnalyzeStage:
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        candidates = context["normalized_candidates"]
        
        pass_rate = PassRateCalculator.calculate(candidates)
        avg_gpa = StatsEngine.calculate_gpa(candidates)
        
        context["analysis"] = {
            "pass_rate": pass_rate,
            "average_gpa": avg_gpa
        }
        
        return context
