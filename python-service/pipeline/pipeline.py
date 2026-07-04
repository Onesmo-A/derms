from typing import Dict, Any, List

class PipelineEngine:
    def __init__(self, stages: List[Any]):
        self.stages = stages

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes stages in sequence. Each stage receives the context,
        modifies it, and passes it forward.
        """
        for stage in self.stages:
            context = stage.execute(context)
        return context
