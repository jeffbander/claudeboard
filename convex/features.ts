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
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
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
    stagingUrl: v.optional(v.string()),
    testResults: v.optional(v.object({
      total: v.number(),
      passing: v.number(),
      failing: v.number(),
      lastRun: v.number(),
    })),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() })
  },
})

export const remove = mutation({
  args: { id: v.id("features") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})
