import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { featureId: string } }) {
  const body = await req.json()
  return NextResponse.json({ id: params.featureId, ...body, updatedAt: Date.now() })
}

export async function GET(_req: Request, { params }: { params: { featureId: string } }) {
  return NextResponse.json({ id: params.featureId })
}
