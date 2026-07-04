from typing import Dict, Any

class SummaryComparator:
    @staticmethod
    def compare_summaries(staged_summary: Dict[str, Any], db_summary: Dict[str, Any]) -> Dict[str, Any]:
        discrepancies = {}
        for key in ["division_i_count", "division_ii_count", "division_iii_count", "division_iv_count", "division_zero_count"]:
            s_val = staged_summary.get(key, 0)
            d_val = db_summary.get(key, 0)
            if s_val != d_val:
                discrepancies[key] = {"staged": s_val, "db": d_val}
        return discrepancies
