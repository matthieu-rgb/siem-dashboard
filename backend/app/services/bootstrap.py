import secrets
import string

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.models import User, UserRole

log = structlog.get_logger()

_CHARS = string.ascii_letters + string.digits + "-_#@"
_SEP = "=" * 58


def _generate_password(length: int = 24) -> str:
    return "".join(secrets.choice(_CHARS) for _ in range(length))


async def bootstrap_admin(db: AsyncSession) -> None:
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    password = _generate_password()
    admin = User(
        email="admin@local",
        password_hash=hash_password(password),
        role=UserRole.admin,
    )
    db.add(admin)
    await db.commit()

    print(f"\n{_SEP}")
    print("  SIEM Dashboard - Bootstrap")
    print(f"  Admin email   : {admin.email}")
    print(f"  Initial pwd   : {password}   (change immediately)")
    print(f"{_SEP}\n")
    log.info("bootstrap.admin_created", email=admin.email)
