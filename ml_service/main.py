"""
Prepzy ML Microservice — FastAPI
=================================
Handles all Python-native ML work:
  - Topic trend analysis  (linear regression, std dev, autocorrelation, gap analysis)
  - Multi-factor weighted prediction scoring
  - Cosine similarity question deduplication  (TF-IDF + optional LLM confirm)
  - Image preprocessing  (adaptive thresholding + CLAHE via OpenCV)

Called internally by the Node/Express backend over HTTP.
Never exposed directly to the browser.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml_service.routers import analytics, deduplication, ocr


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Prepzy ML Service started")
    yield
    print("🛑 Prepzy ML Service stopped")


app = FastAPI(
    title="Prepzy ML Service",
    description="Python ML microservice for exam topic prediction and OCR preprocessing",
    version="1.0.0",
    lifespan=lifespan,
)

# Only accept requests from the Node backend (docker network internal)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://node_backend:5000", "http://localhost:5000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "prepzy-ml"}


# ── Routers ────────────────────────────────────
app.include_router(analytics.router,      prefix="/analytics",      tags=["analytics"])
app.include_router(deduplication.router,  prefix="/deduplication",  tags=["deduplication"])
app.include_router(ocr.router,            prefix="/ocr",            tags=["ocr"])
