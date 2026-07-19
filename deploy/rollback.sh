#!/usr/bin/env bash
# Lists available releases, or switches "current" back to a given one. Run manually on the
# VPS when a deployed release needs to be reverted.
#
# Usage:
#   rollback.sh              # lists available release ids, newest first
#   rollback.sh <release-id> # switches current to that release and reloads nginx
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"

if [ $# -eq 0 ]; then
  echo "Available releases (newest first):"
  ls -1t "$RELEASES_DIR"
  echo
  echo "Currently active: $(readlink -f "$CURRENT_LINK" | xargs basename)"
  echo
  echo "Usage: rollback.sh <release-id>"
  exit 0
fi

RELEASE_ID="$1"
RELEASE_PATH="$RELEASES_DIR/$RELEASE_ID"

if [ ! -d "$RELEASE_PATH" ]; then
  echo "Release $RELEASE_ID not found at $RELEASE_PATH" >&2
  exit 1
fi

ln -sfn "$RELEASE_PATH" "$CURRENT_LINK"
sudo systemctl reload nginx
echo "Rolled back to release $RELEASE_ID"
