from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.rate_limit import login_limiter
from app.core.security import (
    REFRESH_TOKEN_TYPE,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.db.models import AuditLog, RefreshToken, User
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
        secure=settings.cookie_secure,
        max_age=_COOKIE_MAX_AGE,
        path="/api/auth",
    )


def _client_ip(request: Request) -> str:
    if settings.trusted_proxy:
        xff = request.headers.get("X-Forwarded-For", "")
        if xff:
            return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    ip = _client_ip(request)

    if not login_limiter.is_allowed(ip):
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not verify_password(body.password, user.password_hash if user else None):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:  # type: ignore[union-attr]
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login = datetime.now(UTC)  # type: ignore[union-attr]

    token, jti = create_refresh_token(str(user.id))  # type: ignore[union-attr]
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    db.add(RefreshToken(jti=jti, user_id=user.id, expires_at=expires_at))  # type: ignore[union-attr]
    db.add(AuditLog(actor_id=user.id, action="auth.login", target=ip))  # type: ignore[union-attr]
    await db.commit()

    _set_refresh_cookie(response, token)
    return TokenResponse(access_token=create_access_token(str(user.id)))  # type: ignore[union-attr]


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
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
    jti = payload.get("jti")
    if not isinstance(sub, str) or not isinstance(jti, str):
        raise HTTPException(status_code=401, detail="Malformed token")

    rt = await db.get(RefreshToken, jti)
    if rt is None or rt.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Refresh token already used or revoked")

    rt.revoked_at = datetime.now(UTC)

    new_token, new_jti = create_refresh_token(sub)
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    db.add(RefreshToken(jti=new_jti, user_id=int(sub), expires_at=expires_at))
    await db.commit()

    _set_refresh_cookie(response, new_token)
    return TokenResponse(access_token=create_access_token(sub))


@router.post("/logout")
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)] = None,
) -> dict[str, bool]:
    if refresh_token is not None:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            if isinstance(jti, str):
                rt = await db.get(RefreshToken, jti)
                if rt and rt.revoked_at is None:
                    rt.revoked_at = datetime.now(UTC)
                    await db.commit()
        except JWTError:
            pass

    response.delete_cookie(key=_REFRESH_COOKIE, path="/api/auth", samesite="lax")
    return {"ok": True}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
