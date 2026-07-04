from fastapi import APIRouter
from monitoring.health import SystemHealthChecker
from monitoring.metrics import metrics_collector

router = APIRouter(prefix="/api/v1/health", tags=["Health"])

@router.get("")
def check_service_health():
    health = SystemHealthChecker.get_status()
    # Add telemetry throughput metrics to health checker endpoint
    health["metrics"] = {
        "processed_students": metrics_collector.processed_students,
        "processing_time_sec": metrics_collector.processing_time,
        "throughput_students_per_sec": metrics_collector.get_throughput()
    }
    return health
