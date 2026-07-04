import os

class CacheSettings:
    CACHE_TYPE: str = os.getenv("CACHE_TYPE", "memory")  # memory, redis
    CACHE_DEFAULT_TIMEOUT: int = int(os.getenv("CACHE_DEFAULT_TIMEOUT", 3600))  # 1 hour

cache_settings = CacheSettings()
