import requests
from throttling.rate_limiter import rate_limiter
from resilience.retry import retry_with_backoff
from integrations.necta.constants import DEFAULT_TIMEOUT
from urllib.parse import urlparse

class NectaClient:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }

    def fetch_url(self, url: str) -> str:
        parsed_url = urlparse(url)
        # Apply rate limiting throttling per host
        rate_limiter.throttle(parsed_url.netloc)
        
        # Execute request wrapper inside backoff retry handler
        def execute():
            response = requests.get(url, headers=self.headers, timeout=DEFAULT_TIMEOUT)
            response.raise_for_status()
            return response.text
            
        return retry_with_backoff(execute)
