from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.db.models import User, UserRole
from app.db.session import get_db

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise HTTPException(status_code=401, detail="Wrong token type")

    user_id_raw = payload.get("sub")
    if not isinstance(user_id_raw, str):
        raise HTTPException(status_code=401, detail="Malformed token")

    result = await db.execute(select(User).where(User.id == int(user_id_raw)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def get_current_analyst_or_above(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role == UserRole.viewer:
        raise HTTPException(status_code=403, detail="Analyst access required")
    return current_user
