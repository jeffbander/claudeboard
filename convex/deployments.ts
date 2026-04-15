import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    return await ctx.db
      .query("deployments")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect()
  },
})

export const create = mutation({
  args: {
    boardId: v.id("boards"),
    hash: v.string(),
    fullHash: v.optional(v.string()),
    title: v.string(),
    prNumber: v.optional(v.number()),
    vercelUrl: v.optional(v.string()),
    deployedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deployments")
      .withIndex("by_board_status", (q) =>
        q.eq("boardId", args.boardId).eq("status", "live")
      )
      .collect()
    for (const d of existing) {
      await ctx.db.patch(d._id, { status: "previous" })
    }
    return await ctx.db.insert("deployments", {
      ...args,
      status: "live",
      deployedAt: Date.now(),
    })
  },
})

export const rollback = mutation({
  args: { id: v.id("deployments"), boardId: v.id("boards") },
  handler: async (ctx, { id, boardId }) => {
    const live = await ctx.db
      .query("deployments")
      .withIndex("by_board_status", (q) =>
        q.eq("boardId", boardId).eq("status", "live")
      )
      .first()
    if (live) await ctx.db.patch(live._id, { status: "rolled-back" })
    await ctx.db.patch(id, { status: "live" })
  },
})
