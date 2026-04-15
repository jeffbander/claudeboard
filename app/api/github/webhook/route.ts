import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

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

  if (event === "pull_request") {
    const action = body.action
    const branchName = body.pull_request?.head?.ref
    const prNumber = body.pull_request?.number
    const prUrl = body.pull_request?.html_url

    if (action === "opened" || action === "reopened") {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/features?branch=${branchName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "testing", prNumber, prUrl, updatedAt: Date.now() }),
      }).catch(() => {})
    }

    if (action === "closed" && body.pull_request?.merged) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/features?branch=${branchName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "production", updatedAt: Date.now() }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
