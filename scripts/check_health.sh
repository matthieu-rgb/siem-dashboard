#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TIMEOUT=120
POLL_INTERVAL=5
PASSWORD_FILE="$ROOT_DIR/.admin-password"

cd "$ROOT_DIR"

echo "==> Tearing down existing stack (clean slate)..."
docker compose down -v 2>&1

echo ""
echo "==> Building and starting stack..."
docker compose up --build -d 2>&1

echo ""
echo "==> Waiting for all services to become healthy (timeout: ${TIMEOUT}s)..."
elapsed=0
while true; do
    # Count services that are not in a healthy or running state
    unhealthy=$(docker compose ps --format json 2>/dev/null \
        | python3 -c "
import sys, json
lines = sys.stdin.read().strip()
# Docker Compose outputs one JSON object per line (not a JSON array)
containers = []
for line in lines.splitlines():
    line = line.strip()
    if line:
        try:
            containers.append(json.loads(line))
        except Exception:
            pass
not_ready = []
for c in containers:
    state = c.get('State', '')
    health = c.get('Health', '')
    name = c.get('Name', c.get('Service', '?'))
    # A container is ready if: running with no healthcheck, or running+healthy
    if state != 'running':
        not_ready.append(name + ':' + state)
    elif health not in ('', 'healthy'):
        not_ready.append(name + ':' + health)
print(len(not_ready))
" 2>/dev/null || echo "error")

    if [ "$unhealthy" = "error" ]; then
        echo "  [${elapsed}s] Could not read compose status, retrying..."
    elif [ "$unhealthy" = "0" ]; then
        echo "  [${elapsed}s] All services are healthy."
        break
    else
        echo "  [${elapsed}s] Waiting... ($unhealthy service(s) not ready)"
    fi

    if [ "$elapsed" -ge "$TIMEOUT" ]; then
        echo ""
        echo "ERROR: Timeout after ${TIMEOUT}s. Last container states:"
        docker compose ps 2>&1
        echo ""
        echo "--- Backend logs ---"
        docker compose logs backend 2>&1 | tail -30
        echo ""
        echo "--- nginx logs ---"
        docker compose logs nginx 2>&1 | tail -10
        exit 1
    fi

    sleep "$POLL_INTERVAL"
    elapsed=$((elapsed + POLL_INTERVAL))
done

echo ""
echo "==> Extracting admin password from backend logs..."
admin_pwd=$(docker compose logs backend 2>&1 \
    | grep -A1 "Initial pwd" \
    | grep "Initial pwd" \
    | sed 's/.*Initial pwd   : //' \
    | sed 's/ .*//' \
    | tr -d '[:space:]')

if [ -z "$admin_pwd" ]; then
    echo "  (Admin already bootstrapped in a previous run - password not shown again)"
    echo "  Check .admin-password if you saved it during the first run."
else
    echo "$admin_pwd" > "$PASSWORD_FILE"
    echo "  Password saved to: $PASSWORD_FILE"
fi

echo ""
echo "=========================================================="
echo "  SIEM Dashboard is up and running!"
echo "  URL     : http://localhost:8080"
echo "  Email   : admin@local"
if [ -n "$admin_pwd" ]; then
    echo "  Password: $admin_pwd"
else
    echo "  Password: (see $PASSWORD_FILE or re-run with docker compose down -v)"
fi
echo "=========================================================="
echo ""
echo "  Change the admin password immediately after first login."
echo "  To stop: docker compose down"
echo "  To stop and reset: docker compose down -v"
