# TEST-MANIFEST.md
> This file is updated by Claude Code after every feature is built or modified.
> Never skip updating this file. It is the source of truth for what is tested.

Last updated: 2025-04-14

---

## E2E Coverage (Playwright)

| Feature | Test File | Status | Last Passing | Notes |
|---------|-----------|--------|-------------|-------|
| Sign in / sign up | `e2e/auth.spec.ts` | 🔴 missing | — | Needs Clerk test user setup |
| Create a board | `e2e/boards.spec.ts` | 🔴 missing | — | |
| Create a feature ticket | `e2e/features.spec.ts` | 🔴 missing | — | |
| Move feature through stages | `e2e/pipeline.spec.ts` | 🔴 missing | — | |
| Ops tab — health strip | `e2e/ops.spec.ts` | 🔴 missing | — | |
| Ops tab — scheduled tasks | `e2e/ops.spec.ts` | 🔴 missing | — | |
| Rollback confirmation dialog | `e2e/ops.spec.ts` | 🔴 missing | — | Critical — must confirm before rollback |
| MCP server — get_board_state | `e2e/mcp.spec.ts` | 🔴 missing | — | |
| MCP server — update_feature_stage | `e2e/mcp.spec.ts` | 🔴 missing | — | |
| MCP server — run_tests | `e2e/mcp.spec.ts` | 🔴 missing | — | |
| GitHub webhook — PR opened moves card | `e2e/github.spec.ts` | 🔴 missing | — | |
| GitHub webhook — PR merged moves card | `e2e/github.spec.ts` | 🔴 missing | — | |
| Viewer role cannot trigger actions | `e2e/permissions.spec.ts` | 🔴 missing | — | Permissions scaffolded, not enforced yet |

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
