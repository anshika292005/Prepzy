from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.core.security import CurrentUser, current_user
from backend.repositories.learning import (
    create_session,
    get_skill,
    responses,
    session_with_responses,
    sessions,
    skill_scores,
    upsert_skill,
)
from backend.schemas.domain import (
    QuestionResponseCreate,
    SessionCreate,
    SessionSubmission,
    SkillScoreUpsert,
)
from backend.services.scoring import process_session_results, update_skill_score

router = APIRouter(tags=["learning records"])


def assert_owner(actor: CurrentUser, user_id: str) -> None:
    if actor.uid != user_id:
        raise HTTPException(status_code=403, detail="You can only access your own data.")


@router.post("/sessions", status_code=201)
async def new_session(
    payload: SessionCreate,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    assert_owner(actor, payload.user_id)
    document = payload.model_dump(by_alias=False)
    return {"success": True, "data": await create_session(document)}


@router.get("/sessions/{user_id}")
async def list_sessions(
    user_id: str,
    actor: Annotated[CurrentUser, Depends(current_user)],
    topic: str | None = None,
    exam_type: str | None = Query(default=None, alias="examType"),
):
    assert_owner(actor, user_id)
    query = {"user_id": user_id}
    if topic:
        query["topic"] = topic
    if exam_type:
        query["exam_type"] = exam_type
    data = await sessions.find_many(query, sort_key="created_at", descending=True)
    return {"success": True, "data": data}


@router.get("/sessions/detail/{session_id}")
async def session_detail(
    session_id: str,
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    data = await session_with_responses(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"success": True, "data": data}


@router.post("/responses", status_code=201)
async def save_response(
    payload: QuestionResponseCreate,
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    if not await sessions.find_by_id(payload.session_id):
        raise HTTPException(status_code=404, detail="Session not found.")
    document = payload.model_dump(by_alias=False)
    return {"success": True, "data": await responses.create(document)}


@router.post("/responses/batch", status_code=201)
async def save_response_batch(
    payload: list[QuestionResponseCreate],
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    if not payload:
        raise HTTPException(status_code=400, detail="A response list is required.")
    session_ids = {value.session_id for value in payload}
    if len(session_ids) != 1:
        raise HTTPException(status_code=400, detail="Responses must belong to one session.")
    session_id = next(iter(session_ids))
    if not await sessions.find_by_id(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")
    for value in payload:
        await responses.create(value.model_dump(by_alias=False))
    return {"success": True, "data": {"insertedCount": len(payload)}}


@router.get("/responses/{session_id}")
async def list_responses(
    session_id: str,
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    data = await responses.find_many({"session_id": session_id}, sort_key="created_at")
    return {"success": True, "data": data}


@router.get("/skill-scores/{user_id}")
async def list_skill_scores(
    user_id: str,
    actor: Annotated[CurrentUser, Depends(current_user)],
    topic: str | None = None,
):
    assert_owner(actor, user_id)
    query = {"user_id": user_id}
    if topic:
        query["topic"] = topic
    return {"success": True, "data": await skill_scores.find_many(query)}


@router.post("/skill-scores")
async def update_skill(
    payload: SkillScoreUpsert,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    assert_owner(actor, payload.user_id)
    current = await get_skill(payload.user_id, payload.topic, payload.subtopic) or {}
    score = update_skill_score(
        int(current.get("skill_score", 1200)),
        payload.is_correct,
        payload.difficulty,
    )
    data = await upsert_skill(
        user_id=payload.user_id,
        topic=payload.topic,
        subtopic=payload.subtopic,
        skill_score=score,
        total_questions=int(current.get("total_questions", 0)) + 1,
        correct_count=int(current.get("correct_count", 0)) + int(payload.is_correct),
    )
    return {"success": True, "data": data}


@router.post("/submit-session")
async def submit_session(
    payload: SessionSubmission,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    assert_owner(actor, payload.user_id)
    current = await get_skill(payload.user_id, payload.topic, payload.subtopic) or {}
    original_score = int(current.get("skill_score", 1200))
    result_documents = [value.model_dump(by_alias=False) for value in payload.results]
    new_score = process_session_results(original_score, result_documents)
    correct = sum(1 for value in result_documents if value["is_correct"])

    skill = await upsert_skill(
        user_id=payload.user_id,
        topic=payload.topic,
        subtopic=payload.subtopic,
        skill_score=new_score,
        total_questions=int(current.get("total_questions", 0)) + len(result_documents),
        correct_count=int(current.get("correct_count", 0)) + correct,
    )
    session = await create_session({
        "user_id": payload.user_id,
        "topic": payload.topic,
        "exam_type": payload.exam_type,
        "total_questions": len(result_documents),
        "correct_count": correct,
        "duration_seconds": payload.duration_seconds,
    })
    for result in result_documents:
        await responses.create({
            **result,
            "session_id": session["id"],
            "user_id": payload.user_id,
        })
    return {
        "success": True,
        "newSkillScore": new_score,
        "skillDelta": new_score - original_score,
        "sessionId": session["id"],
        "skill": skill,
    }
