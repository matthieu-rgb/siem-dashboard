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

## Local development

### Prerequisites

- Docker Desktop 4.x or Docker Engine 25+
- Docker Compose v2 (included in Docker Desktop)

### Step-by-step startup

```
git clone https://github.com/matthieu-rgb/siem-dashboard
cd siem-dashboard
cp .env.example .env
```

Edit `.env` and set at minimum:

```
SECRET_KEY=<random 64-char hex>    # python3 -c "import secrets; print(secrets.token_hex(32))"
WAZUH_HOST=https://your-wazuh:55000
WAZUH_USER=wazuh
WAZUH_PASS=your-password
```

Then start the stack using the helper script (recommended):

```
bash scripts/check_health.sh
```

This script:
1. Tears down any existing stack (`docker compose down -v`)
2. Builds and starts all services
3. Polls until all services are healthy (up to 120 seconds)
4. Extracts and saves the admin password to `.admin-password`
5. Prints the URL and credentials

Or start manually:

```
docker compose up --build -d
docker compose logs backend   # look for the "Initial pwd" block
```

Open http://localhost:8080 and log in with `admin@local` + the printed password.

### Admin credentials on first start

The backend prints a bootstrap block to its logs on the very first startup (when the database is empty):

```
==========================================================
  SIEM Dashboard - Bootstrap
  Admin email   : admin@local
  Initial pwd   : <random-password>   (change immediately)
==========================================================
```

This password is only shown once. The `check_health.sh` script saves it to `.admin-password` automatically. After the first login, change the password in the Settings page.

### Troubleshooting

**1. Services stuck in "Created" state after `docker compose up -d`**

This usually means Docker Desktop is in a bad state. Fix:

```
docker compose down -v
docker system prune -f
docker compose up --build -d
```

If it persists, restart Docker Desktop.

**2. Backend exits immediately / "Table 'users' does not exist"**

The database schema is managed by Alembic. The `entrypoint.sh` runs `alembic upgrade head` before starting uvicorn. If you see this error:

- Make sure the `backend-data` volume is writable: `docker volume inspect siem-backend-data`
- Do a clean restart: `docker compose down -v && docker compose up --build -d`

**3. SECRET_KEY validation error at startup**

The `SECRET_KEY` must be at least 32 characters and must not be the literal string `change-me-in-production`. Generate a valid key:

```
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Paste the output into `.env` as `SECRET_KEY=<value>`.

## Development (without Docker)

### Backend (FastAPI, Python 3.12)

```
cd backend
pip install -e ".[dev]"
alembic upgrade head
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
- [x] Phase 2 - Auth (JWT, bootstrap admin, RBAC)
- [ ] Phase 3 - Agents view
- [ ] Phase 4 - Alerts + WebSocket stream
- [ ] Phase 5 - Multi-user + invites
- [ ] Phase 6 - Production-ready (HTTPS, backup, observability)

## License

MIT
