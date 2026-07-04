import time
import logging
from typing import Callable, Any
from configs.resilience import resilience_settings

logger = logging.getLogger("resilience")

def retry_with_backoff(func: Callable[..., Any], *args, **kwargs) -> Any:
    max_retries = resilience_settings.MAX_RETRIES
    backoff_factor = resilience_settings.BACKOFF_FACTOR
    
    retries = 0
    delay = 1.0  # Initial delay
    
    while retries < max_retries:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            retries += 1
            if retries >= max_retries:
                logger.error(f"Failed after {retries} retries: {str(e)}")
                raise e
            logger.warning(f"Error occurred: {str(e)}. Retrying in {delay} seconds...")
            time.sleep(delay)
            delay *= backoff_factor
