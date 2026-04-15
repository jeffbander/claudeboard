import { ConvexHttpClient } from "convex/browser"

const client = new ConvexHttpClient("https://wandering-lark-774.convex.cloud")

async function seed() {
  const boardId = await client.mutation("boards:create", {
    name: "Women As One",
    slug: "wao",
    githubRepo: "jeffbander/wao",
    githubDefaultBranch: "main",
    description: "AI-powered resume tool for women job seekers",
    createdBy: "jeff",
  })
  console.log("Board created:", boardId)

  const features = [
    { title: "Hallucination detection v2", type: "feature" },
    { title: "LinkedIn URL import", type: "feature" },
    { title: "Resume scoring vs job description", type: "feature" },
    { title: "PDF export broken on mobile Safari", type: "bug" },
  ]

  for (const f of features) {
    const id = await client.mutation("features:create", {
      boardId, title: f.title, type: f.type, createdBy: "jeff",
    })
    console.log("Feature:", f.title, "->", id)
  }

  await client.mutation("deployments:create", {
    boardId,
    hash: "a3f92c",
    title: "Initial launch — resume upload and AI rewrite",
    vercelUrl: "https://womenasone-resume.com",
  })

  console.log("Seed complete!")
}

seed().catch(console.error)
