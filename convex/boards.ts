import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("boards").collect()
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    githubRepo: v.string(),
    githubDefaultBranch: v.optional(v.string()),
    vercelProjectId: v.optional(v.string()),
    description: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("boards", {
      name: args.name,
      slug: args.slug,
      githubRepo: args.githubRepo,
      githubDefaultBranch: args.githubDefaultBranch ?? "main",
      vercelProjectId: args.vercelProjectId,
      description: args.description,
      playwrightTestDir: "tests/e2e",
      claudeMdPath: "CLAUDE.md",
      members: [{ userId: args.createdBy, role: "owner" }],
      createdAt: now,
      updatedAt: now,
    })
  },
})
