from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseResultAdapter(ABC):
    @abstractmethod
    def discover_years(self, exam_type: str) -> List[int]:
        pass

    @abstractmethod
    def discover_centres(self, exam_type: str, year: int) -> List[Dict[str, str]]:
        pass

    @abstractmethod
    def scrape_centre(self, exam_type: str, year: int, centre_number: str) -> Dict[str, Any]:
        pass
