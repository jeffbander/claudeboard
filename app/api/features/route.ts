import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get("boardId")
  return NextResponse.json({ boardId, features: [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const feature = { id: Date.now().toString(), ...body, stage:"idea", createdAt: Date.now(), updatedAt: Date.now() }
  return NextResponse.json(feature, { status: 201 })
}
