import { ConvexHttpClient } from "convex/browser"

const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
console.log("Connecting to:", url)
const convex = new ConvexHttpClient(url)

async function main() {
  const boards = await convex.query("boards:list" as any, {})
  console.log("Boards:", (boards as any[]).map((b:any) => b.name + " (" + b.slug + ")"))
  const features = await convex.query("features:listReadyForCoding" as any, {})
  console.log("Ready for daemon:", (features as any[]).length, "tickets")
  console.log("✅  Daemon connection verified")
}

main().catch(console.error)
