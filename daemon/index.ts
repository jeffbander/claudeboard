/**
 * ClaudeBoard local coding daemon.
 *
 * Polls Convex every 10s for approved tickets in stage=coding with no PR yet.
 * For each ticket: clones/updates the target repo, creates a branch, invokes
 * Claude Code with the plan + ticket context, pushes commits, opens a PR.
 *
 * Run with:  npm run daemon
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { ensureWorkspace, prepareBranch, listNewCommits, pushBranch, openPR } from "./git"

const CONVEX_URL = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://wandering-lark-774.convex.cloud").trim()
const BOARD_API_URL = process.env.BOARD_API_URL ?? "https://claudeboard.vercel.app"
const POLL_MS = Number(process.env.CLAUDEBOARD_POLL_MS ?? 10_000)

const convex = new ConvexHttpClient(CONVEX_URL)
const inFlight = new Set<string>()

async function pickUp() {
  const ready = await convex.query(api.features.listReadyForCoding, {})
  for (const feature of ready) {
    if (inFlight.has(feature._id)) continue
    inFlight.add(feature._id)
    runTicket(feature).finally(() => inFlight.delete(feature._id))
  }
}

async function runTicket(feature: { _id: Id<"features">; boardId: Id<"boards">; title: string; description?: string; type: "feature"|"bug"|"chore"; branchName?: string; planningDoc?: string }) {
  log(feature._id, `Picked up: ${feature.title} (${feature.type})`)

  const boards = await convex.query(api.boards.list, {})
  const board = boards.find(b => b._id === feature.boardId)
  if (!board) { log(feature._id, "Board missing, skipping"); return }
  if (!feature.branchName) { log(feature._id, "Branch missing, skipping"); return }

  const repoDir = await ensureWorkspace(board.slug, board.githubRepo)
  const baseRef = await prepareBranch(repoDir, feature.branchName, feature.type === "feature")
  log(feature._id, `Workspace ready at ${repoDir}, branch=${feature.branchName}, base=${baseRef}`)

  const prompt = buildPrompt(feature, board.githubRepo)
  const claudeExit = await runClaudeCode(repoDir, prompt, feature._id)
  if (claudeExit !== 0) {
    log(feature._id, `Claude Code exited ${claudeExit}; leaving ticket for manual retry`)
    return
  }

  const commits = await listNewCommits(repoDir, baseRef)
  for (const c of commits) {
    await convex.mutation(api.features.appendCommit, {
      id: feature._id,
      commit: {
        hash: c.hash,
        message: c.message,
        author: c.author,
        timestamp: c.timestamp,
        url: `https://github.com/${board.githubRepo}/commit/${c.hash}`,
      },
    })
  }
  log(feature._id, `Logged ${commits.length} commits`)

  if (commits.length === 0) {
    log(feature._id, "No commits produced — nothing to push")
    return
  }

  await pushBranch(repoDir, feature.branchName)
  const pr = await openPR(repoDir, feature.branchName, feature.title, feature.description ?? "", board.githubDefaultBranch ?? "main")
  if (pr) {
    await convex.mutation(api.features.setPR, { id: feature._id, prNumber: pr.number, prUrl: pr.url, prStatus: "open" })
    await convex.mutation(api.features.updateStage, { id: feature._id, stage: "testing" })
    log(feature._id, `PR #${pr.number} opened: ${pr.url}`)
  } else {
    log(feature._id, "Could not open PR — branch was pushed, please open manually")
  }
}

function buildPrompt(feature: { title: string; description?: string; type: string; planningDoc?: string }, githubRepo: string) {
  return [
    `You are picking up a ClaudeBoard ticket on repository ${githubRepo}.`,
    `Ticket type: ${feature.type}`,
    `Title: ${feature.title}`,
    feature.description ? `Description: ${feature.description}` : null,
    "",
    "Approved plan:",
    feature.planningDoc ?? "(no plan available — use best judgment)",
    "",
    "Work in the current branch. Commit in small logical steps. After each commit, call the MCP tool `log_commit` so the UI updates live.",
    "When you're done, leave the branch pushable — the daemon will push it and open the PR.",
    "Do not run tests yourself — the pipeline handles that after the PR opens.",
  ].filter(Boolean).join("\n")
}

async function runClaudeCode(cwd: string, prompt: string, featureId: string): Promise<number> {
  const { spawn } = await import("child_process")
  const mcpConfig = new URL("../mcp-server/mcp.json", import.meta.url).pathname
  return await new Promise<number>((resolve) => {
    const env = { ...process.env, CLAUDEBOARD_FEATURE_ID: featureId }
    const child = spawn("claude", ["--mcp-config", mcpConfig, "--print", prompt], { cwd, env, stdio: "inherit" })
    child.on("exit", code => resolve(code ?? 1))
    child.on("error", err => { console.error("[daemon] claude CLI error:", err.message); resolve(127) })
  })
}

function log(id: string, msg: string) {
  console.log(`[${new Date().toISOString()}] ${id.slice(0, 6)} · ${msg}`)
}

async function main() {
  console.log(`[daemon] polling ${CONVEX_URL} every ${POLL_MS}ms`)
  console.log(`[daemon] board API: ${BOARD_API_URL}`)
  while (true) {
    try {
      await pickUp()
    } catch (e) {
      console.error("[daemon] poll error:", e instanceof Error ? e.message : e)
    }
    await new Promise(r => setTimeout(r, POLL_MS))
  }
}

main()
