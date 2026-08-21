# Deploying to rahulcodes.qd.je

Server: Vultr Ubuntu VPS, `65.20.78.101`, root access.
Deploy is manual-trigger only — nothing deploys automatically on push.

Pattern modeled on
[dr5hn/csc-export-tool](https://github.com/dr5hn/csc-export-tool)'s
practice-VPS workflow: push-based deploy via `rsync`, timestamped releases,
atomic symlink cutover, a `shared/` directory for data that must survive every
release, health checks, and cleanup of old releases — adapted for this app's
simpler stack (no Redis, no separate frontend build step since the frontend
is already static HTML/CSS/JS).

## How it works

```
/var/www/library-management-system-/
├── releases/
│   ├── 20260821_150000/   ← one full deploy's worth of files (rsynced)
│   └── 20260821_161200/
├── shared/
│   ├── .env                ← real secrets, persists across every release
│   ├── uploads/             ← book cover images, persists across every release
│   └── logs/                 ← pm2 logs, persists across every release
└── current -> releases/20260821_161200   ← symlink, switched atomically
```

Each deploy: creates a new timestamped release dir → rsyncs the repo into it
(excluding what's in `.deployignore`, notably `uploads/` and `.env`) →
symlinks `shared/.env` and `shared/uploads` into the release → `npm ci` →
validates the release → **atomically** repoints `current` at it → restarts
pm2 (`ecosystem.config.js`, whose `cwd` is always `current`) → reloads nginx
→ health-checks it → deletes releases beyond the last 5.

Because `current` only ever flips via one atomic symlink swap, there's no
window where the site serves a half-deployed release, and rolling back is
just repointing the symlink at an older release directory.

## One-time setup

1. **SSH access** — make sure you can `ssh root@65.20.78.101` (you're handling
   this part).
2. **Bootstrap the server** (installs Node, MongoDB, nginx, certbot, pm2,
   rsync, jq; creates `releases/`, `shared/uploads/`, `shared/logs/`, a
   starter `shared/.env`, and a placeholder `current` so nginx has something
   to serve; requests the HTTPS cert):
   ```bash
   ssh root@65.20.78.101
   curl -fsSL https://raw.githubusercontent.com/rahulpawar-31/library-management-system-/main/deploy/bootstrap.sh | bash
   ```
3. **Set real secrets** — edit `/var/www/library-management-system-/shared/.env`
   on the server. At minimum, change `TOKEN_SECRET` to a real random value.
   `EMAIL_USER`/`EMAIL_PASS` only matter if you want the forgot-password OTP
   email to work. No redeploy needed to pick this up — just:
   ```bash
   cd /var/www/library-management-system- && pm2 restart library-api --update-env
   ```
4. **Push the first real release** — from your own machine, with the repo
   checked out:
   ```bash
   ./deploy.sh
   ```
5. **GitHub Actions secrets** (only needed if you want the "Run workflow"
   button instead of running `./deploy.sh` locally) — add under repo
   **Settings → Secrets and variables → Actions**:
   | Secret | Value |
   |---|---|
   | `DEPLOY_HOST` | `65.20.78.101` |
   | `DEPLOY_USER` | `root` |
   | `DEPLOY_SSH_KEY` | The **private** key whose public half is in the server's `~/.ssh/authorized_keys` |
   | `DEPLOY_PORT` | `22` (optional — `deploy.sh` defaults to 22 if unset) |

## Deploying an update

Either:
- **Locally**: `./deploy.sh` from the repo root (needs `ssh`/`rsync` and
  working SSH access to the server).
- **GitHub UI**: Actions tab → "Deploy Library Management System (Practice VPS)"
  → "Run workflow" (checks out the repo on a runner, then runs the same
  `deploy.sh`).

## Useful commands (on the server)

```bash
pm2 status                       # is it running?
pm2 logs library-api             # tail app logs (also in shared/logs/)
ls -la /var/www/library-management-system-/releases/   # release history
readlink /var/www/library-management-system-/current   # what's live right now
nginx -t && systemctl reload nginx
```

## Rolling back

Every past release is still on disk (last 5 are kept). Roll back by
repointing the symlink and restarting — no rsync, no rebuild:

```bash
cd /var/www/library-management-system-
ls -t releases/                  # find the release to roll back to
ln -sfn "releases/<timestamp>" current.tmp && mv -Tf current.tmp current
pm2 restart library-api
```

## Known limitation carried over from local dev

MongoDB runs locally on this same VPS (no managed database) — fine for now,
but if this ever needs to scale or you want off-box backups, switch
`MONGO_URI` in `shared/.env` to a managed MongoDB (e.g. Atlas) and skip the
MongoDB install step in `bootstrap.sh` on any future server.
