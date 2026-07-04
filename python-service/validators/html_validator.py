class HtmlValidator:
    @staticmethod
    def validate(html_content: str) -> bool:
        if not html_content or "<html" not in html_content.lower():
            return False
        # Check for matching body or structure anomalies
        if "table" not in html_content.lower():
            return False
        return True
