from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from backend.core.security import CurrentUser, current_user
from backend.repositories.learning import users
from backend.schemas.domain import UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", status_code=201)
async def register(payload: UserCreate):
    if await users.find_one({"auth_id": payload.auth_id}):
        raise HTTPException(status_code=409, detail="User already exists.")
    created = await users.create(payload.model_dump(by_alias=False))
    return {"success": True, "data": created}


@router.get("/{auth_id}")
async def get_user(
    auth_id: str,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    if actor.uid != auth_id:
        raise HTTPException(status_code=403, detail="You can only view your own profile.")
    profile = await users.find_one({"auth_id": auth_id})
    if not profile:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "data": profile}


@router.patch("/{auth_id}")
async def update_user(
    auth_id: str,
    payload: UserUpdate,
    actor: Annotated[CurrentUser, Depends(current_user)],
):
    if actor.uid != auth_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile.")
    profile = await users.update(
        {"auth_id": auth_id},
        payload.model_dump(exclude_none=True),
    )
    if not profile:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "data": profile}
