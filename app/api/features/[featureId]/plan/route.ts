import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { convexServer } from "../../../../../lib/convex-server"
import { plannerSystemPrompt, plannerUserPrompt } from "../../../../../lib/prompts/planner"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(_req: Request, { params }: { params: { featureId: string } }) {
  const featureId = params.featureId as Id<"features">
  const convex = convexServer()
  const feature = await convex.query(api.features.getById, { id: featureId })
  if (!feature) return NextResponse.json({ error: "feature not found" }, { status: 404 })
  const board = await convex.query(api.boards.list, {})
  const b = board.find(bd => bd._id === feature.boardId)
  if (!b) return NextResponse.json({ error: "board not found" }, { status: 404 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    const stub = `## Plan (stub — ANTHROPIC_API_KEY not set)\n\n**Goal:** ${feature.title}\n\n1. Read the relevant files in \`${b.githubRepo}\`.\n2. Draft the change.\n3. Add or update tests.\n4. Open a PR.\n\n> Set ANTHROPIC_API_KEY to get a real plan from Claude.`
    await convex.mutation(api.features.setPlan, { id: featureId, planningDoc: stub })
    return NextResponse.json({ ok: true, stub: true, plan: stub })
  }

  const anthropic = new Anthropic({ apiKey })
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: plannerSystemPrompt(),
    messages: [{
      role: "user",
      content: plannerUserPrompt({
        title: feature.title,
        description: feature.description,
        type: feature.type,
        boardName: b.name,
        githubRepo: b.githubRepo,
      }),
    }],
  })
  const plan = msg.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map(c => c.text)
    .join("\n")
    .trim()

  await convex.mutation(api.features.setPlan, { id: featureId, planningDoc: plan })
  return NextResponse.json({ ok: true, plan })
}
