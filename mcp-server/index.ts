/**
 * ClaudeBoard MCP Server
 * Runs on localhost:3001
 * Exposes tools that Claude Code calls to read/update board state,
 * create branches, trigger tests, and log deployments.
 *
 * Start: npm run mcp
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { Octokit } from "octokit";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ── Config ────────────────────────────────────────────────────────────────────

const BOARD_API_URL = process.env.BOARD_API_URL ?? "http://localhost:3000";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

// ── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: "claudeboard-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ──────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_board_state",
      description:
        "Get the current state of a ClaudeBoard board — all features and their stages. Call this at the start of every session to understand what's in progress.",
      inputSchema: {
        type: "object",
        properties: {
          boardSlug: {
            type: "string",
            description: "The board slug (e.g. 'wao' for Women As One)",
          },
        },
        required: ["boardSlug"],
      },
    },
    {
      name: "update_feature_stage",
      description:
        "Move a feature card to a new stage on the board. Call this when you complete a phase of work — e.g. after creating a branch, call this with stage='coding'.",
      inputSchema: {
        type: "object",
        properties: {
          featureId: { type: "string", description: "The Convex feature ID" },
          stage: {
            type: "string",
            enum: ["idea", "planning", "coding", "testing", "staging", "production"],
            description: "The new stage for this feature",
          },
          branchName: {
            type: "string",
            description: "The git branch name (include when moving to 'coding')",
          },
          prNumber: {
            type: "number",
            description: "The GitHub PR number (include when moving to 'testing' or 'staging')",
          },
          stagingUrl: {
            type: "string",
            description: "The Vercel preview URL (include when moving to 'staging')",
          },
        },
        required: ["featureId", "stage"],
      },
    },
    {
      name: "create_branch",
      description:
        "Create a new git branch for a feature. Call this before writing any code. Branch is created from the default branch of the repo.",
      inputSchema: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "GitHub repo in owner/repo format (e.g. 'jeffbander/womenasone-resume')",
          },
          branchName: {
            type: "string",
            description: "Branch name — use feat/, fix/, or chore/ prefix (e.g. 'feat/resume-scoring')",
          },
          featureId: {
            type: "string",
            description: "The ClaudeBoard feature ID — used to update the card after branch creation",
          },
        },
        required: ["repo", "branchName", "featureId"],
      },
    },
    {
      name: "get_pr_status",
      description:
        "Get the current status of a GitHub pull request — open/merged/closed, review status, and Vercel preview URL if available.",
      inputSchema: {
        type: "object",
        properties: {
          repo: { type: "string", description: "GitHub repo (owner/repo)" },
          prNumber: { type: "number", description: "PR number" },
        },
        required: ["repo", "prNumber"],
      },
    },
    {
      name: "run_tests",
      description:
        "Run the Playwright test suite for a project and return results. Call this before moving a feature to staging. Updates the feature's testResults on the board.",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description: "Absolute path to the project directory",
          },
          specFile: {
            type: "string",
            description: "Optional: path to a specific spec file. If omitted, runs all tests.",
          },
          featureId: {
            type: "string",
            description: "The ClaudeBoard feature ID — used to update test results on the card",
          },
        },
        required: ["projectPath", "featureId"],
      },
    },
    {
      name: "log_deployment",
      description:
        "Record a deployment in ClaudeBoard's deployment history. Call this after a PR is merged to main and Vercel has deployed it.",
      inputSchema: {
        type: "object",
        properties: {
          boardSlug: { type: "string" },
          hash: { type: "string", description: "Short git commit hash" },
          fullHash: { type: "string", description: "Full git commit hash" },
          title: { type: "string", description: "Feature or commit description" },
          prNumber: { type: "number" },
          vercelUrl: { type: "string", description: "Production Vercel URL" },
        },
        required: ["boardSlug", "hash", "title"],
      },
    },
    {
      name: "get_health_status",
      description:
        "Check if a deployed app is responding. Pings the production URL and returns status.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "The production URL to ping" },
          boardSlug: { type: "string" },
        },
        required: ["url", "boardSlug"],
      },
    },
    {
      name: "log_commit",
      description:
        "Record a commit you just made onto the ticket's Git history so the user can watch progress live. Call this after each commit during coding.",
      inputSchema: {
        type: "object",
        properties: {
          featureId: { type: "string", description: "The ClaudeBoard feature ID" },
          hash: { type: "string", description: "Git commit hash (short or full)" },
          message: { type: "string", description: "Commit message" },
          author: { type: "string", description: "Optional author name" },
          url: { type: "string", description: "Optional link to the commit on GitHub" },
        },
        required: ["featureId", "hash", "message"],
      },
    },
    {
      name: "log_incident",
      description:
        "Log a detected incident to the board's Ops tab. Use this when monitoring detects an error spike, failed health check, or other issue.",
      inputSchema: {
        type: "object",
        properties: {
          boardSlug: { type: "string" },
          title: { type: "string" },
          description: { type: "string", description: "Plain English description of what went wrong" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          claudeDiagnosis: { type: "string", description: "Plain English diagnosis" },
          claudeFix: { type: "string", description: "Plain English description of the fix" },
          affectedUsers: { type: "number" },
        },
        required: ["boardSlug", "title", "description", "severity"],
      },
    },
  ],
}));

// ── Tool handlers ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      // ── get_board_state ────────────────────────────────────────────────────
      case "get_board_state": {
        const { boardSlug } = args as { boardSlug: string };
        const res = await fetch(`${BOARD_API_URL}/api/boards/${boardSlug}`);
        if (!res.ok) throw new Error(`Board not found: ${boardSlug}`);
        const data = await res.json();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(data, null, 2),
          }],
        };
      }

      // ── update_feature_stage ───────────────────────────────────────────────
      case "update_feature_stage": {
        const { featureId, stage, branchName, prNumber, stagingUrl } = args as {
          featureId: string;
          stage: string;
          branchName?: string;
          prNumber?: number;
          stagingUrl?: string;
        };
        const body: Record<string, unknown> = { stage };
        if (branchName) body.branchName = branchName;
        if (prNumber) body.prNumber = prNumber;
        if (stagingUrl) body.stagingUrl = stagingUrl;
        body.updatedAt = Date.now();

        const res = await fetch(`${BOARD_API_URL}/api/features/${featureId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Failed to update feature ${featureId}`);
        return {
          content: [{
            type: "text",
            text: `Feature ${featureId} moved to stage: ${stage}`,
          }],
        };
      }

      // ── create_branch ─────────────────────────────────────────────────────
      case "create_branch": {
        const { repo, branchName, featureId } = args as {
          repo: string;
          branchName: string;
          featureId: string;
        };

        if (!octokit) throw new Error("GITHUB_TOKEN not configured");

        const [owner, repoName] = repo.split("/");

        // Get default branch SHA
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo: repoName });
        const defaultBranch = repoData.default_branch;
        const { data: refData } = await octokit.rest.git.getRef({
          owner,
          repo: repoName,
          ref: `heads/${defaultBranch}`,
        });
        const sha = refData.object.sha;

        // Create branch
        await octokit.rest.git.createRef({
          owner,
          repo: repoName,
          ref: `refs/heads/${branchName}`,
          sha,
        });

        // Update board card to coding stage
        await fetch(`${BOARD_API_URL}/api/features/${featureId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: "coding", branchName, updatedAt: Date.now() }),
        });

        return {
          content: [{
            type: "text",
            text: `Branch '${branchName}' created from '${defaultBranch}' in ${repo}. Card moved to Coding.`,
          }],
        };
      }

      // ── get_pr_status ──────────────────────────────────────────────────────
      case "get_pr_status": {
        const { repo, prNumber } = args as { repo: string; prNumber: number };
        if (!octokit) throw new Error("GITHUB_TOKEN not configured");

        const [owner, repoName] = repo.split("/");
        const { data: pr } = await octokit.rest.pulls.get({
          owner,
          repo: repoName,
          pull_number: prNumber,
        });

        // Try to find Vercel preview URL from PR comments
        const { data: comments } = await octokit.rest.issues.listComments({
          owner,
          repo: repoName,
          issue_number: prNumber,
        });
        const vercelComment = comments.find(c =>
          c.body?.includes("vercel.app") && c.user?.login?.includes("vercel")
        );
        const stagingUrl = vercelComment?.body?.match(/https:\/\/[^\s)]+vercel\.app[^\s)]*/)?.[0];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              number: pr.number,
              title: pr.title,
              state: pr.state,
              merged: pr.merged,
              reviewState: pr.requested_reviewers?.length ? "review-requested" : "no-reviewers",
              stagingUrl: stagingUrl ?? null,
              url: pr.html_url,
            }, null, 2),
          }],
        };
      }

      // ── run_tests ─────────────────────────────────────────────────────────
      case "run_tests": {
        const { projectPath, specFile, featureId } = args as {
          projectPath: string;
          specFile?: string;
          featureId: string;
        };

        const cmd = specFile
          ? `cd "${projectPath}" && npx playwright test "${specFile}" --reporter=json 2>&1`
          : `cd "${projectPath}" && npx playwright test --reporter=json 2>&1`;

        let output = "";
        let exitCode = 0;
        try {
          output = execSync(cmd, { encoding: "utf8", timeout: 120000 });
        } catch (e: any) {
          output = e.stdout ?? e.message;
          exitCode = e.status ?? 1;
        }

        // Parse JSON reporter output
        let total = 0, passing = 0, failing = 0;
        try {
          const lines = output.split("\n");
          const jsonLine = lines.find(l => l.trim().startsWith("{"));
          if (jsonLine) {
            const report = JSON.parse(jsonLine);
            total = report.stats?.total ?? 0;
            passing = report.stats?.expected ?? 0;
            failing = report.stats?.unexpected ?? 0;
          }
        } catch {
          // If JSON parse fails, just report pass/fail by exit code
          total = 1;
          passing = exitCode === 0 ? 1 : 0;
          failing = exitCode === 0 ? 0 : 1;
        }

        // Update board card with test results
        const testResults = { total, passing, failing, lastRun: Date.now() };
        const newStage = failing === 0 ? "staging" : "testing";

        await fetch(`${BOARD_API_URL}/api/features/${featureId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testResults, stage: newStage, updatedAt: Date.now() }),
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              total,
              passing,
              failing,
              passed: failing === 0,
              cardMovedTo: newStage,
              summary: failing === 0
                ? `All ${total} tests passed. Card moved to Staging.`
                : `${failing} of ${total} tests failed. Card stays in Testing.`,
            }, null, 2),
          }],
        };
      }

      // ── log_deployment ────────────────────────────────────────────────────
      case "log_deployment": {
        const { boardSlug, hash, fullHash, title, prNumber, vercelUrl } = args as {
          boardSlug: string;
          hash: string;
          fullHash?: string;
          title: string;
          prNumber?: number;
          vercelUrl?: string;
        };

        const res = await fetch(`${BOARD_API_URL}/api/deployments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardSlug,
            hash,
            fullHash,
            title,
            prNumber,
            vercelUrl,
            deployedAt: Date.now(),
            status: "live",
          }),
        });
        if (!res.ok) throw new Error("Failed to log deployment");

        return {
          content: [{
            type: "text",
            text: `Deployment logged: ${hash} — "${title}"`,
          }],
        };
      }

      // ── get_health_status ─────────────────────────────────────────────────
      case "get_health_status": {
        const { url, boardSlug } = args as { url: string; boardSlug: string };
        const start = Date.now();
        let status: "up" | "down" = "down";
        let statusCode: number | null = null;
        let responseMs: number | null = null;

        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          statusCode = res.status;
          responseMs = Date.now() - start;
          status = res.ok ? "up" : "down";
        } catch {
          responseMs = Date.now() - start;
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ url, status, statusCode, responseMs, checkedAt: Date.now() }, null, 2),
          }],
        };
      }

      // ── log_commit ────────────────────────────────────────────────────────
      case "log_commit": {
        const { featureId, hash, message, author, url } = args as {
          featureId: string; hash: string; message: string; author?: string; url?: string;
        };
        const res = await fetch(`${BOARD_API_URL}/api/features/${featureId}/commits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash, message, author, url, timestamp: Date.now() }),
        });
        if (!res.ok) throw new Error(`Failed to log commit ${hash}`);
        return {
          content: [{ type: "text", text: `Commit ${hash.slice(0, 7)} logged: "${message.split("\n")[0]}"` }],
        };
      }

      // ── log_incident ──────────────────────────────────────────────────────
      case "log_incident": {
        const body = args as {
          boardSlug: string;
          title: string;
          description: string;
          severity: string;
          claudeDiagnosis?: string;
          claudeFix?: string;
          affectedUsers?: number;
        };

        const res = await fetch(`${BOARD_API_URL}/api/incidents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, detectedAt: Date.now(), status: "open" }),
        });
        if (!res.ok) throw new Error("Failed to log incident");

        return {
          content: [{
            type: "text",
            text: `Incident logged: "${body.title}" (${body.severity} severity)`,
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: `Error in ${name}: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ClaudeBoard MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
