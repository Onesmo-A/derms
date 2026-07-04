from typing import Dict, Any
from adapters.registry import adapter_registry

class DiscoverStage:
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        source = context.get("source_system", "NECTA")
        exam_type = context.get("exam_type")
        year = context.get("year")
        
        adapter = adapter_registry.get_adapter(source)
        # Discovers years or centres if parameters are missing, or stages index details
        context["adapter"] = adapter
        return context
