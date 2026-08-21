#!/usr/bin/env bash
# Push-based release deploy, modeled on dr5hn/csc-export-tool's
# deploy-practice-vps.yml pattern: timestamped release dirs, atomic symlink
# cutover, a shared/ dir for data that must survive every release, health
# checks, and cleanup of old releases.
#
# Runs from WHEREVER the repo is checked out — your own machine, or a GitHub
# Actions runner after actions/checkout. It drives everything remotely over
# ssh/rsync; nothing needs to run "on" the server except what bootstrap.sh
# already set up once (Node, MongoDB, nginx, certbot, pm2, rsync, jq, and the
# shared/ directory with a real .env in it).
#
# Usage: ./deploy.sh
# Config: override any of these via environment variables before running.
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-65.20.78.101}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/library-management-system-}"
APP_NAME="library-api"
DOMAIN="rahulcodes.qd.je"
KEEP_RELEASES=5

SSH_TARGET="$DEPLOY_USER@$DEPLOY_HOST"
SSH_OPTS=(-p "$DEPLOY_PORT" -o BatchMode=yes)
SHARED_DIR="$DEPLOY_DIR/shared"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"

remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" bash -s
}

echo "==> Deploying $TIMESTAMP to $SSH_TARGET:$RELEASE_DIR"

echo "==> [1/8] Creating release directory"
remote <<EOF
set -euo pipefail
mkdir -p "$RELEASE_DIR"
EOF

echo "==> [2/8] Syncing files (rsync, excludes per .deployignore)"
rsync -az --delete \
  --exclude-from=.deployignore \
  -e "ssh -p $DEPLOY_PORT" \
  ./ "$SSH_TARGET:$RELEASE_DIR/"

echo "==> [3/8] Linking shared resources (.env, uploads/)"
remote <<EOF
set -euo pipefail
ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
ln -sfn "$SHARED_DIR/uploads" "$RELEASE_DIR/uploads"
EOF

echo "==> [4/8] Installing production dependencies"
remote <<EOF
set -euo pipefail
cd "$RELEASE_DIR"
npm ci
EOF

echo "==> [5/8] Validating the release before switching"
remote <<EOF
set -euo pipefail
cd "$RELEASE_DIR"
[ -f index.js ] || { echo "❌ index.js missing"; exit 1; }
[ -f frontend/index.html ] || { echo "❌ frontend/index.html missing"; exit 1; }
[ -f package.json ] || { echo "❌ package.json missing"; exit 1; }
[ -L .env ] || { echo "❌ .env symlink missing"; exit 1; }
[ -L uploads ] || { echo "❌ uploads symlink missing"; exit 1; }
echo "✅ Release validated"
EOF

echo "==> [6/8] Switching current -> $TIMESTAMP"
remote <<EOF
set -euo pipefail
cd "$DEPLOY_DIR"
ln -sfn "releases/$TIMESTAMP" current.tmp
mv -Tf current.tmp current
echo "✅ current -> \$(readlink current)"
EOF

echo "==> [7/8] Restarting pm2 + reloading nginx"
remote <<EOF
set -euo pipefail
cd "$DEPLOY_DIR"
pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
pm2 start current/ecosystem.config.js
pm2 save
nginx -t
systemctl reload nginx
EOF

echo "==> [8/8] Health checks"
remote <<EOF
set -euo pipefail
sleep 3

STATUS=\$(pm2 jlist | jq -r '.[] | select(.name=="$APP_NAME") | .pm2_env.status')
if [ "\$STATUS" != "online" ]; then
  echo "❌ pm2 app status: \$STATUS"
  pm2 logs "$APP_NAME" --lines 30 --nostream
  exit 1
fi
echo "✅ pm2 app online"

for i in 1 2 3 4 5; do
  if curl -fs --max-time 5 http://127.0.0.1:8080/ > /dev/null; then
    echo "✅ Backend responding on :8080"
    break
  fi
  [ "\$i" = 5 ] && { echo "❌ Backend not responding after 5 attempts"; pm2 logs "$APP_NAME" --lines 30 --nostream; exit 1; }
  sleep 3
done

if curl -fs --max-time 5 "http://$DOMAIN/" > /dev/null; then
  echo "✅ Frontend reachable via nginx at $DOMAIN"
else
  echo "❌ Frontend not reachable via nginx"
  exit 1
fi
EOF

echo "==> Cleaning up old releases (keeping last $KEEP_RELEASES)"
remote <<EOF
set -euo pipefail
cd "$DEPLOY_DIR/releases"
ls -t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf
EOF

echo ""
echo "🎉 Deploy complete: $TIMESTAMP"
echo "   https://$DOMAIN"
