from typing import List, Dict, Any

class PassRateCalculator:
    @staticmethod
    def calculate(candidates: List[Dict[str, Any]]) -> float:
        if not candidates:
            return 0.0
        passed = sum(1 for c in candidates if c.get("division") in ["I", "II", "III", "IV"])
        return (passed / len(candidates)) * 100.0
