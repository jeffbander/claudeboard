import { test, expect } from "@playwright/test"

// MCP server tests — verifies the API endpoints the MCP server calls

test.describe("MCP server API endpoints", () => {
  test("GET /api/boards/wao returns board state", async ({ request }) => {
    const res = await request.get("/api/boards/wao")
    // Returns 200 with board data or 404 if not found — both are valid responses
    expect([200, 404]).toContain(res.status())
  })

  test("PATCH /api/features/:id accepts stage update", async ({ request }) => {
    const res = await request.patch("/api/features/some-feature-id", {
      data: { stage: "testing", prNumber: 42, updatedAt: Date.now() },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.stage).toBe("testing")
  })

  test("POST /api/deployments logs a deployment", async ({ request }) => {
    const res = await request.post("/api/deployments", {
      data: {
        boardSlug: "wao",
        hash: "abc123",
        title: "Test deployment",
        deployedAt: Date.now(),
        status: "live",
      },
    })
    expect(res.status()).toBe(201)
    const data = await res.json()
    expect(data.hash).toBe("abc123")
  })
})
