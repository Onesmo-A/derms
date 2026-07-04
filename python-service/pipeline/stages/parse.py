from typing import Dict, Any

class ParseStage:
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        adapter = context["adapter"]
        exam_type = context.get("exam_type")
        year = context.get("year")
        centre_number = context.get("centre_number")
        
        # Scrapes and parses candidates and summaries from adapter
        parsed_data = adapter.scrape_centre(exam_type, year, centre_number)
        context["raw_data"] = parsed_data
        return context
