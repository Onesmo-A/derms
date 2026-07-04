from pipeline.pipeline import PipelineEngine
from pipeline.stages.discover import DiscoverStage
from pipeline.stages.parse import ParseStage
from pipeline.stages.normalize import NormalizeStage
from pipeline.stages.validate import ValidateStage
from pipeline.stages.analyze import AnalyzeStage
from pipeline.stages.persist import PersistStage
from typing import Dict, Any

class ImportService:
    def __init__(self):
        self.pipeline = PipelineEngine([
            DiscoverStage(),
            ParseStage(),
            NormalizeStage(),
            ValidateStage(),
            AnalyzeStage(),
            PersistStage()
        ])

    def run_import(self, context: Dict[str, Any]) -> Dict[str, Any]:
        result_context = self.pipeline.process(context)
        return result_context["payload"]
