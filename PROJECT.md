# SIEM Dashboard - Project Brief

> Brief technique de reference pour Claude Code. A lire en premier a chaque
> nouvelle session, avant tout autre fichier. Ne pas modifier sans validation.

## 1. Mission

Construire une interface web moderne et legere qui remplace le Wazuh Dashboard
natif (OpenSearch Dashboards) par une UI inspiree de Linear.app, deployable en
moins de 10 minutes par n'importe qui via Docker Compose.

Cible : usage perso multi-endpoints (Mac, Windows, Raspberry Pi) connectes a
un Wazuh Manager sur VPS, avec possibilite d'inviter d'autres utilisateurs
en lecture ou en lecture/ecriture.

Repo public sur GitHub, licence MIT, documentation soignee, screenshots et demo.

## 2. Architecture validee

```
VPS 8 Go RAM
+-- Wazuh Manager + Indexer (existant, deploye via Ansible)
+-- nginx reverse proxy + Let's Encrypt (HTTPS forcee)
+-- Backend FastAPI
|     +-- Proxy vers Wazuh Manager API (REST, port 55000)
|     +-- Proxy vers Wazuh Indexer (OpenSearch DSL, port 9200)
|     +-- Auth JWT + RBAC 3 roles
|     +-- SQLite locale (users, invites, tags, notes, audit log)
|     +-- LRU cache en memoire pour requetes lourdes
+-- Frontend React (build statique servi par nginx)
```

3 containers Docker au total : `nginx`, `backend`, `frontend-build` (le build
peut etre servi directement par nginx, donc en realite 2 services runtime).

### Pourquoi cette archi

- **Pas de PostgreSQL en plus** : le Wazuh Indexer est deja une vraie base
  OpenSearch, on l'utilise comme datastore d'alertes. Full-text search,
  agregation, historique long, tout y est.
- **Pas de Redis** : le cache en memoire FastAPI suffit pour un dashboard
  perso. Si bottleneck en v2, on ajoute.
- **SQLite locale** : seulement pour les donnees app (users, tags custom sur
  alertes, notes d'incident, journal d'audit). Volume estime < 100 Mo.
- **Frontend statique** : Vite build, servi par nginx. Pas de SSR inutile.

### Communication

```
User -> nginx (443/tcp, HTTPS)
        +-- /          -> Frontend statique
        +-- /api/*     -> FastAPI (8000/tcp interne)
        +-- /ws/*      -> FastAPI WebSocket (alertes temps reel)

FastAPI -> Wazuh Manager API (https://wazuh-mgr:55000)  via token
        -> Wazuh Indexer    (https://wazuh-indexer:9200) via basic auth
```

## 3. Stack technique

### Backend

- Python 3.12
- FastAPI 0.115+
- Pydantic v2
- httpx (client async vers Wazuh)
- python-jose (JWT)
- passlib + argon2-cffi (hash mots de passe)
- pyotp (TOTP MFA optionnel)
- SQLAlchemy 2.0 + aiosqlite
- alembic (migrations)
- pytest + pytest-asyncio + httpx test client
- ruff (lint + format)
- mypy (typage strict)
- bandit (security scan)

### Frontend

- React 18
- TypeScript 5 strict mode
- Vite 6
- TailwindCSS 4
- shadcn/ui (Radix sous le capot)
- recharts (graphes)
- lucide-react (icones)
- framer-motion (transitions)
- @tanstack/react-query (state serveur + cache)
- @tanstack/react-table (tables avec tri/filtre)
- react-hook-form + zod (formulaires + validation)
- vitest + react-testing-library
- eslint + prettier

### DevOps

- Docker + Docker Compose
- nginx alpine
- GitHub Actions CI (lint, tests, build, docker build)
- Trivy ou Grype pour le scan d'images Docker
- gitleaks pour les secrets dans le code
- dependabot pour les mises a jour

## 4. Modele multi-utilisateurs

### Roles

- **admin** : tout y compris gestion users + invites + config
- **analyst** : lecture alertes, ajout tags, notes, acquittement
- **viewer** : lecture seule

### Bootstrap (premier lancement)

