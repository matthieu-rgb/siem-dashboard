import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, create_refresh_token, hash_password
from app.db.models import Base, User, UserRole
from app.db.session import get_db
from app.main import app

TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"  # noqa: S105
HTTP_OK = 200
HTTP_UNAUTHORIZED = 401
HTTP_TOO_MANY = 429


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        email=TEST_EMAIL,
        password_hash=hash_password(TEST_PASSWORD),
        role=UserRole.admin,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: User) -> None:
    response = await client.post(
        "/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == HTTP_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"  # noqa: S105
    cookies = response.cookies
    assert "refresh_token" in cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user: User) -> None:
    response = await client.post(
        "/api/auth/login",
        json={"email": TEST_EMAIL, "password": "wrongpassword"},
    )
    assert response.status_code == HTTP_UNAUTHORIZED


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "anything"},
    )
    assert response.status_code == HTTP_UNAUTHORIZED


@pytest.mark.asyncio
async def test_refresh_with_valid_cookie(client: AsyncClient, test_user: User) -> None:
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert login_resp.status_code == HTTP_OK

    refresh_resp = await client.post("/api/auth/refresh")
    assert refresh_resp.status_code == HTTP_OK
    data = refresh_resp.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_refresh_without_cookie(client: AsyncClient) -> None:
    response = await client.post("/api/auth/refresh")
    assert response.status_code == HTTP_UNAUTHORIZED


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, test_user: User) -> None:
    token = create_access_token(str(test_user.id))
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == HTTP_OK
    data = response.json()
    assert data["email"] == TEST_EMAIL
    assert data["role"] == UserRole.admin.value


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient) -> None:
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalidtoken"},
    )
    assert response.status_code == HTTP_UNAUTHORIZED


@pytest.mark.asyncio
async def test_me_refresh_token_rejected(client: AsyncClient, test_user: User) -> None:
    refresh_token = create_refresh_token(str(test_user.id))
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert response.status_code == HTTP_UNAUTHORIZED


@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient, test_user: User) -> None:
    await client.post(
        "/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    response = await client.post("/api/auth/logout")
    assert response.status_code == HTTP_OK
