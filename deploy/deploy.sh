#!/usr/bin/env bash
#
# deploy.sh — Standardized production deploy for the YSTEMandChess React frontend.
#
# Replaces the manual "SSH in and run commands by hand" process with a single,
# repeatable, fail-safe script.
#
# Usage (on the production VM):
#   chmod +x /home/azureuser/deploy.sh
#   /home/azureuser/deploy.sh
#
# What it does, in order:
#   1. Pulls the latest code      (git pull, fast-forward only)
#   2. Installs dependencies      (npm ci — clean, reproducible install)
#   3. Builds the React app       (npm run build)
#   4. Restarts the frontend      (systemctl restart react-frontend)
#   5. Confirms the service is up  (systemctl status)
#
# Safety: the script ABORTS on the first error (set -euo pipefail), so a failed
# build can never restart the service with a broken app.

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
APP_DIR="/home/azureuser/YSTEMandChess/react/react-ystemandchess"
SERVICE="react-frontend"
LOG_FILE="/home/azureuser/deploy.log"

# ── Logging helpers ─────────────────────────────────────────────────────────
# Every line is timestamped and written to both the screen and a log file so
# there's a record of past deploys.
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# If any command fails, this runs before the script exits — making failures loud
# instead of silent.
on_error() {
  log "❌ DEPLOY FAILED at line $1. Service was NOT restarted by a failed step."
  log "   Check the output above and $LOG_FILE. The previous version is still running."
  exit 1
}
trap 'on_error $LINENO' ERR

# ── Deploy ──────────────────────────────────────────────────────────────────
log "================ Starting deploy ================"

log "→ Moving into app directory: $APP_DIR"
cd "$APP_DIR"

log "→ Recording current commit (for rollback reference)..."
PREV_COMMIT="$(git rev-parse HEAD)"
log "   Current commit: $PREV_COMMIT"

log "→ Pulling latest code..."
git pull --ff-only

NEW_COMMIT="$(git rev-parse HEAD)"
if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
  log "   No new commits — already up to date (redeploying same code)."
else
  log "   Updated: $PREV_COMMIT -> $NEW_COMMIT"
fi

log "→ Installing dependencies (npm ci)..."
# npm ci is faster and reproducible: it installs exactly what's in
# package-lock.json. Falls back to npm install if no lockfile is present.
if [ -f package-lock.json ]; then
  npm ci
else
  log "   No package-lock.json found — falling back to npm install."
  npm install
fi

log "→ Building React app (npm run build)..."
npm run build

log "→ Restarting frontend service ($SERVICE)..."
sudo systemctl restart "$SERVICE"

# Give the service a moment to come up before checking its status.
sleep 3

log "→ Verifying service status..."
# 'is-active' returns non-zero (and our ERR trap fires) if the service failed.
if sudo systemctl is-active --quiet "$SERVICE"; then
  log "✅ $SERVICE is active and running."
else
  log "❌ $SERVICE is NOT active after restart!"
  sudo systemctl status "$SERVICE" --no-pager || true
  exit 1
fi

sudo systemctl status "$SERVICE" --no-pager || true

log "================ Deploy complete ✅ ================"
log "Rollback if needed:  cd $APP_DIR && git reset --hard $PREV_COMMIT && npm ci && npm run build && sudo systemctl restart $SERVICE"
