# Deploying Koushol to the VPS

Auto-deploy on every push to `main`: `.github/workflows/deploy.yml` builds the app in CI (so
Supabase build-time env vars stay in GitHub Secrets, never on the VPS), rsyncs the compiled
`dist/` into a new timestamped release directory, then SSHes in to atomically swap a `current`
symlink and reload nginx. Old releases beyond the last 5 are pruned automatically. The VPS only
ever needs nginx + SSH — no Node/npm/git required there.

## One-time VPS setup

Run these once, as a user with sudo (adjust `koushol` to whatever user you want deploys to run as):

```bash
# 1. Directory layout
sudo mkdir -p /var/www/koushol/releases
sudo chown -R $USER:$USER /var/www/koushol

# 2. Copy the two scripts from this folder onto the VPS
#    (scp deploy/activate-release.sh deploy/rollback.sh you@vps:/var/www/koushol/)
chmod +x /var/www/koushol/activate-release.sh /var/www/koushol/rollback.sh

# 3. Let this user reload nginx without a password (needed since activate-release.sh calls sudo)
echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" | sudo tee /etc/sudoers.d/koushol-deploy

# 4. Dedicated SSH keypair for GitHub Actions to deploy with
ssh-keygen -t ed25519 -f ~/.ssh/koushol_deploy -N "" -C "github-actions-deploy"
cat ~/.ssh/koushol_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/koushol_deploy   # copy this private key into the DEPLOY_SSH_KEY GitHub secret, then delete it locally if you like
```

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

Cloudflare Tunnel ingress should point at `http://localhost:80` as before — see the earlier
setup notes. Cloudflare terminates TLS at the edge, so nginx itself stays plain HTTP.

## GitHub repo secrets (Settings → Secrets and variables → Actions)

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | from Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | same page |
| `DEPLOY_HOST` | VPS IP or hostname |
| `DEPLOY_USER` | the VPS user set up above (e.g. `koushol`) |
| `DEPLOY_SSH_KEY` | the **private** key from `~/.ssh/koushol_deploy` generated above |
| `DEPLOY_BASE_PATH` | `/var/www/koushol` |

Once these are set, every push to `main` deploys automatically. You can also trigger a deploy
manually from the Actions tab (the workflow has `workflow_dispatch` enabled).

## Rollback

SSH into the VPS and run:

```bash
/var/www/koushol/rollback.sh            # lists available releases
/var/www/koushol/rollback.sh <release-id>  # switches back to one, reloads nginx instantly
```

## First deploy

The very first run needs at least one release to exist before `current` has anything to point
at — either let the first GitHub Actions run create it (the symlink swap in
`activate-release.sh` creates `current` if it doesn't exist yet), or manually build and rsync
once by hand before wiring up nginx.
