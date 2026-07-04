import time
from typing import Dict

class RateLimiter:
    def __init__(self, requests_per_second: float = 5.0):
        self.delay = 1.0 / requests_per_second
        self.last_request_time: Dict[str, float] = {}

    def throttle(self, host: str):
        current_time = time.time()
        last_time = self.last_request_time.get(host, 0.0)
        elapsed = current_time - last_time
        
        if elapsed < self.delay:
            sleep_time = self.delay - elapsed
            time.sleep(sleep_time)
            
        self.last_request_time[host] = time.time()

rate_limiter = RateLimiter()
