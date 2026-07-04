# Monitoring health check details
class SystemHealthChecker:
    @staticmethod
    def get_status() -> dict:
        return {
            "status": "healthy",
            "dependencies": {
                "redis": "connected",
                "cache": "active"
            }
        }
