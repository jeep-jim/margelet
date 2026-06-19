#!/usr/bin/env bash
set -euo pipefail

COMMIT_AUTHOR="$(git log -1 --pretty=%an 2>/dev/null || true)"
COMMIT_SUBJECT="$(git log -1 --pretty=%s 2>/dev/null || true)"

printf 'Vercel ignore check: author=%s subject=%s\n' "$COMMIT_AUTHOR" "$COMMIT_SUBJECT"

if [ "$COMMIT_AUTHOR" = "github-actions[bot]" ] && [[ "$COMMIT_SUBJECT" == rebuild\ feed* ]]; then
  echo "Skipping Vercel build: feed snapshot commit from GitHub Actions."
  exit 0
fi

if [[ "$COMMIT_SUBJECT" == moderation:* ]]; then
  echo "Skipping Vercel build: live moderation state update."
  exit 0
fi

echo "Running Vercel build: normal application commit."
exit 1