#!/usr/bin/env bash
# One-time server setup for the release-based deploy (deploy.sh). Run this
# ONCE, directly on the server, as root:
#   ssh root@65.20.78.101
#   curl -fsSL https://raw.githubusercontent.com/rahulpawar-31/library-management-system-/main/deploy/bootstrap.sh | bash
#
# After this finishes: edit /var/www/library-management-system-/shared/.env
# with real secrets, then run ./deploy.sh from your own machine (or the
# "Deploy" GitHub Action) to push the first real release.
set -euo pipefail

DEPLOY_DIR="/var/www/library-management-system-"
SHARED_DIR="$DEPLOY_DIR/shared"
DOMAIN="rahulcodes.qd.je"

echo "==> Installing Node.js LTS"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "==> Installing MongoDB Community"
# If this Ubuntu release is too new for MongoDB's official repo to recognize,
# this falls back to the jammy (22.04) package set, which runs fine on newer
# Ubuntu too.
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
  > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org
systemctl enable --now mongod

echo "==> Installing nginx, certbot, rsync, jq"
apt-get install -y nginx certbot python3-certbot-nginx rsync jq

echo "==> Installing pm2"
npm install -g pm2

echo "==> Creating directory structure"
mkdir -p "$DEPLOY_DIR/releases"
mkdir -p "$SHARED_DIR/uploads"
mkdir -p "$SHARED_DIR/logs"

if [ ! -f "$SHARED_DIR/.env" ]; then
  echo "==> Writing a starter shared/.env — EDIT THIS before going live"
  cat > "$SHARED_DIR/.env" <<'EOF'
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/library-management-system
TOKEN_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_STRING
SALT=10
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-char-gmail-app-password
EOF
fi

# nginx needs a valid `current` target to serve (and for certbot's HTTP-01
# challenge) before the first real deploy.sh run exists. A tiny placeholder
# release covers that gap.
if [ ! -e "$DEPLOY_DIR/current" ]; then
  echo "==> Creating placeholder release so nginx has something to serve"
  PLACEHOLDER="$DEPLOY_DIR/releases/000_bootstrap_placeholder"
  mkdir -p "$PLACEHOLDER/frontend"
  echo "<h1>Deploying…</h1><p>Run deploy.sh to push the first release.</p>" \
    > "$PLACEHOLDER/frontend/index.html"
  ln -sfn "$PLACEHOLDER" "$DEPLOY_DIR/current"
fi

echo "==> Configuring nginx"
# Written inline (not copied from deploy/nginx.conf) since this script is run
# via `curl | bash` with no local repo checkout to copy from. Keep this in
# sync with deploy/nginx.conf in the repo.
cat > "/etc/nginx/sites-available/$DOMAIN" <<'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name rahulcodes.qd.je;

    root /var/www/library-management-system-/current/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
NGINX_EOF
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Requesting HTTPS certificate"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
  --register-unsafely-without-email --redirect

echo ""
echo "==> Bootstrap complete."
echo "    1. Edit $SHARED_DIR/.env with real secrets (at least TOKEN_SECRET)."
echo "    2. From your own machine: ./deploy.sh"
echo "    3. Visit https://$DOMAIN"
