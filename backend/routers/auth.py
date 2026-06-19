from fastapi import APIRouter

from backend.schemas.domain import OTPRequest, OTPVerify
from backend.services.auth import request_login_otp, verify_login_otp

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login/request-otp")
async def request_otp(payload: OTPRequest):
    data = await request_login_otp(
        email=payload.email,
        password=payload.password,
        id_token=payload.id_token,
    )
    return {"success": True, **data}


@router.post("/login/verify-otp")
async def verify_otp(payload: OTPVerify):
    data = await verify_login_otp(payload.challenge_id, payload.otp)
    return {"success": True, **data}
