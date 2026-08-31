#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-main}"

echo "Checking PR commit authorship against origin/${BASE_REF}..."
git fetch origin "${BASE_REF}" --depth=50 2>/dev/null || true

AUTHORS=$(git log --format='%an' "origin/${BASE_REF}..HEAD" | sort -u | grep -v '^$' || true)
NORMALIZED_AUTHORS=$(echo "$AUTHORS" | sed 's/ToldYO/Ahmad Nakhala/' | sort -u | grep -v '^$' || true)
AUTHOR_COUNT=$(echo "$NORMALIZED_AUTHORS" | grep -v '^$' | wc -l)

echo "Commit authors on branch:"
echo "$AUTHORS"

if [ "$AUTHOR_COUNT" -gt 1 ]; then
  echo "ERROR: Branch contains commits by $AUTHOR_COUNT different authors."
  echo "Base your branch on the upstream PR branch or wait for it to land on main to keep PR authorship clean."
  exit 1
fi

echo "Authorship check passed (author: $NORMALIZED_AUTHORS)."
