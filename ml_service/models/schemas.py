"""
Shared Pydantic models for request/response validation.
Mirrors the shapes that Prepzy's Node backend sends.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


# ── Analytics ──────────────────────────────────────────────────

class TopicYearEntry(BaseModel):
    """One topic with its yearly practice frequency map."""
    topic: str
    yearly_frequency: dict[int, int] = Field(
        ...,
        description="Map of year (int) → session count",
        json_schema_extra={"example": {2021: 2, 2022: 5, 2023: 3, 2024: 7}},
    )


class SkillWeightEntry(BaseModel):
    topic: str
    skill_score: int = Field(default=1200, ge=600, le=2000)


class AnalyticsRequest(BaseModel):
    user_id: str
    topics: list[TopicYearEntry]
    skill_scores: list[SkillWeightEntry] = Field(default_factory=list)


class TrendResult(BaseModel):
    topic: str
    slope: float
    direction: str          # "rising" | "falling" | "stable"
    r_squared: float


class StabilityResult(BaseModel):
    topic: str
    std_dev: float
    is_stable: bool


class CyclicResult(BaseModel):
    topic: str
    is_cyclic: bool
    cycle_length: Optional[int]
    acf_values: list[float]


class GapResult(BaseModel):
    topic: str
    last_seen_year: Optional[int]
    gap_years: int
    boost_multiplier: float


class ScoreBreakdown(BaseModel):
    frequency_score: float
    trend_score: float
    recency_score: float
    gap_score: float
    skill_weight_score: float


class PredictionScore(BaseModel):
    topic: str
    score: int              # 0–100
    label: str              # "Very Likely" | "Likely" | "Possible" | "Unlikely"
    breakdown: ScoreBreakdown


class AnalyticsResponse(BaseModel):
    user_id: str
    generated_at: str
    predictions: list[PredictionScore]
    trends: list[TrendResult]
    stabilities: list[StabilityResult]
    cyclic_topics: list[CyclicResult]
    gap_analysis: list[GapResult]


# ── Deduplication ──────────────────────────────────────────────

class QuestionDoc(BaseModel):
    id: str
    question_text: str
    topic: str = "General"
    year: Optional[int] = None
    source: Optional[str] = None


class DeduplicationRequest(BaseModel):
    questions: list[QuestionDoc]
    use_llm: bool = True
    similarity_threshold: float = Field(default=0.85, ge=0.0, le=1.0)
    borderline_low: float = Field(default=0.60, ge=0.0, le=1.0)


class DuplicatePair(BaseModel):
    question_a: QuestionDoc
    question_b: QuestionDoc
    cosine_similarity: float
    llm_confirmed: Optional[bool]
    is_duplicate: bool


class DeduplicationResponse(BaseModel):
    original_count: int
    unique_count: int
    duplicate_count: int
    duplicate_pairs: list[DuplicatePair]
    unique_questions: list[QuestionDoc]


# ── OCR Preprocessing ──────────────────────────────────────────

class PreprocessResponse(BaseModel):
    quality_before: dict           # {score: int, recommendation: str}
    preprocess_steps: list[str]
    original_size: dict            # {width, height}
    processed_size: dict           # {width, height}
    processed_image_base64: str    # base64-encoded PNG
    extracted_text: Optional[str]  # only if run_ocr=True


class GradingCriterion(BaseModel):
    criterion: str
    awarded_marks: float
    max_marks: float
    feedback: str


class HandwrittenGradeResponse(BaseModel):
    extracted_text: str
    awarded_marks: float
    max_marks: float
    percentage: float
    verdict: str
    strengths: list[str]
    improvements: list[str]
    criteria: list[GradingCriterion]
    feedback: str
    confidence: float
    quality_before: dict
    preprocess_steps: list[str]
    processed_image_base64: str
