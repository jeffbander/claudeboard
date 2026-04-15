#!/bin/bash
# run-daemon.sh — starts the ClaudeBoard coding daemon with env vars loaded
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  .env.local not found"
  exit 1
fi

# Load .env.local — strip full-line comments and inline comments, skip blanks
while IFS= read -r line; do
  # Strip leading whitespace
  line="${line#"${line%%[![:space:]]*}"}"
  # Skip blank lines and comment lines
  [[ -z "$line" || "$line" == \#* ]] && continue
  # Strip inline comments (anything after ' #')
  line="${line%% #*}"
  # Only export lines that contain '='
  if [[ "$line" == *"="* ]]; then
    export "$line"
  fi
done < "$ENV_FILE"

echo "✅  Env loaded"
echo "   CONVEX: $NEXT_PUBLIC_CONVEX_URL"
echo "   GITHUB_TOKEN: ${GITHUB_TOKEN:0:20}..."

# Verify dependencies
for cmd in claude gh tsx; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌  Missing: $cmd"
    exit 1
  fi
done
echo "✅  claude, gh, tsx all found"

# Verify gh auth
if ! gh auth status &>/dev/null; then
  echo "❌  gh not authenticated — run: gh auth login"
  exit 1
fi
echo "✅  gh authenticated"

echo ""
echo "🚀  Starting ClaudeBoard daemon..."
echo "   Polling every ${CLAUDEBOARD_POLL_MS:-10000}ms"
echo "   Workspace: ${CLAUDEBOARD_WORKSPACE:-$HOME/.claudeboard/workspaces}"
echo ""

cd "$SCRIPT_DIR"
exec npx tsx daemon/index.ts