Au premier `docker compose up`, le backend detecte une base SQLite vide et
genere un compte admin avec un mot de passe aleatoire affiche dans les logs
Docker (style Vaultwarden, Gitea). Pattern :

```
==========================================================
  SIEM Dashboard - Bootstrap
  Admin email   : admin@local
  Initial pwd   : kQ8x-m2N-9Hr4-t6Vz   (a changer immediatement)
  Bootstrap key : se trouve dans /data/bootstrap.lock
==========================================================
```

### Invitations

L'admin invite via l'UI : email + role -> token UUID + expiration 48h.
Le token est affiche en clair dans l'UI (lien copiable), pas d'envoi mail
automatique (pas de SMTP a configurer, c'est volontaire).

L'invite ouvre le lien `/invite/<token>`, choisit son mot de passe, c'est fait.

### MFA

TOTP optionnel par utilisateur (RFC 6238). Activable depuis Settings.
QR code genere cote backend (pyotp + qrcode), recovery codes generes a
l'activation et affiches une seule fois.

## 5. Strategie d'economie de tokens

> Critique pour ce projet. Chaque session Claude Code doit etre cadree.

### Regle 1 : sessions thematiques courtes

Une session = un objectif unique. Pas de session "on avance sur le projet".
Exemples de scope acceptable :
- "Setup du repo + scaffolding initial backend + frontend"
- "Implementer l'auth JWT + bootstrap admin + tests"
- "Vue Agents : tableau, filtres, tri, pagination"
- "WebSocket alertes temps reel + debounce client"

### Regle 2 : trois fichiers de tete a chaque session

Au demarrage de toute session, Claude Code lit dans cet ordre, sans rien
ajouter d'autre au contexte initial :

1. `PROJECT.md` (ce fichier) - le quoi
2. `DESIGN.md` - le visuel
3. `STATUS.md` - ou on en est

Si la session porte sur du backend, lecture en plus de `backend/AGENTS.md`.
Idem pour le frontend. Pas de `cat` global du repo.

### Regle 3 : STATUS.md mis a jour en fin de session

Format strict de STATUS.md :

```markdown
# STATUS - SIEM Dashboard

Derniere mise a jour : YYYY-MM-DD HH:MM (par session #N)

## Phase courante
Phase 2 : Auth + Multi-user

## Done
- [x] Scaffolding repo (session 1)
- [x] Docker Compose squelette (session 1)
- [x] Backend FastAPI hello world (session 1)
- [x] Frontend Vite + Tailwind (session 1)

## In progress
- [ ] Bootstrap admin + login JWT (session 2, 70%)

## Next session
1. Finir login + tests pytest auth
2. Frontend : page /login + redirection
3. Middleware RBAC backend

## Blockers
Aucun.

## Notes
- Token Wazuh API expire toutes les 15 min, gere via refresh dans
  WazuhClient.get_token() avec lock asyncio.
```

### Regle 4 : commits frequents et atomiques

Convention : Conventional Commits.

```
feat(auth): add JWT login endpoint with bcrypt verification
fix(agents): correct pagination off-by-one in /api/agents
chore(deps): bump fastapi to 0.115.4
test(auth): add tests for token expiration
docs(readme): add screenshots and demo gif
ci: add trivy scan to docker build workflow
```

Un commit = une idee. Pas de "WIP" ni de "fix stuff".

### Regle 5 : pas d'allers-retours inutiles

Claude Code applique les principes :
- Lire le code existant avant de proposer
- Ne pas reposer une question deja repondue dans PROJECT.md ou STATUS.md
- Faire les changements et les tests dans la meme passe
- Demander uniquement si une decision architecturale n'est pas couverte
- Sinon trancher avec un commentaire `# DECISION: <pourquoi>` dans le code

## 6. Subagents Claude Code

> A creer dans `.claude/agents/` a la racine du repo. Chaque subagent a son
> propre contexte, ce qui economise massivement les tokens : on n'invoque
> que celui dont on a besoin pour la tache courante.

### .claude/agents/backend-dev.md

```yaml
---
name: backend-dev
description: >
  Develops and reviews FastAPI backend code. Use for endpoints, services,
  database models, async logic, Wazuh API integration, JWT auth, tests.
  Knows Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, httpx, pytest.
tools: Read, Edit, Bash, Grep, Glob
---

You are a senior Python backend engineer focused on FastAPI applications.

Hard rules :
- Always use async/await for I/O.
- Pydantic v2 models for all request/response schemas.
- No SQLAlchemy 1.x patterns. Use 2.0 with async sessions and select().
- Type hints everywhere, mypy strict.
- pytest for tests, no unittest.
- httpx for HTTP, no requests.
- Never log secrets. Use structured logging with structlog.
- Apply principle of least privilege on Wazuh API calls.

Workflow :
1. Read PROJECT.md and STATUS.md before any change.
2. Read backend/AGENTS.md for backend-specific conventions.
3. Implement feature + tests in same commit.
4. Run ruff, mypy, pytest before declaring done.
5. Update STATUS.md at end.
```

### .claude/agents/frontend-dev.md

```yaml
---
name: frontend-dev
description: >
  Develops and reviews React + TypeScript frontend code. Use for components,
  pages, hooks, API client, forms, state management, accessibility.
  Knows React 18, TypeScript strict, TailwindCSS, shadcn/ui, react-query.
tools: Read, Edit, Bash, Grep, Glob
---

You are a senior frontend engineer specialized in React + TypeScript apps
with a strong eye for design.

Hard rules :
- Strict TypeScript, no `any`. Use `unknown` and narrow.
- Functional components, hooks only.
- TailwindCSS utility classes, never inline style.
- Composants shadcn/ui en base, jamais reinventer un Dialog.
- @tanstack/react-query pour TOUT etat serveur. useState seulement pour UI.
- Accessibilite : roles ARIA, focus management, keyboard nav.
- Respect strict de DESIGN.md (couleurs, spacings, typo).
- Aucun appel fetch direct, toujours via le client api/ centralise.

Workflow :
1. Read PROJECT.md, DESIGN.md, STATUS.md.
2. Read frontend/AGENTS.md.
3. Build component + story + test in one commit.
4. Run eslint, tsc --noEmit, vitest before done.
5. Update STATUS.md.
```

### .claude/agents/security-auditor.md

```yaml
---
name: security-auditor
description: >
  Reviews code, dependencies, Docker images and configs for security issues.
  Auto-invoke before any tag/release. Specialised in OWASP Top 10, supply
  chain attacks, secret leaks, container escape, JWT pitfalls, SQL injection,
  SSRF, IDOR. Knows Wazuh-specific risks (token leak, API key in URL).
tools: Read, Bash, Grep, Glob
---

You are a senior application security engineer. You review code with
adversarial mindset.

Checklist applied to every audit :
1. Auth flow : JWT signature algo (no `none`), expiry, refresh, revocation.
2. Password storage : argon2id, no md5/sha1/bcrypt-only.
3. Input validation : Pydantic on every endpoint, size limits.
4. Output encoding : React handles by default, but check dangerouslySetInnerHTML.
5. CORS : restrictive, no `*`.
6. CSRF : SameSite cookies, double-submit if cookies used.
7. Secrets : no hardcoded keys, .env.example without real values, gitleaks pass.
8. Dependencies : pip-audit, npm audit, no critical CVEs.
9. Docker : non-root user, slim base image, .dockerignore correct,
   trivy scan zero critical.
10. Wazuh API : token never in URL, never logged, refreshed before expiry,
    HTTPS verification not disabled.
11. SQLite : parameterised queries via SQLAlchemy, no string interpolation.
12. Rate limiting : on /login, /invite, /api/auth/*.
13. Audit log : every admin action logged with actor, target, timestamp.
14. SSRF : Wazuh hostnames are env-configured and validated.

Output : a markdown report saved as `audits/YYYY-MM-DD-audit.md` with
findings ranked Critical/High/Medium/Low + remediation suggestions + diff
patches when feasible. Never auto-apply patches without confirmation.
```

### .claude/agents/design-guardian.md

```yaml
---
name: design-guardian
description: >
  Enforces DESIGN.md compliance across all UI code. Reviews PRs for
  consistent use of design tokens, components, spacing, typography.
  Use proactively after any frontend change.
tools: Read, Grep, Glob
---

You are the design system custodian. Your job is to refuse divergence from
DESIGN.md and propose conforming alternatives.

Checks :
- Colors via Tailwind tokens defined in tailwind.config.ts. No raw hex.
- Spacings from the 4px scale. No `pt-3.5` weird values.
- Typography from the type scale (xs, sm, base, lg, xl, 2xl, 3xl).
- Radius : sm (6px), md (8px), lg (12px), full (9999px). No others.
- Shadows : only the 3 levels defined in DESIGN.md.
- Icons : lucide-react only, size 16 or 20 in dense UIs.
- Components : shadcn/ui first. New custom only if no equivalent exists,
  with justification in commit message.
- Density rule : tables and lists use compact density by default
  (line-height: 1.4, py-2 max).
- Animations : transitions 150ms or 200ms, ease-out. No bouncy springs.
- Dark mode : everything tested in dark, no light-only assumptions.

When deviation is found, output : the file, the line, the violation,
the proposed fix as a one-line edit suggestion. Do not modify code.
```

### .claude/agents/ops-engineer.md

```yaml
---
name: ops-engineer
description: >
  Owns Docker Compose, nginx config, deployment scripts, GitHub Actions,
  Let's Encrypt automation, backup strategy, observability. Use for any
  infra, CI/CD, or production-readiness concern.
tools: Read, Edit, Bash, Grep, Glob
---

You are a senior DevOps engineer. You optimise for reliability, simplicity,
and zero-downtime updates.

Standards :
- docker-compose.yml uses named volumes, healthchecks, restart: unless-stopped.
- Images pinned by digest in production compose, by tag in dev.
- nginx : HSTS, CSP, security headers, rate limiting on /api/auth/*,
  HTTP/2 enabled, gzip+brotli for static assets.
- Let's Encrypt via traefik or certbot+sidecar, auto-renewal verified.
- GitHub Actions : matrix Python 3.12 + Node 22, cached deps, parallel jobs.
- Releases tagged with semver, changelog auto-generated.
- Backup : nightly cron sqlite .backup -> tar.gz -> rclone to remote
  (B2, S3-compatible). Documented in docs/BACKUP.md.

Workflow :
1. Read PROJECT.md and STATUS.md.
2. Validate every infra change locally with `docker compose up --build`.
3. Update docs/DEPLOY.md with any deployment-impacting change.
4. Update STATUS.md.
```

### .claude/agents/status-keeper.md

```yaml
---
name: status-keeper
description: >
  Lightweight agent invoked at the end of every session to update STATUS.md
  consistently. Reads recent git log and current STATUS.md, produces the
  updated version.
tools: Read, Edit, Bash
---

You update STATUS.md based on the work done in the current session.

Workflow :
1. Run `git log --oneline -n 30` to see recent commits.
2. Read current STATUS.md.
3. Move completed items from "In progress" to "Done" with session number.
4. Add newly started items to "In progress" with rough %.
5. Write a "Next session" section with 2-4 actionable items.
6. Note any blockers explicitly.
7. Keep total file under 200 lines, archive older items into
   docs/CHANGELOG.md.
```

## 7. Roadmap

### Phase 0 - Brief (cette etape, hors Claude Code)
- [x] PROJECT.md ecrit
- [x] DESIGN.md ecrit
- [ ] Repo GitHub vide cree
- [ ] Fichiers commit en initial commit

### Phase 1 - Scaffolding (1 session Claude Code)
- Repo structure
- Docker Compose squelette
- Backend FastAPI hello world + healthcheck
- Frontend Vite + Tailwind + shadcn/ui init
- nginx config minimale
- README de base
- CI : lint + tests + build
- Subagents .claude/agents/* crees

### Phase 2 - Auth (2 sessions)
- Bootstrap admin avec mdp affiche en logs
- POST /api/auth/login (JWT access + refresh)
- POST /api/auth/refresh
- Middleware RBAC
- Frontend : page /login, store auth, redirection
- Tests backend + frontend
- Audit security-auditor

### Phase 3 - Vue Agents (1 session)
- GET /api/agents (liste, filtres, pagination)
- Frontend : page /agents avec table shadcn
- Polling toutes les 30s
- Etat empty + error + loading

### Phase 4 - Vue Alerts (2 sessions)
- GET /api/alerts (filtres : level, agent, rule, time range)
- WebSocket /ws/alerts (stream temps reel via tail alerts.json)
- Frontend : page /alerts, stream, filtres facetes
- Detail alerte (slide-over panel)

### Phase 5 - Multi-user (1 session)
- POST /api/invites (admin only)
- POST /api/invites/<token>/accept
- Page /settings/users
- Tags/notes sur alertes (lecture+ecriture pour analyst)

### Phase 6 - Production-ready (1 session)
- HTTPS Let's Encrypt
- Backup script
- Observability minimale (logs structures, /metrics)
- Documentation deploiement
- Audit security final
- Premiere release v0.1.0

### Phase 7+ - Polish et features
- TOTP MFA
- Vue Rules
- Vue Timeline
- Command palette
- Integration Telegram/Discord pour alertes
- Theme light optionnel
- i18n FR/EN

## 8. Gates de qualite (CI obligatoire)

Tout PR doit passer :

### Backend
- `ruff check` (lint)
- `ruff format --check`
- `mypy --strict`
- `pytest --cov=app --cov-fail-under=80`
- `bandit -r app/`
- `pip-audit`

### Frontend
- `eslint`
- `tsc --noEmit`
- `vitest run --coverage` (seuil 70%)
- `npm audit --audit-level=high`

### Docker
- `trivy image` (zero critical, zero high)
- `hadolint Dockerfile`

### Repo
- `gitleaks detect`
- pas de fichier > 1 Mo
- pas de .env reel commit

## 9. Strategie de deploiement

### Local dev
```
docker compose up --build
# acces : http://localhost:8080
```

### Production VPS
```
git clone https://github.com/matthieu-rgb/siem-dashboard
cd siem-dashboard
cp .env.example .env
vim .env  # WAZUH_HOST, WAZUH_USER, WAZUH_PASS, DOMAIN, etc
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# acces : https://<DOMAIN>
```

Mises a jour :
```
git pull
docker compose pull
docker compose up -d
```

## 10. Contraintes open source

Le projet doit etre installable par un inconnu en moins de 10 minutes :

- README clair avec : screenshots, demo gif, prerequis exacts, install
  pas-a-pas, troubleshooting des 5 erreurs les plus probables.
- `.env.example` exhaustif et commente.
- `docker-compose.yml` standalone qui marche en dev local.
- `docker-compose.prod.yml` overlay pour prod (HTTPS, healthcheck strict).
- LICENSE MIT.
- CONTRIBUTING.md court mais explicite.
- CODE_OF_CONDUCT.md (Contributor Covenant 2.1).
- Issues templates : bug, feature, security.
- Security policy SECURITY.md (comment reporter une vuln).
- Releases GitHub avec changelog.

## 11. Hors scope

Pour ne pas se disperser, sont explicitement EXCLUS du MVP :

- Theme light (dark only au depart)
- i18n (anglais only au depart)
- Mobile native app
- SSO (SAML, OIDC)
- LDAP integration
- Multi-tenant (un dashboard = un Wazuh Manager)
- Custom plugins / marketplace
- Notifications email integrees (besoin SMTP, on prefere webhook)

## 12. Decisions architecturales (ADR rapides)

- **ADR-001** : SQLite plutot que PostgreSQL. Justification : volume app
  data < 100 Mo, simplicite de deploiement, backup trivial.
- **ADR-002** : Pas de Redis. Justification : LRU cache memoire suffit pour
  un dashboard mono-instance, ajout possible en v2.
- **ADR-003** : Wazuh Indexer comme datastore d'alertes. Justification :
  deja installe, deja optimise pour le search, eviter doublon.
- **ADR-004** : JWT plutot que sessions cote serveur. Justification :
  stateless, simple a tester, pas de table sessions a maintenir.
- **ADR-005** : Pas d'envoi d'email automatique. Justification : SMTP est
  une source de friction enorme en self-hosted, on prefere copier-coller
  un lien d'invite.

---

> Ce document est la verite de reference. En cas de divergence avec le code,
> on corrige le code. Avant de modifier ce document, en discuter avec
> Matthieu (le proprietaire du projet).
