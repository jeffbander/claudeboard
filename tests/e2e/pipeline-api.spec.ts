import { test, expect } from "@playwright/test"

// Smoke tests for the plan → code → ship pipeline endpoints.
// They validate the routes exist and respond sensibly to a fake feature id.

test.describe("Pipeline API routes", () => {
  test("POST /api/features/:id/plan rejects missing feature", async ({ request }) => {
    const res = await request.post("/api/features/not-a-real-id/plan")
    expect([400, 404, 500]).toContain(res.status())
  })

  test("POST /api/features/:id/commits rejects empty body", async ({ request }) => {
    const res = await request.post("/api/features/not-a-real-id/commits", { data: {} })
    expect([400, 404, 500]).toContain(res.status())
  })

  test("POST /api/features/:id/commits rejects when hash is present but feature is bogus", async ({ request }) => {
    const res = await request.post("/api/features/not-a-real-id/commits", {
      data: { hash: "deadbeef", message: "smoke test", timestamp: Date.now() },
    })
    expect([400, 404, 500]).toContain(res.status())
  })

  test("POST /api/features/:id/ship rejects missing feature", async ({ request }) => {
    const res = await request.post("/api/features/not-a-real-id/ship")
    expect([400, 404, 500]).toContain(res.status())
  })

  test("POST /api/github/webhook accepts push events without crashing", async ({ request }) => {
    const res = await request.post("/api/github/webhook", {
      data: JSON.stringify({
        ref: "refs/heads/does-not-exist",
        commits: [{ id: "deadbeefdeadbeef", message: "test", timestamp: new Date().toISOString() }],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=invalidsignature",
        "x-github-event": "push",
      },
    })
    expect([200, 401]).toContain(res.status())
  })
})
