# Resilience backoff helper stubs or placeholders
def calculate_backoff(retry_count: int, factor: float = 2.0) -> float:
    return factor ** retry_count
