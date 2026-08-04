#!/bin/bash
set -e

SERVICE_NAME="$1"     # systemd unit, e.g. chess-server.service
WORKING_DIR="$2"      # e.g. /home/azureuser/YSTEMandChess/react/chessServer
PORT="$3"             # e.g. 3001

if [ -z "$SERVICE_NAME" ] || [ -z "$WORKING_DIR" ] || [ -z "$PORT" ]; then
  echo "Usage: deploy-service.sh <service_name> <working_dir> <port>"
  exit 1
fi

echo "== Deploying $SERVICE_NAME =="

echo "== Pulling latest =="
cd "$WORKING_DIR"
git pull

echo "== Installing dependencies =="
npm install

echo "== Restarting $SERVICE_NAME =="
sudo systemctl restart "$SERVICE_NAME"
sleep 3

echo "== Smoke test: checking port $PORT =="
if sudo ss -ltnp | grep -q ":$PORT "; then
  echo "Deploy succeeded — $SERVICE_NAME is listening on $PORT."
else
  echo "FAILED — $SERVICE_NAME is not listening on $PORT after restart."
  echo "Recent logs:"
  sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
  exit 1
fi
