from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends, Header, HTTPException, status

from backend.core.config import get_settings


@dataclass(slots=True)
class CurrentUser:
    uid: str
    email: str | None = None
    name: str | None = None
    claims: dict[str, Any] | None = None


_firebase_app: Any = None


def firebase_admin_modules() -> tuple[Any, Any] | tuple[None, None]:
    global _firebase_app
    settings = get_settings()
    if not (
        settings.firebase_project_id
        and settings.firebase_client_email
        and settings.firebase_private_key
    ):
        return None, None
    try:
        import firebase_admin
        from firebase_admin import auth, credentials

        if _firebase_app is None:
            try:
                _firebase_app = firebase_admin.get_app("prepzy-python")
            except ValueError:
                credential = credentials.Certificate({
                    "project_id": settings.firebase_project_id,
                    "client_email": settings.firebase_client_email,
                    "private_key": settings.firebase_private_key_value,
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "type": "service_account",
                })
                _firebase_app = firebase_admin.initialize_app(
                    credential,
                    name="prepzy-python",
                )
        return auth, _firebase_app
    except Exception:
        return None, None


async def optional_user(
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    auth, app = firebase_admin_modules()
    if auth and app:
        try:
            decoded = auth.verify_id_token(token, app=app)
            return CurrentUser(
                uid=decoded["uid"],
                email=decoded.get("email"),
                name=decoded.get("name"),
                claims=decoded,
            )
        except Exception as error:
            raise HTTPException(status_code=401, detail="Invalid or expired token.") from error
    if get_settings().environment == "development" and token.startswith("dev:"):
        return CurrentUser(uid=token.removeprefix("dev:"))
    raise HTTPException(
        status_code=503,
        detail="Firebase Admin is not configured on the Python API.",
    )


async def current_user(user: Annotated[CurrentUser | None, Depends(optional_user)]) -> CurrentUser:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return user


def create_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(challenge_id: str, otp: str) -> str:
    secret = get_settings().otp_secret.encode()
    message = f"{challenge_id}:{otp}".encode()
    return hmac.new(secret, message, hashlib.sha256).hexdigest()


def verify_otp_hash(challenge_id: str, otp: str, expected: str) -> bool:
    return hmac.compare_digest(hash_otp(challenge_id, otp), expected)
