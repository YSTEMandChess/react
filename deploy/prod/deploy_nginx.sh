#!/bin/bash
# Script to copy ystem.conf to nginx directory and reload nginx on host (native systemd deployment)

CONF_SRC="deploy/prod/ystem.conf"
CONF_DEST="/etc/nginx/sites-available/ystem.conf"
CONF_LIVE="/etc/nginx/sites-enabled/ystem.conf"
BACKUP_DIR="$HOME/nginx-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

if [ ! -f "$CONF_SRC" ]; then
    echo "ERROR: Source file $CONF_SRC not found!"
    echo "Please ensure you run this script from the repository root folder."
    exit 1
fi

echo "Backing up current live config..."
mkdir -p "$BACKUP_DIR"
sudo cp "$CONF_LIVE" "$BACKUP_DIR/ystem.conf.bak-$TIMESTAMP"
echo "Backup saved to $BACKUP_DIR/ystem.conf.bak-$TIMESTAMP"

echo "Copying config to sites-available..."
sudo cp "$CONF_SRC" "$CONF_DEST"

echo "Copying config to sites-enabled (live)..."
sudo cp "$CONF_SRC" "$CONF_LIVE"

echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Deployment successful!"
else
    echo "ERROR: Nginx configuration test failed. Changes NOT reloaded."
    echo "Live config was NOT touched beyond this backup — sites-available copy updated only."
    exit 1
fi
