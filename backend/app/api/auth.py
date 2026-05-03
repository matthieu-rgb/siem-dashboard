from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.rate_limit import login_limiter
from app.core.security import (
    REFRESH_TOKEN_TYPE,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.db.models import AuditLog, User
from app.db.session import get_db

router = APIRouter()

_REFRESH_COOKIE = "refresh_token"
_COOKIE_MAX_AGE = 60 * 60 * 24 * 7


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # noqa: S105


class UserRead(BaseModel):
    id: int
    email: str
    role: str

    model_config = {"from_attributes": True}


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=_COOKIE_MAX_AGE,
        path="/api/auth",
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    ip = request.client.host if request.client else "unknown"

    if not login_limiter.is_allowed(ip):
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    user.last_login = datetime.now(UTC)
    db.add(
        AuditLog(actor_id=user.id, action="auth.login", target=ip)
    )
    await db.commit()

    _set_refresh_cookie(response, create_refresh_token(str(user.id)))
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)] = None,
) -> TokenResponse:
    if refresh_token is None:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        payload = decode_token(refresh_token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    if payload.get("type") != REFRESH_TOKEN_TYPE:
        raise HTTPException(status_code=401, detail="Wrong token type")

    sub = payload.get("sub")
    if not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="Malformed token")

    _set_refresh_cookie(response, create_refresh_token(sub))
    return TokenResponse(access_token=create_access_token(sub))


@router.post("/logout")
async def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(key=_REFRESH_COOKIE, path="/api/auth", samesite="lax")
    return {"ok": True}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
