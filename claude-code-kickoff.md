# ClaudeBoard — Claude Code Kickoff Prompt

Paste this entire prompt into Claude Code to scaffold the ClaudeBoard app from scratch.

---

## Prompt

You are building **ClaudeBoard** — a multi-project developer operations board for novice coders.
Read `CLAUDE.md` in full before writing any code.

### What to build in this session

Scaffold the complete Next.js app with the following:

**1. Project setup**
- Next.js 14 with App Router, TypeScript, Tailwind CSS
- Install all dependencies listed below
- Create the full directory structure from CLAUDE.md

**2. Convex schema**
- Copy `convex/schema.ts` exactly as provided (already written)
- Run `npx convex dev` to generate types

**3. Clerk auth**
- Wrap the app in `ClerkProvider`
- Add sign-in / sign-up pages at `/sign-in` and `/sign-up`
- Middleware to protect all `/boards/*` routes
- On first sign-in, create a user record in Convex `users` table

**4. Home page — `/`**
- List all boards the current user is a member of
- Each board shows: name, GitHub repo, active feature count, last deploy date
- Button: "Create new board" → opens a modal with fields:
  - Board name
  - GitHub repo (owner/repo format)
  - GitHub Personal Access Token (stored encrypted, never logged)
  - Description (optional)
- On create: insert board into Convex, register GitHub webhook via GitHub API

**5. Board page — `/boards/[boardId]`**
- Two tabs: Build | Ops
- **Build tab**: list of features grouped by stage (idea, planning, coding, testing, staging, production)
  - Each feature card shows: title, type badge, stage, mini progress dots, last updated
  - Click → goes to `/boards/[boardId]/features/[featureId]`
  - Button: "New ticket" → modal with fields: title, description, type
- **Ops tab**: 
  - Health strip: app status (ping the vercel URL), last deploy, error rate placeholder, API spend placeholder
  - Scheduled tasks list (from `ops_tasks` table)
  - Quick actions: Redeploy, View logs, Security scan, Rollback
  - Deployment history (from `deployments` table)

**6. Feature detail page — `/boards/[boardId]/features/[featureId]`**
- Pipeline track at top showing current stage (idea → plan → code → test → staging → production)
- Guided step card for the current stage:
  - **Idea**: show description, button "Ask Claude to plan this"
  - **Planning**: show planning doc if exists, button "Start coding"
  - **Coding**: show live log placeholder, branch name, button "Pause and review"
  - **Testing**: show test results from `features.testResults`, button "Fix failures" or "Move to staging"
  - **Staging**: show staging URL, success banner if all tests pass, button "Ship to production"
  - **Production**: shipped confirmation with date
- Each button fires a `sendPrompt()` or calls the MCP server

**7. API routes**

`/api/boards` — GET (list), POST (create)
`/api/features` — GET (list by board), POST (create), PATCH (update stage)
`/api/github/webhook` — POST (receive GitHub push/PR events, update feature stage)
`/api/health/[boardId]` — GET (ping the board's Vercel URL, return status)

**8. MCP server** 
- Copy `mcp-server/index.ts` and `mcp-server/tools/*` as provided (already written)
- Ensure it starts on port 3001
- Add `npm run mcp` script to package.json

### Dependencies to install

```bash
npm install @clerk/nextjs convex @anthropic-ai/sdk octokit \
  @modelcontextprotocol/sdk zod date-fns clsx tailwind-merge \
  lucide-react @radix-ui/react-dialog @radix-ui/react-tabs \
  @radix-ui/react-select next-themes
```

### Environment variables needed

Create `.env.local` with:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

GITHUB_APP_SECRET=           # for webhook signature verification
ANTHROPIC_API_KEY=           # for ops task AI analysis
```

### Design rules (non-negotiable)
- Font: DM Sans (import from Google Fonts)
- Mono font: DM Mono (for hashes, logs, code)  
- Background: #FAFAF8 (warm off-white)
- Primary: #1A1A1A
- Accent: #6C63FF (purple — for active steps, Claude actions)
- Success: #1B9B6F
- Danger: #E24B4A (only for destructive actions, with confirmation)
- Border: 0.5px solid #E5E3DC
- Border radius: 12px for cards, 8px for buttons, 999px for pills
- Language: plain English everywhere — no git jargon in the UI
- Every destructive action (rollback, redeploy) must show a confirmation step before executing
- Viewer-role users see everything but all action buttons are disabled with tooltip "Ask an editor"

### What NOT to build in this session
- Real GitHub webhook registration (stub it — log the payload)
- Real Vercel API integration (stub health check with a fetch ping)
- Real-time log streaming (placeholder text is fine)
- Email notifications
- Billing

### When done
1. Run `npm run dev` and confirm the app loads at localhost:3000
2. Run `npx convex dev` and confirm schema deploys
3. Create a test board called "Women As One" with repo `jeffbander/womenasone-resume`
4. Create three test feature cards in different stages
5. Report any errors and fix them before ending the session
6. Update `tests/TEST-MANIFEST.md` with what is and isn't tested yet
