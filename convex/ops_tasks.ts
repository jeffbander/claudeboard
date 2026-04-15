import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    return await ctx.db
      .query("ops_tasks")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect()
  },
})

export const create = mutation({
  args: {
    boardId: v.id("boards"),
    name: v.string(),
    description: v.string(),
    schedule: v.union(
      v.literal("daily"), v.literal("nightly"),
      v.literal("weekly"), v.literal("monthly")
    ),
    cronExpression: v.string(),
    taskType: v.union(
      v.literal("health_check"), v.literal("smoke_tests"),
      v.literal("dependency_scan"), v.literal("cost_report"),
      v.literal("security_scan"), v.literal("custom")
    ),
    customPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("ops_tasks", {
      ...args,
      enabled: true,
      nextRun: now + 86400000,
      createdAt: now,
    })
  },
})

export const updateResult = mutation({
  args: {
    id: v.id("ops_tasks"),
    lastStatus: v.union(v.literal("pass"), v.literal("warn"), v.literal("fail")),
    lastResult: v.string(),
    nextRun: v.number(),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, { ...updates, lastRun: Date.now() })
  },
})
