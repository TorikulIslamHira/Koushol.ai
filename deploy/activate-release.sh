#!/usr/bin/env bash
# Atomically points the "current" symlink at a freshly-rsynced release, reloads nginx, and
# prunes old releases beyond KEEP_RELEASES. Runs on the VPS, invoked by .github/workflows/deploy.yml
# over SSH after rsync has already placed the new build in releases/<release-id>/.
#
# Usage: activate-release.sh <release-id>
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
KEEP_RELEASES=5

RELEASE_ID="${1:?Usage: activate-release.sh <release-id>}"
RELEASE_PATH="$RELEASES_DIR/$RELEASE_ID"

if [ ! -d "$RELEASE_PATH" ]; then
  echo "Release $RELEASE_ID not found at $RELEASE_PATH" >&2
  exit 1
fi

# ln -sfn on the same filesystem is atomic — nginx never sees a half-swapped symlink.
ln -sfn "$RELEASE_PATH" "$CURRENT_LINK"
sudo systemctl reload nginx

echo "Activated release $RELEASE_ID"

# Prune old releases, keep the newest KEEP_RELEASES for rollback.
cd "$RELEASES_DIR"
ls -1t | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
  echo "Pruning old release: $old"
  rm -rf "${RELEASES_DIR:?}/$old"
done
