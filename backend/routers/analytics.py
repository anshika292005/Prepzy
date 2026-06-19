from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from backend.core.security import CurrentUser, current_user
from backend.repositories.learning import (
    aggregate_topic_years,
    sessions,
    skill_scores,
)
from ml_service.models.schemas import (
    DeduplicationRequest,
)
from ml_service.services.analytics_service import run_full_analytics
from ml_service.services.deduplication_service import deduplicate_questions

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/predictions/{user_id}")
async def predictions(
    user_id: str,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    if actor.uid != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own analytics.")
    topics = await aggregate_topic_years(user_id)
    scores = await skill_scores.find_many({"user_id": user_id})
    from ml_service.models.schemas import SkillWeightEntry, TopicYearEntry

    report = run_full_analytics(
        user_id=user_id,
        topics=[TopicYearEntry(**topic) for topic in topics],
        skill_scores=[
            SkillWeightEntry(
                topic=score.get("topic", "General"),
                skill_score=score.get("skill_score", 1200),
            )
            for score in scores
        ],
    )
    return {"success": True, "data": report.model_dump()}


@router.post("/deduplicate")
async def deduplicate(
    payload: DeduplicationRequest,
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    result = await deduplicate_questions(
        questions=payload.questions,
        use_llm=payload.use_llm,
        similarity_threshold=payload.similarity_threshold,
        borderline_low=payload.borderline_low,
    )
    return {"success": True, "data": result.model_dump()}


@router.get("/dashboard/{user_id}")
async def dashboard(
    user_id: str,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    if actor.uid != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own dashboard.")
    scores = await skill_scores.find_many({"user_id": user_id})
    history = await sessions.find_many(
        {"user_id": user_id},
        sort_key="created_at",
        descending=True,
    )
    topic_scores = []
    total_solved = 0
    total_correct = 0
    for score in scores:
        total = int(score.get("total_questions", 0))
        correct = int(score.get("correct_count", 0))
        total_solved += total
        total_correct += correct
        topic_scores.append({
            "topic": score.get("topic"),
            "accuracy": round(correct / max(1, total) * 100),
            "totalQuestions": total,
            "skillScore": score.get("skill_score", 1200),
        })
    average = round(total_correct / max(1, total_solved) * 100)
    weak = [
        {
            "topic": score["topic"],
            "accuracy": score["accuracy"],
            "priority": "High" if score["accuracy"] < 40 else "Medium",
            "studyTip": f"Review core concepts in {score['topic']} and practice targeted questions.",
        }
        for score in topic_scores
        if score["accuracy"] < 60
    ]
    daily = [
        {
            "date": str(item.get("created_at", ""))[:10],
            "accuracy": round(
                item.get("correct_count", 0)
                / max(1, item.get("total_questions", 0))
                * 100
            ),
            "questionsAnswered": item.get("total_questions", 0),
        }
        for item in reversed(history[:7])
    ]
    return {
        "totalSolved": total_solved,
        "avgScore": average,
        "eloRank": round(
            sum(score.get("skillScore", 1200) for score in topic_scores)
            / max(1, len(topic_scores))
        ),
        "streak": 0,
        "level": "Expert" if average > 80 else "Intermediate" if average > 50 else "Beginner",
        "topicScores": topic_scores,
        "dailyData": daily,
        "weakTopics": weak,
    }
