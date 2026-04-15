import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  boards: defineTable({
    name: v.string(),
    slug: v.string(),
    githubRepo: v.string(),
    githubDefaultBranch: v.string(),
    githubWebhookId: v.optional(v.string()),
    vercelProjectId: v.optional(v.string()),
    vercelTeamId: v.optional(v.string()),
    playwrightTestDir: v.string(),
    claudeMdPath: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.object({
      userId: v.string(),
      role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"]),

  features: defineTable({
    boardId: v.id("boards"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("feature"), v.literal("bug"), v.literal("chore")),
    stage: v.union(
      v.literal("idea"), v.literal("planning"), v.literal("coding"),
      v.literal("testing"), v.literal("staging"), v.literal("production")
    ),
    branchName: v.optional(v.string()),
    prNumber: v.optional(v.number()),
    prUrl: v.optional(v.string()),
    prStatus: v.optional(v.string()),
    mergeStatus: v.optional(v.union(
      v.literal("open"), v.literal("merged"), v.literal("closed"), v.literal("conflicted")
    )),
    stagingUrl: v.optional(v.string()),
    testResults: v.optional(v.object({
      total: v.number(),
      passing: v.number(),
      failing: v.number(),
      lastRun: v.number(),
    })),
    planningDoc: v.optional(v.string()),
    planRejection: v.optional(v.string()),
    approvalState: v.optional(v.union(
      v.literal("pending"), v.literal("approved"), v.literal("rejected")
    )),
    commits: v.optional(v.array(v.object({
      hash: v.string(),
      message: v.string(),
      author: v.optional(v.string()),
      timestamp: v.number(),
      url: v.optional(v.string()),
    }))),
    planStartedAt: v.optional(v.number()),
    codingStartedAt: v.optional(v.number()),
    testingStartedAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_board_stage", ["boardId", "stage"])
    .index("by_branch", ["branchName"]),

  ops_tasks: defineTable({
    boardId: v.id("boards"),
    name: v.string(),
    description: v.string(),
    schedule: v.union(
      v.literal("daily"), v.literal("nightly"),
      v.literal("weekly"), v.literal("monthly")
    ),
    cronExpression: v.string(),
    enabled: v.boolean(),
    lastRun: v.optional(v.number()),
    lastStatus: v.optional(v.union(
      v.literal("pass"), v.literal("warn"), v.literal("fail")
    )),
    lastResult: v.optional(v.string()),
    nextRun: v.number(),
    taskType: v.union(
      v.literal("health_check"), v.literal("smoke_tests"),
      v.literal("dependency_scan"), v.literal("cost_report"),
      v.literal("security_scan"), v.literal("custom")
    ),
    customPrompt: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_next_run", ["nextRun"]),

  deployments: defineTable({
    boardId: v.id("boards"),
    hash: v.string(),
    fullHash: v.optional(v.string()),
    title: v.string(),
    deployedAt: v.number(),
    status: v.union(
      v.literal("live"), v.literal("previous"),
      v.literal("rolled-back"), v.literal("failed")
    ),
    deployedBy: v.optional(v.string()),
    vercelDeploymentId: v.optional(v.string()),
    vercelUrl: v.optional(v.string()),
    prNumber: v.optional(v.number()),
  })
    .index("by_board", ["boardId"])
    .index("by_board_status", ["boardId", "status"]),

  incidents: defineTable({
    boardId: v.id("boards"),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(
      v.literal("open"), v.literal("fix-ready"), v.literal("resolved")
    ),
    affectedUsers: v.optional(v.number()),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    fixAppliedBy: v.optional(v.string()),
    claudeDiagnosis: v.optional(v.string()),
    claudeFix: v.optional(v.string()),
  })
    .index("by_board", ["boardId"])
    .index("by_board_status", ["boardId", "status"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),
});
