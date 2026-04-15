import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect()
  },
})

export const listOpen = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_board_status", (q) =>
        q.eq("boardId", boardId).eq("status", "open")
      )
      .collect()
  },
})

export const create = mutation({
  args: {
    boardId: v.id("boards"),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    claudeDiagnosis: v.optional(v.string()),
    claudeFix: v.optional(v.string()),
    affectedUsers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incidents", {
      ...args,
      status: "open",
      detectedAt: Date.now(),
    })
  },
})

export const resolve = mutation({
  args: { id: v.id("incidents"), resolvedBy: v.string() },
  handler: async (ctx, { id, resolvedBy }) => {
    await ctx.db.patch(id, {
      status: "resolved",
      resolvedAt: Date.now(),
      fixAppliedBy: resolvedBy,
    })
  },
})
