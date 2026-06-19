from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from backend.core.security import CurrentUser, current_user, optional_user
from backend.schemas.domain import (
    ExplanationRequest,
    FollowUpRequest,
    MCQGenerateRequest,
    StudyPlanRequest,
)
from backend.services.coaching import explain_answer, follow_up, study_plan
from backend.services.groq import groq
from backend.services.mcq import analyze_weak_topics, generate_mcqs, mcq_prompt
from backend.services.agents import run_exam_agent

router = APIRouter(tags=["AI learning"])


@router.post("/mcq/generate")
async def generate(
    payload: MCQGenerateRequest,
    _actor: Annotated[CurrentUser | None, Depends(optional_user)],
):
    result = await generate_mcqs(payload)
    return {"success": True, "data": result, **result}


@router.post("/mcq/weak-topics")
async def weak_topics(
    payload: dict,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    user_id = str(payload.get("userId") or actor.uid)
    return {
        "success": True,
        "data": await analyze_weak_topics(user_id, str(payload.get("examType", "General"))),
    }


@router.post("/explain")
async def explain(
    payload: ExplanationRequest,
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    text = await explain_answer(payload.model_dump(by_alias=False))
    return {"success": True, "data": {"explanation": text, "sessionId": payload.session_id}}


@router.post("/explain/followup")
async def explain_followup(
    payload: FollowUpRequest,
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    text = await follow_up(payload.session_id, payload.follow_up_question)
    return {"success": True, "data": {"answer": text, "sessionId": payload.session_id}}


@router.post("/study-plan")
async def create_study_plan(
    payload: StudyPlanRequest,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    user_id = payload.user_id or actor.uid
    return {"success": True, "data": await study_plan(user_id, payload.available_minutes)}


@router.post("/agent/exam-session")
async def exam_agent(
    payload: MCQGenerateRequest,
    _actor: Annotated[CurrentUser, Depends(current_user)],
):
    state = await run_exam_agent(payload)
    if state.error:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=state.error)
    return {
        "success": True,
        "data": {
            "mcqs": state.questions,
            "sessionId": state.session_id,
            "skillScore": state.skill_score,
            "ragEnhanced": bool(state.context),
            "trace": [
                {
                    "stage": trace.stage,
                    "message": trace.message,
                    "metadata": trace.metadata,
                }
                for trace in state.traces
            ],
        },
    }


@router.get("/stream/mcqs")
async def stream_mcqs(
    topic: str,
    exam_type: str = Query(alias="examType"),
    count: int = 5,
    content: str = "",
):
    request = MCQGenerateRequest(
        topic=topic,
        examType=exam_type,
        count=count,
        content=content,
    )

    async def events():
        full = ""
        async for token in groq.stream(
            system="You are a competitive-exam question setter. Return a JSON question array.",
            prompt=mcq_prompt(request, 1200, ""),
        ):
            full += token
            yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"
        yield f"data: {json.dumps({'text': full, 'done': True})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")
