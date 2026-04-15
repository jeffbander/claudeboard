import { execSync, spawnSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"

const WORKSPACE_ROOT = process.env.CLAUDEBOARD_WORKSPACE ?? path.join(os.homedir(), ".claudeboard", "workspaces")

function run(cwd: string, cmd: string, args: string[]): string {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed in ${cwd}: ${r.stderr || r.stdout}`)
  return r.stdout.trim()
}

export async function ensureWorkspace(boardSlug: string, githubRepo: string): Promise<string> {
  fs.mkdirSync(WORKSPACE_ROOT, { recursive: true })
  const dir = path.join(WORKSPACE_ROOT, boardSlug)
  if (!fs.existsSync(path.join(dir, ".git"))) {
    fs.rmSync(dir, { recursive: true, force: true })
    const token = process.env.GITHUB_TOKEN
    const cloneUrl = token
      ? `https://${token}@github.com/${githubRepo}.git`
      : `git@github.com:${githubRepo}.git`
    run(WORKSPACE_ROOT, "git", ["clone", cloneUrl, boardSlug])
  } else {
    run(dir, "git", ["fetch", "--all", "--prune"])
  }
  return dir
}

/**
 * Prepare the branch for coding and return the base ref for new-commit detection.
 *
 * - For feature branches: create from origin/main (or reset to it if it exists and has no unique work).
 * - For the shared `staging` branch: check it out and fast-forward to origin/staging; if it doesn't
 *   exist yet, create it from origin/main.
 */
export async function prepareBranch(repoDir: string, branchName: string, isFeature: boolean): Promise<string> {
  const defaultBranch = run(repoDir, "git", ["symbolic-ref", "refs/remotes/origin/HEAD"]).split("/").pop() ?? "main"
  run(repoDir, "git", ["checkout", defaultBranch])
  run(repoDir, "git", ["pull", "--ff-only"])

  if (isFeature) {
    try { run(repoDir, "git", ["branch", "-D", branchName]) } catch { /* ignore */ }
    run(repoDir, "git", ["checkout", "-b", branchName])
    return run(repoDir, "git", ["rev-parse", "HEAD"])
  }

  const remoteExists = spawnSync("git", ["show-ref", "--verify", `refs/remotes/origin/${branchName}`], { cwd: repoDir }).status === 0
  if (remoteExists) {
    run(repoDir, "git", ["checkout", branchName])
    run(repoDir, "git", ["reset", "--hard", `origin/${branchName}`])
  } else {
    run(repoDir, "git", ["checkout", "-b", branchName])
  }
  return run(repoDir, "git", ["rev-parse", "HEAD"])
}

export interface CommitInfo { hash: string; message: string; author: string; timestamp: number }

export async function listNewCommits(repoDir: string, baseRef: string): Promise<CommitInfo[]> {
  const out = run(repoDir, "git", ["log", `${baseRef}..HEAD`, "--format=%H%x1f%an%x1f%at%x1f%s"])
  if (!out) return []
  return out.split("\n").map(line => {
    const [hash, author, epoch, subject] = line.split("\x1f")
    return { hash, author, timestamp: Number(epoch) * 1000, message: subject }
  }).reverse()
}

export async function pushBranch(repoDir: string, branchName: string): Promise<void> {
  run(repoDir, "git", ["push", "-u", "origin", branchName])
}

export async function openPR(repoDir: string, branchName: string, title: string, body: string, baseBranch: string): Promise<{ number: number; url: string } | null> {
  const which = spawnSync("which", ["gh"], { encoding: "utf8" })
  if (which.status !== 0) {
    console.error("[daemon] gh CLI not found; skipping PR creation")
    return null
  }
  try {
    const url = execSync(`gh pr create --base "${baseBranch}" --head "${branchName}" --title ${JSON.stringify(title)} --body ${JSON.stringify(body || title)} 2>&1`, { cwd: repoDir, encoding: "utf8" }).trim().split("\n").pop() ?? ""
    const match = url.match(/\/pull\/(\d+)/)
    if (!match) return null
    return { number: Number(match[1]), url }
  } catch (e) {
    console.error("[daemon] gh pr create failed:", e instanceof Error ? e.message : e)
    return null
  }
}
