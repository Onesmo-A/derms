from typing import Dict, Any
from validators.candidate_validator import CandidateValidator

class ValidateStage:
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        normalized_candidates = context["normalized_candidates"]
        
        # Run validations
        val_result = CandidateValidator.validate_candidates(normalized_candidates)
        context["errors"] = val_result["errors"]
        context["warnings"] = val_result["warnings"]
        
        return context
