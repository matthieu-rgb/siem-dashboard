import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

HTTP_OK = 200
SEMVER_PARTS = 3


@pytest.mark.asyncio
async def test_health_returns_ok() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")

    assert response.status_code == HTTP_OK
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.asyncio
async def test_health_version_format() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")

    version = response.json()["version"]
    parts = version.split(".")
    assert len(parts) == SEMVER_PARTS
    assert all(p.isdigit() for p in parts)
