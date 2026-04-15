import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    return await ctx.db
      .query("features")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect()
  },
})

export const getById = query({
  args: { id: v.id("features") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

export const listReadyForCoding = query({
  args: { boardId: v.optional(v.id("boards")) },
  handler: async (ctx, { boardId }) => {
    const all = boardId
      ? await ctx.db.query("features").withIndex("by_board", (q) => q.eq("boardId", boardId)).collect()
      : await ctx.db.query("features").collect()
    return all.filter(f =>
      f.stage === "coding" &&
      f.approvalState === "approved" &&
      !f.prNumber
    )
  },
})

export const create = mutation({
  args: {
    boardId: v.id("boards"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("feature"), v.literal("bug"), v.literal("chore")),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("features", {
      boardId: args.boardId,
      title: args.title,
      description: args.description,
      type: args.type,
      stage: "idea",
      approvalState: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    })
  },
})

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "ticket"
}

export const setPlan = mutation({
  args: { id: v.id("features"), planningDoc: v.string() },
  handler: async (ctx, { id, planningDoc }) => {
    const f = await ctx.db.get(id)
    if (!f) throw new Error("feature not found")
    await ctx.db.patch(id, {
      planningDoc,
      stage: "planning",
      planStartedAt: f.planStartedAt ?? Date.now(),
      approvalState: "pending",
      planRejection: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const approvePlan = mutation({
  args: { id: v.id("features") },
  handler: async (ctx, { id }) => {
    const f = await ctx.db.get(id)
    if (!f) throw new Error("feature not found")
    const branch = f.type === "feature" ? `feat/${slugify(f.title)}` : "staging"
    await ctx.db.patch(id, {
      stage: "coding",
      approvalState: "approved",
      branchName: branch,
      codingStartedAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const rejectPlan = mutation({
  args: { id: v.id("features"), note: v.optional(v.string()) },
  handler: async (ctx, { id, note }) => {
    await ctx.db.patch(id, {
      approvalState: "rejected",
      planRejection: note,
      updatedAt: Date.now(),
    })
  },
})

export const regeneratePlan = mutation({
  args: { id: v.id("features") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      planningDoc: undefined,
      stage: "idea",
      approvalState: "pending",
      planStartedAt: undefined,
      updatedAt: Date.now(),
    })
  },
})

export const appendCommit = mutation({
  args: {
    id: v.id("features"),
    commit: v.object({
      hash: v.string(),
      message: v.string(),
      author: v.optional(v.string()),
      timestamp: v.number(),
      url: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, commit }) => {
    const f = await ctx.db.get(id)
    if (!f) throw new Error("feature not found")
    const existing = f.commits ?? []
    if (existing.some(c => c.hash === commit.hash)) return
    await ctx.db.patch(id, {
      commits: [...existing, commit],
      updatedAt: Date.now(),
    })
  },
})

export const setPR = mutation({
  args: {
    id: v.id("features"),
    prNumber: v.number(),
    prUrl: v.string(),
    prStatus: v.optional(v.string()),
  },
  handler: async (ctx, { id, prNumber, prUrl, prStatus }) => {
    await ctx.db.patch(id, {
      prNumber,
      prUrl,
      prStatus: prStatus ?? "open",
      mergeStatus: "open",
      updatedAt: Date.now(),
    })
  },
})

export const setMerged = mutation({
  args: { id: v.id("features"), mergedToStaging: v.boolean() },
  handler: async (ctx, { id, mergedToStaging }) => {
    const f = await ctx.db.get(id)
    if (!f) throw new Error("feature not found")
    await ctx.db.patch(id, {
      mergeStatus: "merged",
      prStatus: "merged",
      stage: mergedToStaging ? "staging" : "production",
      updatedAt: Date.now(),
    })
  },
})

export const updateStage = mutation({
  args: {
    id: v.id("features"),
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
  },
  handler: async (ctx, { id, ...updates }) => {
    const patch: Record<string, unknown> = { ...updates, updatedAt: Date.now() }
    if (updates.stage === "testing") patch.testingStartedAt = Date.now()
    await ctx.db.patch(id, patch)
  },
})

export const getByBranch = query({
  args: { branchName: v.string() },
  handler: async (ctx, { branchName }) => {
    return await ctx.db
      .query("features")
      .withIndex("by_branch", (q) => q.eq("branchName", branchName))
      .collect()
  },
})

export const remove = mutation({
  args: { id: v.id("features") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})
