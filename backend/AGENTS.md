# Backend conventions

## Structure

- `app/main.py` - FastAPI app factory, middleware, router includes
- `app/api/` - Route handlers (one file per resource)
- `app/core/` - Config, security utilities, logging
- `app/db/` - SQLAlchemy models, session factory, migrations
- `tests/` - pytest tests, mirror app/ structure

## Naming

- Endpoints: noun-plural, lowercase, hyphenated: `/api/auth/refresh-token`
- Router files: resource name singular: `health.py`, `agent.py`, `alert.py`
- Models: PascalCase: `User`, `AuditLog`
- Schemas (Pydantic): `UserCreate`, `UserRead`, `UserUpdate`
- Services: `user_service.py` with async functions

## Async rules

All I/O must be async. No `time.sleep()`. Use `asyncio.sleep()`.
DB sessions via `async with AsyncSession(engine) as session:`.
HTTP clients via `async with httpx.AsyncClient() as client:`.

## Logging

Use `structlog` with context binding. Never log passwords, tokens, or PII.

```python
import structlog
log = structlog.get_logger()
log.info("user.login", user_id=user.id, ip=request.client.host)
```

## Error handling

Use FastAPI `HTTPException` for client errors. Let unhandled exceptions
propagate to a global exception handler (to be added in Phase 2).

## Tests

One test file per API file: `tests/test_health.py`, `tests/test_auth.py`.
Use `httpx.AsyncClient(transport=ASGITransport(app=app))` for integration tests.
No mocking of the database - use in-memory SQLite for tests.
