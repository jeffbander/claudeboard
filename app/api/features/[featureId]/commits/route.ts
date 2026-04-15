import { NextResponse } from "next/server"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { convexServer } from "../../../../../lib/convex-server"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: { featureId: string } }) {
  const body = await req.json()
  const { hash, message, author, timestamp, url } = body ?? {}
  if (!hash || !message) return NextResponse.json({ error: "hash and message required" }, { status: 400 })
  await convexServer().mutation(api.features.appendCommit, {
    id: params.featureId as Id<"features">,
    commit: {
      hash: String(hash),
      message: String(message),
      author: author ? String(author) : undefined,
      timestamp: Number(timestamp ?? Date.now()),
      url: url ? String(url) : undefined,
    },
  })
  return NextResponse.json({ ok: true })
}
