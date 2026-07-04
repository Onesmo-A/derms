import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    NECTA_PORTAL_URL: str = os.getenv("NECTA_PORTAL_URL", "https://www.necta.go.tz")
    NECTA_ONLINE_SYS_URL: str = os.getenv("NECTA_ONLINE_SYS_URL", "https://onlinesys.necta.go.tz")
    API_PORT: int = int(os.getenv("API_PORT", 8080))
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")

settings = Settings()
