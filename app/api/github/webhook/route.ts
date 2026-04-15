import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { api } from "../../../../convex/_generated/api"
import { convexServer } from "../../../../lib/convex-server"

export const dynamic = "force-dynamic"

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const sig = Buffer.from(signature)
    const expected = Buffer.from("sha256=" + createHmac("sha256", secret).update(payload).digest("hex"))
    return sig.length === expected.length && timingSafeEqual(sig, expected)
  } catch { return false }
}

export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get("x-hub-signature-256") ?? ""
  const event = req.headers.get("x-github-event") ?? ""
  const secret = process.env.GITHUB_APP_SECRET ?? ""

  if (secret && !verifySignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const body = JSON.parse(payload)
  const convex = convexServer()

  if (event === "pull_request") {
    const action = body.action
    const branchName: string | undefined = body.pull_request?.head?.ref
    const prNumber: number | undefined = body.pull_request?.number
    const prUrl: string | undefined = body.pull_request?.html_url
    if (!branchName) return NextResponse.json({ ok: true })

    const features = await convex.query(api.features.getByBranch, { branchName })
    for (const feature of features) {
      if ((action === "opened" || action === "reopened") && prNumber && prUrl) {
        await convex.mutation(api.features.setPR, { id: feature._id, prNumber, prUrl, prStatus: "open" })
        await convex.mutation(api.features.updateStage, { id: feature._id, stage: "testing" })
      }
      if (action === "closed" && body.pull_request?.merged) {
        await convex.mutation(api.features.setMerged, {
          id: feature._id,
          mergedToStaging: feature.type !== "feature",
        })
      }
    }
  }

  if (event === "push") {
    const branchRef: string | undefined = body.ref
    const branchName = branchRef?.replace(/^refs\/heads\//, "")
    const commits: Array<{ id: string; message: string; author?: { name?: string; username?: string }; timestamp?: string; url?: string }> = body.commits ?? []
    if (!branchName || commits.length === 0) return NextResponse.json({ ok: true })

    const features = await convex.query(api.features.getByBranch, { branchName })
    for (const feature of features) {
      for (const c of commits) {
        await convex.mutation(api.features.appendCommit, {
          id: feature._id,
          commit: {
            hash: c.id,
            message: c.message,
            author: c.author?.username ?? c.author?.name,
            timestamp: c.timestamp ? new Date(c.timestamp).getTime() : Date.now(),
            url: c.url,
          },
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
