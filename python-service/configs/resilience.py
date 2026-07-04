import os

class ResilienceSettings:
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", 3))
    BACKOFF_FACTOR: float = float(os.getenv("BACKOFF_FACTOR", 2.0))  # Exponential factor
    CIRCUIT_BREAKER_THRESHOLD: int = int(os.getenv("CIRCUIT_BREAKER_THRESHOLD", 5))  # Failures before trip

resilience_settings = ResilienceSettings()
