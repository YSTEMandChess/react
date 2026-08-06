#!/bin/bash
set -e

REPO_DIR="/home/azureuser/YSTEMandChess/react/react-ystemandchess"
BUILD_DIR="$REPO_DIR/build"
BACKUP_DIR="/home/azureuser/deploy-backups/frontend-$(date +%Y%m%d%H%M%S)"
SERVICE="react-frontend.service"

echo "== Backing up current build =="
mkdir -p /home/azureuser/deploy-backups
cp -r "$BUILD_DIR" "$BACKUP_DIR"

# Rotate old backups — keep only the 5 most recent
ls -t /home/azureuser/deploy-backups/ | tail -n +6 | xargs -I {} rm -rf /home/azureuser/deploy-backups/{}

echo "== Pulling latest =="
cd "$REPO_DIR"
git pull

echo "== Building =="
npm install
npm run build

echo "== Restarting service =="
sudo systemctl restart "$SERVICE"
sleep 3

echo "== Smoke test =="
NEW_HASH=$(curl -s https://www.ystemandchess.com/ | grep -o 'main\.[a-z0-9]*\.js' || true)
echo "Live bundle hash: $NEW_HASH"

if [ -z "$NEW_HASH" ]; then
  echo "FAILED — rolling back"
  rm -rf "$BUILD_DIR"
  cp -r "$BACKUP_DIR" "$BUILD_DIR"
  sudo systemctl restart "$SERVICE"
  exit 1
fi

echo "Deploy succeeded."
