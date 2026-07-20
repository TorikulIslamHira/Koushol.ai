# Deploying Koushol to the VPS

Auto-deploy on every push to `main`: `.github/workflows/deploy.yml` runs on a **self-hosted
GitHub Actions runner installed directly on the VPS**. The VPS sits on a private network
(`172.16.x.x`), unreachable from GitHub's cloud-hosted runners, so build and deploy both
happen locally on the machine instead of over SSH/rsync from the outside — the runner only
needs an outbound connection to GitHub, nothing needs to reach in.

The workflow builds the app (Supabase build-time env vars come from GitHub Secrets), copies
the compiled `dist/` into a new timestamped release directory, then `activate-release.sh`
atomically swaps a `current` symlink and reloads nginx. Old releases beyond the last 5 are
pruned automatically, and `rollback.sh` can revert instantly if a deploy is bad.

## One-time VPS setup

Run as a user with sudo (this same user will run the self-hosted runner):

```bash
# 1. Directory layout
sudo mkdir -p /var/www/koushol/releases
sudo chown -R $USER:$USER /var/www/koushol

# 2. Copy the two scripts from this repo's deploy/ folder into place
#    (e.g. after cloning the repo once: cp deploy/activate-release.sh deploy/rollback.sh /var/www/koushol/)
chmod +x /var/www/koushol/activate-release.sh /var/www/koushol/rollback.sh

# 3. Let this user reload nginx without a password (needed since activate-release.sh calls sudo)
echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/koushol-deploy
```

## Install the self-hosted runner

1. GitHub repo → **Settings → Actions → Runners → New self-hosted runner**.
2. Pick **Linux**, then copy-paste the commands GitHub shows you (they include a
   registration token unique to that moment — don't reuse commands from a screenshot or an
   old guide, always get fresh ones from that page). It looks like:
   ```bash
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/vX.Y.Z/actions-runner-linux-x64-X.Y.Z.tar.gz
   tar xzf ./actions-runner-linux-x64.tar.gz
   ./config.sh --url https://github.com/<your-org>/Koushol.ai --token <TOKEN_FROM_THE_PAGE>
   ```
3. Run it as a persistent service so it survives reboots and SSH disconnects:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```
4. Confirm it shows **Idle** (green) on the same Settings → Actions → Runners page.

The runner needs internet access to reach `github.com` (outbound only — no inbound port
forwarding, no public IP, and no Cloudflare Tunnel involvement needed for this part at all).

## nginx config

Point `root` at the `current` symlink, not a release directory directly:

```nginx
server {
    listen 80;
    server_name koushol.xyz;
    root /var/www/koushol/current;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA routing
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/koushol /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Cloudflare Tunnel ingress should point at `http://localhost:80` — that part is unaffected by
the runner change, it's still just serving the built site to the outside world.

## GitHub repo secrets (Settings → Secrets and variables → Actions)

Only two are needed now — no SSH keys or VPS host/user, since the runner already lives on
the VPS itself:

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | from Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | same page |

Once these are set and the runner shows **Idle**, every push to `main` deploys automatically.
You can also trigger a deploy manually from the Actions tab (`workflow_dispatch` is enabled).

## Rollback

On the VPS:

```bash
/var/www/koushol/rollback.sh            # lists available releases
/var/www/koushol/rollback.sh <release-id>  # switches back to one, reloads nginx instantly
```

## First deploy

The very first workflow run creates `current` if it doesn't exist yet (the symlink swap in
`activate-release.sh` handles that) — no separate manual first-build step needed as long as
the runner is registered and nginx is pointed at `/var/www/koushol/current` beforehand.
