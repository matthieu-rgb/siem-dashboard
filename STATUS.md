# STATUS - SIEM Dashboard

Derniere mise a jour : 2026-05-03 (session 4 - ops)

## Phase courante
Phase 3 : Wazuh API + Alertes en temps reel

## Done
- [x] Subagents .claude/agents/* (6 agents) (session 1)
- [x] Backend FastAPI scaffold + GET /api/health + pytest (session 1)
- [x] Frontend Vite + React 18 + TS strict + TailwindCSS 4 + shadcn/ui init (session 1)
- [x] Home page health status with design tokens (session 1)
- [x] Docker Compose (nginx + backend + frontend, 3 services) (session 1)
- [x] nginx reverse proxy /api -> backend, / -> frontend (session 1)
- [x] .env.example exhaustif (session 1)
- [x] CI GitHub Actions (lint + tests + docker build) (session 1)
- [x] .gitignore, LICENSE MIT, README avec badge CI (session 1)
- [x] docker compose up --build fonctionne, http://localhost:8080 repond (session 1)
- [x] SQLAlchemy 2.0 async models : User, Invite, AuditLog, RefreshToken (session 3)
- [x] Alembic migrations 0001 (schema initial) + 0002 (refresh_tokens jti) (session 3)
- [x] argon2id hashing via passlib CryptContext (session 3)
- [x] JWT HS256 : access token 30min + refresh token 7j avec JTI (session 3)
- [x] JTI-based refresh token rotation + revocation (single-use, replay rejecte) (session 3)
- [x] httpOnly SameSite cookie pour refresh, Bearer pour access (session 3)
- [x] Rate limiter in-memory : 5 req/15min/IP (session 3)
- [x] Bootstrap admin@local au premier demarrage (session 3)
- [x] RBAC : get_current_user, get_current_admin, get_current_analyst_or_above (session 3)
- [x] 12 tests backend, ruff clean, mypy strict (session 3)
- [x] Security audit Phase 2 - 6 findings traites (2 Critical, 4 High) (session 3)
- [x] Frontend : Login page 360px + react-hook-form + zod (session 3)
- [x] Frontend : AuthContext (access token memoire + cookie refresh) (session 3)
- [x] Frontend : 401 interceptor -> refresh single-flight -> retry (session 3)
- [x] Frontend : ProtectedRoute + redirection /login (session 3)
- [x] Frontend : Sidebar 240px (collapsible Cmd+B, localStorage) (session 3)
- [x] Frontend : Topbar breadcrumb + Cmd+K hint (session 3)
- [x] Frontend : /agents stub (session 3)
- [x] Frontend : 8 tests, 100% couverture statements pages (session 3)
- [x] Backend entrypoint.sh : alembic upgrade head avant uvicorn (session 4)
- [x] Healthcheck start_period passe a 60s (session 4)
- [x] scripts/check_health.sh : bootstrap helper local dev (session 4)
- [x] README : section Local development + troubleshooting (session 4)

## In progress
(rien)

## Next - Phase 3
1. Wazuh API client (httpx, auth Basic, certificat self-signed)
2. GET /api/agents - liste agents Wazuh (proxy + cache Redis ou TTL)
3. GET /api/alerts - alertes recentes avec filtres (severity, agent, time range)
4. WebSocket /api/ws/alerts - stream alertes en temps reel
5. Frontend /agents : table dense TanStack Table + filtres
6. Frontend /alerts : stream live + slide-over detail
7. Frontend KPI cards sur / (agents actifs, alertes 24h, critiques 7j)

## Blockers
- Wazuh doit etre accessible depuis le backend (container ou tunnel)
- cookie_secure=False en dev (a passer True en prod via COOKIE_SECURE=true)

## Notes
- CORS_ORIGINS dans .env doit etre en JSON array : `["http://localhost:8080"]`
- Python 3.12 via pyenv (3.11 est le defaut du systeme)
- .venv dans backend/ pour dev local (`uv venv .venv --python 3.12`)
- SECRET_KEY doit etre >= 32 chars et != "change-me-in-production" (validator)
- TRUSTED_PROXY=true si derriere reverse proxy (active X-Forwarded-For pour IP rate limiting)
- OpenAPI docs desactives en prod (DEBUG=false) - activer avec DEBUG=true en dev
