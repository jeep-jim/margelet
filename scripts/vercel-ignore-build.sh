#!/usr/bin/env bash
set -euo pipefail

COMMIT_AUTHOR="$(git log -1 --pretty=%an 2>/dev/null || true)"
COMMIT_SUBJECT="$(git log -1 --pretty=%s 2>/dev/null || true)"

printf 'Vercel ignore check: author=%s subject=%s\n' "$COMMIT_AUTHOR" "$COMMIT_SUBJECT"

echo "Running Vercel build: feed commits must deploy so production JSON cannot stay stale."
exit 1
