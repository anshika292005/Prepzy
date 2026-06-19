from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from backend.core.config import get_settings
from backend.core.security import CurrentUser, current_user, optional_user
from backend.services.files import (
    SUPPORTED_DOCUMENTS,
    SUPPORTED_IMAGES,
    extract_text,
    ingest_notes,
)
from backend.services.rag import vector_store

router = APIRouter(tags=["documents and RAG"])


async def read_file(file: UploadFile) -> bytes:
    content = await file.read()
    if len(content) > get_settings().upload_max_bytes:
        raise HTTPException(status_code=413, detail="File is too large.")
    if not content:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")
    return content


@router.post("/extract-text")
async def extract(
    file: UploadFile = File(...),
    _actor: Annotated[CurrentUser | None, Depends(optional_user)] = None,
):
    if file.content_type not in SUPPORTED_IMAGES | SUPPORTED_DOCUMENTS:
        raise HTTPException(status_code=415, detail="Unsupported file type.")
    content = await read_file(file)
    text = await extract_text(content, file.content_type or "")
    return {
        "success": True,
        "extractedText": text,
        "charCount": len(text),
        "estimatedTokens": round(len(text) / 4),
    }


@router.post("/upload/notes", status_code=201)
async def upload_notes(
    actor: Annotated[CurrentUser, Depends(current_user)],
    file: UploadFile = File(...),
    user_id: str = Form(alias="userId"),
    topic: str = Form(...),
):
    if actor.uid != user_id:
        raise HTTPException(status_code=403, detail="You can only upload your own notes.")
    content = await read_file(file)
    result = await ingest_notes(
        user_id=user_id,
        topic=topic,
        content=content,
        mime_type=file.content_type or "",
    )
    return {
        "success": True,
        "data": {
            **result,
            "topic": topic,
            "fileName": file.filename,
            "fileSize": len(content),
        },
    }


@router.delete("/upload/notes")
async def delete_notes(
    payload: dict,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    user_id = str(payload.get("userId", ""))
    if actor.uid != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own notes.")
    topic = payload.get("topic")
    await vector_store.delete(user_id, topic)
    return {"success": True, "data": {"message": "Notes deleted."}}


@router.get("/upload/topics/{user_id}")
async def topics(
    user_id: str,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    if actor.uid != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own notes.")
    return {"success": True, "data": {"topics": await vector_store.topics(user_id)}}
