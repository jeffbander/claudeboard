import { NextResponse } from "next/server"

const MOCK_BOARDS = [
  { id:"wao", name:"Women As One", slug:"wao", githubRepo:"jeffbander/wao", githubDefaultBranch:"main", playwrightTestDir:"tests/e2e", claudeMdPath:"CLAUDE.md", members:[{ userId:"user_1", role:"owner" }], createdAt: Date.now()-2592000000, updatedAt: Date.now()-7200000 }
]

export async function GET() {
  return NextResponse.json(MOCK_BOARDS)
}

export async function POST(req: Request) {
  const body = await req.json()
  const board = { id: body.slug ?? Date.now().toString(), ...body, createdAt: Date.now(), updatedAt: Date.now() }
  return NextResponse.json(board, { status: 201 })
}
