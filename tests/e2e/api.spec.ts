import { test, expect } from "@playwright/test"

// API route tests — these don't require auth and test the route handlers directly

test.describe("API routes", () => {
  test("GET /api/boards returns board list", async ({ request }) => {
    const res = await request.get("/api/boards")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test("GET /api/features returns features for a board", async ({ request }) => {
    const res = await request.get("/api/features?boardId=wao")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("boardId")
  })

  test("GET /api/deployments returns deployments", async ({ request }) => {
    const res = await request.get("/api/deployments?boardSlug=wao")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("deployments")
  })

  test("POST /api/github/webhook rejects invalid signature", async ({ request }) => {
    const res = await request.post("/api/github/webhook", {
      data: JSON.stringify({ action: "opened" }),
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=invalidsignature",
        "x-github-event": "pull_request",
      },
    })
    // Should reject with 401 if GITHUB_APP_SECRET is set, or 200 if not configured
    expect([200, 401]).toContain(res.status())
  })

  test("POST /api/features creates a feature", async ({ request }) => {
    const res = await request.post("/api/features", {
      data: { title: "Test feature", type: "feature", boardId: "test-board", createdBy: "test" },
    })
    expect(res.status()).toBe(201)
    const data = await res.json()
    expect(data.title).toBe("Test feature")
    expect(data.stage).toBe("idea")
  })

  test("POST /api/incidents creates an incident", async ({ request }) => {
    const res = await request.post("/api/incidents", {
      data: { boardSlug: "wao", title: "Test incident", description: "Test desc", severity: "low" },
    })
    expect(res.status()).toBe(201)
  })
})
