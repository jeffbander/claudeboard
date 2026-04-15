import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const deployment = { id: Date.now().toString(), ...body, deployedAt: Date.now(), status: "live" }
  return NextResponse.json(deployment, { status: 201 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const boardSlug = searchParams.get("boardSlug")
  return NextResponse.json({ boardSlug, deployments: [] })
}
