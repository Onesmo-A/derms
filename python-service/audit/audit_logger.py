import logging
import json
import time

logger = logging.getLogger("audit")

class AuditLogger:
    @staticmethod
    def log_event(action: str, operator: str, details: dict):
        event = {
            "timestamp": time.time(),
            "action": action,
            "operator": operator,
            "details": details
        }
        logger.info(json.dumps(event))

audit_logger = AuditLogger()
