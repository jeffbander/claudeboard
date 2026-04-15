#!/bin/bash
# ClaudeBoard — Setup Script
# Run this once to bootstrap the project from scratch.
# Usage: bash setup.sh

set -e

echo ""
echo "🛠  ClaudeBoard setup"
echo "────────────────────────────────────────"

# ── 1. Check prerequisites ────────────────────────────────────────────────────
echo ""
echo "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  echo "❌  Node.js is required. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌  Node.js v18+ required. Found: $(node -v)"
  exit 1
fi

if ! command -v git &>/dev/null; then
  echo "❌  Git is required."
  exit 1
fi

echo "✅  Node $(node -v), Git $(git --version | cut -d' ' -f3)"

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "Installing dependencies..."
npm install

# ── 3. Install MCP server dependencies ───────────────────────────────────────
echo ""
echo "Installing MCP server dependencies..."
cd mcp-server
npm install
cd ..

# ── 4. Check for .env.local ───────────────────────────────────────────────────
echo ""
if [ ! -f .env.local ]; then
  echo "Creating .env.local from template..."
  cat > .env.local << 'EOF'
# Clerk — get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Convex — get from https://dashboard.convex.dev
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# GitHub — personal access token with repo scope
GITHUB_TOKEN=
GITHUB_APP_SECRET=

# Anthropic — for ops task AI analysis
ANTHROPIC_API_KEY=
EOF
  echo "⚠️   .env.local created — fill in your keys before running the app"
else
  echo "✅  .env.local already exists"
fi

# ── 5. Check Convex ───────────────────────────────────────────────────────────
echo ""
echo "Checking Convex..."
if ! command -v npx &>/dev/null; then
  echo "⚠️   npx not found — run 'npx convex dev' manually after filling in .env.local"
else
  echo "ℹ️   Run 'npx convex dev' in a separate terminal after filling in CONVEX_DEPLOY_KEY"
fi

# ── 6. Build MCP server ───────────────────────────────────────────────────────
echo ""
echo "Building MCP server..."
cd mcp-server
npm run build 2>/dev/null || echo "⚠️   MCP server build skipped — run 'npm run build' in mcp-server/ after setup"
cd ..

# ── 7. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────"
echo "✅  ClaudeBoard setup complete"
echo ""
echo "Next steps:"
echo "  1. Fill in .env.local with your Clerk, Convex, GitHub, and Anthropic keys"
echo "  2. Terminal 1:  npx convex dev"
echo "  3. Terminal 2:  npm run dev              (board UI on localhost:3000)"
echo "  4. Terminal 3:  npm run mcp              (MCP server on stdio)"
echo ""
echo "To start a Claude Code session on a target project:"
echo "  cd ../your-project"
echo "  claude --mcp-config ../claudeboard/mcp-server/mcp.json"
echo ""
echo "Docs: see CLAUDE.md and docs/ARCHITECTURE.md"
echo ""
