# Execution metrics collector
class MetricsCollector:
    def __init__(self):
        self.processed_students = 0
        self.processing_time = 0.0

    def record_parse(self, count: int, elapsed_time: float):
        self.processed_students += count
        self.processing_time += elapsed_time

    def get_throughput(self) -> float:
        if self.processing_time == 0.0:
            return 0.0
        return self.processed_students / self.processing_time

metrics_collector = MetricsCollector()
