# ────────────────────────────────────────────────
# Prepzy ML Service — Dockerfile
# Multi-stage build: keeps the final image lean (~600MB vs ~1.4GB)
# ────────────────────────────────────────────────

# ── Stage 1: Build / install dependencies ───────
FROM python:3.11-slim AS builder

WORKDIR /build

# System deps needed to compile OpenCV + statsmodels wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY ml_service/requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime image ───────────────────────
FROM python:3.11-slim AS runtime

LABEL maintainer="Prepzy"
LABEL description="Python ML microservice: topic prediction, deduplication, OCR preprocessing"

WORKDIR /app

# Runtime system libs for OpenCV (headless — no display needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY ml_service/ .

# Non-root user for security
RUN useradd --no-create-home --shell /bin/false prepzy \
    && chown -R prepzy:prepzy /app
USER prepzy

# Expose internal port (NOT exposed to public — only accessed within Docker network)
EXPOSE 8080

# Health check: Docker will restart if /health fails 3× in a row
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

# Start FastAPI with uvicorn
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--workers", "2", \
     "--log-level", "info"]
