from adapters.base_adapter import BaseResultAdapter
from adapters.necta_adapter import NectaAdapter
from typing import Dict, Type

class AdapterRegistry:
    def __init__(self):
        self._registry: Dict[str, BaseResultAdapter] = {
            "NECTA": NectaAdapter(),
            # Stub placeholders for other future integration adapters
            "CAMBRIDGE": None,
            "EXCEL": None
        }

    def get_adapter(self, source_system: str) -> BaseResultAdapter:
        system_key = source_system.upper().strip()
        adapter = self._registry.get(system_key)
        if not adapter:
            raise ValueError(f"No result importer adapter registered for source: {source_system}")
        return adapter

adapter_registry = AdapterRegistry()
