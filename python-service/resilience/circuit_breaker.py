import time
import logging
from configs.resilience import resilience_settings

logger = logging.getLogger("resilience")

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    def __init__(self, threshold: int = None, cooldown: int = 60):
        self.threshold = threshold or resilience_settings.CIRCUIT_BREAKER_THRESHOLD
        self.cooldown = cooldown
        self.failures = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN
        self.last_failure_time = 0

    def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.cooldown:
                self.state = "HALF-OPEN"
                logger.info("Circuit transition to HALF-OPEN")
            else:
                raise CircuitBreakerOpenException("Circuit is OPEN. Request blocked.")

        try:
            result = func(*args, **kwargs)
            if self.state == "HALF-OPEN":
                self.state = "CLOSED"
                self.failures = 0
                logger.info("Circuit transition to CLOSED")
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.threshold:
                self.state = "OPEN"
                logger.error(f"Circuit transition to OPEN. Failures: {self.failures}")
            raise e
