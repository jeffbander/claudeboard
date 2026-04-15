# CLAUDE.md — ClaudeBoard
> This file governs every Claude Code session on the ClaudeBoard repository.
> Read it fully before writing any code.

---

## What this app is

ClaudeBoard is a generic developer operations board that connects to any GitHub repository.
It gives novice coders a friendly guided interface to manage features from idea through
production, and to monitor running apps via scheduled ops tasks.

Each Board maps to one GitHub repo. Multiple boards can be created — one per project.

Target users: early/novice coders who are not comfortable with the terminal.

---

## Tech stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database + realtime | Convex |
| Auth + permissions | Clerk |
| Deployment | Vercel |
| GitHub sync | GitHub REST API via Octokit |
| Claude Code bridge | MCP server in /mcp-server |
| Testing | Playwright |

---

## Repo structure

claudeboard/
  CLAUDE.md                              <- you are here
  setup.sh                               <- one-command bootstrap
  claude-code-kickoff.md                 <- paste into Claude Code to scaffold
  convex/
    schema.ts                            <- 6-table data model
  mcp-server/
    index.ts                             <- MCP server, 8 tools
    mcp.json                             <- config for claude --mcp-config
    package.json
  tests/
    TEST-MANIFEST.md                     <- living test coverage doc
    e2e/                                 <- Playwright specs go here
  docs/
    ARCHITECTURE.md
  src/
    app/
      page.tsx                           <- home: list of all boards
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
      boards/[boardId]/
        page.tsx                         <- Build + Ops tabs
        features/[featureId]/page.tsx    <- guided step view
      api/
        boards/route.ts
        features/route.ts
        deployments/route.ts
        incidents/route.ts
        github/webhook/route.ts
  middleware.ts                          <- Clerk route protection

---

## Branch conventions

main          <- Production, never commit directly
feat/name     <- New features
fix/name      <- Bug fixes
chore/name    <- Deps, refactors, config

Never commit directly to main.

---

## Data model summary (convex/schema.ts)

boards        <- one per GitHub repo, has members[] with roles
features      <- tickets, tracks stage + branch + PR + test results
ops_tasks     <- scheduled monitoring tasks
deployments   <- deployment history per board
incidents     <- ops incidents with Claude diagnosis
users         <- extended from Clerk

---

## Key rules

- Every UI action that could affect production must show a confirmation step first
- Language must be plain English — no git jargon, no raw terminal output in UI
- Board members with viewer role can never trigger write actions
- GitHub tokens stored encrypted, never logged or exposed to client
- MCP server runs on stdio (not a port)
- All MCP tools must be idempotent

---

## Running locally

Terminal 1:  npx convex dev
Terminal 2:  npm run dev               <- board UI on localhost:3000
Terminal 3:  npm run mcp              <- MCP server on stdio

To start Claude Code on a target project:
  cd ../wao
  claude --mcp-config ../claudeboard/mcp-server/mcp.json

---

## Testing

npx playwright test
npx playwright test --ui

All tests must pass before opening a PR.
Update tests/TEST-MANIFEST.md when adding new specs.

---

## Permissions

Data model supports owner, editor, viewer roles per board per user.
For now all authenticated users with board access are treated as editors.
Enforcement will be added in a future sprint — scaffold it, do not skip it.

---

## What not to do

- Do not hardcode board-specific config — everything must come from the boards table
- Do not skip the confirmation dialog on destructive actions
- Do not show raw error messages or stack traces to users
- Do not commit .env.local
- Do not push directly to main
