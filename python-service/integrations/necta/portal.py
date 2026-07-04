from bs4 import BeautifulSoup
import re
from typing import List, Dict, Any

class NectaPortalParser:
    @staticmethod
    def parse_years(html_content: str) -> List[int]:
        soup = BeautifulSoup(html_content, "lxml")
        years = []
        for link in soup.find_all("a", href=True):
            href = link['href']
            text = link.get_text()
            matches = re.findall(r"\b(20\d{2})\b", text + " " + href)
            for m in matches:
                years.append(int(m))
        return sorted(list(set(years)), reverse=True)

    @staticmethod
    def parse_centres(html_content: str) -> List[Dict[str, str]]:
        soup = BeautifulSoup(html_content, "lxml")
        centres = []
        for link in soup.find_all("a", href=True):
            href = link['href']
            text = link.get_text().strip()
            if "results/" in href or re.match(r"[ps]\d{4}", text, re.IGNORECASE):
                match = re.match(r"^([PS]\d{4})\b\s*(.*)$", text, re.IGNORECASE)
                if match:
                    centre_no = match.group(1).upper()
                    name = match.group(2).strip()
                    centres.append({
                        "centre_number": centre_no,
                        "school_name": name or f"Centre {centre_no}",
                        "href": href
                    })
        return centres
