#!/bin/bash
# Script to copy ystem.conf to nginx directory and reload nginx on host (native systemd deployment)

CONF_SRC="deploy/prod/ystem.conf"
CONF_DEST="/etc/nginx/sites-available/ystem.conf"
CONF_LINK="/etc/nginx/sites-enabled/ystem.conf"

if [ ! -f "$CONF_SRC" ]; then
    echo "ERROR: Source file $CONF_SRC not found!"
    echo "Please ensure you run this script from the repository root folder."
    exit 1
fi

echo "Copying config..."
sudo cp "$CONF_SRC" "$CONF_DEST"

if [ ! -L "$CONF_LINK" ]; then
    echo "Creating symlink..."
    sudo ln -s "$CONF_DEST" "$CONF_LINK"
fi

echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Deployment successful!"
else
    echo "ERROR: Nginx configuration test failed. Changes NOT reloaded."
    exit 1
fi
