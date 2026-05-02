# SIEM Dashboard

[![CI](https://github.com/matthieu-rgb/siem-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/matthieu-rgb/siem-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Lightweight Wazuh interface inspired by Linear.app. Replaces OpenSearch Dashboards with a fast, keyboard-driven UI designed for security analysts.

> Screenshot placeholder - coming after Phase 3

## Features

- Dark-first UI (Linear aesthetic)
- Agents overview with live status
- Alert stream with real-time WebSocket feed
- Faceted filters (severity, agent, rule, time range)
- Multi-user with role-based access (admin / analyst / viewer)
- Optional TOTP MFA
- Invite-based user onboarding (no SMTP required)

## Quick start

**Prerequisites:** Docker and Docker Compose v2.

```
git clone https://github.com/matthieu-rgb/siem-dashboard
cd siem-dashboard
cp .env.example .env
# Edit .env: set WAZUH_HOST, WAZUH_USER, WAZUH_PASS
docker compose up --build
```

Open http://localhost:8080. The bootstrap admin credentials are printed in the backend container logs on first start.

## Development

### Backend (FastAPI, Python 3.12)

```
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Tests:

```
pytest --cov=app
```

### Frontend (React 18 + Vite + TailwindCSS 4)

```
cd frontend
npm install
npm run dev
```

Tests:

```
npm run test:run
```

## Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | FastAPI, Pydantic v2, SQLAlchemy 2.0, aiosqlite |
| Frontend | React 18, TypeScript 5, TailwindCSS 4, shadcn/ui |
| Proxy    | nginx                                           |
| Auth     | JWT (access + refresh), argon2id, TOTP          |
| Data     | Wazuh Indexer (OpenSearch) + SQLite             |

## Architecture

```
User -> nginx (8080) -> /api/*  -> FastAPI (8000)
                     -> /ws/*   -> FastAPI WebSocket
                     -> /       -> React SPA (static)

FastAPI -> Wazuh Manager API  (https://<host>:55000)
        -> Wazuh Indexer      (https://<host>:9200)
        -> SQLite             (users, tags, notes, audit log)
```

## Roadmap

- [x] Phase 1 - Scaffolding
- [ ] Phase 2 - Auth (JWT, bootstrap admin, RBAC)
- [ ] Phase 3 - Agents view
- [ ] Phase 4 - Alerts + WebSocket stream
- [ ] Phase 5 - Multi-user + invites
- [ ] Phase 6 - Production-ready (HTTPS, backup, observability)

## License

MIT
