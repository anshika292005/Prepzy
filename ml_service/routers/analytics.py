from fastapi import APIRouter, HTTPException
from models.schemas import AnalyticsRequest, AnalyticsResponse
from services.analytics_service import run_full_analytics

router = APIRouter()


@router.post("/predict", response_model=AnalyticsResponse)
async def predict_topics(request: AnalyticsRequest):
    """
    Runs the full 5-algorithm analytics pipeline for a user's topic data.

    Called by Node backend at:  POST http://ml_service:8080/analytics/predict

    Body (sent by Node after aggregating from MongoDB):
    {
      "user_id": "abc123",
      "topics": [
        { "topic": "Thermodynamics", "yearly_frequency": {2022: 3, 2023: 5, 2024: 7} },
        ...
      ],
      "skill_scores": [
        { "topic": "Thermodynamics", "skill_score": 1050 },
        ...
      ]
    }
    """
    if not request.topics:
        raise HTTPException(
            status_code=422,
            detail="No topic data provided. Student needs at least one practice session.",
        )

    report = run_full_analytics(
        user_id=request.user_id,
        topics=request.topics,
        skill_scores=request.skill_scores,
    )
    return report
