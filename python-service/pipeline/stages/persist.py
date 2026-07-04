from typing import Dict, Any

class PersistStage:
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # Persist stage formats the staged payload that is returned to Laravel.
        # This keeps the Python service stateless and leaves database writing to Laravel.
        context["payload"] = {
            "centre_number": context.get("centre_number"),
            "school_name": context["raw_data"].get("school_name"),
            "candidates": context["normalized_candidates"],
            "summary": context["summary"],
            "analysis": context["analysis"],
            "errors": context.get("errors", []),
            "warnings": context.get("warnings", [])
        }
        return context
