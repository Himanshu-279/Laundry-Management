#!/bin/sh
set -e

# For Railway deployment: use actual backend URL
# For local Docker Compose: use default backend service
BACKEND_URL="${BACKEND_URL:-https://laundry-management-production-7947.up.railway.app}"

# Replace BACKEND_URL placeholder in nginx config
sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
