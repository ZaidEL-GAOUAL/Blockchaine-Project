#!/usr/bin/env bash
#
# install.sh — one-shot setup for the whole project (backend + frontend).
#
# Run from the repository root, in a bash shell:
#     bash install.sh
# (On Windows: use Git Bash or WSL, not PowerShell.)
#
# What it does:
#   1. checks prerequisites (docker, python, node, npm)
#   2. backend: creates .env, starts MongoDB (docker compose), creates a
#      Python virtualenv, installs deps, runs the tests
#   3. frontend: creates .env.local (points to the API), installs npm deps
#   4. prints the two commands to start the dev servers
#
# It is safe to re-run: existing .env files and installs are left in place.

set -eo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# ---- pretty output helpers ----
info() { printf "\n\033[1;34m==> %s\033[0m\n" "$1"; }
warn() { printf "\033[1;33m[!] %s\033[0m\n" "$1"; }
err()  { printf "\033[1;31m[x] %s\033[0m\n" "$1" >&2; }

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "'$1' is required but was not found. Install it and re-run."
    exit 1
  fi
}

# ---- 0. layout check (expects a merged repo) ----
[ -d "$ROOT/backend" ]  || { err "backend/ not found at repo root. Merge the backend branch first.";  exit 1; }
[ -d "$ROOT/frontend" ] || { err "frontend/ not found at repo root. Merge the frontend branch first."; exit 1; }

# ---- 1. prerequisites ----
info "Checking prerequisites"
need docker
need node
need npm
PYTHON="python3"; command -v python3 >/dev/null 2>&1 || PYTHON="python"
need "$PYTHON"
docker compose version >/dev/null 2>&1 || {
  err "'docker compose' (v2) is unavailable. Is Docker Desktop running?"
  exit 1
}
echo "    all prerequisites found."

# ---- 2. backend ----
info "Backend — environment file"
cd "$ROOT/backend"
if [ -f .env ]; then
  warn ".env already exists, leaving it untouched."
else
  cp .env.example .env
  echo "    .env created from .env.example (edit secrets if needed)."
fi

info "Backend — starting MongoDB (docker compose, detached)"
docker compose up -d

info "Backend — Python virtualenv + dependencies"
$PYTHON -m venv .venv
# Activate the venv (path differs between OSes)
if   [ -f .venv/bin/activate ];     then source .venv/bin/activate
elif [ -f .venv/Scripts/activate ]; then source .venv/Scripts/activate
else err "Could not find the venv activation script."; exit 1
fi
python -m pip install --quiet --upgrade pip
pip install -e ".[dev]"

info "Backend — running tests"
pytest -q || warn "Some backend tests failed (see above)."
deactivate 2>/dev/null || true

# ---- 3. frontend ----
info "Frontend — environment file"
cd "$ROOT/frontend"
if [ -f .env.local ]; then
  warn ".env.local already exists, leaving it untouched."
else
  printf "VITE_API_BASE_URL=http://localhost:8000\n" > .env.local
  echo "    .env.local created (VITE_API_BASE_URL=http://localhost:8000)."
fi

info "Frontend — installing npm dependencies"
npm install

# ---- 4. done ----
cd "$ROOT"
info "Setup complete."
cat <<'EOF'

MongoDB is running in Docker. Now open TWO terminals:

  Terminal 1 — backend API:
      cd backend
      # activate the virtualenv first:
      #   macOS / Linux / Git Bash:   source .venv/bin/activate
      #   Windows PowerShell:         .venv\Scripts\Activate.ps1
      uvicorn app.main:app --reload
      # -> http://localhost:8000/docs

  Terminal 2 — frontend:
      cd frontend
      npm run dev
      # -> http://localhost:5173

Useful:
      cd backend && docker compose ps     # is Mongo up?
      cd backend && docker compose down    # stop Mongo (keeps data)
      cd backend && docker compose down -v # stop Mongo AND wipe the database
EOF