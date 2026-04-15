import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const incident = { id: Date.now().toString(), ...body, detectedAt: Date.now(), status: "open" }
  return NextResponse.json(incident, { status: 201 })
}
