from datetime import UTC, datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"  # noqa: S105
REFRESH_TOKEN_TYPE = "refresh"  # noqa: S105
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)  # type: ignore[no-any-return]


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)  # type: ignore[no-any-return]


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    expire = datetime.now(UTC) + expires_delta
    payload = {"sub": subject, "exp": expire, "type": token_type}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)  # type: ignore[no-any-return]


def create_access_token(subject: str) -> str:
    return _create_token(
        subject,
        ACCESS_TOKEN_TYPE,
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject,
        REFRESH_TOKEN_TYPE,
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict[str, object]:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])  # type: ignore[no-any-return]
