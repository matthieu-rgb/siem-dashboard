#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Checking alembic state..."

# `alembic current` prints the current revision (e.g. "0002 (head)") or is
# empty when the alembic_version table does not exist yet.
# If the DB was created by SQLAlchemy create_all (pre-alembic), stamp it at
# head so that `upgrade head` becomes a no-op instead of failing on existing tables.
current=$(alembic current 2>&1)
if echo "$current" | grep -q "(head)"; then
    echo "[entrypoint] Database already at head, nothing to do."
elif echo "$current" | grep -qE "^[0-9a-f]"; then
    echo "[entrypoint] Running alembic upgrade head..."
    alembic upgrade head
else
    # No version row found. Check whether the users table already exists
    # (legacy: created by create_all before alembic was introduced).
    # If it does, stamp at head. Otherwise run the full migration chain.
    db_path="${DATABASE_URL#sqlite+aiosqlite:///}"
    # Resolve relative path (./data/siem.db -> /app/data/siem.db from /app cwd)
    db_path="${db_path#./}"
    if [ -f "$db_path" ]; then
        table_exists=$(python3 -c "
import sqlite3, sys
try:
    conn = sqlite3.connect('$db_path')
    cur = conn.execute(\"SELECT name FROM sqlite_master WHERE type='table' AND name='users'\")
    print('yes' if cur.fetchone() else 'no')
    conn.close()
except Exception as e:
    print('no')
")
        if [ "$table_exists" = "yes" ]; then
            echo "[entrypoint] Legacy DB detected (no alembic_version). Stamping at head..."
            alembic stamp head
        else
            echo "[entrypoint] Fresh database. Running alembic upgrade head..."
            alembic upgrade head
        fi
    else
        echo "[entrypoint] No database file found. Running alembic upgrade head..."
        alembic upgrade head
    fi
fi

echo "[entrypoint] Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
