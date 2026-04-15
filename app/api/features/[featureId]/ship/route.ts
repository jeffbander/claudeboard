import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { convexServer } from "../../../../../lib/convex-server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(_req: Request, { params }: { params: { featureId: string } }) {
  const convex = convexServer()
  const feature = await convex.query(api.features.getById, { id: params.featureId as Id<"features"> })
  if (!feature) return NextResponse.json({ error: "feature not found" }, { status: 404 })
  if (!feature.prNumber) return NextResponse.json({ error: "no pull request to merge" }, { status: 400 })

  const boards = await convex.query(api.boards.list, {})
  const board = boards.find(b => b._id === feature.boardId)
  if (!board) return NextResponse.json({ error: "board not found" }, { status: 404 })

  const token = process.env.GITHUB_TOKEN
  if (!token) return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 })

  const [owner, repo] = board.githubRepo.split("/")
  if (!owner || !repo) return NextResponse.json({ error: "invalid githubRepo" }, { status: 400 })

  const octokit = new Octokit({ auth: token })
  try {
    await octokit.pulls.merge({ owner, repo, pull_number: feature.prNumber, merge_method: "squash" })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "merge failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  await convex.mutation(api.features.setMerged, { id: feature._id, mergedToStaging: false })
  return NextResponse.json({ ok: true })
}
