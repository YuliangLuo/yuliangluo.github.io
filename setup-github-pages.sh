#!/usr/bin/env bash
set -euo pipefail

GITHUB_USER="${1:-yuliangluo}"
REPO="${2:-${GITHUB_USER}.github.io}"
REMOTE="git@github.com:${GITHUB_USER}/${REPO}.git"

if [ ! -d .git ]; then
  git init
fi

git branch -M main
git add .
git commit -m "init VitePress tech blog" || true

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

echo "Remote: $REMOTE"
echo "Now run: git push -u origin main"
