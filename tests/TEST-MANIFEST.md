# TEST-MANIFEST.md
> This file is updated by Claude Code after every feature is built or modified.
> Never skip updating this file. It is the source of truth for what is tested.

Last updated: 2026-04-15

---

## E2E Coverage (Playwright)

| Feature | Test File | Status | Last Passing | Notes |
|---------|-----------|--------|-------------|-------|
| Home page renders + branding | `e2e/auth.spec.ts`, `e2e/boards.spec.ts` | ✅ passing | 2026-04-15 | Checks "ClaudeBoard" text and page title |
| Home page — sign in / get started | `e2e/auth.spec.ts` | ✅ passing | 2026-04-15 | Logged-out state |
| /boards/[slug] renders without 500 | `e2e/auth.spec.ts`, `e2e/boards.spec.ts`, `e2e/ops.spec.ts` | ✅ passing | 2026-04-15 | Passes after removing `serverComponentsExternalPackages: ["convex"]` from next.config.js |
| /boards/[slug]/features/[id] renders | `e2e/auth.spec.ts`, `e2e/pipeline.spec.ts` | ✅ passing | 2026-04-15 | |
| Clerk sign-in / sign-up pages | `e2e/boards.spec.ts`, `e2e/ops.spec.ts`, `e2e/pipeline.spec.ts` | ✅ passing | 2026-04-15 | Checks `.cl-rootBox` mounts |
| GET /api/boards | `e2e/api.spec.ts` | ✅ passing | 2026-04-15 | |
| GET /api/features | `e2e/api.spec.ts` | ✅ passing | 2026-04-15 | |
| GET /api/deployments | `e2e/api.spec.ts` | ✅ passing | 2026-04-15 | |
| POST /api/features | `e2e/api.spec.ts` | ✅ passing | 2026-04-15 | |
| POST /api/incidents | `e2e/api.spec.ts` | ✅ passing | 2026-04-15 | |
| POST /api/github/webhook signature check | `e2e/api.spec.ts` | ✅ passing | 2026-04-15 | |
| MCP server — GET /api/boards/:slug | `e2e/mcp.spec.ts` | ✅ passing | 2026-04-15 | |
| MCP server — PATCH /api/features/:id | `e2e/mcp.spec.ts`, `e2e/pipeline.spec.ts` | ✅ passing | 2026-04-15 | Covers stage + branch update |
| MCP server — POST /api/deployments | `e2e/mcp.spec.ts` | ✅ passing | 2026-04-15 | |

**Total: 32 passing / 32 total**

### Added in this pass — plan → code → ship pipeline
| Feature | Test File | Status |
|---|---|---|
| POST /api/features/:id/plan handles missing feature | `e2e/pipeline-api.spec.ts` | ✅ |
| POST /api/features/:id/commits validates body | `e2e/pipeline-api.spec.ts` | ✅ (2 specs) |
| POST /api/features/:id/ship handles missing feature | `e2e/pipeline-api.spec.ts` | ✅ |
| GitHub webhook accepts push events | `e2e/pipeline-api.spec.ts` | ✅ |

---

## Coverage gaps (not yet tested)

These exist in the UI but have no Playwright spec yet:

| Feature | Status | Notes |
|---------|--------|-------|
| Create a board via `+ New board` modal | 🔴 missing | Now wired to `api.boards.create` Convex mutation; needs signed-in test user |
| Create a feature via `+ New ticket` modal | 🔴 missing | Now wired to `api.features.create`; needs signed-in test user |
| Build tab — live Convex `features.listByBoard` | 🔴 missing | Covered indirectly by "board page renders" |
| Move feature through stages | 🔴 missing | Needs signed-in test user |
| Ops tab — rollback confirmation dialog | 🔴 missing | Critical — must confirm before rollback |
| Viewer role cannot trigger actions | 🔴 missing | Permissions scaffolded, not enforced yet |
| GitHub webhook — PR opened / merged moves card | 🔴 missing | |

Adding Clerk-authenticated flows requires a test user setup — tracked separately.

---

## Status key
- ✅ Passing — test exists and passes in CI
- ⚠️ Flaky — test exists but fails intermittently
- 🔴 Missing — feature exists but no test yet
- 🚫 Skipped — explicitly skipped with reason noted

---

## Rules
1. When you build a new feature, add its test file to this table before opening a PR
2. When a test goes from missing to passing, update the status and Last Passing date
3. Never mark a test ✅ unless it passes in a full `npx playwright test` run
4. If you break a test that was previously passing, do not ignore it — fix it or flag it
