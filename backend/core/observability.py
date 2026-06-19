from __future__ import annotations

import logging
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from threading import Lock

from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse

logger = logging.getLogger("prepzy.http")


@dataclass(slots=True)
class RouteMetric:
    count: int = 0
    errors: int = 0
    total_seconds: float = 0
    max_seconds: float = 0

    @property
    def average_seconds(self) -> float:
        return self.total_seconds / self.count if self.count else 0


class Metrics:
    def __init__(self) -> None:
        self.routes: defaultdict[tuple[str, str, int], RouteMetric] = defaultdict(RouteMetric)
        self.in_flight = 0
        self._lock = Lock()

    def start(self) -> None:
        with self._lock:
            self.in_flight += 1

    def finish(self, method: str, path: str, status: int, elapsed: float) -> None:
        with self._lock:
            self.in_flight = max(0, self.in_flight - 1)
            metric = self.routes[(method, path, status)]
            metric.count += 1
            metric.errors += int(status >= 500)
            metric.total_seconds += elapsed
            metric.max_seconds = max(metric.max_seconds, elapsed)

    @staticmethod
    def escape(value: str) -> str:
        return value.replace("\\", "\\\\").replace('"', '\\"')

    def prometheus(self) -> str:
        lines = [
            "# HELP prepzy_http_requests_total Total HTTP requests.",
            "# TYPE prepzy_http_requests_total counter",
            "# HELP prepzy_http_request_duration_seconds Request latency.",
            "# TYPE prepzy_http_request_duration_seconds summary",
            "# HELP prepzy_http_requests_in_flight Requests currently executing.",
            "# TYPE prepzy_http_requests_in_flight gauge",
            f"prepzy_http_requests_in_flight {self.in_flight}",
        ]
        with self._lock:
            items = list(self.routes.items())
        for (method, path, status), metric in sorted(items):
            labels = (
                f'method="{self.escape(method)}",'
                f'path="{self.escape(path)}",'
                f'status="{status}"'
            )
            lines.append(f"prepzy_http_requests_total{{{labels}}} {metric.count}")
            lines.append(
                f"prepzy_http_request_duration_seconds_sum{{{labels}}} "
                f"{metric.total_seconds:.6f}"
            )
            lines.append(
                f"prepzy_http_request_duration_seconds_count{{{labels}}} {metric.count}"
            )
            lines.append(
                f"prepzy_http_request_duration_seconds_max{{{labels}}} "
                f"{metric.max_seconds:.6f}"
            )
        return "\n".join(lines) + "\n"


metrics = Metrics()


def install_observability(app: FastAPI) -> None:
    @app.middleware("http")
    async def observe(request: Request, call_next):
        started = time.perf_counter()
        metrics.start()
        response: Response | None = None
        status = 500
        try:
            response = await call_next(request)
            status = response.status_code
            return response
        finally:
            elapsed = time.perf_counter() - started
            route = request.scope.get("route")
            path = getattr(route, "path", request.url.path)
            metrics.finish(request.method, path, status, elapsed)
            logger.info(
                "%s %s status=%s duration_ms=%.2f",
                request.method,
                request.url.path,
                status,
                elapsed * 1000,
            )

    @app.get("/metrics", include_in_schema=False)
    async def prometheus_metrics():
        return PlainTextResponse(metrics.prometheus())
