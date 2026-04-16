#!/bin/sh
set -e

# Use BACKEND_URL environment variable, or default to local backend for Docker Compose
BACKEND_URL="${BACKEND_URL:-http://backend:5000}"

# Replace BACKEND_URL placeholder in nginx config
sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
