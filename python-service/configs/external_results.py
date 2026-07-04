import os
from dotenv import load_dotenv

load_dotenv()

class ExternalResultsSettings:
    NECTA_PORTAL_URL: str = os.getenv("NECTA_PORTAL_URL", "https://www.necta.go.tz")
    NECTA_ONLINE_SYS_URL: str = os.getenv("NECTA_ONLINE_SYS_URL", "https://onlinesys.necta.go.tz")
    PARSER_VERSION: str = "2.1.0"
    SCRAPER_VERSION: str = "1.8.4"
    MAPPING_VERSION: str = "1.0.0"

settings = ExternalResultsSettings()
